# Frontend Deployment - Design

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Repository                        │
│                  (Music Poetry Canvas)                      │
└────────────────────────┬────────────────────────────────────┘
                         │ Push to main
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   GitHub Actions Workflow                   │
│  1. Checkout code                                           │
│  2. Setup Node.js 20.x                                      │
│  3. Install dependencies (npm ci)                           │
│  4. Build production bundle (npm run build)                 │
│  5. Configure AWS credentials (OIDC)                        │
│  6. Sync files to S3                                        │
│  7. Invalidate CloudFront cache                             │
└────────────────────────┬────────────────────────────────────┘
                         │ Deploy
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      AWS Infrastructure                     │
│                                                             │
│  ┌──────────────┐         ┌──────────────┐                │
│  │  S3 Bucket   │────────▶│  CloudFront  │                │
│  │  (Origin)    │         │ Distribution │                │
│  │              │         │   (CDN)      │                │
│  │ - index.html │         │              │                │
│  │ - assets/    │         │ - HTTPS      │                │
│  │ - *.js       │         │ - Caching    │                │
│  │ - *.css      │         │ - Global     │                │
│  └──────────────┘         └──────┬───────┘                │
│                                   │                         │
└───────────────────────────────────┼─────────────────────────┘
                                    │ HTTPS
                                    ▼
                            ┌───────────────┐
                            │     Users     │
                            │  (Worldwide)  │
                            └───────────────┘
```

## Component Design

### 1. GitHub Actions Workflow

**File**: `.github/workflows/deploy-frontend.yml`

**Trigger**: Push to `main` branch

**Jobs**:
1. **Build and Deploy**
   - Runs on: `ubuntu-latest`
   - Node.js version: 20.x
   - Steps: Checkout → Setup → Install → Build → Deploy

**Workflow Structure**:
```yaml
name: Deploy Frontend to AWS

on:
  push:
    branches:
      - main
  workflow_dispatch:  # Manual trigger

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      id-token: write  # Required for OIDC
      contents: read
    
    steps:
      - name: Checkout code
      - name: Setup Node.js
      - name: Install dependencies
      - name: Build production bundle
      - name: Configure AWS credentials
      - name: Sync to S3
      - name: Invalidate CloudFront cache
```

### 2. AWS OIDC Authentication

**Authentication Flow**:
```
1. GitHub Actions requests OIDC token from GitHub
2. GitHub provides JWT token with repository information
3. Workflow assumes AWS IAM role using OIDC token
4. AWS STS validates token and provides temporary credentials
5. Workflow uses temporary credentials for S3/CloudFront operations
```

**IAM Role Trust Policy**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:OWNER/REPO:ref:refs/heads/main"
        }
      }
    }
  ]
}
```

**IAM Role Permissions Policy**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::BUCKET_NAME",
        "arn:aws:s3:::BUCKET_NAME/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation",
        "cloudfront:GetInvalidation"
      ],
      "Resource": "arn:aws:cloudfront::ACCOUNT_ID:distribution/DISTRIBUTION_ID"
    }
  ]
}
```

### 3. S3 Bucket Configuration

**Bucket Settings**:
- **Name**: Configurable via GitHub Secret
- **Region**: Same as Lambda backend (ap-northeast-2)
- **Versioning**: Enabled (for rollback capability)
- **Public Access**: Blocked (CloudFront only)
- **Static Website Hosting**: Enabled

**Static Website Configuration**:
```json
{
  "IndexDocument": {
    "Suffix": "index.html"
  },
  "ErrorDocument": {
    "Key": "index.html"
  }
}
```

**Bucket Policy** (CloudFront access only):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipal",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::BUCKET_NAME/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::ACCOUNT_ID:distribution/DISTRIBUTION_ID"
        }
      }
    }
  ]
}
```

### 4. CloudFront Distribution

**Origin Configuration**:
- **Origin Domain**: S3 bucket regional endpoint
- **Origin Access**: Origin Access Control (OAC)
- **Origin Protocol**: HTTPS only

**Cache Behavior**:
- **Path Pattern**: Default (*)
- **Viewer Protocol**: Redirect HTTP to HTTPS
- **Allowed Methods**: GET, HEAD, OPTIONS
- **Cached Methods**: GET, HEAD
- **Cache Policy**: CachingOptimized (for static assets)
- **Origin Request Policy**: CORS-S3Origin

**Custom Error Responses**:
```yaml
- ErrorCode: 404
  ResponseCode: 200
  ResponsePagePath: /index.html
  ErrorCachingMinTTL: 0

- ErrorCode: 403
  ResponseCode: 200
  ResponsePagePath: /index.html
  ErrorCachingMinTTL: 0
```

**Cache Invalidation**:
- **Pattern**: `/*` (invalidate all files)
- **Trigger**: After S3 sync completes
- **Wait**: Poll until invalidation completes

### 5. Build Configuration

**Environment Variables** (.env.production):
```bash
VITE_API_ENDPOINT=https://your-api-id.execute-api.ap-northeast-2.amazonaws.com/Prod
VITE_AI_PROVIDER=bedrock
VITE_AWS_REGION=ap-northeast-2
```

**Build Process**:
```bash
# 1. Install dependencies (exact versions from package-lock.json)
npm ci

# 2. Build production bundle
npm run build

# Output: dist/ directory with:
# - index.html
# - assets/*.js (hashed filenames)
# - assets/*.css (hashed filenames)
# - vite.svg, other static assets
```

**Build Optimizations**:
- Code splitting for lazy loading
- Tree shaking to remove unused code
- Minification of JS and CSS
- Asset hashing for cache busting
- Source maps for debugging (optional)

### 6. Deployment Process

**S3 Sync Strategy**:
```bash
# Sync with delete (remove old files)
aws s3 sync dist/ s3://BUCKET_NAME/ \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "index.html"

# Upload index.html separately (no cache)
aws s3 cp dist/index.html s3://BUCKET_NAME/index.html \
  --cache-control "no-cache, no-store, must-revalidate" \
  --content-type "text/html"
```

**Cache Control Headers**:
- **Static Assets** (JS, CSS, images): `max-age=31536000, immutable`
- **index.html**: `no-cache, no-store, must-revalidate`
- **Reason**: Hashed filenames allow aggressive caching, index.html must always be fresh

**CloudFront Invalidation**:
```bash
# Create invalidation
aws cloudfront create-invalidation \
  --distribution-id DISTRIBUTION_ID \
  --paths "/*"

# Wait for completion (optional)
aws cloudfront wait invalidation-completed \
  --distribution-id DISTRIBUTION_ID \
  --id INVALIDATION_ID
```

## Infrastructure as Code

### CloudFormation Template

**File**: `infrastructure/frontend-stack.yaml`

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Frontend hosting infrastructure for Music Poetry Canvas

Parameters:
  BucketName:
    Type: String
    Description: S3 bucket name for hosting
  
  GitHubOrg:
    Type: String
    Description: GitHub organization or username
  
  GitHubRepo:
    Type: String
    Description: GitHub repository name

Resources:
  # S3 Bucket
  FrontendBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Ref BucketName
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      WebsiteConfiguration:
        IndexDocument: index.html
        ErrorDocument: index.html

  # CloudFront Origin Access Control
  CloudFrontOAC:
    Type: AWS::CloudFront::OriginAccessControl
    Properties:
      OriginAccessControlConfig:
        Name: !Sub "${BucketName}-OAC"
        OriginAccessControlOriginType: s3
        SigningBehavior: always
        SigningProtocol: sigv4

  # CloudFront Distribution
  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Enabled: true
        DefaultRootObject: index.html
        Origins:
          - Id: S3Origin
            DomainName: !GetAtt FrontendBucket.RegionalDomainName
            S3OriginConfig: {}
            OriginAccessControlId: !Ref CloudFrontOAC
        DefaultCacheBehavior:
          TargetOriginId: S3Origin
          ViewerProtocolPolicy: redirect-to-https
          AllowedMethods:
            - GET
            - HEAD
            - OPTIONS
          CachedMethods:
            - GET
            - HEAD
          CachePolicyId: 658327ea-f89d-4fab-a63d-7e88639e58f6  # CachingOptimized
          OriginRequestPolicyId: 88a5eaf4-2fd4-4709-b370-b4c650ea3fcf  # CORS-S3Origin
        CustomErrorResponses:
          - ErrorCode: 404
            ResponseCode: 200
            ResponsePagePath: /index.html
            ErrorCachingMinTTL: 0
          - ErrorCode: 403
            ResponseCode: 200
            ResponsePagePath: /index.html
            ErrorCachingMinTTL: 0
        HttpVersion: http2and3
        IPV6Enabled: true

  # S3 Bucket Policy
  BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref FrontendBucket
      PolicyDocument:
        Statement:
          - Sid: AllowCloudFrontServicePrincipal
            Effect: Allow
            Principal:
              Service: cloudfront.amazonaws.com
            Action: s3:GetObject
            Resource: !Sub "${FrontendBucket.Arn}/*"
            Condition:
              StringEquals:
                AWS:SourceArn: !Sub "arn:aws:cloudfront::${AWS::AccountId}:distribution/${CloudFrontDistribution}"

  # IAM Role for GitHub Actions
  GitHubActionsRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub "${BucketName}-github-actions-role"
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Federated: !Sub "arn:aws:iam::${AWS::AccountId}:oidc-provider/token.actions.githubusercontent.com"
            Action: sts:AssumeRoleWithWebIdentity
            Condition:
              StringEquals:
                token.actions.githubusercontent.com:aud: sts.amazonaws.com
              StringLike:
                token.actions.githubusercontent.com:sub: !Sub "repo:${GitHubOrg}/${GitHubRepo}:ref:refs/heads/main"
      Policies:
        - PolicyName: DeploymentPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:PutObject
                  - s3:DeleteObject
                  - s3:ListBucket
                Resource:
                  - !GetAtt FrontendBucket.Arn
                  - !Sub "${FrontendBucket.Arn}/*"
              - Effect: Allow
                Action:
                  - cloudfront:CreateInvalidation
                  - cloudfront:GetInvalidation
                Resource: !Sub "arn:aws:cloudfront::${AWS::AccountId}:distribution/${CloudFrontDistribution}"

Outputs:
  BucketName:
    Description: S3 bucket name
    Value: !Ref FrontendBucket
  
  CloudFrontDistributionId:
    Description: CloudFront distribution ID
    Value: !Ref CloudFrontDistribution
  
  CloudFrontDomainName:
    Description: CloudFront domain name
    Value: !GetAtt CloudFrontDistribution.DomainName
  
  CloudFrontURL:
    Description: CloudFront URL
    Value: !Sub "https://${CloudFrontDistribution.DomainName}"
  
  GitHubActionsRoleArn:
    Description: IAM role ARN for GitHub Actions
    Value: !GetAtt GitHubActionsRole.Arn
```

## Error Handling

### Build Failures

**Scenario**: npm build fails

**Handling**:
1. Workflow fails immediately
2. Error logged in GitHub Actions
3. No deployment occurs
4. Developer notified via GitHub

**Common Causes**:
- TypeScript errors
- Missing dependencies
- Environment variable issues

### Deployment Failures

**Scenario**: S3 sync fails

**Handling**:
1. Retry with exponential backoff
2. If retry fails, workflow fails
3. Previous version remains live (no downtime)
4. Error logged with details

**Common Causes**:
- AWS credentials expired
- S3 bucket permissions
- Network issues

### Invalidation Failures

**Scenario**: CloudFront invalidation fails

**Handling**:
1. Log warning (non-critical)
2. Deployment considered successful
3. Cache will expire naturally
4. Manual invalidation may be needed

**Common Causes**:
- CloudFront permissions
- Invalid distribution ID
- Rate limiting

## Rollback Strategy

### Automatic Rollback

**S3 Versioning**:
- All objects versioned
- Previous versions retained
- Can restore via AWS Console

**CloudFront**:
- Previous content cached at edge
- Invalidation clears cache
- Can revert S3 and invalidate again

### Manual Rollback

**Process**:
1. Identify previous working commit
2. Revert code in Git
3. Push to main branch
4. Workflow deploys previous version
5. Verify application works

**Alternative**:
1. Use S3 versioning to restore files
2. Invalidate CloudFront cache
3. Verify application works

## Monitoring and Logging

### GitHub Actions Logs

**Available Information**:
- Build output
- Deployment progress
- Error messages
- Timing information

**Retention**: 90 days

### CloudWatch Logs

**S3 Access Logs** (optional):
- Enable S3 server access logging
- Log bucket: separate bucket
- Analyze access patterns

**CloudFront Access Logs** (optional):
- Enable CloudFront standard logging
- Log bucket: separate bucket
- Analyze traffic patterns

### Metrics to Monitor

**CloudFront**:
- Requests
- Bytes downloaded
- Error rate (4xx, 5xx)
- Cache hit ratio

**S3**:
- Storage size
- Number of objects
- Request count

## Security Considerations

### OIDC Security

**Benefits**:
- No long-lived credentials
- Temporary credentials (1 hour)
- Scoped to specific repository
- Auditable via CloudTrail

**Best Practices**:
- Restrict to main branch only
- Use least privilege permissions
- Regular IAM role review
- Monitor CloudTrail logs

### Content Security

**S3 Bucket**:
- Block all public access
- CloudFront access only
- Versioning enabled
- Encryption at rest (AES-256)

**CloudFront**:
- HTTPS only
- AWS-managed certificate
- Origin access control
- Geo-restriction (optional)

### Application Security

**Build-time**:
- Dependency scanning (npm audit)
- No secrets in code
- Environment variables only

**Runtime**:
- Content Security Policy headers
- CORS configuration
- XSS protection

## Cost Estimation

### S3 Costs

**Storage**: ~100 MB application
- Cost: $0.023 per GB/month
- Estimated: $0.002/month

**Requests**: ~1000 GET requests/month
- Cost: $0.0004 per 1000 requests
- Estimated: $0.0004/month

### CloudFront Costs

**Data Transfer**: ~10 GB/month
- First 10 TB: $0.085 per GB
- Estimated: $0.85/month

**Requests**: ~10,000 requests/month
- Cost: $0.0075 per 10,000 requests
- Estimated: $0.0075/month

### GitHub Actions

**Build Minutes**: ~5 minutes per deployment
- Free for public repos
- Private repos: 2000 minutes/month free
- Estimated: $0/month (within free tier)

### Total Estimated Cost

**Monthly**: ~$0.86/month (well under $2 target)

**Note**: Actual costs depend on traffic volume. Free tier covers most development usage.

## Testing Strategy

### Pre-Deployment Testing

**Local Build**:
```bash
npm run build
npm run preview  # Test production build locally
```

**Manual Testing**:
- Test all features locally
- Verify API connectivity
- Check responsive design
- Test on multiple browsers

### Post-Deployment Testing

**Smoke Tests**:
1. Access CloudFront URL
2. Verify homepage loads
3. Test navigation
4. Test API calls
5. Check console for errors

**Automated Tests** (future):
- Playwright end-to-end tests
- Visual regression tests
- Performance tests

## Deployment Checklist

**Before First Deployment**:
- [ ] Create S3 bucket
- [ ] Create CloudFront distribution
- [ ] Configure IAM role (or use existing)
- [ ] Set up GitHub Secrets
- [ ] Update .env.production
- [ ] Test build locally

**For Each Deployment**:
- [ ] Code reviewed and merged
- [ ] Tests passing locally
- [ ] Environment variables correct
- [ ] Push to main branch
- [ ] Monitor GitHub Actions
- [ ] Verify deployment success
- [ ] Test application in production

## References

- Requirements: `requirements.md`
- GitHub Actions: https://docs.github.com/en/actions
- AWS OIDC: https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services
- S3 Static Hosting: https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html
- CloudFront: https://docs.aws.amazon.com/cloudfront/

---

**Last Updated**: 2025-11-27
**Status**: Design complete, ready for implementation
