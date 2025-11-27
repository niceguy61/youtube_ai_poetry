# CloudFront 설정 수정 리포트

**날짜:** 2025-11-27  
**도메인:** kiroween.drumgoon.net  
**CloudFront ID:** E2XXT04YWS0DGE  
**상태:** ✅ 수정 완료 (배포 중)

---

## 🔍 발견된 문제

### 1. ❌ DefaultRootObject 누락
**문제:**
- DefaultRootObject가 비어있음 (`""`)
- 루트 URL (https://kiroween.drumgoon.net) 접속 시 index.html을 찾지 못함

**증상:**
- 도메인 접속 시 403 Forbidden 또는 빈 페이지
- S3 버킷 리스팅 시도 (차단됨)

**원인:**
- CloudFront 생성 시 DefaultRootObject 설정 누락

### 2. ❌ CustomErrorResponses 누락
**문제:**
- CustomErrorResponses가 null
- SPA (Single Page Application) 라우팅 지원 안 됨

**증상:**
- 직접 URL 접속 시 404 에러 (예: /about, /settings)
- 새로고침 시 페이지 깨짐
- 클라이언트 사이드 라우팅 실패

**원인:**
- SPA를 위한 에러 핸들링 설정 누락

---

## ✅ 적용된 수정사항

### 1. DefaultRootObject 설정
```json
{
  "DefaultRootObject": "index.html"
}
```

**효과:**
- ✅ https://kiroween.drumgoon.net → index.html 자동 로드
- ✅ 루트 URL 접속 정상 작동

### 2. CustomErrorResponses 설정
```json
{
  "CustomErrorResponses": {
    "Quantity": 2,
    "Items": [
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 0
      },
      {
        "ErrorCode": 403,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 0
      }
    ]
  }
}
```

**효과:**
- ✅ 404 에러 → index.html 반환 (SPA 라우팅)
- ✅ 403 에러 → index.html 반환 (권한 문제 우회)
- ✅ 클라이언트 사이드 라우팅 정상 작동
- ✅ 직접 URL 접속 가능
- ✅ 새로고침 시 페이지 유지

### 3. 캐시 무효화
```
Invalidation ID: I78VV2UGY2TCWX7KEEP1LZC7G1
Paths: /*
Status: InProgress
```

**효과:**
- ✅ 기존 캐시 제거
- ✅ 새 설정 즉시 적용
- ✅ 모든 엣지 로케이션 업데이트

---

## 📊 현재 상태

### CloudFront Distribution
- **ID:** E2XXT04YWS0DGE
- **도메인:** d3dmnpn2aufr9o.cloudfront.net
- **커스텀 도메인:** kiroween.drumgoon.net
- **상태:** InProgress (배포 중)
- **예상 완료 시간:** 5-15분

### S3 버킷
- **이름:** kiroween.drumgoon.net
- **리전:** ap-northeast-2
- **파일 상태:** ✅ 정상 업로드됨
  - index.html (459 bytes)
  - assets/index-D2vAZjKW.js (495,910 bytes)
  - assets/index-Dxxpr5u6.css (57,554 bytes)
  - assets/YouTubeExtractor-CTswCqTr.js (4,005 bytes)
  - vite.svg (1,497 bytes)

### SSL/TLS 인증서
- **ARN:** arn:aws:acm:us-east-1:261250906071:certificate/8eb766bd-f5ca-47d4-884d-e9c3b9688416
- **상태:** ✅ 정상
- **프로토콜:** TLSv1.2_2021
- **방식:** SNI

---

## 🧪 테스트 방법

### 배포 완료 확인 (5-15분 후)
```powershell
# CloudFront 상태 확인
aws cloudfront get-distribution --id E2XXT04YWS0DGE --query 'Distribution.Status'

# 결과가 "Deployed"가 되면 완료
```

### 웹사이트 테스트
1. **루트 URL 테스트**
   ```
   https://kiroween.drumgoon.net
   ```
   - 예상: index.html 로드, 앱 정상 표시

2. **CloudFront URL 테스트**
   ```
   https://d3dmnpn2aufr9o.cloudfront.net
   ```
   - 예상: 커스텀 도메인과 동일하게 작동

3. **직접 경로 테스트**
   ```
   https://kiroween.drumgoon.net/about
   https://kiroween.drumgoon.net/settings
   ```
   - 예상: 404 대신 index.html 로드, React Router 처리

4. **새로고침 테스트**
   - 앱 내에서 페이지 이동 후 F5 새로고침
   - 예상: 페이지 유지, 에러 없음

5. **브라우저 콘솔 확인**
   - F12 → Console 탭
   - 예상: 에러 없음, API 호출 정상

---

## 🔧 추가 확인사항

### DNS 설정 확인
```powershell
# DNS 레코드 확인
nslookup kiroween.drumgoon.net

# 예상 결과: CloudFront 도메인으로 CNAME 설정됨
```

### HTTPS 리다이렉트 확인
```powershell
# HTTP → HTTPS 리다이렉트 테스트
curl -I http://kiroween.drumgoon.net

# 예상: 301/302 리다이렉트 → https://
```

---

## 📝 설정 요약

### 수정 전
```json
{
  "DefaultRootObject": "",
  "CustomErrorResponses": null
}
```

### 수정 후
```json
{
  "DefaultRootObject": "index.html",
  "CustomErrorResponses": {
    "Quantity": 2,
    "Items": [
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 0
      },
      {
        "ErrorCode": 403,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 0
      }
    ]
  }
}
```

---

## 🚀 다음 단계

### 즉시 (배포 완료 후)
1. ✅ https://kiroween.drumgoon.net 접속 테스트
2. ✅ 브라우저 콘솔 에러 확인
3. ✅ 모든 기능 테스트 (poetry, YouTube, visualization)
4. ✅ 모바일/태블릿 반응형 테스트

### 선택사항
1. **커스텀 도메인 추가 설정**
   - www.kiroween.drumgoon.net 리다이렉트
   - 다른 서브도메인 추가

2. **성능 최적화**
   - 캐시 정책 조정
   - 압축 설정 확인
   - 이미지 최적화

3. **모니터링 설정**
   - CloudWatch 알람
   - 에러율 모니터링
   - 트래픽 분석

---

## 📚 참고 자료

### AWS 문서
- [CloudFront DefaultRootObject](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/DefaultRootObject.html)
- [CloudFront Custom Error Pages](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/custom-error-pages.html)
- [SPA with CloudFront](https://aws.amazon.com/premiumsupport/knowledge-center/cloudfront-serve-static-website/)

### 프로젝트 문서
- `.kiro/specs/frontend-deployment/design.md`
- `.kiro/specs/frontend-deployment/requirements.md`
- `PRODUCTION_BUILD_TEST_REPORT.md`

---

## ⚠️ 주의사항

### 캐시 관련
- 변경사항이 즉시 반영되지 않을 수 있음
- 브라우저 캐시 클리어 필요 (Ctrl+Shift+R)
- CloudFront 캐시 무효화 완료 대기 필요

### 배포 시간
- CloudFront 배포: 5-15분 소요
- 캐시 무효화: 5-10분 소요
- DNS 전파: 최대 48시간 (일반적으로 수분)

### 비용
- 캐시 무효화: 처음 1000개 경로 무료
- CloudFront 요청: 프리티어 포함
- 데이터 전송: 사용량에 따라 과금

---

## ✅ 체크리스트

배포 완료 후 확인:
- [ ] CloudFront 상태: Deployed
- [ ] 캐시 무효화 완료
- [ ] https://kiroween.drumgoon.net 접속 성공
- [ ] index.html 로드 확인
- [ ] SPA 라우팅 작동 확인
- [ ] API 연결 확인 (poetry, YouTube)
- [ ] 브라우저 콘솔 에러 없음
- [ ] 모바일 반응형 확인
- [ ] HTTPS 리다이렉트 확인

---

**수정 완료:** 2025-11-27  
**배포 상태:** InProgress → Deployed (5-15분 소요)  
**다음 확인:** 배포 완료 후 웹사이트 테스트

🎉 CloudFront 설정이 수정되었습니다. 5-15분 후 다시 접속해보세요!
