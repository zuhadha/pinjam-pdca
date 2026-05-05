# ============================================================
# run-cron.ps1
# Script ini digunakan oleh Windows Task Scheduler untuk
# mentrigger cron job pengingat peminjaman.
# Script akan membaca APP_URL yang dinamis dan CRON_SECRET
# secara langsung dari .env.local
# ============================================================

$envFile = [System.IO.Path]::GetFullPath("$PSScriptRoot\..\.env.local")

if (-not (Test-Path $envFile)) {
    Write-Error "File .env.local tidak ditemukan di: $envFile"
    exit 1
}

$content = Get-Content $envFile -Raw

$appUrl = ""
$cronSecret = ""

if ($content -match '(?m)^APP_URL=(.*)$') { 
    $appUrl = $matches[1].Trim() 
}
if ($content -match '(?m)^CRON_SECRET=(.*)$') { 
    $cronSecret = $matches[1].Trim() 
}

if (-not $appUrl -or -not $cronSecret) {
    Write-Error "APP_URL atau CRON_SECRET tidak ditemukan di .env.local"
    exit 1
}

# Hapus tanda kutip jika ada di variabel .env
$appUrl = $appUrl -replace '^"|"$', ''
$cronSecret = $cronSecret -replace '^"|"$', ''

$targetUrl = "$appUrl/api/cron/send-reminders"

Write-Host "Mentrigger cron job di: $targetUrl"

try {
    $response = Invoke-RestMethod -Uri $targetUrl -Method GET -Headers @{ Authorization = "Bearer $cronSecret" }
    Write-Host "Cron berhasil dijalankan:"
    $response | ConvertTo-Json
} catch {
    Write-Error "Gagal mengeksekusi cron job: $_"
}
