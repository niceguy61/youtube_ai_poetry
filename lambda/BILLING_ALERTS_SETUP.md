# Billing Alerts Setup Guide

This document explains how to set up billing alerts for the Music Poetry Canvas serverless backend to monitor and control AWS costs.

## Overview

Billing alerts help you:
- Monitor AWS spending in real-time
- Get notified when costs exceed thresholds
- Prevent unexpected charges
- Track cost trends over time

## Expected Monthly Costs

Based on 1,000 requests per month:

| Service | Cost | Details |
|---------|------|---------|
| Lambda Execution | $0.72 | Poetry ($0.04) + YouTube ($0.67) + Thumbnail ($0.01) |
| AWS Bedrock | $0.71 | Claude 3 Haiku for poetry generation |
| API Gateway | $0.004 | 1,000 API requests |
| CloudWatch Logs | $0.50 | Log storage and ingestion |
| **Total** | **~$2.00/month** | Well under $5 target |

**Note**: Costs may vary based on:
- Actual request volume
- Bedrock model selection (Sonnet costs more)
- Log retention settings
- Data transfer

## Setup Methods

### Method 1: AWS Console (Recommended for First-Time Setup)

#### Step 1: Enable Billing Alerts

1. Sign in to AWS Console as root user or IAM user with billing permissions
2. Go to **Billing and Cost Management** → **Billing preferences**
3. Enable these options:
   - ✅ **Receive Billing Alerts**
   - ✅ **Receive Free Tier Usage Alerts**
4. Enter your email address
5. Click **Save preferences**

#### Step 2: Create Billing Alarm in CloudWatch

1. Go to **CloudWatch** → **Alarms** → **Billing**
2. Click **Create alarm**
3. Click **Select metric**
4. Choose **Billing** → **Total Estimated Charge**
5. Select **USD** currency
6. Click **Select metric**
7. Configure alarm:
   - **Threshold type**: Static
   - **Whenever EstimatedCharges is**: Greater than
   - **than**: 10 (USD)
   - **Period**: 6 hours
8. Click **Next**
9. Configure notifications:
   - **Select an SNS topic**: Create new topic
   - **Topic name**: billing-alerts
   - **Email endpoints**: your-email@example.com
10. Click **Create topic**
11. Click **Next**
12. Name the alarm: `music-poetry-backend-billing-alert`
13. Click **Next** → **Create alarm**
14. Check your email and confirm SNS subscription

#### Step 3: Create Additional Threshold Alarms

Repeat Step 2 for additional thresholds:
- **Warning**: $5 threshold (50% of budget)
- **Critical**: $10 threshold (100% of budget)
- **Emergency**: $20 threshold (200% of budget)

### Method 2: AWS CLI (Automated Setup)

Use the provided script to automate billing alert setup.

#### Prerequisites

```bash
# Install AWS CLI if not already installed
# Windows: choco install awscli
# Verify installation
aws --version

# Configure AWS credentials
aws configure
```

#### Run Setup Script

```bash
cd lambda
.\setup-billing-alerts.ps1 -Email "your-email@example.com"
```

The script will:
1. Create SNS topic for billing alerts
2. Subscribe your email to the topic
3. Create billing alarms for $5, $10, and $20 thresholds
4. Display confirmation instructions

### Method 3: CloudFormation (Infrastructure as Code)

Add billing alarms to a separate CloudFormation stack (billing alarms must be in us-east-1 region).

Create `lambda/billing-alerts-template.yaml`:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Billing Alerts for Music Poetry Canvas Backend

Parameters:
  AlarmEmail:
    Type: String
    Description: Email address for billing alerts

Resources:
  BillingAlertTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: music-poetry-billing-alerts
      Subscription:
        - Endpoint: !Ref AlarmEmail
          Protocol: email

  BillingAlarmWarning:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: music-poetry-billing-warning-5usd
      AlarmDescription: Alert when estimated charges exceed $5
      MetricName: EstimatedCharges
      Namespace: AWS/Billing
      Statistic: Maximum
      Period: 21600  # 6 hours
      EvaluationPeriods: 1
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: Currency
          Value: USD
      AlarmActions:
        - !Ref BillingAlertTopic

  BillingAlarmCritical:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: music-poetry-billing-critical-10usd
      AlarmDescription: Alert when estimated charges exceed $10
      MetricName: EstimatedCharges
      Namespace: AWS/Billing
      Statistic: Maximum
      Period: 21600  # 6 hours
      EvaluationPeriods: 1
      Threshold: 10
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: Currency
          Value: USD
      AlarmActions:
        - !Ref BillingAlertTopic

  BillingAlarmEmergency:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: music-poetry-billing-emergency-20usd
      AlarmDescription: Alert when estimated charges exceed $20
      MetricName: EstimatedCharges
      Namespace: AWS/Billing
      Statistic: Maximum
      Period: 21600  # 6 hours
      EvaluationPeriods: 1
      Threshold: 20
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: Currency
          Value: USD
      AlarmActions:
        - !Ref BillingAlertTopic

Outputs:
  TopicArn:
    Description: SNS Topic ARN for billing alerts
    Value: !Ref BillingAlertTopic
```

Deploy to us-east-1 (billing metrics only available in this region):

```bash
aws cloudformation deploy \
  --template-file billing-alerts-template.yaml \
  --stack-name music-poetry-billing-alerts \
  --parameter-overrides AlarmEmail=your-email@example.com \
  --region us-east-1
```

## Monitoring Costs

### AWS Cost Explorer

1. Go to **Billing and Cost Management** → **Cost Explorer**
2. View costs by:
   - Service (Lambda, Bedrock, API Gateway)
   - Time period (daily, monthly)
   - Usage type
3. Create custom reports
4. Set up cost anomaly detection

### AWS Budgets (Advanced)

For more sophisticated cost management:

1. Go to **Billing and Cost Management** → **Budgets**
2. Click **Create budget**
3. Choose **Cost budget**
4. Set monthly budget: $10
5. Configure alerts at 50%, 80%, 100%
6. Add email notifications

**Note**: AWS Budgets costs $0.02 per budget per day (~$0.60/month)

### CloudWatch Billing Dashboard

Create a custom dashboard:

1. Go to **CloudWatch** → **Dashboards**
2. Click **Create dashboard**
3. Name: `music-poetry-billing`
4. Add widgets:
   - Line graph: EstimatedCharges over time
   - Number: Current month charges
   - Number: Lambda invocations
   - Number: Bedrock API calls

## Cost Optimization Tips

### 1. Optimize Lambda Memory

- Monitor actual memory usage in CloudWatch
- Reduce memory if consistently under 50% utilization
- See subtask 7.3 for detailed optimization

### 2. Reduce Log Retention

Edit log retention in CloudWatch:

```bash
# Set 7-day retention for all Lambda functions
aws logs put-retention-policy \
  --log-group-name /aws/lambda/kiroween-PoetryFunction-xxx \
  --retention-in-days 7

aws logs put-retention-policy \
  --log-group-name /aws/lambda/kiroween-YouTubeFunction-xxx \
  --retention-in-days 7

aws logs put-retention-policy \
  --log-group-name /aws/lambda/kiroween-ThumbnailFunction-xxx \
  --retention-in-days 7
```

### 3. Use Bedrock Wisely

- Use Claude 3 Haiku for most requests (cheaper)
- Reserve Claude 3.5 Sonnet for premium features
- Implement caching for common prompts
- Optimize prompt length

### 4. Monitor Free Tier Usage

AWS Free Tier includes:
- Lambda: 1M requests/month, 400,000 GB-seconds
- API Gateway: 1M API calls/month (first 12 months)
- CloudWatch: 10 alarms, 5GB logs

Track usage:
1. Go to **Billing** → **Free Tier**
2. View current usage vs. limits
3. Set up Free Tier usage alerts

## Responding to Billing Alerts

### When You Receive an Alert

1. **Don't Panic**: Review actual usage first
2. **Check Cost Explorer**: Identify which service is causing costs
3. **Review CloudWatch Logs**: Look for unusual activity
4. **Check for Errors**: High error rates = wasted invocations
5. **Optimize**: Apply cost optimization tips above

### Emergency Cost Control

If costs are unexpectedly high:

1. **Disable API Gateway** (temporary):
   ```bash
   # This will stop all traffic
   aws apigateway update-stage \
     --rest-api-id YOUR_API_ID \
     --stage-name Prod \
     --patch-operations op=replace,path=/throttle/rateLimit,value=0
   ```

2. **Delete Stack** (nuclear option):
   ```bash
   aws cloudformation delete-stack --stack-name kiroween
   ```

3. **Contact AWS Support**: If you believe charges are erroneous

## Testing Billing Alerts

You cannot easily test billing alarms without incurring actual costs. Instead:

1. **Verify SNS Subscription**: Send test notification
   ```bash
   aws sns publish \
     --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:billing-alerts \
     --message "Test billing alert" \
     --region us-east-1
   ```

2. **Check Alarm Configuration**: Verify thresholds are correct
   ```bash
   aws cloudwatch describe-alarms \
     --alarm-names music-poetry-billing-warning-5usd \
     --region us-east-1
   ```

3. **Monitor Current Charges**: View in Billing dashboard

## Troubleshooting

### Billing Metrics Not Showing

- Billing metrics are only available in **us-east-1** region
- Must enable "Receive Billing Alerts" in Billing preferences
- Metrics update every 6 hours (not real-time)
- May take 24 hours for first data point

### Not Receiving Alert Emails

1. Check SNS subscription status:
   ```bash
   aws sns list-subscriptions-by-topic \
     --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:billing-alerts \
     --region us-east-1
   ```

2. Confirm email subscription (check spam folder)

3. Test SNS topic manually (see Testing section above)

### Alarm Shows INSUFFICIENT_DATA

- Normal for new accounts
- Wait 6-24 hours for billing data to populate
- Alarm will transition to OK once data is available

## Cost Tracking Checklist

- [ ] Billing alerts enabled in AWS Console
- [ ] Email confirmed for SNS notifications
- [ ] Billing alarms created ($5, $10, $20 thresholds)
- [ ] Cost Explorer reviewed weekly
- [ ] Free Tier usage monitored
- [ ] Log retention set to 7 days
- [ ] Lambda memory optimized (see subtask 7.3)
- [ ] Bedrock usage monitored

## Related Documentation

- [AWS Billing Alarms](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/monitor_estimated_charges_with_cloudwatch.html)
- [AWS Cost Explorer](https://docs.aws.amazon.com/cost-management/latest/userguide/ce-what-is.html)
- [AWS Budgets](https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html)
- [Lambda Pricing](https://aws.amazon.com/lambda/pricing/)
- [Bedrock Pricing](https://aws.amazon.com/bedrock/pricing/)

---

**Last Updated**: 2025-11-27
**Target Monthly Cost**: < $5
**Current Estimated Cost**: ~$2/month (1,000 requests)
