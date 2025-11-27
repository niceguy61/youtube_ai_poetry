# Serverless Migration - Requirements

## Overview
Migrate the Music Poetry Canvas Express backend to AWS Lambda using AWS SAM (Serverless Application Model) for better scalability, cost efficiency, and AWS service integration.

## Goals
1. Convert Express endpoints to Lambda functions
2. Deploy with AWS SAM and API Gateway
3. Use AWS Bedrock for AI poetry generation
4. Maintain all existing functionality
5. Reduce operational costs

## Functional Requirements

### FR-1: Poetry Generation Lambda
**Priority**: High
**Description**: Migrate poetry generation endpoint to Lambda with Bedrock integration

**Acceptance Criteria**:
- Lambda function handles POST `/api/poetry/generate`
- Uses AWS Bedrock (Claude 3 Haiku or Sonnet)
- Supports all personas and languages
- Returns poetry in same format as Express version
- Handles errors gracefully with fallback

### FR-2: YouTube Processing Lambda
**Priority**: High
**Description**: Migrate YouTube audio extraction and analysis to Python Lambda

**Acceptance Criteria**:
- Lambda function handles GET `/api/youtube/info`
- Lambda function handles GET `/api/youtube/audio-with-analysis`
- Uses yt-dlp for YouTube audio extraction
- Uses librosa for audio analysis
- Returns same data structure as Express version
- Validates 5-minute duration limit
- Cleans up temporary files in /tmp

### FR-3: Thumbnail Proxy Lambda
**Priority**: Medium
**Description**: Migrate thumbnail proxy to Lambda

**Acceptance Criteria**:
- Lambda function handles GET `/api/thumbnail`
- Proxies YouTube thumbnails to avoid CORS
- Returns base64-encoded images
- Sets proper content-type headers

### FR-4: API Gateway Integration
**Priority**: High
**Description**: Set up API Gateway with CORS support

**Acceptance Criteria**:
- All Lambda functions accessible via API Gateway
- CORS enabled for all endpoints
- Consistent URL structure with Express version
- Returns proper HTTP status codes
- Handles OPTIONS preflight requests

### FR-5: Lambda Layers
**Priority**: High
**Description**: Create Lambda layers for shared dependencies

**Acceptance Criteria**:
- yt-dlp layer with binary
- Python libraries layer with librosa, numpy, scipy
- Layers properly attached to YouTube function
- Layers reduce deployment package size

## Non-Functional Requirements

### NFR-1: Performance
- Poetry generation: < 30 seconds response time
- YouTube processing: < 60 seconds response time
- Thumbnail proxy: < 10 seconds response time
- Cold start: < 5 seconds

### NFR-2: Cost
- Target: < $5/month for 1000 requests
- Utilize AWS Free Tier where possible
- Optimize memory allocation for cost

### NFR-3: Reliability
- 99.9% availability (AWS Lambda SLA)
- Automatic retries on transient failures
- Graceful error handling with user-friendly messages

### NFR-4: Security
- IAM roles with least privilege
- Bedrock access limited to specific models
- No hardcoded credentials
- CORS restricted to frontend domain in production

### NFR-5: Maintainability
- Infrastructure as Code (SAM template)
- Clear separation of concerns (3 functions)
- Comprehensive logging to CloudWatch
- Easy local testing with SAM CLI

## Technical Requirements

### TR-1: Runtime Versions
- Node.js: 24.x (latest LTS)
- Python: 3.11

### TR-2: Memory Allocation
- Poetry function: 512MB
- YouTube function: 2048MB (librosa needs memory)
- Thumbnail function: 256MB

### TR-3: Timeout Configuration
- Poetry function: 30 seconds
- YouTube function: 60 seconds
- Thumbnail function: 10 seconds

### TR-4: Environment Variables
- `AWS_BEDROCK_REGION`: AWS region for Bedrock
- `LOG_LEVEL`: Logging level (INFO, DEBUG, ERROR)
- `PYTHONPATH`: /opt/python (for layers)

### TR-5: Dependencies
**Poetry Function (Node.js)**:
- @aws-sdk/client-bedrock-runtime: ^3.0.0

**YouTube Function (Python)**:
- librosa: 0.10.1
- numpy: 1.24.3
- scipy: 1.11.4
- soundfile: 0.12.1
- audioread: 3.0.1

## Migration Phases

### Phase 1: Setup (Day 1)
- Install AWS SAM CLI
- Configure AWS credentials
- Create lambda/ directory structure
- Set up SAM template

### Phase 2: Poetry Function (Day 1-2)
- Create Node.js Lambda handler
- Integrate AWS Bedrock SDK
- Migrate prompt building logic
- Test locally with SAM

### Phase 3: YouTube Function (Day 2-3)
- Create Python Lambda handler
- Copy audio_analyzer.py from backend
- Create yt-dlp layer
- Create Python libraries layer
- Test locally with SAM

### Phase 4: Thumbnail Function (Day 3)
- Create Node.js Lambda handler
- Implement image proxy logic
- Test locally with SAM

### Phase 5: Deployment (Day 4)
- Deploy to AWS with `sam deploy --guided`
- Test all endpoints in production
- Update frontend API endpoint
- Monitor CloudWatch logs

### Phase 6: Optimization (Day 5)
- Set up CloudWatch alarms
- Configure billing alerts
- Optimize memory allocation
- Document deployment process

## Success Criteria
1. All Express endpoints migrated to Lambda
2. All existing tests pass with new endpoints
3. Frontend works with Lambda backend
4. Cost < $5/month for expected usage
5. Response times meet NFR-1 requirements
6. Zero downtime during migration (parallel deployment)

## Out of Scope
- Database migration (no database currently)
- Frontend changes (except API endpoint URL)
- Authentication/authorization (not implemented yet)
- Custom domain setup (can be added later)
- CI/CD pipeline (manual deployment for now)

## Risks & Mitigation

### Risk 1: Cold Start Latency
**Impact**: High
**Probability**: High
**Mitigation**: 
- Optimize package size
- Consider provisioned concurrency for production
- Implement warming strategy if needed

### Risk 2: librosa Memory Issues
**Impact**: High
**Probability**: Medium
**Mitigation**:
- Allocate 2048MB memory
- Optimize librosa parameters (lower sample rate)
- Monitor memory usage in CloudWatch

### Risk 3: yt-dlp Compatibility
**Impact**: Medium
**Probability**: Low
**Mitigation**:
- Test with multiple YouTube videos
- Include error handling for unsupported formats
- Keep yt-dlp layer updated

### Risk 4: Cost Overrun
**Impact**: Medium
**Probability**: Low
**Mitigation**:
- Set up billing alerts
- Monitor usage in CloudWatch
- Optimize function execution time

## Dependencies
- AWS Account with Bedrock access
- AWS SAM CLI installed
- Docker Desktop (for local testing)
- Python 3.11 (for layer building)
- Node.js 24.x (for function development)

## References
- Serverless Migration Guide: `.kiro/steering/serverless-migration-guide.md`
- AI Model Selection Guide: `.kiro/steering/ai-model-selection-guide.md`
- Current Express Server: `backend/server.js`
- Audio Analyzer: `backend/audio_analyzer.py`
