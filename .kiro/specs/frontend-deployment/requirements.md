# Frontend Deployment - Requirements

## Introduction

Deploy the Music Poetry Canvas React frontend to AWS S3 and CloudFront with automated CI/CD using GitHub Actions. The deployment will use existing AWS OIDC role for secure authentication without storing AWS credentials in GitHub.

## Glossary

- **Frontend Application**: React-based Music Poetry Canvas web application built with Vite
- **S3 Bucket**: AWS Simple Storage Service bucket for hosting static website files
- **CloudFront Distribution**: AWS Content Delivery Network (CDN) for global content delivery
- **GitHub Actions**: CI/CD platform for automated build and deployment
- **OIDC (OpenID Connect)**: Authentication protocol for secure AWS access from GitHub
- **IAM Role**: AWS Identity and Access Management role with permissions for deployment
- **GitHub Secrets**: Encrypted environment variables stored in GitHub repository settings

## Requirements

### Requirement 1: S3 Static Website Hosting

**User Story**: As a developer, I want to host the frontend application on S3, so that it can be served as a static website with high availability.

#### Acceptance Criteria

1. WHEN the S3 bucket is created, THE System SHALL configure it for static website hosting
2. WHEN files are uploaded to S3, THE System SHALL set appropriate content types and cache headers
3. WHEN the bucket is accessed, THE System SHALL serve index.html as the default document
4. WHEN a 404 error occurs, THE System SHALL serve index.html for client-side routing
5. THE S3 bucket name SHALL be configurable via GitHub Secrets

### Requirement 2: CloudFront CDN Distribution

**User Story**: As a user, I want the application to load quickly from anywhere in the world, so that I have a smooth experience regardless of my location.

#### Acceptance Criteria

1. WHEN CloudFront is configured, THE System SHALL use S3 bucket as the origin
2. WHEN content is requested, THE System SHALL cache static assets at edge locations
3. WHEN the distribution is created, THE System SHALL support HTTPS with AWS-managed certificate
4. WHEN a 404 error occurs, THE System SHALL return index.html with 200 status for SPA routing
5. THE CloudFront distribution ID SHALL be configurable via GitHub Secrets

### Requirement 3: GitHub Actions CI/CD Pipeline

**User Story**: As a developer, I want automated deployment on every push to main branch, so that changes are deployed without manual intervention.

#### Acceptance Criteria

1. WHEN code is pushed to main branch, THE System SHALL trigger the deployment workflow
2. WHEN the workflow runs, THE System SHALL install dependencies using npm ci
3. WHEN dependencies are installed, THE System SHALL build the production bundle using Vite
4. WHEN the build completes, THE System SHALL upload files to S3 bucket
5. WHEN files are uploaded, THE System SHALL invalidate CloudFront cache

### Requirement 4: AWS OIDC Authentication

**User Story**: As a security-conscious developer, I want to use OIDC for AWS authentication, so that no long-lived credentials are stored in GitHub.

#### Acceptance Criteria

1. WHEN the workflow authenticates, THE System SHALL use existing AWS OIDC provider
2. WHEN assuming the role, THE System SHALL use the IAM role from GitHub Secrets
3. WHEN authentication succeeds, THE System SHALL have temporary credentials for deployment
4. THE IAM role ARN SHALL be configurable via GitHub Secrets
5. THE System SHALL NOT store AWS access keys or secret keys in GitHub

### Requirement 5: Environment Configuration

**User Story**: As a developer, I want to configure API endpoints for production, so that the frontend connects to the correct backend services.

#### Acceptance Criteria

1. WHEN building for production, THE System SHALL use environment variables from .env.production
2. WHEN the API endpoint is configured, THE System SHALL use the Lambda API Gateway URL
3. WHEN environment variables are set, THE System SHALL include them in the build
4. THE System SHALL support configuring AI provider settings (Bedrock)
5. THE System SHALL validate required environment variables before deployment

### Requirement 6: Deployment Validation

**User Story**: As a developer, I want to verify successful deployment, so that I can confirm the application is working correctly.

#### Acceptance Criteria

1. WHEN deployment completes, THE System SHALL output the CloudFront URL
2. WHEN files are uploaded, THE System SHALL verify S3 sync was successful
3. WHEN cache is invalidated, THE System SHALL verify CloudFront invalidation completed
4. WHEN the workflow fails, THE System SHALL provide clear error messages
5. THE System SHALL report deployment status in GitHub Actions logs

## Non-Functional Requirements

### NFR-1: Performance
- Build time: < 5 minutes
- Deployment time: < 3 minutes
- CloudFront cache invalidation: < 5 minutes
- Total workflow time: < 15 minutes

### NFR-2: Reliability
- Deployment success rate: > 95%
- Automatic retry on transient failures
- Rollback capability via CloudFront versioning
- Zero-downtime deployments

### NFR-3: Security
- No AWS credentials stored in GitHub repository
- OIDC token-based authentication only
- S3 bucket not publicly accessible (CloudFront only)
- HTTPS enforced for all connections
- Least privilege IAM role permissions

### NFR-4: Cost
- S3 storage: < $1/month for typical usage
- CloudFront: Free tier covers most usage
- GitHub Actions: Free for public repos, minimal cost for private
- Target total cost: < $2/month

### NFR-5: Maintainability
- Infrastructure as Code (CloudFormation/SAM)
- Clear documentation for setup and troubleshooting
- Reusable workflow for multiple environments
- Easy to update and modify

## Technical Requirements

### TR-1: GitHub Secrets Configuration

Required secrets:
- `AWS_ROLE_ARN`: IAM role ARN for OIDC authentication
- `AWS_REGION`: AWS region (e.g., ap-northeast-2)
- `S3_BUCKET_NAME`: S3 bucket name for hosting
- `CLOUDFRONT_DISTRIBUTION_ID`: CloudFront distribution ID
- `VITE_API_ENDPOINT`: Lambda API Gateway URL

### TR-2: IAM Role Permissions

The IAM role must have permissions for:
- `s3:PutObject` on the S3 bucket
- `s3:DeleteObject` on the S3 bucket
- `s3:ListBucket` on the S3 bucket
- `cloudfront:CreateInvalidation` on the distribution
- `cloudfront:GetInvalidation` on the distribution

### TR-3: S3 Bucket Configuration

- Static website hosting enabled
- Index document: index.html
- Error document: index.html (for SPA routing)
- Bucket policy allows CloudFront access only
- Public access blocked

### TR-4: CloudFront Configuration

- Origin: S3 bucket
- Default root object: index.html
- Custom error response: 404 → /index.html (200)
- Cache behavior: Cache static assets, no-cache for index.html
- HTTPS only (redirect HTTP to HTTPS)

### TR-5: Build Configuration

- Node.js version: 20.x
- Package manager: npm
- Build command: `npm run build`
- Output directory: `dist/`
- Environment file: `.env.production`

## Out of Scope

- Custom domain setup (can be added later)
- SSL certificate management (using AWS-managed certificate)
- Multi-environment deployments (dev, staging, prod)
- Preview deployments for pull requests
- Automated testing in CI/CD pipeline
- Performance monitoring and analytics

## Success Criteria

1. GitHub Actions workflow successfully deploys to S3 and CloudFront
2. Application accessible via CloudFront URL
3. All features work correctly in production
4. No AWS credentials stored in GitHub
5. Deployment completes in < 15 minutes
6. Documentation complete and accurate

## Dependencies

- AWS account with S3 and CloudFront access
- GitHub repository with Actions enabled
- Existing AWS OIDC provider configured
- IAM role with deployment permissions
- Lambda backend deployed and accessible

## References

- GitHub Actions Documentation: https://docs.github.com/en/actions
- AWS OIDC with GitHub: https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services
- S3 Static Website Hosting: https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html
- CloudFront Documentation: https://docs.aws.amazon.com/cloudfront/

---

**Last Updated**: 2025-11-27
**Status**: Requirements defined, ready for design
