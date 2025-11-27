# CloudWatch Monitoring Setup Guide

This document explains the CloudWatch monitoring and alerting configuration for the Music Poetry Canvas serverless backend.

## Overview

The SAM template includes comprehensive CloudWatch alarms for all Lambda functions, monitoring:
- **Error rates**: Alerts when errors exceed 5 per 5-minute period
- **Duration**: Alerts when execution time exceeds 80% of timeout
- **Throttles**: Alerts immediately when functions are throttled

## Alarm Configuration

### Poetry Function Alarms
- **Error Alarm**: Triggers when > 5 errors in 5 minutes
- **Duration Alarm**: Triggers when average duration > 24 seconds (80% of 30s timeout)
- **Throttle Alarm**: Triggers when any throttling occurs

### YouTube Function Alarms
- **Error Alarm**: Triggers when > 5 errors in 5 minutes
- **Duration Alarm**: Triggers when average duration > 48 seconds (80% of 60s timeout)
- **Throttle Alarm**: Triggers when any throttling occurs

### Thumbnail Function Alarms
- **Error Alarm**: Triggers when > 5 errors in 5 minutes
- **Duration Alarm**: Triggers when average duration > 8 seconds (80% of 10s timeout)
- **Throttle Alarm**: Triggers when any throttling occurs

## Deployment with Email Notifications

### Option 1: Deploy with Email Parameter

```bash
cd lambda
sam build
sam deploy --parameter-overrides AlarmEmail=your-email@example.com
```

### Option 2: Update samconfig.toml

Add the parameter to your `samconfig.toml`:

```toml
[default.deploy.parameters]
stack_name = "kiroween"
resolve_s3 = true
s3_prefix = "kiroween"
region = "ap-northeast-2"
confirm_changeset = true
capabilities = "CAPABILITY_IAM"
disable_rollback = true
parameter_overrides = "AlarmEmail=your-email@example.com"
```

Then deploy:

```bash
sam build && sam deploy
```

### Option 3: Deploy without Email (Manual Setup)

Deploy without email parameter:

```bash
sam build && sam deploy
```

Then manually subscribe to the SNS topic in AWS Console:
1. Go to SNS → Topics
2. Find `music-poetry-backend-alarms`
3. Create subscription → Email protocol
4. Enter your email and confirm

## Confirming Email Subscription

After deployment with email parameter:
1. Check your email inbox
2. Look for "AWS Notification - Subscription Confirmation"
3. Click the confirmation link
4. You'll receive alarm notifications at this email

## Testing Alarms

### Test Error Alarm

Trigger an error by sending invalid request:

```bash
# Poetry function - invalid JSON
curl -X POST https://your-api-endpoint/Prod/api/poetry/generate \
  -H "Content-Type: application/json" \
  -d 'invalid json'

# Repeat 6 times to trigger alarm (threshold: 5 errors)
```

### Test Duration Alarm

This requires sustained high duration over 2 evaluation periods (10 minutes total).

### Test Throttle Alarm

Throttling occurs when concurrent executions exceed account limits. This is rare in normal usage.

## Viewing Alarms in AWS Console

### CloudWatch Console
1. Go to CloudWatch → Alarms
2. Filter by stack name: `kiroween`
3. View alarm status and history

### Lambda Console
1. Go to Lambda → Functions
2. Select a function
3. Click "Monitoring" tab
4. View metrics and alarms

## Alarm States

- **OK**: Metric is within threshold
- **ALARM**: Metric has breached threshold
- **INSUFFICIENT_DATA**: Not enough data to evaluate (normal for new deployments)

## Customizing Alarms

### Adjust Thresholds

Edit `lambda/template.yaml` and modify alarm properties:

```yaml
PoetryFunctionErrorAlarm:
  Properties:
    Threshold: 10  # Change from 5 to 10 errors
    Period: 600    # Change from 5 to 10 minutes
```

### Add New Alarms

Example: Add memory usage alarm:

```yaml
PoetryFunctionMemoryAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: !Sub "${AWS::StackName}-PoetryFunction-Memory"
    AlarmDescription: "Alert when memory usage is high"
    MetricName: MemoryUtilization
    Namespace: AWS/Lambda
    Statistic: Average
    Period: 300
    EvaluationPeriods: 2
    Threshold: 80  # 80% of allocated memory
    ComparisonOperator: GreaterThanThreshold
    Dimensions:
      - Name: FunctionName
        Value: !Ref PoetryFunction
    AlarmActions:
      - !Ref AlarmNotificationTopic
```

## Alarm Actions

When an alarm triggers:
1. SNS notification sent to subscribed email
2. Alarm state changes to "ALARM" in CloudWatch
3. Alarm history is recorded

## Best Practices

1. **Monitor Regularly**: Check CloudWatch dashboard weekly
2. **Respond to Alarms**: Investigate and fix issues promptly
3. **Adjust Thresholds**: Fine-tune based on actual usage patterns
4. **Test Alarms**: Verify notifications work before production
5. **Document Changes**: Update this guide when modifying alarms

## Troubleshooting

### Not Receiving Email Notifications

1. Check SNS subscription status:
   ```bash
   aws sns list-subscriptions-by-topic \
     --topic-arn arn:aws:sns:ap-northeast-2:ACCOUNT_ID:music-poetry-backend-alarms
   ```

2. Verify email confirmation:
   - Status should be "Confirmed"
   - If "PendingConfirmation", check spam folder

3. Test SNS topic manually:
   ```bash
   aws sns publish \
     --topic-arn arn:aws:sns:ap-northeast-2:ACCOUNT_ID:music-poetry-backend-alarms \
     --message "Test notification"
   ```

### Alarm Stuck in INSUFFICIENT_DATA

- Normal for new deployments
- Wait for function invocations to generate metrics
- Alarm will transition to OK or ALARM state after data is available

### False Positive Alarms

- Review CloudWatch Logs to understand errors
- Adjust thresholds if needed
- Consider adding filters to exclude expected errors

## Cost Considerations

- **CloudWatch Alarms**: First 10 alarms free, then $0.10/alarm/month
- **SNS Notifications**: First 1,000 emails free, then $2.00 per 100,000 emails
- **Current Setup**: 9 alarms = Free tier (under 10)
- **Email Notifications**: Minimal cost (< $0.01/month for typical usage)

## Related Documentation

- [CloudWatch Alarms Documentation](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/AlarmThatSendsEmail.html)
- [Lambda Metrics](https://docs.aws.amazon.com/lambda/latest/dg/monitoring-metrics.html)
- [SNS Email Notifications](https://docs.aws.amazon.com/sns/latest/dg/sns-email-notifications.html)

---

**Last Updated**: 2025-11-27
**Status**: Ready for deployment
