# Setup Billing Alerts for Music Poetry Canvas Backend
# This script creates SNS topic and CloudWatch billing alarms

param(
    [Parameter(Mandatory=$true)]
    [string]$Email,
    
    [Parameter(Mandatory=$false)]
    [int[]]$Thresholds = @(5, 10, 20)
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Billing Alerts Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Billing metrics are only available in us-east-1
$Region = "us-east-1"
Write-Host "Note: Billing alarms must be created in us-east-1 region" -ForegroundColor Yellow
Write-Host ""

# Step 1: Create SNS Topic
Write-Host "Step 1: Creating SNS topic for billing alerts..." -ForegroundColor Green

$TopicName = "music-poetry-billing-alerts"

try {
    $TopicArn = aws sns create-topic `
        --name $TopicName `
        --region $Region `
        --query 'TopicArn' `
        --output text
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ SNS topic created: $TopicArn" -ForegroundColor Green
    } else {
        Write-Host "  ℹ Topic may already exist, continuing..." -ForegroundColor Yellow
        $TopicArn = aws sns list-topics `
            --region $Region `
            --query "Topics[?contains(TopicArn, '$TopicName')].TopicArn" `
            --output text
    }
} catch {
    Write-Host "  ℹ Topic may already exist, retrieving ARN..." -ForegroundColor Yellow
    $TopicArn = aws sns list-topics `
        --region $Region `
        --query "Topics[?contains(TopicArn, '$TopicName')].TopicArn" `
        --output text
}

Write-Host ""

# Step 2: Subscribe email to topic
Write-Host "Step 2: Subscribing email to SNS topic..." -ForegroundColor Green

try {
    aws sns subscribe `
        --topic-arn $TopicArn `
        --protocol email `
        --notification-endpoint $Email `
        --region $Region | Out-Null
    
    Write-Host "  ✓ Email subscription created: $Email" -ForegroundColor Green
    Write-Host "  ⚠ Check your email and confirm the subscription!" -ForegroundColor Yellow
} catch {
    Write-Host "  ℹ Subscription may already exist" -ForegroundColor Yellow
}

Write-Host ""

# Step 3: Create billing alarms
Write-Host "Step 3: Creating billing alarms..." -ForegroundColor Green

foreach ($Threshold in $Thresholds) {
    $AlarmName = "music-poetry-billing-alert-${Threshold}usd"
    
    Write-Host "  Creating alarm for `$$Threshold threshold..." -NoNewline
    
    $AlarmConfig = @"
{
    "AlarmName": "$AlarmName",
    "AlarmDescription": "Alert when estimated charges exceed `$$Threshold",
    "ActionsEnabled": true,
    "AlarmActions": ["$TopicArn"],
    "MetricName": "EstimatedCharges",
    "Namespace": "AWS/Billing",
    "Statistic": "Maximum",
    "Dimensions": [
        {
            "Name": "Currency",
            "Value": "USD"
        }
    ],
    "Period": 21600,
    "EvaluationPeriods": 1,
    "Threshold": $Threshold,
    "ComparisonOperator": "GreaterThanThreshold",
    "TreatMissingData": "notBreaching"
}
"@
    
    try {
        $AlarmConfig | aws cloudwatch put-metric-alarm `
            --cli-input-json file:///dev/stdin `
            --region $Region
        
        Write-Host " ✓" -ForegroundColor Green
    } catch {
        Write-Host " ℹ (may already exist)" -ForegroundColor Yellow
    }
}

Write-Host ""

# Step 4: Verify alarms
Write-Host "Step 4: Verifying alarm creation..." -ForegroundColor Green

$Alarms = aws cloudwatch describe-alarms `
    --alarm-name-prefix "music-poetry-billing" `
    --region $Region `
    --query 'MetricAlarms[*].[AlarmName,Threshold,StateValue]' `
    --output table

Write-Host $Alarms
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✓ SNS Topic: $TopicArn" -ForegroundColor Green
Write-Host "✓ Email: $Email" -ForegroundColor Green
Write-Host "✓ Alarms created: $($Thresholds.Count)" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Check your email ($Email) for SNS confirmation" -ForegroundColor White
Write-Host "2. Click the confirmation link in the email" -ForegroundColor White
Write-Host "3. Monitor billing in CloudWatch Console:" -ForegroundColor White
Write-Host "   https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#alarmsV2:" -ForegroundColor Gray
Write-Host "4. View current charges in Billing Console:" -ForegroundColor White
Write-Host "   https://console.aws.amazon.com/billing/home" -ForegroundColor Gray
Write-Host ""
Write-Host "Alarm Thresholds:" -ForegroundColor Yellow
foreach ($Threshold in $Thresholds) {
    Write-Host "  - `$$Threshold USD" -ForegroundColor White
}
Write-Host ""
Write-Host "Expected Monthly Cost: ~`$2 (1,000 requests)" -ForegroundColor Green
Write-Host "Target Budget: < `$5/month" -ForegroundColor Green
Write-Host ""
Write-Host "For more information, see BILLING_ALERTS_SETUP.md" -ForegroundColor Cyan
Write-Host ""
