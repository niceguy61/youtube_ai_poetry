# Serverless Migration Guide - Music Poetry Canvas Backend

This document provides a comprehensive guide for migrating the Music Poetry Canvas Express backend to AWS Lambda using AWS SAM (Serverless Application Model).

## Migration Overview

### Current Architecture (Express)
```
Express Server (Node.js)
├─ YouTube endpoints (yt-dlp + Python subprocess)
├─ Poetry generation (Ollama local)
├─ Audio analysis (Python subprocess)
└─ Utility endpoints (thumbnail proxy)
```

### Target Architecture (Serverless)
```
API Gateway
├─ Lambda 1: Poetry Generation (Node.js + Bedrock)
├─ Lambda 2: YouTube Processing (Python + yt-dlp + librosa)
└─ Lambda 3: Thumbnail Proxy (Node.js)

Lambda Layers
├─ yt-dlp Layer (binary)
└─ Python Libraries Layer (librosa, numpy, scipy)
```

## Why Serverless?

### Benefits
1. **Cost Efficiency**: Pay only for actual usage (~$1-2/month for 1000 requests)
2. **Auto-scaling**: Handles traffic spikes automatically
3. **No Server Management**: AWS manages infrastructure
4. **High Availability**: Built-in redundancy across AZs
5. **Integration**: Native AWS service integration (Bedrock, S3, etc.)

### Trade-offs
1. **Cold Starts**: First request may be slower (1-3 seconds)
2. **Execution Limits**: 15 minute max timeout, 10GB max memory
3. **Stateless**: No persistent file storage (use /tmp or S3)
4. **Complexity**: More moving parts to manage

## Project Structure

```
lambda/
├── template.yaml                    # SAM template (infrastructure as code)
├── samconfig.toml                   # SAM deployment configuration
│
├── poetry-function/                 # Node.js Lambda
│   ├── index.js                     # Handler for poetry generation
│   ├── package.json                 # Node.js dependencies
│   └── .npmignore                   # Files to exclude from deployment
│
├── youtube-function/                # Python Lambda
│   ├── handler.py                   # Handler for YouTube processing
│   ├── audio_analyzer.py            # Librosa analysis (copied from backend)
│   ├── requirements.txt             # Python dependencies
│   └── .gitignore                   # Files to exclude from git
│
├── thumbnail-function/              # Node.js Lambda
│   ├── index.js                     # Handler for thumbnail proxy
│   └── package.json                 # Node.js dependencies
│
└── layers/                          # Lambda Layers
    ├── yt-dlp-layer/
    │   ├── Makefile                 # Build script for yt-dlp
    │   └── bin/
    │       └── yt-dlp               # Binary (downloaded during build)
    │
    └── python-libs-layer/
        ├── requirements.txt         # Python libraries
        └── python/                  # Installed packages (built by SAM)
```

## Migration Steps

### Phase 1: Setup & Preparation

#### 1.1 Install AWS SAM CLI
```bash
# Windows (using Chocolatey)
choco install aws-sam-cli

# Or download installer from:
# https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html

# Verify installation
sam --version
```

#### 1.2 Configure AWS Credentials
```bash
# Configure AWS CLI
aws configure

# Or set environment variables
set AWS_ACCESS_KEY_ID=your_access_key
set AWS_SECRET_ACCESS_KEY=your_secret_key
set AWS_DEFAULT_REGION=us-east-1
```

#### 1.3 Create Lambda Directory Structure
```bash
cd backend
mkdir lambda
cd lambda
mkdir poetry-function youtube-function thumbnail-function layers
mkdir layers\yt-dlp-layer layers\python-libs-layer
```

### Phase 2: Function Migration

#### 2.1 Poetry Function (Node.js + Bedrock)

**Key Changes from Express:**
- Replace `req, res` with Lambda `event, context`
- Parse `event.body` for POST data
- Return structured response with `statusCode`, `headers`, `body`
- Use AWS SDK v3 for Bedrock

**Handler Pattern:**
```javascript
export const handler = async (event, context) => {
  try {
    const body = JSON.parse(event.body || '{}');
    // Process request
    const result = await processRequest(body);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(result)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
};
```

#### 2.2 YouTube Function (Python + yt-dlp + librosa)

**Key Changes from Express:**
- Replace subprocess spawning with direct Python calls
- Use `/tmp` directory for temporary files (512MB limit)
- Clean up files after processing
- Handle Lambda event structure

**Handler Pattern:**
```python
def lambda_handler(event, context):
    try:
        # Parse query parameters
        params = event.get('queryStringParameters', {}) or {}
        url = params.get('url')
        
        # Process request
        result = process_youtube(url)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(result)
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)})
        }
```

**Important: /tmp Directory Management**
```python
import tempfile
import os

# Create temp file
with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False, dir='/tmp') as tmp:
    audio_file = tmp.name

# Use the file
process_audio(audio_file)

# ALWAYS clean up
try:
    os.unlink(audio_file)
except Exception as e:
    print(f'Failed to delete temp file: {e}')
```

#### 2.3 Thumbnail Function (Node.js)

**Simple proxy pattern:**
```javascript
export const handler = async (event) => {
  const url = event.queryStringParameters?.url;
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'image/jpeg' },
    body: Buffer.from(buffer).toString('base64'),
    isBase64Encoded: true
  };
};
```

### Phase 3: Lambda Layers

#### 3.1 yt-dlp Layer

**Purpose**: Provide yt-dlp binary to Python Lambda

**Structure:**
```
yt-dlp-layer/
├── Makefile
└── bin/
    └── yt-dlp
```

**Makefile:**
```makefile
build-YtdlpLayer:
	mkdir -p "$(ARTIFACTS_DIR)/bin"
	curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o "$(ARTIFACTS_DIR)/bin/yt-dlp"
	chmod +x "$(ARTIFACTS_DIR)/bin/yt-dlp"
```

**Usage in Lambda:**
```python
# yt-dlp is available in PATH
subprocess.run(['yt-dlp', '--version'])
```

#### 3.2 Python Libraries Layer

**Purpose**: Provide librosa and dependencies to Python Lambda

**requirements.txt:**
```
librosa==0.10.1
numpy==1.24.3
scipy==1.11.4
soundfile==0.12.1
audioread==3.0.1
```

**SAM builds this automatically:**
```yaml
PythonLibsLayer:
  Type: AWS::Serverless::LayerVersion
  Properties:
    ContentUri: layers/python-libs-layer/
    CompatibleRuntimes:
      - python3.11
  Metadata:
    BuildMethod: python3.11
```

**Usage in Lambda:**
```python
# Libraries are available in PYTHONPATH
import librosa
import numpy as np
```

### Phase 4: SAM Template Configuration

#### 4.1 Key SAM Concepts

**Resources**: AWS resources (Lambda functions, APIs, layers)
**Events**: Triggers for Lambda functions (API Gateway, S3, etc.)
**Globals**: Shared configuration across all functions
**Outputs**: Values to export (API endpoint URL, function ARNs)

#### 4.2 Function Configuration

**Memory Size Guidelines:**
- Poetry function: 512MB (lightweight, just API calls)
- YouTube function: 2048MB (librosa needs memory)
- Thumbnail function: 256MB (simple proxy)

**Timeout Guidelines:**
- Poetry function: 30 seconds (Bedrock response time)
- YouTube function: 60 seconds (download + analysis)
- Thumbnail function: 10 seconds (simple fetch)

**Environment Variables:**
```yaml
Environment:
  Variables:
    AWS_BEDROCK_REGION: !Ref AWS::Region
    LOG_LEVEL: INFO
    PYTHONPATH: /opt/python  # For layers
```

#### 4.3 IAM Permissions

**Bedrock Access:**
```yaml
Policies:
  - Statement:
    - Effect: Allow
      Action:
        - bedrock:InvokeModel
      Resource: 
        - !Sub 'arn:aws:bedrock:${AWS::Region}::foundation-model/anthropic.claude-*'
```

**S3 Access (if needed):**
```yaml
Policies:
  - S3ReadPolicy:
      BucketName: !Ref AudioBucket
```

### Phase 5: Testing

#### 5.1 Local Testing with SAM

**Start local API:**
```bash
cd lambda
sam build
sam local start-api --port 3001
```

**Test endpoints:**
```bash
# Poetry generation
curl -X POST http://localhost:3001/api/poetry/generate \
  -H "Content-Type: application/json" \
  -d '{"audioFeatures": {...}, "persona": "hamlet"}'

# YouTube info
curl "http://localhost:3001/api/youtube/info?url=https://youtube.com/watch?v=..."
```

#### 5.2 Local Testing with Docker

**SAM uses Docker for local testing:**
- Ensure Docker Desktop is running
- SAM automatically pulls Lambda runtime images
- Local testing mimics AWS Lambda environment

#### 5.3 Unit Testing

**Test Lambda handlers directly:**
```javascript
// poetry-function/index.test.js
import { handler } from './index.js';

test('generates poetry', async () => {
  const event = {
    body: JSON.stringify({
      audioFeatures: { tempo: 120, energy: 0.8, mood: 'energetic' },
      persona: 'hamlet'
    })
  };
  
  const result = await handler(event);
  expect(result.statusCode).toBe(200);
});
```

### Phase 6: Deployment

#### 6.1 First Deployment

```bash
cd lambda

# Build functions and layers
sam build

# Deploy with guided prompts (first time)
sam deploy --guided

# Follow prompts:
# - Stack Name: music-poetry-backend
# - AWS Region: us-east-1
# - Confirm changes: Y
# - Allow SAM CLI IAM role creation: Y
# - Save arguments to config: Y
```

#### 6.2 Subsequent Deployments

```bash
# After first deployment, just run:
sam build && sam deploy
```

#### 6.3 Deployment Configuration (samconfig.toml)

**Auto-generated after first deployment:**
```toml
[default.deploy.parameters]
stack_name = "music-poetry-backend"
region = "us-east-1"
capabilities = "CAPABILITY_IAM"
confirm_changeset = true
resolve_s3 = true
```

### Phase 7: Frontend Integration

#### 7.1 Update API Endpoint

**Before (Express):**
```typescript
const API_BASE_URL = 'http://localhost:3001';
```

**After (Lambda):**
```typescript
const API_BASE_URL = process.env.VITE_API_ENDPOINT || 
  'https://abc123.execute-api.us-east-1.amazonaws.com/Prod';
```

#### 7.2 Environment Variables

**.env.production:**
```bash
VITE_API_ENDPOINT=https://your-api-id.execute-api.us-east-1.amazonaws.com/Prod
VITE_AI_PROVIDER=bedrock
```

#### 7.3 CORS Configuration

**SAM handles CORS automatically:**
```yaml
Globals:
  Api:
    Cors:
      AllowMethods: "'GET,POST,OPTIONS'"
      AllowHeaders: "'Content-Type,Authorization'"
      AllowOrigin: "'*'"
```

**For production, restrict origin:**
```yaml
AllowOrigin: "'https://your-domain.com'"
```

## Common Issues & Solutions

### Issue 1: Cold Start Latency

**Problem**: First request takes 3-5 seconds
**Solutions:**
1. Use Provisioned Concurrency (costs more)
2. Implement warming strategy (scheduled pings)
3. Optimize package size (remove unused dependencies)
4. Use Lambda SnapStart (Java only, not applicable)

**Warming Strategy:**
```yaml
# Add to template.yaml
PoetryFunctionWarmer:
  Type: AWS::Events::Rule
  Properties:
    ScheduleExpression: rate(5 minutes)
    Targets:
      - Arn: !GetAtt PoetryFunction.Arn
        Input: '{"warmer": true}'
```

### Issue 2: Package Size Too Large

**Problem**: Deployment package exceeds 50MB (unzipped) or 250MB (zipped)
**Solutions:**
1. Use Lambda Layers for large dependencies
2. Remove unnecessary files (.git, tests, docs)
3. Use .npmignore / .gitignore
4. Consider Docker-based Lambda (10GB limit)

**Optimize package.json:**
```json
{
  "dependencies": {
    "@aws-sdk/client-bedrock-runtime": "^3.0.0"
  },
  "devDependencies": {
    // Move dev dependencies here
  }
}
```

### Issue 3: /tmp Directory Full

**Problem**: /tmp directory exceeds 512MB limit
**Solutions:**
1. Clean up files immediately after use
2. Stream data instead of saving to disk
3. Use S3 for large files
4. Increase ephemeral storage (up to 10GB, costs more)

**Increase ephemeral storage:**
```yaml
PoetryFunction:
  Type: AWS::Serverless::Function
  Properties:
    EphemeralStorage:
      Size: 1024  # MB (default: 512, max: 10240)
```

### Issue 4: Timeout Errors

**Problem**: Function times out before completing
**Solutions:**
1. Increase timeout (max 15 minutes)
2. Optimize code performance
3. Use Step Functions for long workflows
4. Consider async processing with SQS

### Issue 5: Memory Errors (librosa)

**Problem**: Python function runs out of memory
**Solutions:**
1. Increase memory (2048MB or more)
2. Optimize librosa parameters
3. Process audio in chunks
4. Use smaller audio files

**Optimize librosa:**
```python
# Reduce sample rate
y, sr = librosa.load(audio_file, sr=22050)  # Instead of 44100

# Reduce FFT size
tempo, _ = librosa.beat.beat_track(y=y, sr=sr, hop_length=1024)  # Instead of 512
```

## Cost Optimization

### 1. Right-size Memory

**Memory affects both performance and cost:**
- More memory = faster CPU = potentially lower cost
- Test different memory sizes to find sweet spot

**Example:**
- 512MB @ 2 seconds = 1024 MB-seconds
- 1024MB @ 1 second = 1024 MB-seconds (same cost, faster)

### 2. Reduce Execution Time

**Optimization strategies:**
- Minimize cold starts (keep functions warm)
- Optimize dependencies (tree-shaking, bundling)
- Use connection pooling for external services
- Cache frequently accessed data

### 3. Use Free Tier

**AWS Lambda Free Tier (permanent):**
- 1M requests per month
- 400,000 GB-seconds compute time

**Bedrock Pricing:**
- No free tier, but very affordable
- Claude 3 Haiku: ~$0.71 per 1000 poems

### 4. Monitor Usage

**CloudWatch Metrics to track:**
- Invocations
- Duration
- Errors
- Throttles
- Memory usage

**Set up billing alerts:**
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name lambda-cost-alert \
  --alarm-description "Alert when Lambda costs exceed $10" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 86400 \
  --evaluation-periods 1 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold
```

## Monitoring & Debugging

### CloudWatch Logs

**Automatic logging:**
```javascript
// Logs go to CloudWatch automatically
console.log('Processing request:', event);
console.error('Error occurred:', error);
```

**View logs:**
```bash
# Via SAM CLI
sam logs -n PoetryFunction --tail

# Via AWS CLI
aws logs tail /aws/lambda/music-poetry-backend-PoetryFunction --follow
```

### X-Ray Tracing

**Enable tracing:**
```yaml
Globals:
  Function:
    Tracing: Active
```

**View traces in AWS Console:**
- X-Ray Service Map
- Trace details
- Performance bottlenecks

### CloudWatch Insights

**Query logs:**
```
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 20
```

## Rollback Strategy

### Automatic Rollback

**SAM supports automatic rollback:**
```bash
sam deploy --no-fail-on-empty-changeset
```

**CloudFormation handles rollback automatically on failure**

### Manual Rollback

**Rollback to previous version:**
```bash
# List stack events
aws cloudformation describe-stack-events --stack-name music-poetry-backend

# Rollback
aws cloudformation rollback-stack --stack-name music-poetry-backend
```

### Version Management

**Lambda versions and aliases:**
```yaml
PoetryFunction:
  Type: AWS::Serverless::Function
  Properties:
    AutoPublishAlias: live
    DeploymentPreference:
      Type: Canary10Percent5Minutes
```

## Migration Checklist

- [ ] Install AWS SAM CLI
- [ ] Configure AWS credentials
- [ ] Create lambda/ directory structure
- [ ] Migrate poetry function to Lambda
- [ ] Migrate YouTube function to Lambda
- [ ] Migrate thumbnail function to Lambda
- [ ] Create yt-dlp layer
- [ ] Create Python libraries layer
- [ ] Write SAM template
- [ ] Test locally with `sam local start-api`
- [ ] Deploy to AWS with `sam deploy --guided`
- [ ] Update frontend API endpoint
- [ ] Test all endpoints in production
- [ ] Set up CloudWatch alarms
- [ ] Configure billing alerts
- [ ] Document API endpoint for team
- [ ] Update README with deployment instructions

## References

- AWS SAM Documentation: https://docs.aws.amazon.com/serverless-application-model/
- Lambda Best Practices: https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html
- Lambda Layers: https://docs.aws.amazon.com/lambda/latest/dg/configuration-layers.html
- Bedrock Documentation: https://docs.aws.amazon.com/bedrock/
- SAM CLI Reference: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-command-reference.html

---

**Last Updated**: 2025-11-27
**Maintainer**: Development Team
