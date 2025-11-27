# Delete failed CloudFormation stacks manually
# Run this script when stacks are in ROLLBACK_COMPLETE state

Write-Host "Checking stack status..." -ForegroundColor Yellow

# Check main stack
$mainStackStatus = aws cloudformation describe-stacks `
    --stack-name kiroween `
    --query 'Stacks[0].StackStatus' `
    --output text 2>$null

if ($mainStackStatus -eq "ROLLBACK_COMPLETE") {
    Write-Host "⚠️  Main stack is in ROLLBACK_COMPLETE state" -ForegroundColor Red
    Write-Host "Deleting main stack..." -ForegroundColor Yellow
    aws cloudformation delete-stack --stack-name kiroween
    Write-Host "Waiting for deletion to complete..." -ForegroundColor Yellow
    aws cloudformation wait stack-delete-complete --stack-name kiroween
    Write-Host "✅ Main stack deleted successfully" -ForegroundColor Green
} else {
    Write-Host "Main stack status: $mainStackStatus" -ForegroundColor Cyan
}

# Check companion stack
$companionStackStatus = aws cloudformation describe-stacks `
    --stack-name kiroween-0d4750de-CompanionStack `
    --query 'Stacks[0].StackStatus' `
    --output text 2>$null

if ($companionStackStatus -eq "ROLLBACK_COMPLETE") {
    Write-Host "⚠️  Companion stack is in ROLLBACK_COMPLETE state" -ForegroundColor Red
    Write-Host "Deleting companion stack..." -ForegroundColor Yellow
    aws cloudformation delete-stack --stack-name kiroween-0d4750de-CompanionStack
    Write-Host "Waiting for deletion to complete..." -ForegroundColor Yellow
    aws cloudformation wait stack-delete-complete --stack-name kiroween-0d4750de-CompanionStack
    Write-Host "✅ Companion stack deleted successfully" -ForegroundColor Green
} else {
    Write-Host "Companion stack status: $companionStackStatus" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "⚠️  IMPORTANT: After redeploying, you MUST update the API Gateway URL in:" -ForegroundColor Yellow
Write-Host "   - .env.production" -ForegroundColor Yellow
Write-Host "   - Frontend deployment workflow" -ForegroundColor Yellow
Write-Host ""
Write-Host "Run 'sam deploy' to redeploy the stack" -ForegroundColor Cyan
