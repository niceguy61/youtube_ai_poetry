# Analyze Lambda Memory Usage and Recommend Optimizations
# This script fetches CloudWatch logs and analyzes memory usage patterns

param(
    [Parameter(Mandatory=$false)]
    [string]$StackName = "kiroween",
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "ap-northeast-2",
    
    [Parameter(Mandatory=$false)]
    [int]$Hours = 24
)

$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Lambda Memory Usage Analysis" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Stack: $StackName" -ForegroundColor Yellow
Write-Host "Region: $Region" -ForegroundColor Yellow
Write-Host "Time Range: Last $Hours hours" -ForegroundColor Yellow
Write-Host ""

# Get Lambda function names from stack
Write-Host "Fetching Lambda functions from stack..." -ForegroundColor Green

$Functions = @()

try {
    $StackResources = aws cloudformation describe-stack-resources `
        --stack-name $StackName `
        --region $Region `
        --query 'StackResources[?ResourceType==`AWS::Lambda::Function`].[PhysicalResourceId,LogicalResourceId]' `
        --output json | ConvertFrom-Json
    
    foreach ($Resource in $StackResources) {
        $Functions += @{
            Name = $Resource[0]
            LogicalId = $Resource[1]
        }
    }
    
    Write-Host "  Found $($Functions.Count) Lambda functions" -ForegroundColor Green
} catch {
    Write-Host "  Error fetching stack resources" -ForegroundColor Red
    Write-Host "  Make sure the stack '$StackName' exists in region '$Region'" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Analyze each function
$Results = @()

foreach ($Function in $Functions) {
    $FunctionName = $Function.Name
    $LogicalId = $Function.LogicalId
    $LogGroupName = "/aws/lambda/$FunctionName"
    
    Write-Host "Analyzing: $LogicalId ($FunctionName)" -ForegroundColor Cyan
    Write-Host "  Log Group: $LogGroupName" -ForegroundColor Gray
    
    # Get function configuration
    try {
        $Config = aws lambda get-function-configuration `
            --function-name $FunctionName `
            --region $Region `
            --output json | ConvertFrom-Json
        
        $AllocatedMemory = $Config.MemorySize
        $Timeout = $Config.Timeout
        
        Write-Host "  Allocated Memory: $AllocatedMemory MB" -ForegroundColor Gray
        Write-Host "  Timeout: $Timeout seconds" -ForegroundColor Gray
    } catch {
        Write-Host "  Error fetching function configuration" -ForegroundColor Red
        continue
    }
    
    # Query CloudWatch Logs for memory usage
    Write-Host "  Querying CloudWatch Logs..." -ForegroundColor Gray
    
    $StartTime = [DateTimeOffset]::UtcNow.AddHours(-$Hours).ToUnixTimeMilliseconds()
    $EndTime = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
    
    $Query = @"
fields @timestamp, @memorySize, @maxMemoryUsed, @duration
| filter @type = "REPORT"
| stats 
    count() as Invocations,
    avg(@maxMemoryUsed) as AvgMemoryUsed,
    max(@maxMemoryUsed) as MaxMemoryUsed,
    min(@maxMemoryUsed) as MinMemoryUsed,
    avg(@duration) as AvgDuration,
    max(@duration) as MaxDuration
"@
    
    try {
        # Start query
        $QueryId = aws logs start-query `
            --log-group-name $LogGroupName `
            --start-time $StartTime `
            --end-time $EndTime `
            --query-string $Query `
            --region $Region `
            --query 'queryId' `
            --output text
        
        # Wait for query to complete
        $MaxWait = 30
        $Waited = 0
        $Status = "Running"
        
        while ($Status -eq "Running" -and $Waited -lt $MaxWait) {
            Start-Sleep -Seconds 2
            $Waited += 2
            
            $QueryResult = aws logs get-query-results `
                --query-id $QueryId `
                --region $Region `
                --output json | ConvertFrom-Json
            
            $Status = $QueryResult.status
        }
        
        if ($Status -eq "Complete" -and $QueryResult.results.Count -gt 0) {
            $Result = $QueryResult.results[0]
            
            $Invocations = [int]($Result | Where-Object { $_.field -eq "Invocations" }).value
            $AvgMemoryUsed = [math]::Round([double]($Result | Where-Object { $_.field -eq "AvgMemoryUsed" }).value, 2)
            $MaxMemoryUsed = [math]::Round([double]($Result | Where-Object { $_.field -eq "MaxMemoryUsed" }).value, 2)
            $MinMemoryUsed = [math]::Round([double]($Result | Where-Object { $_.field -eq "MinMemoryUsed" }).value, 2)
            $AvgDuration = [math]::Round([double]($Result | Where-Object { $_.field -eq "AvgDuration" }).value, 2)
            $MaxDuration = [math]::Round([double]($Result | Where-Object { $_.field -eq "MaxDuration" }).value, 2)
            
            $MemoryUtilization = [math]::Round(($AvgMemoryUsed / $AllocatedMemory) * 100, 1)
            $MaxMemoryUtilization = [math]::Round(($MaxMemoryUsed / $AllocatedMemory) * 100, 1)
            
            Write-Host "  Invocations: $Invocations" -ForegroundColor White
            Write-Host "  Avg Memory Used: $AvgMemoryUsed MB ($MemoryUtilization%)" -ForegroundColor White
            Write-Host "  Max Memory Used: $MaxMemoryUsed MB ($MaxMemoryUtilization%)" -ForegroundColor White
            Write-Host "  Min Memory Used: $MinMemoryUsed MB" -ForegroundColor White
            Write-Host "  Avg Duration: $AvgDuration ms" -ForegroundColor White
            Write-Host "  Max Duration: $MaxDuration ms" -ForegroundColor White
            
            # Recommendation logic
            $Recommendation = $AllocatedMemory
            $Reason = "Current allocation is optimal"
            $Action = "No change needed"
            
            if ($MaxMemoryUtilization -gt 90) {
                $Recommendation = [math]::Ceiling($AllocatedMemory * 1.5 / 128) * 128
                $Reason = "Memory usage is very high (>90%)"
                $Action = "INCREASE memory to prevent OOM errors"
            } elseif ($MaxMemoryUtilization -gt 80) {
                $Recommendation = [math]::Ceiling($AllocatedMemory * 1.25 / 128) * 128
                $Reason = "Memory usage is high (>80%)"
                $Action = "Consider INCREASING memory for safety margin"
            } elseif ($AvgMemoryUtilization -lt 40 -and $AllocatedMemory -gt 256) {
                $Recommendation = [math]::Max(128, [math]::Ceiling($MaxMemoryUsed * 1.2 / 128) * 128)
                $Reason = "Memory usage is low (<40% average)"
                $Action = "Consider REDUCING memory to save costs"
            } elseif ($AvgMemoryUtilization -lt 60 -and $AllocatedMemory -gt 512) {
                $Recommendation = [math]::Ceiling($MaxMemoryUsed * 1.3 / 128) * 128
                $Reason = "Memory usage is moderate (<60% average)"
                $Action = "Consider REDUCING memory slightly"
            }
            
            # Calculate cost impact
            $CurrentCost = ($AllocatedMemory * $AvgDuration / 1000) * 0.0000166667
            $NewCost = ($Recommendation * $AvgDuration / 1000) * 0.0000166667
            $CostDiff = $NewCost - $CurrentCost
            $CostDiffPercent = if ($CurrentCost -gt 0) { [math]::Round(($CostDiff / $CurrentCost) * 100, 1) } else { 0 }
            
            Write-Host ""
            Write-Host "  Recommendation: $Recommendation MB" -ForegroundColor $(if ($Recommendation -ne $AllocatedMemory) { "Yellow" } else { "Green" })
            Write-Host "  Reason: $Reason" -ForegroundColor Gray
            Write-Host "  Action: $Action" -ForegroundColor $(if ($Recommendation -ne $AllocatedMemory) { "Yellow" } else { "Green" })
            
            if ($Recommendation -ne $AllocatedMemory) {
                $CostImpact = if ($CostDiff -lt 0) { "Save" } else { "Cost" }
                $CostColor = if ($CostDiff -lt 0) { "Green" } else { "Red" }
                Write-Host "  Cost Impact: $CostImpact $([math]::Abs($CostDiffPercent))% per invocation" -ForegroundColor $CostColor
            }
            
            $Results += @{
                LogicalId = $LogicalId
                FunctionName = $FunctionName
                Invocations = $Invocations
                AllocatedMemory = $AllocatedMemory
                AvgMemoryUsed = $AvgMemoryUsed
                MaxMemoryUsed = $MaxMemoryUsed
                MemoryUtilization = $MemoryUtilization
                MaxMemoryUtilization = $MaxMemoryUtilization
                AvgDuration = $AvgDuration
                Recommendation = $Recommendation
                Reason = $Reason
                Action = $Action
                CostDiffPercent = $CostDiffPercent
            }
        } else {
            Write-Host "  No data available (function may not have been invoked recently)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  Error querying logs: $_" -ForegroundColor Red
    }
    
    Write-Host ""
}

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Summary & Recommendations" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($Results.Count -eq 0) {
    Write-Host "No data available for analysis" -ForegroundColor Yellow
    Write-Host "Make sure functions have been invoked in the last $Hours hours" -ForegroundColor Yellow
    exit 0
}

$ChangesNeeded = $Results | Where-Object { $_.Recommendation -ne $_.AllocatedMemory }

if ($ChangesNeeded.Count -eq 0) {
    Write-Host "✓ All functions are optimally configured!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "Recommended Changes:" -ForegroundColor Yellow
    Write-Host ""
    
    foreach ($Result in $ChangesNeeded) {
        Write-Host "  $($Result.LogicalId):" -ForegroundColor Cyan
        Write-Host "    Current: $($Result.AllocatedMemory) MB" -ForegroundColor White
        Write-Host "    Recommended: $($Result.Recommendation) MB" -ForegroundColor Yellow
        Write-Host "    Reason: $($Result.Reason)" -ForegroundColor Gray
        Write-Host "    Cost Impact: $($Result.CostDiffPercent)%" -ForegroundColor $(if ($Result.CostDiffPercent -lt 0) { "Green" } else { "Red" })
        Write-Host ""
    }
    
    Write-Host "To apply changes:" -ForegroundColor Yellow
    Write-Host "1. Edit lambda/template.yaml" -ForegroundColor White
    Write-Host "2. Update MemorySize for each function" -ForegroundColor White
    Write-Host "3. Run: sam build && sam deploy" -ForegroundColor White
    Write-Host "4. Monitor performance after deployment" -ForegroundColor White
    Write-Host ""
}

# Export results to CSV
$CsvPath = "lambda-memory-analysis-$(Get-Date -Format 'yyyyMMdd-HHmmss').csv"

$Results | ForEach-Object {
    [PSCustomObject]@{
        Function = $_.LogicalId
        Invocations = $_.Invocations
        AllocatedMemory = $_.AllocatedMemory
        AvgMemoryUsed = $_.AvgMemoryUsed
        MaxMemoryUsed = $_.MaxMemoryUsed
        MemoryUtilization = "$($_.MemoryUtilization)%"
        MaxMemoryUtilization = "$($_.MaxMemoryUtilization)%"
        AvgDuration = "$($_.AvgDuration)ms"
        Recommendation = $_.Recommendation
        CostImpact = "$($_.CostDiffPercent)%"
        Action = $_.Action
    }
} | Export-Csv -Path $CsvPath -NoTypeInformation

Write-Host "Results exported to: $CsvPath" -ForegroundColor Green
Write-Host ""
Write-Host "For more information, see MEMORY_OPTIMIZATION.md" -ForegroundColor Cyan
Write-Host ""
