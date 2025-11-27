# SAM Local Testing Guide (Windows without Docker)

## Current Situation

Windows 환경에서 Docker 없이 SAM local 테스트를 진행하는 방법입니다.

## Issue: SAM Build on Windows

SAM build가 Windows에서 파일 잠금 문제로 실패합니다:
```
Error: [WinError 32] 다른 프로세스가 파일을 사용 중이기 때문에 프로세스가 액세스 할 수 없습니다
```

## Workaround Options

### Option 1: Test Functions Individually (Recommended)

각 함수를 개별적으로 테스트:

#### Poetry Function (Node.js)
```bash
cd lambda/poetry-function
node test-local.js
```

#### YouTube Function (Python)
```bash
cd lambda/youtube-function
python test-handler.py
```

### Option 2: Install Docker Desktop

1. Docker Desktop 설치: https://www.docker.com/products/docker-desktop
2. Docker Desktop 실행
3. SAM build 재시도:
```bash
cd lambda
sam build --use-container
sam local start-api --port 3001
```

### Option 3: Deploy to AWS Directly

로컬 테스트를 건너뛰고 AWS에 직접 배포:
```bash
cd lambda
sam build
sam deploy --guided
```

AWS 환경(Linux)에서는 빌드가 정상적으로 작동합니다.

## Current Test Status

### ✅ Poetry Function
- Tested with `test-local.js`
- All tests passing
- Ready for deployment

### ✅ YouTube Function  
- Tested with `test-handler.py`
- Handler logic verified
- Ready for deployment

### ⏭️ Thumbnail Function
- Not implemented (optional)
- Can be added later if needed

## Recommendation

**Option 3 (Deploy to AWS)** 추천:
1. 로컬 테스트는 개별 스크립트로 완료됨
2. AWS 환경에서 통합 테스트 진행
3. 실제 환경에서 검증하는 것이 더 정확함

## Next Steps

1. AWS 자격 증명 설정 확인
2. `sam deploy --guided` 실행
3. API Gateway 엔드포인트로 테스트
4. CloudWatch Logs 확인

