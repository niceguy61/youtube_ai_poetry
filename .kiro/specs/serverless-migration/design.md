# Serverless Migration - Design

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                        │
│                  VITE_API_ENDPOINT                          │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Gateway (REST)                        │
│              /Prod/api/* endpoints                          │
│              CORS: * (dev) / domain (prod)                  │
└─────┬──────────────────┬──────────────────┬────────────────┘
      │                  │                  │
      ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Poetry     │  │   YouTube    │  │  Thumbnail   │
│   Lambda     │  │   Lambda     │  │   Lambda     │
│  (Node 24)   │  │ (Python 3.11)│  │  (Node 24)   │
│   512MB      │  │   2048MB     │  │   256MB      │
│   30s        │  │    60s       │  │   10s        │
└──────┬───────┘  └──────┬───────┘  └──────────────┘
       │                 │
       ▼                 ▼
┌──────────────┐  ┌──────────────┐
│   Bedrock    │  │Lambda Layers │
│   Claude     │  │ - yt-dlp     │
│   Haiku/     │  │ - librosa    │
│   Sonnet     │  │ - numpy      │
└──────────────┘  └──────────────┘
```

## Component Design

### 1. Poetry Generation Lambda

**Runtime**: Node.js 24.x
**Memory**: 512MB
**Timeout**: 30 seconds

**Handler Flow**:
```
1. Parse event.body (JSON)
2. Extract audioFeatures, persona, language, model
3. Build poetry prompt
4. Call AWS Bedrock InvokeModel
5. Parse Bedrock response
6. Return formatted response
```

**Input Event**:
```json
{
  "body": "{\"audioFeatures\": {...}, \"persona\": \"hamlet\", \"language\": \"ko\", \"model\": \"anthropic.claude-3-haiku-20240307-v1:0\"}"
}
```

**Output Response**:
```json
{
  "statusCode": 200,
  "headers": {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  },
  "body": "{\"success\": true, \"poetry\": \"...\"}"
}
```

**Dependencies**:
- @aws-sdk/client-bedrock-runtime

**IAM Permissions**:
- bedrock:InvokeModel on Claude models

---

### 2. YouTube Processing Lambda

**Runtime**: Python 3.11
**Memory**: 2048MB
**Timeout**: 60 seconds

**Handler Flow**:
```
1. Parse event.queryStringParameters
2. Extract and validate YouTube URL
3. Check video duration with yt-dlp
4. Download audio to /tmp
5. Analyze with librosa
6. Clean up /tmp files
7. Return video info + analysis
```

**Input Event**:
```json
{
  "queryStringParameters": {
    "url": "https://youtube.com/watch?v=..."
  }
}
```

**Output Response**:
```json
{
  "statusCode": 200,
  "headers": {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  },
  "body": "{\"success\": true, \"videoInfo\": {...}, \"analysis\": {...}}"
}
```

**Dependencies** (Layer):
- yt-dlp (binary)
- librosa 0.10.1
- numpy 1.24.3
- scipy 1.11.4
- soundfile 0.12.1
- audioread 3.0.1

**File Management**:
```python
# Use /tmp for temporary files
audio_file = f'/tmp/audio_{timestamp}.mp3'

# Always clean up
try:
    os.unlink(audio_file)
except Exception as e:
    print(f'Cleanup failed: {e}')
```

---

### 3. Thumbnail Proxy Lambda

**Runtime**: Node.js 24.x
**Memory**: 256MB
**Timeout**: 10 seconds

**Handler Flow**:
```
1. Parse event.queryStringParameters
2. Extract thumbnail URL
3. Fetch image with fetch()
4. Convert to base64
5. Return with proper headers
```

**Input Event**:
```json
{
  "queryStringParameters": {
    "url": "https://i3.ytimg.com/vi/..."
  }
}
```

**Output Response**:
```json
{
  "statusCode": 200,
  "headers": {
    "Content-Type": "image/jpeg",
    "Access-Control-Allow-Origin": "*"
  },
  "body": "base64_encoded_image",
  "isBase64Encoded": true
}
```

---

## Lambda Layers Design

### yt-dlp Layer

**Structure**:
```
yt-dlp-layer/
├── Makefile
└── bin/
    └── yt-dlp (executable)
```

**Build Process**:
```makefile
build-YtdlpLayer:
	mkdir -p "$(ARTIFACTS_DIR)/bin"
	curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
	  -o "$(ARTIFACTS_DIR)/bin/yt-dlp"
	chmod +x "$(ARTIFACTS_DIR)/bin/yt-dlp"
```

**Usage**:
- Binary available in PATH
- No additional configuration needed

---

### Python Libraries Layer

**Structure**:
```
python-libs-layer/
├── requirements.txt
└── python/
    └── lib/
        └── python3.11/
            └── site-packages/
                ├── librosa/
                ├── numpy/
                └── ...
```

**Build Process**:
- SAM automatically builds with `BuildMethod: python3.11`
- Installs packages from requirements.txt
- Creates proper directory structure

**Usage**:
```python
# Set PYTHONPATH in Lambda environment
Environment:
  Variables:
    PYTHONPATH: /opt/python

# Import normally
import librosa
import numpy as np
```

---

## SAM Template Design

### Globals Section
```yaml
Globals:
  Function:
    Timeout: 30
    MemorySize: 512
    Environment:
      Variables:
        LOG_LEVEL: INFO
  Api:
    Cors:
      AllowMethods: "'GET,POST,OPTIONS'"
      AllowHeaders: "'Content-Type,Authorization'"
      AllowOrigin: "'*'"
```

### Function Resources
Each function defined with:
- CodeUri: path to function code
- Handler: entry point
- Runtime: nodejs24.x or python3.11
- MemorySize: optimized per function
- Timeout: based on expected execution time
- Events: API Gateway triggers
- Policies: IAM permissions

### Layer Resources
- YtdlpLayer: yt-dlp binary
- PythonLibsLayer: Python packages

### Outputs
- ApiEndpoint: API Gateway URL
- Function ARNs: for reference

---

## API Gateway Design

### Endpoint Mapping

| Method | Path | Lambda Function | Purpose |
|--------|------|-----------------|---------|
| POST | /api/poetry/generate | PoetryFunction | Generate AI poetry |
| GET | /api/youtube/info | YouTubeFunction | Get video metadata |
| GET | /api/youtube/audio-with-analysis | YouTubeFunction | Download + analyze |
| GET | /api/thumbnail | ThumbnailFunction | Proxy thumbnails |

### CORS Configuration
- **Development**: Allow all origins (*)
- **Production**: Restrict to frontend domain
- **Methods**: GET, POST, OPTIONS
- **Headers**: Content-Type, Authorization

### Error Responses
Consistent error format:
```json
{
  "error": "Error message",
  "details": "Additional context (optional)"
}
```

Status codes:
- 200: Success
- 400: Bad request (invalid input)
- 500: Internal server error
- 503: Service unavailable (Bedrock/Ollama down)
- 504: Timeout

---

## Error Handling Strategy

### Poetry Function
```javascript
try {
  const poetry = await generateWithBedrock(prompt, model);
  return successResponse({ success: true, poetry });
} catch (error) {
  console.error('[Poetry] Error:', error);
  
  // Specific error handling
  if (error.name === 'AccessDeniedException') {
    return errorResponse(403, 'Bedrock access denied');
  }
  
  return errorResponse(500, 'Poetry generation failed', error.message);
}
```

### YouTube Function
```python
try:
    result = process_youtube(url)
    return success_response(result)
except subprocess.TimeoutExpired:
    return error_response(504, 'Request timeout')
except Exception as e:
    print(f'[YouTube] Error: {str(e)}')
    traceback.print_exc()
    return error_response(500, f'Failed to process: {str(e)}')
```

---

## Logging Strategy

### CloudWatch Logs
All console.log/print statements go to CloudWatch automatically.

**Log Format**:
```
[FunctionName] Action: Details
```

**Examples**:
```javascript
console.log('[Poetry] Generating with Bedrock - Persona:', persona);
console.error('[Poetry] Bedrock error:', error);
```

```python
print(f'[YouTube] Processing: {url}')
print(f'[YouTube] Analysis complete - Tempo: {tempo}, Mood: {mood}')
```

### Log Retention
- Default: Never expire
- Recommendation: 7 days for cost optimization

---

## Monitoring & Alarms

### CloudWatch Metrics
- Invocations
- Duration
- Errors
- Throttles
- ConcurrentExecutions

### Recommended Alarms
1. **Error Rate > 5%**
   - Metric: Errors / Invocations
   - Threshold: 5%
   - Action: SNS notification

2. **Duration > 80% of timeout**
   - Poetry: > 24 seconds
   - YouTube: > 48 seconds
   - Action: SNS notification

3. **Throttles > 0**
   - Indicates concurrency limit reached
   - Action: Increase reserved concurrency

---

## Cost Estimation

### Lambda Costs (1000 requests/month)

**Poetry Function**:
- Execution: 1000 × 5s × 512MB = 2,500 GB-seconds
- Cost: 2,500 × $0.0000166667 = $0.04

**YouTube Function**:
- Execution: 1000 × 20s × 2048MB = 40,000 GB-seconds
- Cost: 40,000 × $0.0000166667 = $0.67

**Thumbnail Function**:
- Execution: 1000 × 2s × 256MB = 500 GB-seconds
- Cost: 500 × $0.0000166667 = $0.01

**Total Lambda**: $0.72/month

### Bedrock Costs (1000 poems)
- Input: 300K tokens × $0.00025/1K = $0.08
- Output: 500K tokens × $0.00125/1K = $0.63
- **Total Bedrock**: $0.71/month

### API Gateway Costs
- 1000 requests × $0.0000035 = $0.004
- **Total API Gateway**: $0.004/month

### Grand Total
**$1.43/month** (well under $5 target)

---

## Deployment Strategy

### Initial Deployment
```bash
cd lambda
sam build
sam deploy --guided
```

### Subsequent Deployments
```bash
sam build && sam deploy
```

### Rollback Plan
```bash
# CloudFormation automatic rollback on failure
# Manual rollback if needed:
aws cloudformation rollback-stack --stack-name music-poetry-backend
```

---

## Testing Strategy

### Local Testing
```bash
# Start local API
sam local start-api --port 3001

# Test poetry endpoint
curl -X POST http://localhost:3001/api/poetry/generate \
  -H "Content-Type: application/json" \
  -d '{"audioFeatures": {...}}'

# Test YouTube endpoint
curl "http://localhost:3001/api/youtube/info?url=..."
```

### Unit Testing
- Test Lambda handlers directly
- Mock AWS SDK calls
- Test error handling

### Integration Testing
- Deploy to dev environment
- Test all endpoints
- Verify CORS
- Check CloudWatch logs

---

## Security Considerations

### IAM Roles
- Least privilege principle
- Separate role per function
- No wildcard permissions

### Secrets Management
- No hardcoded credentials
- Use environment variables
- Consider AWS Secrets Manager for production

### CORS
- Restrict origins in production
- Validate request headers
- Handle preflight requests

### Input Validation
- Validate YouTube URLs
- Sanitize user inputs
- Check file sizes

---

## Migration Checklist

**Phase 1: Setup**
- [ ] Install AWS SAM CLI
- [ ] Configure AWS credentials
- [ ] Create lambda/ directory
- [ ] Create SAM template

**Phase 2: Poetry Function**
- [ ] Create poetry-function/index.js
- [ ] Create poetry-function/package.json
- [ ] Implement Bedrock integration
- [ ] Test locally

**Phase 3: YouTube Function**
- [ ] Create youtube-function/handler.py
- [ ] Copy audio_analyzer.py
- [ ] Create requirements.txt
- [ ] Create yt-dlp layer
- [ ] Create Python libs layer
- [ ] Test locally

**Phase 4: Thumbnail Function**
- [ ] Create thumbnail-function/index.js
- [ ] Create thumbnail-function/package.json
- [ ] Implement proxy logic
- [ ] Test locally

**Phase 5: Deployment**
- [ ] Deploy with sam deploy --guided
- [ ] Test all endpoints
- [ ] Update frontend .env
- [ ] Monitor CloudWatch

**Phase 6: Optimization**
- [ ] Set up alarms
- [ ] Configure billing alerts
- [ ] Optimize memory
- [ ] Document process

---

## References
- Requirements: `requirements.md`
- Migration Guide: `.kiro/steering/serverless-migration-guide.md`
- Current Backend: `backend/server.js`
- Audio Analyzer: `backend/audio_analyzer.py`
