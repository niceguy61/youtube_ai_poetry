# Test CloudWatch Alarms for Music Poetry Backend
# This script triggers alarms by sending requests that cause errors

param(
    [Parameter(Mandatory=$true)]
    [string]$ApiEndpoint
)

Write-Host "Testing CloudWatch Alarms for Music Poetry Backend" -ForegroundColor Cyan
Write-Host "API Endpoint: $ApiEndpoint" -ForegroundColor Yellow
Write-Host ""

# Test 1: Trigger Poetry Function Error Alarm
Write-Host "Test 1: Triggering Poetry Function Error Alarm (need 6 errors)" -ForegroundColor Green
Write-Host "Sending invalid JSON requests..." -ForegroundColor Yellow

for ($i = 1; $i -le 6; $i++) {
    Write-Host "  Request $i/6..." -NoNewline
    try {
        $response = Invoke-RestMethod -Uri "$ApiEndpoint/api/poetry/generate" `
            -Method POST `
            -ContentType "application/json" `
            -Body "invalid json" `
            -ErrorAction SilentlyContinue
    } catch {
        Write-Host " Error triggered ✓" -ForegroundColor Green
    }
    Start-Sleep -Milliseconds 500
}

Write-Host ""
Write-Host "Poetry Function Error Alarm should trigger in ~5 minutes" -ForegroundColor Cyan
Write-Host ""

# Test 2: Trigger YouTube Function Error Alarm
Write-Host "Test 2: Triggering YouTube Function Error Alarm (need 6 errors)" -ForegroundColor Green
Write-Host "Sending invalid URL requests..." -ForegroundColor Yellow

for ($i = 1; $i -le 6; $i++) {
    Write-Host "  Request $i/6..." -NoNewline
    try {
        $response = Invoke-RestMethod -Uri "$ApiEndpoint/api/youtube/info?url=invalid" `
            -Method GET `
            -ErrorAction SilentlyContinue
    } catch {
        Write-Host " Error triggered ✓" -ForegroundColor Green
    }
    Start-Sleep -Milliseconds 500
}

Write-Host ""
Write-Host "YouTube Function Error Alarm should trigger in ~5 minutes" -ForegroundColor Cyan
Write-Host ""

# Test 3: Trigger Thumbnail Function Error Alarm
Write-Host "Test 3: Triggering Thumbnail Function Error Alarm (need 6 errors)" -ForegroundColor Green
Write-Host "Sending invalid thumbnail requests..." -ForegroundColor Yellow

for ($i = 1; $i -le 6; $i++) {
    Write-Host "  Request $i/6..." -NoNewline
    try {
        $response = Invoke-RestMethod -Uri "$ApiEndpoint/api/thumbnail?url=invalid" `
            -Method GET `
            -ErrorAction SilentlyContinue
    } catch {
        Write-Host " Error triggered ✓" -ForegroundColor Green
    }
    Start-Sleep -Milliseconds 500
}

Write-Host ""
Write-Host "Thumbnail Function Error Alarm should trigger in ~5 minutes" -ForegroundColor Cyan
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Alarm Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✓ Sent 6 error requests to Poetry Function" -ForegroundColor Green
Write-Host "✓ Sent 6 error requests to YouTube Function" -ForegroundColor Green
Write-Host "✓ Sent 6 error requests to Thumbnail Function" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Wait 5-10 minutes for alarms to evaluate" -ForegroundColor White
Write-Host "2. Check CloudWatch Console for alarm state changes" -ForegroundColor White
Write-Host "3. Check your email for SNS notifications" -ForegroundColor White
Write-Host "4. View alarm history in CloudWatch" -ForegroundColor White
Write-Host ""
Write-Host "CloudWatch Console:" -ForegroundColor Yellow
Write-Host "https://console.aws.amazon.com/cloudwatch/home?region=ap-northeast-2#alarmsV2:" -ForegroundColor White
Write-Host ""
Write-Host "Lambda Console:" -ForegroundColor Yellow
Write-Host "https://console.aws.amazon.com/lambda/home?region=ap-northeast-2#/functions" -ForegroundColor White
Write-Host ""
