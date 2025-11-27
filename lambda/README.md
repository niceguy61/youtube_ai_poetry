# AWS Lambda Backend - Music Poetry Canvas

This directory contains the serverless backend implementation for Music Poetry Canvas, deployed using AWS SAM (Serverless Application Model).

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Lambda Functions](#lambda-functions)
- [Deployment](#deployment)
- [Testing](#testing)
- [Monitoring](#monitoring)
- [Cost Optimization](#cost-optimization)
- [Troubleshooting](#troubleshooting)

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                        │
│              VITE_API_ENDPOINT (API Gateway)                │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Gateway (REST)                        │
│              /Prod/api/* endpoints                          │
│              CORS: Enabled                                  │
└─────┬──────────────────┬──────────────────────────────────┘
      │                  │
      ▼                  ▼
┌──────────────┐  ┌──────────────┐
│   Poetry     │  │   YouTube    │
│   Lambda     │  │   Lambda     │
│  (Node 20)   │  │ (Python 3.11)│
│   512MB      │  │   2048MB     │
│   30s        │  │    60s       │
└──────┬───────┘  └──────┬───────┘
       │                 │
       ▼                 ▼
┌──────────────┐  ┌──────────────┐
│   Bedrock    │  │Lambda Layers │
│   Claude     │  │ - yt-dlp     │
│   Haiku/     │  │ - librosa    │
│   Sonnet     │  │ - numpy      │
└──────────────┘  └──────────────┘
```

### Components

1. **Poetry Function** (Node.js 20.x)
   - Generates AI poetry using AWS Bedrock (Claude models)
   - Endpoint: `POST /api/poetry/generate`
   - Memory: 512MB, Timeout: 30s

2. **YouTube Function** (Python 3.11) - *Ready for deployment*
   - Extracts YouTube audio and analyzes with librosa
   - Endpoints: `GET /api/youtube/info`, `GET /api/youtube/audio-with-analysis`
   - Memory: 2048MB, Timeout: 60s
   - Uses Lambda Layers for yt-dlp and Python libraries

3. **API Gateway**
   - REST API with CORS enabled
   - Routes requests to appropriate Lambda functions
   - Handles authentication and rate limiting

## 📦 Prerequisites

### Required Tools

1. **AWS SAM CLI**
   ```bash
   # Windows (Chocolatey)
   choco install aws-sam-cli
   
   # macOS (Homebrew)
   brew install aws-sam-cli
   
   # Or download installer from:
   # https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html
   ```

2. **AWS CLI**
   ```bash
   # Windows (Chocolatey)
   choco install awscli
   
   # macOS (Homebrew)
   brew install awscli
   
   # Configure credentials
   aws configure
   ```

3. **Docker Desktop**
   - Required for local testing with SAM
   - Download from: https://www.docker.com/products/docker-desktop

4. **Node.js 20.x** and **Python 3.11**
   ```bash
   node --version  # Should be v20.x
   python --version  # Should be 3.11.x
   ```

### AWS Account Setup

1. **Create AWS Account** (if you don't have one)
   - Sign up at: https://aws.amazon.com

2. **Enable AWS Bedrock**
   - Navigate to AWS Bedrock console
   - Request access to Claude models (Haiku, Sonnet)
   - Wait for approval (usually instant)

3. **Configure IAM Permissions**
   - Ensure your AWS user has permissions for:
     - Lambda function creation
     - API Gateway management
     - CloudFormation stack operations
     - IAM role creation
     - Bedrock model invocation

## 🚀 Quick Start

### 1. Deploy to AWS

```bash
# Navigate to lambda directory
cd lambda

# Build Lambda functions and layers
sam build

# Deploy with guided prompts (first time)
sam deploy --guided

# Follow the prompts:
# - Stack Name: music-poetry-backend (or your choice)
# - AWS Region: us-east-1 (or your preferred region)
# - Confirm changes: Y
# - Allow SAM CLI IAM role creation: Y
# - Save arguments to config: Y
```

### 2. Get API Gateway URL

After deployment, SAM will output the API Gateway URL:
```
Outputs:
ApiEndpoint: https://abc123.execute-api.us-east-1.amazonaws.com/Prod/
```

### 3. Update Frontend Configuration

Update `.env.production` in the root directory:
```bash
VITE_API_ENDPOINT=https://abc123.execute-api.us-east-1.amazonaws.com/Prod
VITE_AI_PROVIDER=bedrock
VITE_AWS_REGION=us-east-1
```

### 4. Test the Deployment

```bash
# Test poetry generation
curl -X POST https://your-api-id.execute-api.region.amazonaws.com/Prod/api/poetry/generate \
  -H "Content-Type: application/json" \
  -d '{
    "audioFeatures": {
      "tempo": 120,
      "energy": 0.8,
      "mood": "energetic"
    },
    "persona": "hamlet",
    "language": "ko"
  }'
```

## 📁 Project Structure

```
lambda/
├── template.yaml                    # SAM template (infrastructure as code)
├── samconfig.toml                   # SAM deployment configuration
├── README.md                        # This file
│
├── poetry-function/                 # Poetry generation Lambda
│   ├── index.js                     # Handler for poetry generation
│   ├── package.json                 # Node.js dependencies
│   ├── test-local.js                # Local testing script
│   ├── README.md                    # Function-specific docs
│   └── TEST_RESULTS.md              # Test results and examples
│
├── youtube-function/                # YouTube processing Lambda
│   ├── handler.py                   # Handler for YouTube processing
│   ├── audio_analyzer.py            # Librosa analysis
│   ├── requirements.txt             # Python dependencies
│   ├── test-handler.py              # Local testing script
│   ├── README.md                    # Function-specific docs
│   └── TEST_RESULTS.md              # Test results and examples
│
├── layers/                          # Lambda Layers
│   ├── yt-dlp-layer/
│   │   ├── Makefile                 # Build script for yt-dlp
│   │   └── bin/
│   │       └── yt-dlp               # Binary (downloaded during build)
│   │
│   └── python-libs-layer/
│       ├── requirements.txt         # Python libraries
│       └── python/                  # Installed packages (built by SAM)
│
├── test-events/                     # Test event JSON files
│   └── poetry-test-event.json
│
├── DEPLOYMENT_RESULTS.md            # Latest deployment results
├── PRODUCTION_TEST_RESULTS.md       # Production test results
├── LOCAL_TESTING_GUIDE.md           # Local testing guide
└── BEDROCK_ACCESS_FIX.md            # Bedrock access troubleshooting
```

## 🔧 Lambda Functions

### Poetry Function

**Purpose**: Generate AI poetry using AWS Bedrock (Claude models)

**Endpoint**: `POST /api/poetry/generate`

**Request Body**:
```json
{
  "audioFeatures": {
    "tempo": 120,
    "energy": 0.8,
    "mood": "energetic",
    "valence": 0.7
  },
  "persona": "hamlet",
  "language": "ko",
  "model": "anthropic.claude-3-haiku-20240307-v1:0"
}
```

**Response**:
```json
{
  "success": true,
  "poetry": "격렬한 에너지여, 탐구하라!..."
}
```

**Configuration**:
- Runtime: Node.js 20.x
- Memory: 512MB
- Timeout: 30 seconds
- IAM: Bedrock InvokeModel permission

**See**: [poetry-function/README.md](poetry-function/README.md)

### YouTube Function

**Purpose**: Extract and analyze YouTube audio

**Endpoints**:
- `GET /api/youtube/info?url=<youtube-url>` - Get video metadata
- `GET /api/youtube/audio-with-analysis?url=<youtube-url>` - Get audio + analysis

**Response**:
```json
{
  "success": true,
  "videoInfo": {
    "title": "Song Title",
    "duration": 180,
    "thumbnail": "https://...",
    "author": "Artist Name"
  },
  "analysis": {
    "tempo": 120.5,
    "key": "C major",
    "energy": 0.85,
    "mood": "energetic",
    "intensity": 0.78
  }
}
```

**Configuration**:
- Runtime: Python 3.11
- Memory: 2048MB (librosa needs memory)
- Timeout: 60 seconds
- Layers: yt-dlp, Python libraries (librosa, numpy, scipy)

**See**: [youtube-function/README.md](youtube-function/README.md)

## 🚢 Deployment

### First Deployment

```bash
cd lambda
sam build
sam deploy --guided
```

Answer the prompts:
- **Stack Name**: `music-poetry-backend` (or your choice)
- **AWS Region**: `us-east-1` (or your preferred region)
- **Confirm changes**: `Y`
- **Allow SAM CLI IAM role creation**: `Y`
- **Disable rollback**: `N` (recommended for production)
- **Save arguments to config**: `Y`

### Subsequent Deployments

```bash
sam build && sam deploy
```

### Deployment to Different Environments

```bash
# Development
sam deploy --config-env dev

# Staging
sam deploy --config-env staging

# Production
sam deploy --config-env prod
```

Configure environments in `samconfig.toml`:
```toml
[dev.deploy.parameters]
stack_name = "music-poetry-backend-dev"
region = "us-east-1"

[prod.deploy.parameters]
stack_name = "music-poetry-backend-prod"
region = "us-east-1"
```

### Rollback

If deployment fails, CloudFormation automatically rolls back.

Manual rollback:
```bash
aws cloudformation rollback-stack --stack-name music-poetry-backend
```

Delete stack:
```bash
sam delete --stack-name music-poetry-backend
```

## 🧪 Testing

### Local Testing with SAM

```bash
# Start local API Gateway
sam local start-api --port 3001

# In another terminal, test endpoints
curl -X POST http://localhost:3001/api/poetry/generate \
  -H "Content-Type: application/json" \
  -d @test-events/poetry-test-event.json
```

### Test Individual Functions

```bash
# Test poetry function
sam local invoke PoetryFunction -e test-events/poetry-test-event.json

# Test with environment variables
sam local invoke PoetryFunction \
  -e test-events/poetry-test-event.json \
  --env-vars env.json
```

### Production Testing

See [PRODUCTION_TEST_RESULTS.md](PRODUCTION_TEST_RESULTS.md) for test scripts and results.

```powershell
# Windows PowerShell
.\test-production-endpoints.ps1
```

```bash
# Linux/macOS
./test-production-endpoints.sh
```

## 📊 Monitoring

### Quick Start: 5-Minute Setup ⚡

Get comprehensive monitoring set up in 5 minutes:

```bash
cd lambda

# 1. Deploy CloudWatch alarms (2 min)
sam build && sam deploy --parameter-overrides AlarmEmail=your-email@example.com

# 2. Set up billing alerts (2 min)
.\setup-billing-alerts.ps1 -Email "your-email@example.com"

# 3. Create monitoring dashboard (1 min)
.\create-monitoring-dashboard.ps1
```

**See**: [QUICK_START_MONITORING.md](QUICK_START_MONITORING.md) for detailed quick start guide.

### What You Get

✅ **9 CloudWatch Alarms** (error rate, duration, throttles for all functions)
✅ **3 Billing Alerts** ($5, $10, $20 thresholds)
✅ **Monitoring Dashboard** (real-time metrics visualization)
✅ **Email Notifications** (instant alerts when issues occur)
✅ **Memory Optimization Tools** (analyze and optimize costs)

### CloudWatch Alarms (Configured)

The SAM template includes comprehensive alarms for all Lambda functions:

**Poetry Function**:
- Error alarm: > 5 errors in 5 minutes
- Duration alarm: > 24s average (80% of timeout)
- Throttle alarm: Any throttling

**YouTube Function**:
- Error alarm: > 5 errors in 5 minutes
- Duration alarm: > 48s average (80% of timeout)
- Throttle alarm: Any throttling

**Thumbnail Function**:
- Error alarm: > 5 errors in 5 minutes
- Duration alarm: > 8s average (80% of timeout)
- Throttle alarm: Any throttling

**Total**: 9 alarms (within free tier limit of 10)

**See**: [MONITORING_SETUP.md](MONITORING_SETUP.md) for detailed alarm configuration.

### Billing Alerts (Configured)

Billing alerts help prevent unexpected AWS charges:

- **Warning**: $5 threshold (50% of target budget)
- **Critical**: $10 threshold (100% of target budget)
- **Emergency**: $20 threshold (200% of target budget)

**Expected Monthly Cost**: ~$2.50 (well under $5 target)

**See**: [BILLING_ALERTS_SETUP.md](BILLING_ALERTS_SETUP.md) for setup instructions.

### Monitoring Dashboard

Create a comprehensive CloudWatch dashboard:

```bash
.\create-monitoring-dashboard.ps1
```

**Dashboard includes**:
- Lambda invocations (all functions)
- Lambda errors (all functions)
- Lambda duration (all functions)
- Concurrent executions
- API Gateway requests
- API Gateway latency
- API Gateway errors
- Lambda throttles

**View Dashboard**:
https://console.aws.amazon.com/cloudwatch/home?region=ap-northeast-2#dashboards:name=music-poetry-backend-monitoring

**See**: [MONITORING_DASHBOARD.md](MONITORING_DASHBOARD.md) for dashboard guide.

### Memory Optimization

After 1 week of production usage, optimize memory allocation:

```bash
# Analyze memory usage
.\analyze-memory-usage.ps1

# Review recommendations
# Update lambda/template.yaml if needed
# Redeploy: sam build && sam deploy
```

**Potential Savings**:
- Poetry Function: 40% cost reduction (512MB → 256MB)
- YouTube Function: 12.5% cost reduction (2048MB → 1536MB)
- Thumbnail Function: 50% cost reduction (256MB → 128MB)

**See**: [MEMORY_OPTIMIZATION.md](MEMORY_OPTIMIZATION.md) for optimization guide.

### CloudWatch Logs

View logs in real-time:
```bash
sam logs -n PoetryFunction --stack-name music-poetry-backend --tail
```

View logs in AWS Console:
```
CloudWatch > Log groups > /aws/lambda/music-poetry-backend-PoetryFunction
```

### CloudWatch Metrics

Monitor in AWS Console:
- **Invocations**: Number of function calls
- **Duration**: Execution time
- **Errors**: Failed invocations
- **Throttles**: Rate-limited requests
- **ConcurrentExecutions**: Simultaneous executions

### Testing Alarms

Test that alarms are working correctly:

```bash
.\test-alarms.ps1 -ApiEndpoint "https://your-api-endpoint/Prod"
```

This will trigger error alarms by sending invalid requests.

### Monitoring Checklist

**Daily** (1 minute):
- [ ] Check CloudWatch dashboard
- [ ] Verify alarm status (should be OK)
- [ ] Review error count

**Weekly** (5 minutes):
- [ ] Check Cost Explorer for spending trends
- [ ] Review CloudWatch dashboard for patterns
- [ ] Check alarm history

**Monthly** (15 minutes):
- [ ] Run memory analysis script
- [ ] Review recommendations
- [ ] Update SAM template if needed
- [ ] Deploy changes

### Monitoring Documentation

- [QUICK_START_MONITORING.md](QUICK_START_MONITORING.md) - 5-minute setup guide
- [MONITORING_SETUP.md](MONITORING_SETUP.md) - CloudWatch alarms configuration
- [BILLING_ALERTS_SETUP.md](BILLING_ALERTS_SETUP.md) - Billing alerts setup
- [MEMORY_OPTIMIZATION.md](MEMORY_OPTIMIZATION.md) - Memory optimization guide
- [MONITORING_DASHBOARD.md](MONITORING_DASHBOARD.md) - Dashboard creation and usage
- [MONITORING_COMPLETE.md](MONITORING_COMPLETE.md) - Complete monitoring summary

## 💰 Cost Optimization

### Current Costs (Estimated)

For **1000 requests/month**:

| Service | Cost | Details |
|---------|------|---------|
| Lambda (Poetry) | $0.04 | 1000 × 4.5s × 512MB |
| Lambda (YouTube) | $0.67 | 1000 × 20s × 2048MB |
| Bedrock (Claude Haiku) | $0.71 | Input + Output tokens |
| API Gateway | $0.004 | 1000 requests |
| **Total** | **$1.43/month** | Well under $5 target |

### Optimization Tips

1. **Right-size Memory**
   - Monitor actual memory usage in CloudWatch
   - Adjust memory allocation in `template.yaml`
   - More memory = faster CPU = potentially lower cost

2. **Reduce Execution Time**
   - Optimize code performance
   - Use connection pooling
   - Cache frequently accessed data

3. **Use Free Tier**
   - Lambda: 1M requests/month free
   - Lambda: 400,000 GB-seconds free
   - API Gateway: 1M requests/month free (first 12 months)

4. **Monitor Usage**
   - Set up billing alerts
   - Review CloudWatch metrics weekly
   - Optimize based on actual usage patterns

### Billing Alerts

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name lambda-cost-alert \
  --alarm-description "Alert when costs exceed $10" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 86400 \
  --evaluation-periods 1 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Bedrock Access Denied

**Error**: `AccessDeniedException: User is not authorized to perform: bedrock:InvokeModel`

**Solution**:
1. Check IAM role has `bedrock:InvokeModel` permission
2. Verify Bedrock is enabled in your region
3. Request access to Claude models in Bedrock console

See [BEDROCK_ACCESS_FIX.md](BEDROCK_ACCESS_FIX.md) for detailed steps.

#### 2. Layer Build Failed (Windows)

**Error**: `Error: PythonPipBuilder:ResolveDependencies - {librosa==0.10.1(wheel)}`

**Solution**:
- Use Linux/macOS for building layers
- Or use CI/CD (GitHub Actions, CodePipeline)
- Or deploy without layers using `template-no-layers.yaml`

#### 3. Cold Start Latency

**Issue**: First request takes 3-5 seconds

**Solutions**:
- Accept cold starts (most cost-effective)
- Use Provisioned Concurrency (costs more)
- Implement warming strategy (scheduled pings)

#### 4. Timeout Errors

**Error**: `Task timed out after 30.00 seconds`

**Solution**:
1. Increase timeout in `template.yaml`
2. Optimize code performance
3. Check external service latency (Bedrock, YouTube)

#### 5. Memory Errors

**Error**: `Runtime exited with error: signal: killed`

**Solution**:
1. Increase memory in `template.yaml`
2. Optimize memory usage (especially for librosa)
3. Process data in chunks

#### 6. CORS Errors

**Error**: `Access to fetch at '...' from origin '...' has been blocked by CORS policy`

**Solution**:
1. Check CORS configuration in `template.yaml`
2. Ensure Lambda returns proper CORS headers
3. Test with `curl` to isolate frontend vs backend issue

### Debugging Tips

1. **Check CloudWatch Logs**
   ```bash
   sam logs -n PoetryFunction --stack-name music-poetry-backend --tail
   ```

2. **Test Locally**
   ```bash
   sam local start-api
   curl http://localhost:3001/api/poetry/generate -d @test-event.json
   ```

3. **Invoke Function Directly**
   ```bash
   sam local invoke PoetryFunction -e test-event.json
   ```

4. **Check IAM Permissions**
   ```bash
   aws iam get-role --role-name music-poetry-backend-PoetryFunctionRole
   ```

5. **Validate Template**
   ```bash
   sam validate
   ```

## 📚 Additional Resources

### Documentation
- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)
- [Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [API Gateway CORS](https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-cors.html)

### Function-Specific Docs
- [Poetry Function README](poetry-function/README.md)
- [YouTube Function README](youtube-function/README.md)

### Test Results
- [Deployment Results](DEPLOYMENT_RESULTS.md)
- [Production Test Results](PRODUCTION_TEST_RESULTS.md)
- [Local Testing Guide](LOCAL_TESTING_GUIDE.md)

### Troubleshooting Guides
- [Bedrock Access Fix](BEDROCK_ACCESS_FIX.md)

## 🤝 Contributing

When adding new Lambda functions:

1. Create function directory under `lambda/`
2. Add function definition to `template.yaml`
3. Create function-specific README.md
4. Add test events to `test-events/`
5. Update this README with new endpoints
6. Test locally with `sam local`
7. Deploy and document results

## 📄 License

MIT

---

**Last Updated**: 2025-11-27
**Stack Name**: kiroween (ap-northeast-2)
**Status**: Poetry Function deployed ✅, YouTube Function ready for deployment ⏭️
