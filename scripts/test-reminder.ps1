# Script to test the email reminder system
# Run this from the project root

$cronSecret = "0b8674dead99413c25044512834a4aea394bab4321718e5995b55c9813a0e073" # From .env.local
$baseUrl = "http://localhost:3000"

Write-Host "Triggering reminder cron job..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/cron/send-reminders" -Method Get -Headers @{
        "Authorization" = "Bearer $cronSecret"
    }

    Write-Host "Response received:" -ForegroundColor Green
    $response | ConvertTo-Json | Write-Host
} catch {
    Write-Host "Error triggering cron job:" -ForegroundColor Red
    $_.Exception.Message | Write-Host
    if ($_.ErrorDetails) {
        $_.ErrorDetails.Message | Write-Host
    }
}
