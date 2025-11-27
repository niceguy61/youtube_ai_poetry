# How to Fix Bedrock Access Issue

## Problem
Lambda function returns 403 AccessDeniedException when trying to invoke Bedrock models:
```
Model access is denied due to IAM user or service role is not authorized 
to perform the required AWS Marketplace actions
```

## Solution Options

### Option 1: Enable Model Access in AWS Console (Recommended - Fastest)

1. **Go to AWS Bedrock Console**
   ```
   https://ap-northeast-2.console.aws.amazon.com/bedrock/home?region=ap-northeast-2#/modelaccess
   ```

2. **Request Model Access**
   - Click "Manage model access" or "Edit"
   - Find "Anthropic" section
   - Check the box for "Claude 3 Haiku"
   - Check the box for "Claude 3.5 Sonnet" (optional, for premium)
   - Click "Request model access" or "Save changes"

3. **Wait for Approval**
   - Usually instant for standard models
   - Status will change from "Not available" to "Access granted"

4. **Verify Access**
   ```powershell
   # Test the endpoint again
   cd lambda
   .\test-production-endpoints.ps1
   ```

**Time**: 5-10 minutes

---

### Option 2: Update IAM Role Permissions (Alternative)

If Option 1 doesn't work, you may need to add AWS Marketplace permissions to the IAM role.

1. **Update template.yaml**

   Find the `PoetryFunction` section and update the `Policies`:

   ```yaml
   PoetryFunction:
     Type: AWS::Serverless::Function
     Properties:
       # ... other properties ...
       Policies:
         - Statement:
           - Effect: Allow
             Action:
               - bedrock:InvokeModel
             Resource: 
               - !Sub 'arn:aws:bedrock:${AWS::Region}::foundation-model/anthropic.claude-*'
           - Effect: Allow
             Action:
               - aws-marketplace:ViewSubscriptions
               - aws-marketplace:Subscribe
             Resource: '*'
   ```

2. **Redeploy**
   ```bash
   cd lambda
   sam build
   sam deploy
   ```

3. **Test**
   ```powershell
   .\test-production-endpoints.ps1
   ```

**Time**: 15-20 minutes

---

### Option 3: Manual IAM Role Update (If SAM deploy fails)

1. **Find the IAM Role**
   ```bash
   aws cloudformation describe-stack-resources \
     --stack-name kiroween \
     --region ap-northeast-2 \
     --query "StackResources[?LogicalResourceId=='PoetryFunctionRole'].PhysicalResourceId" \
     --output text
   ```

2. **Create Policy Document**
   
   Save as `bedrock-marketplace-policy.json`:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "aws-marketplace:ViewSubscriptions",
           "aws-marketplace:Subscribe"
         ],
         "Resource": "*"
       }
     ]
   }
   ```

3. **Attach Policy**
   ```bash
   aws iam put-role-policy \
     --role-name <ROLE_NAME_FROM_STEP_1> \
     --policy-name BedrockMarketplaceAccess \
     --policy-document file://bedrock-marketplace-policy.json \
     --region ap-northeast-2
   ```

4. **Wait 1-2 minutes** for IAM changes to propagate

5. **Test**
   ```powershell
   cd lambda
   .\test-production-endpoints.ps1
   ```

**Time**: 10-15 minutes

---

## Verification

After applying any of the above solutions, verify that it works:

### Test 1: Simple curl test
```bash
curl -X POST https://mvw4x2xbud.execute-api.ap-northeast-2.amazonaws.com/Prod/api/poetry/generate \
  -H "Content-Type: application/json" \
  -d '{
    "audioFeatures": {
      "tempo": 120,
      "energy": 0.8,
      "mood": "energetic",
      "spectralCentroid": 2000,
      "key": "C"
    },
    "persona": "hamlet",
    "language": "ko",
    "model": "anthropic.claude-3-haiku-20240307-v1:0"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "poetry": "격렬한 에너지여, 탐구하라!..."
}
```

### Test 2: Check CloudWatch Logs
```bash
aws logs tail /aws/lambda/kiroween-PoetryFunction-cPVYJVkPTPco \
  --region ap-northeast-2 \
  --since 5m \
  --follow
```

**Expected Log**:
```
[Poetry] Request received
[Poetry] Generating - Persona: hamlet, Language: ko
[Poetry] Invoking Bedrock model: anthropic.claude-3-haiku-20240307-v1:0
[Poetry] Success - Generated XXX characters
```

**No More**:
```
[Poetry] Bedrock error: AccessDeniedException
```

---

## Troubleshooting

### Issue: Still getting 403 after enabling model access

**Solution**: Wait 10 minutes as mentioned in the error message:
```
If you recently fixed this issue, try again after 10 minutes.
```

IAM and Bedrock permissions can take a few minutes to propagate.

---

### Issue: Model access request is pending

**Solution**: 
- Some models require manual approval
- Claude 3 Haiku should be instant
- Check your AWS account status (new accounts may have restrictions)
- Contact AWS Support if pending for > 1 hour

---

### Issue: Different error after fix

**Possible Errors**:

1. **ThrottlingException**: Too many requests
   - Wait a few seconds and retry
   - Implement exponential backoff

2. **ValidationException**: Invalid model ID
   - Check model ID spelling
   - Verify model is available in ap-northeast-2 region

3. **ServiceQuotaExceededException**: Exceeded quota
   - Request quota increase in Service Quotas console

---

## Cost Impact

Enabling Bedrock model access does NOT incur any costs until you actually invoke the models.

**Bedrock Pricing** (Claude 3 Haiku):
- Input: $0.00025 per 1K tokens
- Output: $0.00125 per 1K tokens

**Example Cost** (1000 poems):
- ~$0.71/month

**Free Tier**: None for Bedrock (pay per use)

---

## Security Considerations

### AWS Marketplace Permissions

The `aws-marketplace:ViewSubscriptions` and `aws-marketplace:Subscribe` permissions allow:
- Viewing which AWS Marketplace products are subscribed
- Subscribing to new products (if allowed by account policies)

**Risk**: Low - These permissions don't allow purchasing or modifying existing subscriptions.

**Best Practice**: 
- Use Option 1 (Console) if possible - no IAM changes needed
- If using Option 2/3, consider restricting to specific resources if possible

---

## References

- AWS Bedrock Documentation: https://docs.aws.amazon.com/bedrock/
- Model Access Guide: https://docs.aws.amazon.com/bedrock/latest/userguide/model-access.html
- IAM Policies: https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies.html

---

**Last Updated**: 2025-11-27
**Status**: Awaiting user action

