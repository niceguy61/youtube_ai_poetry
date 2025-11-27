# Test deployed Poetry function

$apiEndpoint = "https://mvw4x2xbud.execute-api.ap-northeast-2.amazonaws.com/Prod"

$body = @{
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
} | ConvertTo-Json

Write-Host "Testing Poetry Generation Endpoint..." -ForegroundColor Cyan
Write-Host "Endpoint: $apiEndpoint/api/poetry/generate" -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "$apiEndpoint/api/poetry/generate" `
        -Method Post `
        -Body $body `
        -ContentType "application/json" `
        -TimeoutSec 30
    
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Error!" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody"
    }
}
