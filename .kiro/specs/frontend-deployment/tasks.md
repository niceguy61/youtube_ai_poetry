# Implementation Plan

- [ ]* 1. Verify AWS infrastructure
  - Verify existing S3 bucket and CloudFront distribution
  - Verify IAM role for GitHub Actions
  - Test infrastructure manually
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 1.1 Verify S3 bucket configuration
  - Confirm S3 bucket exists and note bucket name
  - Verify static website hosting is enabled
  - Verify index document is set to index.html
  - Verify error document is set to index.html (for SPA routing)
  - Verify versioning is enabled (optional but recommended)
  - Verify public access is blocked
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ]* 1.2 Verify CloudFront distribution configuration
  - Confirm CloudFront distribution exists and note distribution ID
  - Verify S3 bucket is set as origin
  - Verify HTTPS redirect is enabled (HTTP → HTTPS)
  - Verify custom error responses configured (404 → /index.html with 200 status)
  - Verify Origin Access Control (OAC) or Origin Access Identity (OAI) is configured
  - Note CloudFront domain name (e.g., d123456.cloudfront.net)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 1.3 Verify IAM role for GitHub Actions




  - Confirm IAM role exists for OIDC authentication
  - Verify trust policy allows GitHub Actions OIDC provider
  - Verify role has S3 permissions (PutObject, DeleteObject, ListBucket)
  - Verify role has CloudFront permissions (CreateInvalidation, GetInvalidation)
  - Note role ARN for GitHub Secrets
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 2. Fix build errors and test locally
  - Fix any build errors in the codebase
  - Test production build locally
  - Configure GitHub Secrets
  - _Requirements: 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 2.1 Verify environment configuration





  - Verify `.env.production` exists with correct values
  - Confirm `VITE_API_ENDPOINT=https://mvw4x2xbud.execute-api.ap-northeast-2.amazonaws.com/Prod`
  - Confirm `VITE_AI_PROVIDER=bedrock`
  - Confirm `VITE_AWS_REGION=ap-northeast-2`
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 2.2 Fix build errors


  - Run `npm ci` to install dependencies
  - Run `npm run build` to identify build errors
  - Fix TypeScript errors if any
  - Fix import/export errors if any
  - Fix missing dependencies if any
  - Re-run `npm run build` until successful
  - _Requirements: 5.5_

- [x] 2.3 Test production build locally





  - Verify `npm run build` completes successfully
  - Check `dist/` directory is created with files
  - Run `npm run preview` to test production build
  - Test application functionality (poetry, YouTube, visualization)
  - Verify API connectivity to Lambda backend
  - Check browser console for errors
  - Test on localhost before deploying
  - _Requirements: 5.5_

- [x] 2.4 Add GitHub Secrets
  - Go to GitHub repository → Settings → Secrets and variables → Actions
  - Add `AWS_ROLE_ARN` secret: `arn:aws:iam::ACCOUNT_ID:role/GithubActionRoleApi`
  - Add `AWS_REGION` secret: `ap-northeast-2`
  - Add `S3_BUCKET_NAME` secret: `kiroween.drumgoon.net`
  - Add `CLOUDFRONT_DISTRIBUTION_ID` secret: `E2XXT04YWS0DGE`
  - Add `VITE_API_ENDPOINT` secret: `https://mvw4x2xbud.execute-api.ap-northeast-2.amazonaws.com/Prod`
  - _Requirements: 4.4, 4.5, 5.2_

- [x] 3. Create GitHub Actions workflow





  - Implement CI/CD pipeline for automated deployment
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3_

- [x] 3.1 Create workflow file


  - Create `.github/workflows/deploy-frontend.yml`
  - Configure trigger on push to main branch
  - Add manual workflow_dispatch trigger
  - Set up job with ubuntu-latest runner
  - Configure OIDC permissions (id-token: write, contents: read)
  - _Requirements: 3.1_

- [x] 3.2 Implement build steps


  - Add checkout step (actions/checkout@v4)
  - Add Node.js setup step (actions/setup-node@v4, version 20.x)
  - Add dependency installation step (npm ci)
  - Add build step (npm run build)
  - Configure environment variables from secrets
  - _Requirements: 3.2, 3.3, 5.1, 5.2, 5.3_

- [x] 3.3 Implement AWS authentication


  - Add AWS credentials configuration step (aws-actions/configure-aws-credentials@v4)
  - Configure OIDC authentication with role ARN from secrets
  - Set AWS region from secrets
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 3.4 Implement S3 deployment


  - Add S3 sync step for static assets (with cache headers)
  - Add separate upload for index.html (no-cache headers)
  - Use --delete flag to remove old files
  - Set appropriate content-type headers
  - _Requirements: 3.4_

- [x] 3.5 Implement CloudFront invalidation


  - Add CloudFront invalidation step (invalidate /*)
  - Wait for invalidation to complete
  - Log invalidation ID for tracking
  - _Requirements: 3.5_

- [x] 3.6 Add deployment validation


  - Output CloudFront URL in workflow
  - Verify S3 sync success
  - Verify CloudFront invalidation success
  - Add error handling for each step
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 4. Test deployment workflow
  - Verify end-to-end deployment process
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 4.1 Test workflow execution
  - Push test commit to main branch
  - Monitor GitHub Actions workflow
  - Verify all steps complete successfully
  - Check workflow logs for errors
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 4.2 Verify deployment
  - Access CloudFront URL
  - Verify homepage loads correctly
  - Test navigation (client-side routing)
  - Test API connectivity (poetry generation, YouTube)
  - Check browser console for errors
  - Test on multiple browsers (Chrome, Firefox, Safari)
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 4.3 Test error scenarios
  - Test 404 handling (should return index.html)
  - Test direct URL access (should work with SPA routing)
  - Verify HTTPS redirect (HTTP → HTTPS)
  - Test cache invalidation (make change, verify update)
  - _Requirements: 1.4, 2.4, 6.4_

- [ ] 5. Create documentation
  - Document setup process and deployment workflow
  - _Requirements: NFR-5_

- [ ] 5.1 Create deployment guide
  - Create `DEPLOYMENT.md` in root directory
  - Document infrastructure setup steps
  - Document GitHub Secrets configuration
  - Document workflow usage
  - Document troubleshooting common issues
  - _Requirements: NFR-5_

- [ ] 5.2 Update main README
  - Add deployment section to `README.md`
  - Link to deployment guide
  - Document CloudFront URL
  - Add deployment status badge
  - _Requirements: NFR-5_

- [ ] 5.3 Create rollback guide
  - Document rollback procedures
  - Document S3 versioning usage
  - Document manual deployment process
  - _Requirements: NFR-2, NFR-5_

---

## Deployment Verification Checklist

After completing all tasks, verify:

### Infrastructure
- [ ] S3 bucket exists and configured correctly
- [ ] CloudFront distribution exists and deployed
- [ ] IAM role exists with correct permissions
- [ ] Bucket policy allows CloudFront access only
- [ ] Static website hosting enabled
- [ ] Versioning enabled on S3 bucket (recommended)

### GitHub Configuration
- [ ] All required secrets configured
- [ ] Secrets values are correct
- [ ] .env.production updated
- [ ] Production build works locally

### Workflow
- [ ] Workflow file created and valid
- [ ] Triggers configured correctly
- [ ] OIDC authentication works
- [ ] Build step completes successfully
- [ ] S3 sync works correctly
- [ ] CloudFront invalidation works
- [ ] Error handling in place

### Application
- [ ] Homepage loads via CloudFront
- [ ] Navigation works (SPA routing)
- [ ] API calls work (poetry, YouTube)
- [ ] No console errors
- [ ] HTTPS enforced
- [ ] 404 handling works
- [ ] Cache headers correct

### Documentation
- [ ] Deployment guide complete
- [ ] README updated
- [ ] Rollback guide created
- [ ] Troubleshooting documented

---

## Success Metrics

- [ ] Deployment completes in < 15 minutes
- [ ] Application accessible via CloudFront URL
- [ ] All features work correctly
- [ ] No AWS credentials in GitHub
- [ ] Monthly cost < $2
- [ ] Documentation complete

---

**Last Updated**: 2025-11-27
**Status**: Ready to start implementation
