# CloudWatch Monitoring Dashboard Guide

This document explains how to create and use CloudWatch dashboards to monitor the Music Poetry Canvas serverless backend.

## Quick Links

- **CloudWatch Console**: https://console.aws.amazon.com/cloudwatch/home?region=ap-northeast-2
- **Lambda Console**: https://console.aws.amazon.com/lambda/home?region=ap-northeast-2
- **Billing Console**: https://console.aws.amazon.com/billing/home

## Creating a Custom Dashboard

### Method 1: AWS Console (Manual)

1. Go to **CloudWatch** → **Dashboards**
2. Click **Create dashboard**
3. Name: `music-poetry-backend-monitoring`
4. Add widgets (see Widget Configuration below)
5. Click **Save dashboard**

### Method 2: AWS CLI (Automated)

Use the provided script:

```bash
cd lambda
.\create-monitoring-dashboard.ps1
```

## Widget Configuration

### 1. Lambda Invocations (Line Graph)

**Metrics**:
- Poetry Function: Invocations
- YouTube Function: Invocations
- Thumbnail Function: Invocations

**Configuration**:
- Period: 5 minutes
- Statistic: Sum
- Time range: Last 3 hours

### 2. Lambda Errors (Line Graph)

**Metrics**:
- Poetry Function: Errors
- YouTube Function: Errors
- Thumbnail Function: Errors

**Configuration**:
- Period: 5 minutes
- Statistic: Sum
- Time range: Last 3 hours

### 3. Lambda Duration (Line Graph)

**Metrics**:
- Poetry Function: Duration (Average)
- YouTube Function: Duration (Average)
- Thumbnail Function: Duration (Average)

**Configuration**:
- Period: 5 minutes
- Statistic: Average
- Time range: Last 3 hours

### 4. Lambda Memory Usage (Line Graph)

**Metrics**:
- Poetry Function: Memory Used (Average)
- YouTube Function: Memory Used (Average)
- Thumbnail Function: Memory Used (Average)

**Configuration**:
- Period: 5 minutes
- Statistic: Average
- Time range: Last 3 hours

### 5. Lambda Throttles (Number)

**Metrics**:
- Poetry Function: Throttles (Sum)
- YouTube Function: Throttles (Sum)
- Thumbnail Function: Throttles (Sum)

**Configuration**:
- Period: 1 hour
- Statistic: Sum

### 6. API Gateway Requests (Line Graph)

**Metrics**:
- API Gateway: Count

**Configuration**:
- Period: 5 minutes
- Statistic: Sum
- Time range: Last 3 hours

### 7. API Gateway Latency (Line Graph)

**Metrics**:
- API Gateway: Latency (Average)
- API Gateway: IntegrationLatency (Average)

**Configuration**:
- Period: 5 minutes
- Statistic: Average
- Time range: Last 3 hours

### 8. API Gateway Errors (Line Graph)

**Metrics**:
- API Gateway: 4XXError
- API Gateway: 5XXError

**Configuration**:
- Period: 5 minutes
- Statistic: Sum
- Time range: Last 3 hours

### 9. Estimated Charges (Number)

**Metrics**:
- Billing: EstimatedCharges (USD)

**Configuration**:
- Period: 6 hours
- Statistic: Maximum
- Region: us-east-1 (billing metrics only in this region)

### 10. Alarm Status (Alarm Status Widget)

**Alarms**:
- All Poetry Function alarms
- All YouTube Function alarms
- All Thumbnail Function alarms
- Billing alarms

## Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│                  Music Poetry Backend Monitoring            │
├─────────────────────────────────────────────────────────────┤
│  Lambda Invocations (3h)    │  Lambda Errors (3h)          │
│  [Line Graph]               │  [Line Graph]                 │
├─────────────────────────────────────────────────────────────┤
│  Lambda Duration (3h)       │  Lambda Memory Usage (3h)    │
│  [Line Graph]               │  [Line Graph]                 │
├─────────────────────────────────────────────────────────────┤
│  API Gateway Requests (3h)  │  API Gateway Latency (3h)    │
│  [Line Graph]               │  [Line Graph]                 │
├─────────────────────────────────────────────────────────────┤
│  API Gateway Errors (3h)    │  Throttles (1h)              │
│  [Line Graph]               │  [Number]                     │
├─────────────────────────────────────────────────────────────┤
│  Estimated Charges          │  Alarm Status                │
│  [Number]                   │  [Alarm Status]               │
└─────────────────────────────────────────────────────────────┘
```

## Key Metrics to Monitor

### Performance Metrics

| Metric | Target | Alert Threshold | Action |
|--------|--------|-----------------|--------|
| Poetry Duration | < 15s | > 24s | Optimize code or increase memory |
| YouTube Duration | < 40s | > 48s | Optimize librosa or increase memory |
| Thumbnail Duration | < 3s | > 8s | Investigate network issues |
| API Latency | < 100ms | > 500ms | Check API Gateway configuration |

### Reliability Metrics

| Metric | Target | Alert Threshold | Action |
|--------|--------|-----------------|--------|
| Error Rate | < 1% | > 5% | Investigate logs, fix bugs |
| Throttles | 0 | > 0 | Increase concurrency limits |
| 4XX Errors | < 5% | > 10% | Improve input validation |
| 5XX Errors | < 0.1% | > 1% | Fix server-side errors |

### Cost Metrics

| Metric | Target | Alert Threshold | Action |
|--------|--------|-----------------|--------|
| Monthly Cost | < $5 | > $10 | Optimize memory, reduce logs |
| Invocations | ~1000/month | > 5000/month | Investigate unusual traffic |
| Bedrock Tokens | ~800K/month | > 2M/month | Optimize prompts |

## CloudWatch Insights Queries

### Query 1: Error Analysis

```
fields @timestamp, @message
| filter @type = "ERROR" or level = "error"
| sort @timestamp desc
| limit 50
```

### Query 2: Slow Invocations

```
fields @timestamp, @duration, @memorySize, @maxMemoryUsed
| filter @type = "REPORT"
| filter @duration > 10000
| sort @duration desc
| limit 20
```

### Query 3: Memory Usage Statistics

```
fields @timestamp, @memorySize, @maxMemoryUsed, @duration
| filter @type = "REPORT"
| stats avg(@maxMemoryUsed) as AvgMemory, 
        max(@maxMemoryUsed) as MaxMemory,
        avg(@duration) as AvgDuration,
        count() as Invocations
  by bin(5m)
```

### Query 4: Cold Start Analysis

```
fields @timestamp, @initDuration, @duration
| filter @type = "REPORT"
| filter ispresent(@initDuration)
| stats avg(@initDuration) as AvgColdStart,
        max(@initDuration) as MaxColdStart,
        count() as ColdStarts
```

### Query 5: Bedrock API Calls

```
fields @timestamp, @message
| filter @message like /Bedrock/
| parse @message "[Poetry] Generating with Bedrock - Persona: *, Language: *" as persona, language
| stats count() by persona, language
```

## Monitoring Best Practices

### Daily Checks

- [ ] Review dashboard for anomalies
- [ ] Check alarm status (should be OK)
- [ ] Verify no throttling occurred
- [ ] Review error logs if any

### Weekly Reviews

- [ ] Analyze performance trends
- [ ] Review cost trends in Cost Explorer
- [ ] Check memory utilization
- [ ] Review slow invocations
- [ ] Update documentation if needed

### Monthly Reviews

- [ ] Run memory optimization analysis
- [ ] Review and adjust alarm thresholds
- [ ] Analyze cost breakdown
- [ ] Plan optimizations for next month
- [ ] Update monitoring dashboard

### Quarterly Reviews

- [ ] Comprehensive performance review
- [ ] Cost optimization deep dive
- [ ] Architecture review
- [ ] Update monitoring strategy
- [ ] Plan major improvements

## Alerting Strategy

### Critical Alerts (Immediate Action)

- Lambda function errors > 5 in 5 minutes
- API Gateway 5XX errors > 10 in 5 minutes
- Billing exceeds $20
- Any throttling

**Action**: Investigate immediately, fix within 1 hour

### Warning Alerts (Action Within 24 Hours)

- Lambda duration > 80% of timeout
- Memory usage > 90%
- Billing exceeds $10
- Error rate > 2%

**Action**: Investigate within 24 hours, plan fix

### Info Alerts (Review Weekly)

- Billing exceeds $5
- Unusual traffic patterns
- Cold start rate > 10%

**Action**: Review during weekly check, plan optimization

## Troubleshooting with Monitoring

### High Error Rate

1. Check CloudWatch Logs for error messages
2. Identify error pattern (specific endpoint, time of day)
3. Review recent deployments
4. Check external dependencies (Bedrock, YouTube)
5. Fix and deploy

### High Duration

1. Check memory usage (may need more memory)
2. Review CloudWatch Logs for slow operations
3. Analyze cold start frequency
4. Check external API latency
5. Optimize code or increase resources

### High Costs

1. Check Cost Explorer for breakdown
2. Identify cost driver (Lambda, Bedrock, logs)
3. Review invocation count (unusual traffic?)
4. Optimize memory allocation
5. Reduce log retention
6. Optimize Bedrock prompts

### Throttling

1. Check concurrent execution metrics
2. Review account limits
3. Request limit increase if needed
4. Implement request queuing
5. Consider reserved concurrency

## Integration with Other Tools

### AWS X-Ray

Enable X-Ray tracing for detailed performance analysis:

```yaml
Globals:
  Function:
    Tracing: Active
```

View traces:
1. Go to **X-Ray** → **Service Map**
2. Click on Lambda function
3. View trace details

### AWS Cost Explorer

Monitor costs:
1. Go to **Billing** → **Cost Explorer**
2. Filter by service (Lambda, Bedrock, API Gateway)
3. View daily/monthly trends
4. Create custom reports

### AWS Budgets

Set up budgets:
1. Go to **Billing** → **Budgets**
2. Create cost budget ($10/month)
3. Set alerts at 50%, 80%, 100%
4. Add email notifications

## Exporting Dashboard

### Export as JSON

```bash
aws cloudwatch get-dashboard \
  --dashboard-name music-poetry-backend-monitoring \
  --region ap-northeast-2 \
  --query 'DashboardBody' \
  --output text > dashboard.json
```

### Import Dashboard

```bash
aws cloudwatch put-dashboard \
  --dashboard-name music-poetry-backend-monitoring \
  --dashboard-body file://dashboard.json \
  --region ap-northeast-2
```

## Related Documentation

- [CloudWatch Dashboards](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Dashboards.html)
- [CloudWatch Logs Insights](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/AnalyzingLogData.html)
- [Lambda Metrics](https://docs.aws.amazon.com/lambda/latest/dg/monitoring-metrics.html)
- [API Gateway Metrics](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-metrics-and-dimensions.html)

---

**Last Updated**: 2025-11-27
**Dashboard Name**: music-poetry-backend-monitoring
**Region**: ap-northeast-2
