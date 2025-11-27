# Create CloudWatch Monitoring Dashboard for Music Poetry Backend
# This script creates a comprehensive monitoring dashboard

param(
    [Parameter(Mandatory=$false)]
    [string]$StackName = "kiroween",
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "ap-northeast-2",
    
    [Parameter(Mandatory=$false)]
    [string]$DashboardName = "music-poetry-backend-monitoring"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CloudWatch Dashboard Creation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Stack: $StackName" -ForegroundColor Yellow
Write-Host "Region: $Region" -ForegroundColor Yellow
Write-Host "Dashboard: $DashboardName" -ForegroundColor Yellow
Write-Host ""

# Get Lambda function names and API Gateway ID from stack
Write-Host "Fetching stack resources..." -ForegroundColor Green

try {
    $StackResources = aws cloudformation describe-stack-resources `
        --stack-name $StackName `
        --region $Region `
        --output json | ConvertFrom-Json
    
    $PoetryFunction = ($StackResources.StackResources | Where-Object { $_.LogicalResourceId -eq "PoetryFunction" }).PhysicalResourceId
    $YouTubeFunction = ($StackResources.StackResources | Where-Object { $_.LogicalResourceId -eq "YouTubeFunction" }).PhysicalResourceId
    $ThumbnailFunction = ($StackResources.StackResources | Where-Object { $_.LogicalResourceId -eq "ThumbnailFunction" }).PhysicalResourceId
    $ApiGateway = ($StackResources.StackResources | Where-Object { $_.ResourceType -eq "AWS::ApiGateway::RestApi" }).PhysicalResourceId
    
    Write-Host "  ✓ Poetry Function: $PoetryFunction" -ForegroundColor Green
    Write-Host "  ✓ YouTube Function: $YouTubeFunction" -ForegroundColor Green
    Write-Host "  ✓ Thumbnail Function: $ThumbnailFunction" -ForegroundColor Green
    Write-Host "  ✓ API Gateway: $ApiGateway" -ForegroundColor Green
} catch {
    Write-Host "  Error fetching stack resources" -ForegroundColor Red
    Write-Host "  Make sure the stack '$StackName' exists in region '$Region'" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Creating dashboard..." -ForegroundColor Green

# Dashboard JSON configuration
$DashboardBody = @{
    widgets = @(
        # Row 1: Invocations and Errors
        @{
            type = "metric"
            x = 0
            y = 0
            width = 12
            height = 6
            properties = @{
                metrics = @(
                    @("AWS/Lambda", "Invocations", "FunctionName", $PoetryFunction, @{ stat = "Sum"; label = "Poetry" })
                    @("AWS/Lambda", "Invocations", "FunctionName", $YouTubeFunction, @{ stat = "Sum"; label = "YouTube" })
                    @("AWS/Lambda", "Invocations", "FunctionName", $ThumbnailFunction, @{ stat = "Sum"; label = "Thumbnail" })
                )
                view = "timeSeries"
                stacked = false
                region = $Region
                title = "Lambda Invocations"
                period = 300
                yAxis = @{ left = @{ min = 0 } }
            }
        }
        @{
            type = "metric"
            x = 12
            y = 0
            width = 12
            height = 6
            properties = @{
                metrics = @(
                    @("AWS/Lambda", "Errors", "FunctionName", $PoetryFunction, @{ stat = "Sum"; label = "Poetry" })
                    @("AWS/Lambda", "Errors", "FunctionName", $YouTubeFunction, @{ stat = "Sum"; label = "YouTube" })
                    @("AWS/Lambda", "Errors", "FunctionName", $ThumbnailFunction, @{ stat = "Sum"; label = "Thumbnail" })
                )
                view = "timeSeries"
                stacked = false
                region = $Region
                title = "Lambda Errors"
                period = 300
                yAxis = @{ left = @{ min = 0 } }
            }
        }
        
        # Row 2: Duration and Memory
        @{
            type = "metric"
            x = 0
            y = 6
            width = 12
            height = 6
            properties = @{
                metrics = @(
                    @("AWS/Lambda", "Duration", "FunctionName", $PoetryFunction, @{ stat = "Average"; label = "Poetry (avg)" })
                    @("AWS/Lambda", "Duration", "FunctionName", $YouTubeFunction, @{ stat = "Average"; label = "YouTube (avg)" })
                    @("AWS/Lambda", "Duration", "FunctionName", $ThumbnailFunction, @{ stat = "Average"; label = "Thumbnail (avg)" })
                )
                view = "timeSeries"
                stacked = false
                region = $Region
                title = "Lambda Duration (ms)"
                period = 300
                yAxis = @{ left = @{ min = 0 } }
            }
        }
        @{
            type = "metric"
            x = 12
            y = 6
            width = 12
            height = 6
            properties = @{
                metrics = @(
                    @("AWS/Lambda", "ConcurrentExecutions", "FunctionName", $PoetryFunction, @{ stat = "Maximum"; label = "Poetry" })
                    @("AWS/Lambda", "ConcurrentExecutions", "FunctionName", $YouTubeFunction, @{ stat = "Maximum"; label = "YouTube" })
                    @("AWS/Lambda", "ConcurrentExecutions", "FunctionName", $ThumbnailFunction, @{ stat = "Maximum"; label = "Thumbnail" })
                )
                view = "timeSeries"
                stacked = false
                region = $Region
                title = "Concurrent Executions"
                period = 300
                yAxis = @{ left = @{ min = 0 } }
            }
        }
        
        # Row 3: API Gateway Metrics
        @{
            type = "metric"
            x = 0
            y = 12
            width = 12
            height = 6
            properties = @{
                metrics = @(
                    @("AWS/ApiGateway", "Count", "ApiName", $StackName, @{ stat = "Sum"; label = "Total Requests" })
                )
                view = "timeSeries"
                stacked = false
                region = $Region
                title = "API Gateway Requests"
                period = 300
                yAxis = @{ left = @{ min = 0 } }
            }
        }
        @{
            type = "metric"
            x = 12
            y = 12
            width = 12
            height = 6
            properties = @{
                metrics = @(
                    @("AWS/ApiGateway", "Latency", "ApiName", $StackName, @{ stat = "Average"; label = "Latency" })
                    @("AWS/ApiGateway", "IntegrationLatency", "ApiName", $StackName, @{ stat = "Average"; label = "Integration Latency" })
                )
                view = "timeSeries"
                stacked = false
                region = $Region
                title = "API Gateway Latency (ms)"
                period = 300
                yAxis = @{ left = @{ min = 0 } }
            }
        }
        
        # Row 4: API Gateway Errors and Throttles
        @{
            type = "metric"
            x = 0
            y = 18
            width = 12
            height = 6
            properties = @{
                metrics = @(
                    @("AWS/ApiGateway", "4XXError", "ApiName", $StackName, @{ stat = "Sum"; label = "4XX Errors" })
                    @("AWS/ApiGateway", "5XXError", "ApiName", $StackName, @{ stat = "Sum"; label = "5XX Errors" })
                )
                view = "timeSeries"
                stacked = false
                region = $Region
                title = "API Gateway Errors"
                period = 300
                yAxis = @{ left = @{ min = 0 } }
            }
        }
        @{
            type = "metric"
            x = 12
            y = 18
            width = 12
            height = 6
            properties = @{
                metrics = @(
                    @("AWS/Lambda", "Throttles", "FunctionName", $PoetryFunction, @{ stat = "Sum"; label = "Poetry" })
                    @("AWS/Lambda", "Throttles", "FunctionName", $YouTubeFunction, @{ stat = "Sum"; label = "YouTube" })
                    @("AWS/Lambda", "Throttles", "FunctionName", $ThumbnailFunction, @{ stat = "Sum"; label = "Thumbnail" })
                )
                view = "singleValue"
                region = $Region
                title = "Lambda Throttles (Last Hour)"
                period = 3600
            }
        }
    )
} | ConvertTo-Json -Depth 10 -Compress

# Create dashboard
try {
    aws cloudwatch put-dashboard `
        --dashboard-name $DashboardName `
        --dashboard-body $DashboardBody `
        --region $Region | Out-Null
    
    Write-Host "  ✓ Dashboard created successfully" -ForegroundColor Green
} catch {
    Write-Host "  Error creating dashboard: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Dashboard Created!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Dashboard Name: $DashboardName" -ForegroundColor Green
Write-Host "Region: $Region" -ForegroundColor Green
Write-Host ""
Write-Host "View Dashboard:" -ForegroundColor Yellow
Write-Host "https://console.aws.amazon.com/cloudwatch/home?region=$Region#dashboards:name=$DashboardName" -ForegroundColor White
Write-Host ""
Write-Host "Dashboard includes:" -ForegroundColor Yellow
Write-Host "  ✓ Lambda invocations" -ForegroundColor White
Write-Host "  ✓ Lambda errors" -ForegroundColor White
Write-Host "  ✓ Lambda duration" -ForegroundColor White
Write-Host "  ✓ Concurrent executions" -ForegroundColor White
Write-Host "  ✓ API Gateway requests" -ForegroundColor White
Write-Host "  ✓ API Gateway latency" -ForegroundColor White
Write-Host "  ✓ API Gateway errors" -ForegroundColor White
Write-Host "  ✓ Lambda throttles" -ForegroundColor White
Write-Host ""
Write-Host "For more information, see MONITORING_DASHBOARD.md" -ForegroundColor Cyan
Write-Host ""
