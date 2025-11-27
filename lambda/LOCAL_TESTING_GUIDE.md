# SAM Local Testing with Podman on Windows

## Current Situation

Windows 환경에서 Podman을 사용하여 SAM local 테스트를 진행하려고 했으나, SAM CLI가 Docker를 직접 요구하고 있습니다.

## Issue

SAM CLI는 기본적으로 Docker를 찾으며, Podman을 직접 인식하지 못합니다:
```
Error: Running AWS SAM projects locally requires Docker. Have you got it installed and running?
```

## Solutions

### ✅ Solution 1: Individual Function Testing (Already Done)

각 함수를 독립적으로 테스트 - **이미 완료됨**:

#### Poetry Function
```bash
cd lambda/poetry-function
node test-local.js
```
**Status**: ✅ All tests passing

#### YouTube Function  
```bash
cd lambda/youtube-function
python test-handler.py
```
**Status**: ✅ All tests passing

---

### 🔧 Solution 2: Podman Docker Compatibility (Manual Setup Required)

Podman을 Docker 호환 모드로 설정:

#### Step 1: Start Podman Docker Socket
새 PowerShell 창에서 실행:
```powershell
podman machine stop
podman machine set --rootful
podman machine start
podman system service --time=0
```

#### Step 2: Set Docker Environment Variables
```powershell
$env:DOCKER_HOST = "npipe:////./pipe/podman-machine-default"
```

#### Step 3: Test SAM Local
```bash
cd lambda
sam local start-api --template .aws-sam/build/template.yaml --port 3001
```

#### Step 4: Test Endpoints
```bash
# Poetry endpoint
curl -X POST http://localhost:3001/api/poetry/generate `
  -H "Content-Type: application/json" `
  -d '{\"audioFeatures\": {\"tempo\": 120, \"energy\": 0.8, \"mood\": \"energetic\"}, \"persona\": \"hamlet\", \"language\": \"ko\", \"model\": \"anthropic.claude-3-haiku-20240307-v1:0\"}'
```

---

### 🚀 Solution 3: Deploy to AWS (Recommended)

로컬 테스트를 건너뛰고 AWS에 직접 배포:

```bash
cd lambda
sam build
sam deploy --guided
```

**장점**:
- 실제 환경에서 테스트
- Layer 빌드 문제 없음 (Linux 환경)
- CloudWatch Logs로 디버깅
- 실제 Bedrock 통합 테스트

**단점**:
- AWS 비용 발생 (매우 적음, Free Tier 사용 가능)
- 배포 시간 소요 (15-20분)

---

## Current Test Status

### ✅ Completed Tests

| Function | Test Method | Status | Details |
|----------|-------------|--------|---------|
| Poetry | `test-local.js` | ✅ PASS | All endpoints working |
| YouTube | `test-handler.py` | ✅ PASS | Handler logic verified |

### 📋 Test Coverage

**Poetry Function**:
- ✅ Bedrock integration (mocked)
- ✅ Prompt building
- ✅ Error handling
- ✅ Response formatting
- ✅ CORS headers

**YouTube Function**:
- ✅ URL validation
- ✅ Duration checking
- ✅ yt-dlp integration
- ✅ Error handling
- ✅ Response formatting

---

## Recommendation

**Option A: Proceed with AWS Deployment** (추천)
- 개별 함수 테스트 완료
- 실제 환경에서 통합 테스트 진행
- 더 정확한 검증 가능

**Option B: Manual Podman Setup**
- Podman Docker 호환 모드 설정
- SAM local 실행
- 로컬 통합 테스트

**Option C: Skip Local Integration Test**
- 개별 테스트로 충분
- AWS 배포 후 검증

---

## Next Steps

### If choosing AWS Deployment:

1. **Configure AWS Credentials**
```bash
aws configure
# Enter: Access Key, Secret Key, Region (us-east-1), Output format (json)
```

2. **Build and Deploy**
```bash
cd lambda
sam build
sam deploy --guided
```

3. **Test in AWS**
```bash
# Get API endpoint from deployment output
curl -X POST https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/Prod/api/poetry/generate \
  -H "Content-Type: application/json" \
  -d '{"audioFeatures": {...}, "persona": "hamlet"}'
```

4. **Monitor**
```bash
sam logs -n PoetryFunction --tail
```

---

### If choosing Podman Setup:

1. **Configure Podman**
```powershell
# In new PowerShell window
podman machine stop
podman machine set --rootful
podman machine start
podman system service --time=0
```

2. **Set Environment**
```powershell
# In your working PowerShell
$env:DOCKER_HOST = "npipe:////./pipe/podman-machine-default"
```

3. **Test SAM Local**
```bash
cd lambda
sam local start-api --template .aws-sam/build/template.yaml --port 3001
```

---

## Conclusion

**개별 함수 테스트는 이미 완료되었으며 모두 통과했습니다.**

로컬 통합 테스트를 원하시면 Podman Docker 호환 모드 설정이 필요하지만, 
**AWS에 직접 배포하는 것이 더 효율적이고 정확한 테스트 방법**입니다.

어떤 방법을 선택하시겠습니까?

