# Invalidate CloudFront cache to force new deployment
# Run this after updating .env.production and redeploying frontend

$DISTRIBUTION_ID = "E2XXT04YWS0DGE"

Write-Host "Creating CloudFront invalidation..." -ForegroundColor Yellow
Write-Host "Distribution ID: $DISTRIBUTION_ID" -ForegroundColor Cyan

$invalidationId = aws cloudfront create-invalidation `
    --distribution-id $DISTRIBUTION_ID `
    --paths "/*" `
    --query 'Invalidation.Id' `
    --output text

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Invalidation created: $invalidationId" -ForegroundColor Green
    Write-Host "Waiting for invalidation to complete..." -ForegroundColor Yellow
    
    aws cloudfront wait invalidation-completed `
        --distribution-id $DISTRIBUTION_ID `
        --id $invalidationId
    
    Write-Host "✅ CloudFront cache invalidated successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Now try:" -ForegroundColor Cyan
    Write-Host "1. Hard refresh your browser (Ctrl+Shift+R)" -ForegroundColor White
    Write-Host "2. Check the new API endpoint is being used" -ForegroundColor White
} else {
    Write-Host "❌ Failed to create invalidation" -ForegroundColor Red
}
