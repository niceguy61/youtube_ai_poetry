# CloudFront Configuration Fix Script
# Fixes missing DefaultRootObject and CustomErrorResponses for SPA

$DISTRIBUTION_ID = "E2XXT04YWS0DGE"

Write-Host "🔧 Fixing CloudFront Configuration..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Get current configuration
Write-Host "1️⃣ Getting current CloudFront configuration..." -ForegroundColor Yellow
$configJson = aws cloudfront get-distribution-config --id $DISTRIBUTION_ID
$config = $configJson | ConvertFrom-Json

if (-not $config) {
    Write-Host "❌ Failed to get CloudFront configuration" -ForegroundColor Red
    exit 1
}

Write-Host "   ✅ Configuration retrieved" -ForegroundColor Green

# Step 2: Extract ETag and DistributionConfig
$etag = $config.ETag
$distConfig = $config.DistributionConfig

Write-Host "   ETag: $etag" -ForegroundColor Gray

# Step 3: Update DefaultRootObject
Write-Host ""
Write-Host "2️⃣ Setting DefaultRootObject to 'index.html'..." -ForegroundColor Yellow
$distConfig.DefaultRootObject = "index.html"
Write-Host "   ✅ DefaultRootObject updated" -ForegroundColor Green

# Step 4: Add CustomErrorResponses for SPA routing
Write-Host ""
Write-Host "3️⃣ Adding CustomErrorResponses for SPA routing..." -ForegroundColor Yellow

$customErrorResponses = @{
    Quantity = 2
    Items = @(
        @{
            ErrorCode = 404
            ResponsePagePath = "/index.html"
            ResponseCode = "200"
            ErrorCachingMinTTL = 0
        },
        @{
            ErrorCode = 403
            ResponsePagePath = "/index.html"
            ResponseCode = "200"
            ErrorCachingMinTTL = 0
        }
    )
}

$distConfig.CustomErrorResponses = $customErrorResponses
Write-Host "   ✅ CustomErrorResponses configured" -ForegroundColor Green
Write-Host "      - 404 → /index.html (200)" -ForegroundColor Gray
Write-Host "      - 403 → /index.html (200)" -ForegroundColor Gray

# Step 5: Save updated config to file
Write-Host ""
Write-Host "4️⃣ Saving updated configuration..." -ForegroundColor Yellow
$configFile = "cloudfront-config-update.json"
$distConfig | ConvertTo-Json -Depth 10 | Set-Content $configFile
Write-Host "   ✅ Configuration saved to $configFile" -ForegroundColor Green

# Step 6: Update CloudFront distribution
Write-Host ""
Write-Host "5️⃣ Updating CloudFront distribution..." -ForegroundColor Yellow
Write-Host "   ⏳ This may take a few minutes..." -ForegroundColor Gray

try {
    $updateResult = aws cloudfront update-distribution `
        --id $DISTRIBUTION_ID `
        --distribution-config file://$configFile `
        --if-match $etag `
        2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ CloudFront distribution updated successfully!" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Failed to update distribution" -ForegroundColor Red
        Write-Host "   Error: $updateResult" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ❌ Error updating distribution: $_" -ForegroundColor Red
    exit 1
}

# Step 7: Create invalidation to clear cache
Write-Host ""
Write-Host "6️⃣ Creating cache invalidation..." -ForegroundColor Yellow

$invalidationResult = aws cloudfront create-invalidation `
    --distribution-id $DISTRIBUTION_ID `
    --paths "/*" `
    --query 'Invalidation.{Id:Id,Status:Status,CreateTime:CreateTime}' `
    --output json | ConvertFrom-Json

if ($invalidationResult) {
    Write-Host "   ✅ Cache invalidation created" -ForegroundColor Green
    Write-Host "      Invalidation ID: $($invalidationResult.Id)" -ForegroundColor Gray
    Write-Host "      Status: $($invalidationResult.Status)" -ForegroundColor Gray
} else {
    Write-Host "   ⚠️  Failed to create invalidation (non-critical)" -ForegroundColor Yellow
}

# Step 8: Check distribution status
Write-Host ""
Write-Host "7️⃣ Checking distribution status..." -ForegroundColor Yellow

$status = aws cloudfront get-distribution `
    --id $DISTRIBUTION_ID `
    --query 'Distribution.Status' `
    --output text

Write-Host "   Status: $status" -ForegroundColor Gray

if ($status -eq "InProgress") {
    Write-Host "   ⏳ Distribution is deploying..." -ForegroundColor Yellow
    Write-Host "   This typically takes 5-15 minutes" -ForegroundColor Gray
} elseif ($status -eq "Deployed") {
    Write-Host "   ✅ Distribution is deployed" -ForegroundColor Green
}

# Summary
Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "✅ CloudFront Configuration Fixed!" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""
Write-Host "Changes Applied:" -ForegroundColor White
Write-Host "  ✅ DefaultRootObject: index.html" -ForegroundColor Green
Write-Host "  ✅ CustomErrorResponses: 404/403 → index.html" -ForegroundColor Green
Write-Host "  ✅ Cache invalidation: Created" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor White
Write-Host "  1. Wait 5-15 minutes for CloudFront to deploy changes" -ForegroundColor Gray
Write-Host "  2. Test: https://kiroween.drumgoon.net" -ForegroundColor Gray
Write-Host "  3. Test: https://d3dmnpn2aufr9o.cloudfront.net" -ForegroundColor Gray
Write-Host ""
Write-Host "Monitoring:" -ForegroundColor White
Write-Host "  aws cloudfront get-distribution --id $DISTRIBUTION_ID --query 'Distribution.Status'" -ForegroundColor Gray
Write-Host ""

# Cleanup
Remove-Item $configFile -ErrorAction SilentlyContinue

Write-Host "🎉 Done!" -ForegroundColor Green
