# Lambda Memory Optimization Guide

This document explains how to optimize Lambda function memory allocation for the Music Poetry Canvas backend to improve performance and reduce costs.

## Why Memory Optimization Matters

### Performance Impact
- **More memory = More CPU**: Lambda allocates CPU proportionally to memory
- **Faster execution = Lower cost**: Higher memory can reduce execution time
- **Sweet spot**: Find the optimal memory where cost/performance is balanced

### Cost Impact
- Lambda pricing: $0.0000166667 per GB-second
- Example: 512MB @ 2s = 1024 MB-seconds = $0.000017
- Example: 1024MB @ 1s = 1024 MB-seconds = $0.000017 (same cost, faster!)

## Current Configuration

| Function | Memory | Timeout | Typical Duration | Typical Memory Used |
|----------|--------|---------|------------------|---------------------|
| Poetry | 512 MB | 30s | 5-15s | TBD |
| YouTube | 2048 MB | 60s | 20-40s | TBD |
| Thumbnail | 256 MB | 10s | 1-3s | TBD |

## Optimization Process

### Step 1: Monitor Current Usage

#### Using CloudWatch Console

1. Go to **Lambda** → Select function → **Monitoring** tab
2. View **Memory utilization** graph
3. Look for:
   - **Average memory used**: Should be 60-80% of allocated
   - **Maximum memory used**: Should not exceed allocated
   - **Consistent patterns**: Stable usage indicates good sizing

#### Using CloudWatch Insights

Query memory usage for all invocations:

```
fields @timestamp, @memorySize, @maxMemoryUsed, @duration
| filter @type = "REPORT"
| stats avg(@maxMemoryUsed) as AvgMemoryUsed, 
        max(@maxMemoryUsed) as MaxMemoryUsed,
        avg(@duration) as AvgDuration,
        count() as Invocations
  by @memorySize
```

#### Using AWS CLI

Get memory statistics:

```bash
# Poetry Function
aws logs filter-log-events \
  --log-group-name /aws/lambda/kiroween-PoetryFunction-xxx \
  --filter-pattern "[report_type=REPORT, ...]" \
  --query 'events[*].message' \
  --output text | grep "Max Memory Used"

# YouTube Function
aws logs filter-log-events \
  --log-group-name /aws/lambda/kiroween-YouTubeFunction-xxx \
  --filter-pattern "[report_type=REPORT, ...]" \
  --query 'events[*].message' \
  --output text | grep "Max Memory Used"

# Thumbnail Function
aws logs filter-log-events \
  --log-group-name /aws/lambda/kiroween-ThumbnailFunction-xxx \
  --filter-pattern "[report_type=REPORT, ...]" \
  --query 'events[*].message' \
  --output text | grep "Max Memory Used"
```

### Step 2: Analyze Memory Usage

Use the provided script to analyze memory usage:

```bash
cd lambda
.\analyze-memory-usage.ps1
```

The script will:
1. Fetch recent invocation logs
2. Parse memory usage statistics
3. Calculate average and max memory used
4. Recommend optimal memory settings
5. Estimate cost savings

### Step 3: Test Different Memory Sizes

#### Manual Testing

1. Update memory in SAM template
2. Deploy changes
3. Run load tests
4. Monitor performance and cost
5. Repeat with different values

#### Automated Testing (AWS Lambda Power Tuning)

Use AWS Lambda Power Tuning tool:

```bash
# Install SAR application
aws serverlessrepo create-cloud-formation-change-set \
  --application-id arn:aws:serverlessrepo:us-east-1:451282441545:applications/aws-lambda-power-tuning \
  --stack-name lambda-power-tuning

# Execute change set
aws cloudformation execute-change-set --change-set-name <change-set-name>

# Run power tuning for Poetry Function
aws stepfunctions start-execution \
  --state-machine-arn <state-machine-arn> \
  --input '{
    "lambdaARN": "arn:aws:lambda:ap-northeast-2:ACCOUNT_ID:function:kiroween-PoetryFunction-xxx",
    "powerValues": [256, 512, 1024, 1536, 2048],
    "num": 10,
    "payload": {"body": "{\"audioFeatures\": {...}}"}
  }'
```

### Step 4: Update SAM Template

Based on analysis, update memory settings in `lambda/template.yaml`:

```yaml
PoetryFunction:
  Type: AWS::Serverless::Function
  Properties:
    MemorySize: 512  # Adjust based on analysis
    # ... other properties

YouTubeFunction:
  Type: AWS::Serverless::Function
  Properties:
    MemorySize: 2048  # Adjust based on analysis
    # ... other properties

ThumbnailFunction:
  Type: AWS::Serverless::Function
  Properties:
    MemorySize: 256  # Adjust based on analysis
    # ... other properties
```

### Step 5: Deploy and Verify

```bash
cd lambda
sam build
sam deploy

# Run tests to verify performance
.\test-production-endpoints.ps1
```

## Optimization Guidelines

### Poetry Function (Node.js + Bedrock)

**Current**: 512 MB

**Considerations**:
- Lightweight function (just API calls)
- No heavy computation
- Memory mainly for Node.js runtime + AWS SDK

**Optimization Strategy**:
1. Monitor actual usage (likely 100-200 MB)
2. If consistently < 256 MB, reduce to 256 MB
3. If 256-400 MB, keep at 512 MB
4. If > 400 MB, investigate memory leaks

**Expected Outcome**:
- Likely can reduce to 256 MB
- Cost savings: ~50%
- Performance impact: Minimal (I/O bound, not CPU bound)

### YouTube Function (Python + librosa)

**Current**: 2048 MB

**Considerations**:
- Memory-intensive (librosa audio analysis)
- CPU-intensive (FFT, beat detection)
- Temporary file storage in /tmp

**Optimization Strategy**:
1. Monitor actual usage (likely 1200-1600 MB)
2. If consistently < 1536 MB, reduce to 1536 MB
3. If 1536-1800 MB, keep at 2048 MB
4. If > 1800 MB, increase to 3008 MB

**Expected Outcome**:
- Likely can reduce to 1536 MB
- Cost savings: ~25%
- Performance impact: Slight increase in duration (more CPU = faster)

**Important**: Test thoroughly! librosa needs memory for:
- Audio buffer
- FFT computations
- Numpy arrays
- Temporary data structures

### Thumbnail Function (Node.js)

**Current**: 256 MB

**Considerations**:
- Simple proxy function
- Minimal computation
- Small image buffers

**Optimization Strategy**:
1. Monitor actual usage (likely 50-100 MB)
2. If consistently < 128 MB, reduce to 128 MB
3. If 128-200 MB, keep at 256 MB

**Expected Outcome**:
- Likely can reduce to 128 MB
- Cost savings: ~50%
- Performance impact: Minimal

## Memory Sizing Best Practices

### General Rules

1. **Start Conservative**: Begin with higher memory, then reduce
2. **Monitor First**: Collect data before optimizing
3. **Test Thoroughly**: Verify performance after changes
4. **Consider CPU**: More memory = more CPU = faster execution
5. **Watch for OOM**: Out of memory errors indicate undersizing

### Memory Allocation Options

Lambda memory can be set in 1 MB increments from 128 MB to 10,240 MB.

**Common values**:
- 128 MB: Minimal functions (simple proxies)
- 256 MB: Lightweight functions (API calls)
- 512 MB: Standard functions (light processing)
- 1024 MB: Medium functions (moderate processing)
- 1536 MB: Heavy functions (data processing)
- 2048 MB: Very heavy functions (audio/video processing)
- 3008 MB: Maximum for most use cases

### Cost vs. Performance Trade-off

| Memory | CPU Power | Use Case | Cost Multiplier |
|--------|-----------|----------|-----------------|
| 128 MB | 0.08 vCPU | Minimal | 1x |
| 256 MB | 0.17 vCPU | Light | 2x |
| 512 MB | 0.33 vCPU | Standard | 4x |
| 1024 MB | 0.67 vCPU | Medium | 8x |
| 1536 MB | 1.0 vCPU | Heavy | 12x |
| 2048 MB | 1.33 vCPU | Very Heavy | 16x |
| 3008 MB | 2.0 vCPU | Maximum | 23.5x |

**Key Insight**: Doubling memory doubles cost per second, but may reduce duration by more than 50%, resulting in net savings.

## Cost Calculation Examples

### Example 1: Poetry Function Optimization

**Before**: 512 MB, 10s average duration
- Cost per invocation: 512 MB × 10s = 5,120 MB-seconds
- Cost: 5,120 × $0.0000166667 = $0.000085

**After**: 256 MB, 12s average duration (slower CPU)
- Cost per invocation: 256 MB × 12s = 3,072 MB-seconds
- Cost: 3,072 × $0.0000166667 = $0.000051
- **Savings**: 40% ($0.000034 per invocation)

**For 1,000 invocations/month**: Save $0.034/month

### Example 2: YouTube Function Optimization

**Before**: 2048 MB, 30s average duration
- Cost per invocation: 2048 MB × 30s = 61,440 MB-seconds
- Cost: 61,440 × $0.0000166667 = $0.001024

**After**: 1536 MB, 35s average duration (slightly slower)
- Cost per invocation: 1536 MB × 35s = 53,760 MB-seconds
- Cost: 53,760 × $0.0000166667 = $0.000896
- **Savings**: 12.5% ($0.000128 per invocation)

**For 1,000 invocations/month**: Save $0.128/month

### Total Potential Savings

- Poetry: $0.034/month
- YouTube: $0.128/month
- Thumbnail: $0.020/month (estimated)
- **Total**: ~$0.18/month (9% of total Lambda costs)

## Monitoring After Optimization

### Set Up Memory Utilization Alarms

Add to `lambda/template.yaml`:

```yaml
PoetryFunctionMemoryAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: !Sub "${AWS::StackName}-PoetryFunction-HighMemory"
    AlarmDescription: "Alert when memory usage exceeds 90%"
    MetricName: MemoryUtilization
    Namespace: AWS/Lambda
    Statistic: Average
    Period: 300
    EvaluationPeriods: 2
    Threshold: 90
    ComparisonOperator: GreaterThanThreshold
    Dimensions:
      - Name: FunctionName
        Value: !Ref PoetryFunction
    AlarmActions:
      - !Ref AlarmNotificationTopic
```

### Regular Review Schedule

- **Weekly**: Check CloudWatch dashboards
- **Monthly**: Run memory analysis script
- **Quarterly**: Re-evaluate memory settings
- **After major changes**: Re-test and optimize

## Troubleshooting

### Out of Memory Errors

**Symptoms**:
- Function fails with "Runtime exited with error: signal: killed"
- CloudWatch shows memory usage at 100%

**Solutions**:
1. Increase memory allocation
2. Optimize code to use less memory
3. Process data in chunks
4. Use streaming instead of buffering

### Performance Degradation

**Symptoms**:
- Duration increased after reducing memory
- Timeouts occurring more frequently

**Solutions**:
1. Increase memory to get more CPU
2. Optimize code for efficiency
3. Consider async processing
4. Use caching

### Inconsistent Memory Usage

**Symptoms**:
- Memory usage varies widely between invocations
- Some invocations use 200 MB, others use 800 MB

**Solutions**:
1. Investigate code paths
2. Check for memory leaks
3. Optimize data structures
4. Set memory to accommodate peak usage

## Tools and Scripts

### analyze-memory-usage.ps1

Analyzes CloudWatch logs to determine optimal memory settings.

**Usage**:
```bash
.\analyze-memory-usage.ps1
```

**Output**:
- Current memory allocation
- Average memory used
- Maximum memory used
- Recommended memory setting
- Estimated cost savings

### AWS Lambda Power Tuning

Open-source tool for automated memory optimization.

**Features**:
- Tests multiple memory configurations
- Measures cost and performance
- Generates visualization
- Recommends optimal setting

**Installation**: See Step 3 above

## Related Documentation

- [Lambda Memory Configuration](https://docs.aws.amazon.com/lambda/latest/dg/configuration-memory.html)
- [Lambda Pricing](https://aws.amazon.com/lambda/pricing/)
- [Lambda Power Tuning](https://github.com/alexcasalboni/aws-lambda-power-tuning)
- [CloudWatch Logs Insights](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/AnalyzingLogData.html)

---

**Last Updated**: 2025-11-27
**Status**: Ready for optimization
**Next Review**: After 1 week of production usage
