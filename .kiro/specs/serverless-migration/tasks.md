# Implementation Plan

- [x] 1. Set up project structure and SAM template
  - Lambda directory created with template.yaml
  - All resources defined (functions, layers, API Gateway)
  - _Requirements: FR-1, FR-2, FR-3, FR-4, FR-5_

- [x] 2. Implement Poetry Generation Lambda Function





  - [x] 2.1 Create poetry function handler and dependencies


    - Create `lambda/poetry-function/index.js` with Lambda handler
    - Create `lambda/poetry-function/package.json` with @aws-sdk/client-bedrock-runtime
    - Migrate buildPoetryPrompt function from `backend/server.js`
    - Implement Bedrock InvokeModel integration for Claude models
    - Return structured response with statusCode, headers, body
    - _Requirements: FR-1_
  - [x] 2.2 Test poetry function locally


    - Run `sam build && sam local start-api`
    - Test with different personas and languages
    - Verify response format and error handling
    - _Requirements: FR-1, NFR-1_

- [x] 3. Implement YouTube Processing Lambda Function




  - [x] 3.1 Create YouTube function handler


    - Create `lambda/youtube-function/handler.py` with lambda_handler
    - Copy `backend/audio_analyzer.py` to youtube-function directory
    - Implement routing for /info and /audio-with-analysis endpoints
    - Migrate YouTube URL validation logic
    - Implement yt-dlp subprocess calls with /tmp cleanup
    - Integrate librosa analysis
    - _Requirements: FR-2_
  - [x] 3.2 Create yt-dlp Lambda layer


    - Create `lambda/layers/yt-dlp-layer/Makefile`
    - Implement build-YtdlpLayer target to download binary
    - Test layer build with `sam build`
    - _Requirements: FR-5_
  - [x] 3.3 Create Python libraries Lambda layer


    - Create `lambda/layers/python-libs-layer/requirements.txt`
    - Add librosa, numpy, scipy, soundfile, audioread dependencies
    - Test layer build with `sam build`
    - _Requirements: FR-5_
  - [x] 3.4 Test YouTube function locally


    - Run `sam build && sam local start-api`
    - Test both endpoints with valid YouTube URLs
    - Verify analysis results and /tmp cleanup
    - _Requirements: FR-2, NFR-1_

- [ ]* 4. Implement Thumbnail Proxy Lambda Function
  - [ ]* 4.1 Create thumbnail function handler
    - Create `lambda/thumbnail-function/index.js` with Lambda handler
    - Create `lambda/thumbnail-function/package.json`
    - Implement image fetch and base64 conversion
    - Return response with proper headers and isBase64Encoded flag
    - _Requirements: FR-3_
  - [ ]* 4.2 Test thumbnail function locally
    - Run `sam build && sam local start-api`
    - Test with YouTube thumbnail URLs
    - Verify image data and headers
    - _Requirements: FR-3, NFR-1_

- [x] 5. Deploy to AWS and test production
  - [x] 5.1 Deploy Lambda functions to AWS
    - Configure AWS credentials and Bedrock access
    - Run `sam build && sam deploy --guided`
    - Configure stack settings and wait for deployment
    - Note API Gateway endpoint URL
    - _Requirements: FR-4, NFR-2, NFR-4_
  - [x] 5.2 Test production endpoints




    - Test all endpoints with real requests
    - Verify CloudWatch Logs
    - Test error handling and CORS
    - Monitor execution times and memory usage
    - _Requirements: FR-1, FR-2, FR-3, FR-4, NFR-1, NFR-3_
-

- [x] 6. Integrate with frontend and update documentation



  - [x] 6.1 Update frontend configuration

    - Update `.env.production` with API Gateway URL
    - Update `src/config/config.ts` to use environment variable
    - Test frontend with Lambda backend
    - Verify all features work without CORS errors
    - _Requirements: FR-4, NFR-4_
  - [x] 6.2 Update project documentation

    - Update README.md with serverless deployment instructions
    - Document SAM CLI setup and deployment commands
    - Add troubleshooting section for common issues
    - Update lambda/README.md with Lambda-specific details
    - _Requirements: NFR-5_

- [x] 7. Set up monitoring and optimize performance




  - [x] 7.1 Configure CloudWatch alarms


    - Create alarms for error rate, duration, and throttles
    - Set up SNS notifications
    - Test alarm triggers
    - _Requirements: NFR-3, NFR-5_
  - [x] 7.2 Configure billing alerts


    - Enable billing alerts in AWS Console
    - Create alarm for $10 threshold
    - Document expected costs
    - _Requirements: NFR-2_
  - [x] 7.3 Optimize memory allocation


    - Monitor memory usage in CloudWatch
    - Test different memory sizes for each function
    - Update SAM template with optimal settings
    - Redeploy and verify improvements
    - _Requirements: NFR-1, NFR-2_

---

## Integration Testing Checklist

After completing all phases, verify the complete system:

### Poetry Function
- [ ] Generates poetry with Bedrock (Claude 3 Haiku and Sonnet)
- [ ] Supports all personas (hamlet, nietzsche, yi-sang, baudelaire, etc.)
- [ ] Supports all languages (ko, en, ja, zh, fr, de, es)
- [ ] Handles invalid input gracefully
- [ ] Returns proper error messages with status codes
- [ ] CORS headers present in all responses
- [ ] Response time < 30 seconds

### YouTube Function
- [ ] Fetches video info correctly
- [ ] Validates YouTube URLs (youtube.com and youtu.be)
- [ ] Enforces 5 minute duration limit
- [ ] Downloads audio to /tmp successfully
- [ ] Analyzes audio with librosa (tempo, energy, mood, etc.)
- [ ] Cleans up /tmp files after execution
- [ ] Returns proper format matching Express version
- [ ] Response time < 60 seconds

### Thumbnail Function
- [ ] Proxies YouTube thumbnail images
- [ ] Returns base64-encoded data
- [ ] Sets proper Content-Type headers
- [ ] Handles fetch errors gracefully
- [ ] Response time < 10 seconds

### Integration
- [ ] All endpoints accessible via API Gateway
- [ ] Frontend connects successfully to Lambda backend
- [ ] No CORS errors in browser console
- [ ] Error handling works end-to-end
- [ ] CloudWatch logs show proper execution
- [ ] All features work: YouTube input, analysis, poetry, visualization

---

## Success Metrics

- [ ] All Express endpoints migrated to Lambda
- [ ] Monthly cost < $5 for expected usage (1000 requests)
- [ ] Response times meet NFR-1 requirements:
  - Poetry: < 30 seconds
  - YouTube: < 60 seconds
  - Thumbnail: < 10 seconds
- [ ] Zero critical errors in first week of production
- [ ] Frontend works seamlessly with Lambda backend
- [ ] Documentation complete and accurate
- [ ] Team can deploy updates independently

---

**Last Updated**: 2025-11-27
**Status**: Ready to start - SAM template created, functions need implementation
