# Production Endpoint Testing Script
# Tests all deployed Lambda functions via API Gateway

$API_ENDPOINT = "https://mvw4x2xbud.execute-api.ap-northeast-2.amazonaws.com/Prod"
$REGION = "ap-northeast-2"
$STACK_NAME = "kiroween"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Production Endpoint Testing" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "API Endpoint: $API_ENDPOINT" -ForegroundColor Yellow
Write-Host "Region: $REGION" -ForegroundColor Yellow
Write-Host ""

# Test Results
$testResults = @()

# Function to test endpoint
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Path,
        [object]$Body = $null,
        [int]$ExpectedStatus = 200,
        [int]$MaxDuration = 30000
    )
    
    Write-Host "Testing: $Name" -ForegroundColor Cyan
    Write-Host "  Method: $Method $Path" -ForegroundColor Gray
    
    $url = "$API_ENDPOINT$Path"
    $startTime = Get-Date
    
    try {
        $headers = @{
            "Content-Type" = "application/json"
        }
        
        if ($Method -eq "POST" -and $Body) {
            $jsonBody = $Body | ConvertTo-Json -Depth 10
            Write-Host "  Request Body: $($jsonBody.Substring(0, [Math]::Min(100, $jsonBody.Length)))..." -ForegroundColor Gray
            
            $response = Invoke-WebRequest -Uri $url -Method $Method -Headers $headers -Body $jsonBody -UseBasicParsing
        } else {
            $response = Invoke-WebRequest -Uri $url -Method $Method -Headers $headers -UseBasicParsing
        }
        
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalMilliseconds
        
        $statusCode = $response.StatusCode
        $content = $response.Content | ConvertFrom-Json
        
        # Check status code
        $statusMatch = $statusCode -eq $ExpectedStatus
        
        # Check duration
        $durationOk = $duration -le $MaxDuration
        
        # Check CORS headers
        $corsHeaders = $response.Headers["Access-Control-Allow-Origin"]
        $corsOk = $corsHeaders -ne $null
        
        $success = $statusMatch -and $durationOk -and $corsOk
        
        if ($success) {
            Write-Host "  [PASS]" -ForegroundColor Green
        } else {
            Write-Host "  [FAIL]" -ForegroundColor Red
        }
        
        Write-Host "  Status: $statusCode (Expected: $ExpectedStatus) $(if($statusMatch){'[OK]'}else{'[FAIL]'})" -ForegroundColor $(if($statusMatch){'Green'}else{'Red'})
        Write-Host "  Duration: $([Math]::Round($duration, 2))ms (Max: ${MaxDuration}ms) $(if($durationOk){'[OK]'}else{'[FAIL]'})" -ForegroundColor $(if($durationOk){'Green'}else{'Red'})
        Write-Host "  CORS: $(if($corsOk){'[OK] Present'}else{'[FAIL] Missing'})" -ForegroundColor $(if($corsOk){'Green'}else{'Red'})
        
        if ($content.success) {
            Write-Host "  Response: Success" -ForegroundColor Green
        }
        
        Write-Host ""
        
        return @{
            Name = $Name
            Success = $success
            StatusCode = $statusCode
            Duration = $duration
            CORS = $corsOk
            Error = $null
        }
        
    } catch {
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalMilliseconds
        
        Write-Host "  [FAIL]" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "  Duration: $([Math]::Round($duration, 2))ms" -ForegroundColor Gray
        Write-Host ""
        
        return @{
            Name = $Name
            Success = $false
            StatusCode = 0
            Duration = $duration
            CORS = $false
            Error = $_.Exception.Message
        }
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "1. Poetry Generation Tests" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Poetry Generation - Hamlet, Korean
$testResults += Test-Endpoint `
    -Name "Poetry: Hamlet (Korean)" `
    -Method "POST" `
    -Path "/api/poetry/generate" `
    -Body @{
        audioFeatures = @{
            tempo = 120
            energy = 0.8
            mood = "energetic"
            spectralCentroid = 2000
            key = "C"
        }
        persona = "hamlet"
        language = "ko"
        model = "anthropic.claude-3-haiku-20240307-v1:0"
    } `
    -ExpectedStatus 200 `
    -MaxDuration 30000

# Test 2: Poetry Generation - Nietzsche, English
$testResults += Test-Endpoint `
    -Name "Poetry: Nietzsche (English)" `
    -Method "POST" `
    -Path "/api/poetry/generate" `
    -Body @{
        audioFeatures = @{
            tempo = 80
            energy = 0.4
            mood = "melancholic"
            spectralCentroid = 1500
            key = "Am"
        }
        persona = "nietzsche"
        language = "en"
        model = "anthropic.claude-3-haiku-20240307-v1:0"
    } `
    -ExpectedStatus 200 `
    -MaxDuration 30000

# Test 3: Poetry Generation - Invalid Input (Error Handling)
$testResults += Test-Endpoint `
    -Name "Poetry: Invalid Input (Error Handling)" `
    -Method "POST" `
    -Path "/api/poetry/generate" `
    -Body @{
        audioFeatures = @{}
        persona = ""
        language = ""
    } `
    -ExpectedStatus 500 `
    -MaxDuration 5000

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "2. YouTube Function Tests (If Deployed)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 4: YouTube Info
$testResults += Test-Endpoint `
    -Name "YouTube: Video Info" `
    -Method "GET" `
    -Path "/api/youtube/info?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ" `
    -ExpectedStatus 200 `
    -MaxDuration 60000

# Test 5: YouTube Audio Analysis
$testResults += Test-Endpoint `
    -Name "YouTube: Audio Analysis" `
    -Method "GET" `
    -Path "/api/youtube/audio-with-analysis?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ" `
    -ExpectedStatus 200 `
    -MaxDuration 60000

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "3. CloudWatch Logs Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Fetching recent CloudWatch logs..." -ForegroundColor Yellow

try {
    # Get Poetry Function logs
    $poetryFunctionName = (aws cloudformation describe-stack-resources --stack-name $STACK_NAME --region $REGION --query "StackResources[?LogicalResourceId=='PoetryFunction'].PhysicalResourceId" --output text)
    
    if ($poetryFunctionName) {
        Write-Host "Poetry Function: $poetryFunctionName" -ForegroundColor Green
        
        # Get recent logs (last 5 minutes)
        $startTime = [DateTimeOffset]::UtcNow.AddMinutes(-5).ToUnixTimeMilliseconds()
        
        Write-Host "Recent logs (last 5 minutes):" -ForegroundColor Cyan
        aws logs tail "/aws/lambda/$poetryFunctionName" --region $REGION --since 5m --format short | Select-Object -First 20
        Write-Host ""
    } else {
        Write-Host "[WARN] Could not find Poetry Function" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[WARN] Error fetching CloudWatch logs: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "4. Performance Metrics" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Fetching Lambda metrics..." -ForegroundColor Yellow

try {
    if ($poetryFunctionName) {
        # Get invocation count
        $invocations = aws cloudwatch get-metric-statistics `
            --namespace AWS/Lambda `
            --metric-name Invocations `
            --dimensions Name=FunctionName,Value=$poetryFunctionName `
            --start-time (Get-Date).AddHours(-1).ToString("yyyy-MM-ddTHH:mm:ss") `
            --end-time (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss") `
            --period 3600 `
            --statistics Sum `
            --region $REGION | ConvertFrom-Json
        
        $invocationCount = if ($invocations.Datapoints.Count -gt 0) { $invocations.Datapoints[0].Sum } else { 0 }
        
        Write-Host "Invocations (last hour): $invocationCount" -ForegroundColor Cyan
        
        # Get error count
        $errors = aws cloudwatch get-metric-statistics `
            --namespace AWS/Lambda `
            --metric-name Errors `
            --dimensions Name=FunctionName,Value=$poetryFunctionName `
            --start-time (Get-Date).AddHours(-1).ToString("yyyy-MM-ddTHH:mm:ss") `
            --end-time (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss") `
            --period 3600 `
            --statistics Sum `
            --region $REGION | ConvertFrom-Json
        
        $errorCount = if ($errors.Datapoints.Count -gt 0) { $errors.Datapoints[0].Sum } else { 0 }
        
        Write-Host "Errors (last hour): $errorCount" -ForegroundColor $(if($errorCount -eq 0){'Green'}else{'Red'})
        
        # Get average duration
        $duration = aws cloudwatch get-metric-statistics `
            --namespace AWS/Lambda `
            --metric-name Duration `
            --dimensions Name=FunctionName,Value=$poetryFunctionName `
            --start-time (Get-Date).AddHours(-1).ToString("yyyy-MM-ddTHH:mm:ss") `
            --end-time (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss") `
            --period 3600 `
            --statistics Average `
            --region $REGION | ConvertFrom-Json
        
        $avgDuration = if ($duration.Datapoints.Count -gt 0) { [Math]::Round($duration.Datapoints[0].Average, 2) } else { 0 }
        
        Write-Host "Average Duration: ${avgDuration}ms" -ForegroundColor Cyan
        Write-Host ""
    }
} catch {
    Write-Host "[WARN] Error fetching metrics: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$totalTests = $testResults.Count
$passedTests = ($testResults | Where-Object { $_.Success }).Count
$failedTests = $totalTests - $passedTests

Write-Host "Total Tests: $totalTests" -ForegroundColor Cyan
Write-Host "Passed: $passedTests" -ForegroundColor Green
Write-Host "Failed: $failedTests" -ForegroundColor $(if($failedTests -eq 0){'Green'}else{'Red'})
Write-Host ""

# Detailed results
Write-Host "Detailed Results:" -ForegroundColor Cyan
foreach ($result in $testResults) {
    $status = if ($result.Success) { "[PASS]" } else { "[FAIL]" }
    $color = if ($result.Success) { "Green" } else { "Red" }
    
    Write-Host "  $status - $($result.Name)" -ForegroundColor $color
    Write-Host "    Status: $($result.StatusCode), Duration: $([Math]::Round($result.Duration, 2))ms, CORS: $($result.CORS)" -ForegroundColor Gray
    
    if ($result.Error) {
        Write-Host "    Error: $($result.Error)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Recommendations" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($failedTests -gt 0) {
    Write-Host "[WARN] Some tests failed. Review the errors above." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "  - YouTube function not deployed yet (expected)" -ForegroundColor Gray
    Write-Host "  - Bedrock permissions not configured" -ForegroundColor Gray
    Write-Host "  - CORS configuration issues" -ForegroundColor Gray
    Write-Host "  - Timeout or memory limits" -ForegroundColor Gray
} else {
    Write-Host "[SUCCESS] All tests passed!" -ForegroundColor Green
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Review CloudWatch logs for any errors" -ForegroundColor Gray
Write-Host "  2. Monitor performance metrics in AWS Console" -ForegroundColor Gray
Write-Host "  3. Deploy YouTube function (requires Linux environment)" -ForegroundColor Gray
Write-Host "  4. Update frontend .env.production with API endpoint" -ForegroundColor Gray
Write-Host "  5. Set up CloudWatch alarms for production monitoring" -ForegroundColor Gray
Write-Host ""

Write-Host "CloudWatch Console:" -ForegroundColor Cyan
Write-Host "  https://ap-northeast-2.console.aws.amazon.com/cloudwatch/home?region=ap-northeast-2" -ForegroundColor Blue
Write-Host ""
