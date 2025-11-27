# Quick Start: Monitoring & Optimization

This is a quick reference guide to get monitoring and optimization set up in 5 minutes.

## Prerequisites

- AWS CLI configured
- SAM CLI installed
- Stack deployed (`kiroween`)
- PowerShell (Windows)

## 5-Minute Setup

### Step 1: Deploy CloudWatch Alarms (2 minutes)

```bash
cd lambda

# Update samconfig.toml with your email
# Add this line under [default.deploy.parameters]:
# parameter_overrides = "AlarmEmail=your-email@example.com"

# Deploy
sam build && sam deploy
```

**Check your email and confirm SNS subscription!**

### Step 2: Set Up Billing Alerts (2 minutes)

```bash
.\setup-billing-alerts.ps1 -Email "your-email@example.com"
```

**Check your email and confirm SNS subscription!**

### Step 3: Create Monitoring Dashboard (1 minute)

```bash
.\create-monitoring-dashboard.ps1
```

**Done!** View dashboard at:
https://console.aws.amazon.com/cloudwatch/home?region=ap-northeast-2#dashboards:name=music-poetry-backend-monitoring

## What You Get

### CloudWatch Alarms (9 total)
- ✅ Error rate monitoring (all functions)
- ✅ Duration monitoring (all functions)
- ✅ Throttle monitoring (all functions)
- ✅ Email notifications

### Billing Alerts (3 total)
- ✅ $5 warning (50% of budget)
- ✅ $10 critical (100% of budget)
- ✅ $20 emergency (200% of budget)
- ✅ Email notifications

### Monitoring Dashboard
- ✅ Lambda invocations
- ✅ Lambda errors
- ✅ Lambda duration
- ✅ API Gateway metrics
- ✅ Real-time monitoring

## After 1 Week: Optimize Memory

```bash
# Analyze memory usage
.\analyze-memory-usage.ps1

# Review recommendations
# Update lambda/template.yaml if needed
# Redeploy: sam build && sam deploy
```

## Testing

### Test Alarms
```bash
.\test-alarms.ps1 -ApiEndpoint "https://your-api-endpoint/Prod"
```

### Test Billing Alerts
```bash
aws sns publish \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:music-poetry-billing-alerts \
  --message "Test" \
  --region us-east-1
```

## Daily Monitoring (1 minute)

1. Open CloudWatch dashboard
2. Check for red alarms (should be green)
3. Review error count (should be low)
4. Done!

## Weekly Review (5 minutes)

1. Check Cost Explorer for spending trends
2. Review CloudWatch dashboard for patterns
3. Check alarm history
4. Done!

## Monthly Optimization (15 minutes)

1. Run memory analysis script
2. Review recommendations
3. Update SAM template if needed
4. Deploy changes
5. Monitor for 1 week
6. Done!

## Cost Breakdown

| Item | Cost/Month |
|------|------------|
| Lambda | $0.72 |
| Bedrock | $0.71 |
| API Gateway | $0.004 |
| CloudWatch | $0.50 |
| Monitoring | $0.50 |
| **Total** | **$2.50** |

**Target**: < $5/month ✅

## Troubleshooting

### Not receiving emails?
- Check spam folder
- Confirm SNS subscription in AWS Console
- Verify email address is correct

### No data in dashboard?
- Wait for function invocations
- Check functions are deployed
- Verify stack name is correct

### Billing metrics not showing?
- Enable billing alerts in AWS Console
- Wait 6-24 hours for first data
- Ensure alarms created in us-east-1

## Documentation

For detailed information, see:
- `MONITORING_SETUP.md` - CloudWatch alarms
- `BILLING_ALERTS_SETUP.md` - Billing alerts
- `MEMORY_OPTIMIZATION.md` - Memory optimization
- `MONITORING_DASHBOARD.md` - Dashboard guide
- `MONITORING_COMPLETE.md` - Complete summary

## Support

Questions? Check the detailed documentation above or AWS Console.

---

**Setup Time**: 5 minutes
**Daily Monitoring**: 1 minute
**Monthly Cost**: ~$2.50
**Status**: Production Ready ✅
