# ============================================================
# update-env-ip.ps1
# 1. Deteksi IP lokal aktif
# 2. Update APP_URL + NEXT_PUBLIC_BASE_URL di .env.local
# 3. Jalankan Next.js dev server dengan IP tersebut sebagai hostname
#    agar output "Network: http://<IP>:3000" tampil dengan benar
# ============================================================

# Cari IP lokal yang sedang aktif (bukan loopback/link-local)
$ip = (
    Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object {
        $_.IPAddress -notmatch '^127\.' -and
        $_.IPAddress -notmatch '^169\.254\.' -and
        $_.PrefixOrigin -ne 'WellKnown'
    } |
    Sort-Object -Property InterfaceIndex |
    Select-Object -First 1
).IPAddress

if (-not $ip) {
    Write-Warning "Tidak dapat mendeteksi IP lokal. Menggunakan localhost sebagai fallback."
    $ip = "localhost"
}

$port = "3000"
$appUrl = "http://${ip}:${port}"

Write-Host ""
Write-Host "[update-env-ip] IP lokal terdeteksi : $ip"
Write-Host "[update-env-ip] APP_URL akan diset  : $appUrl"

# ── Update .env.local ─────────────────────────────────────────────────────────

$envFile = [System.IO.Path]::GetFullPath("$PSScriptRoot\\..\\.env.local")

if (-not (Test-Path $envFile)) {
    Write-Error "File .env.local tidak ditemukan di: $envFile"
    exit 1
}

$content = Get-Content $envFile -Raw

# Update atau tambahkan APP_URL
if ($content -match '(?m)^APP_URL=.*$') {
    $content = $content -replace '(?m)^APP_URL=.*$', "APP_URL=$appUrl"
} else {
    $content = $content.TrimEnd() + "`nAPP_URL=$appUrl`n"
}

# Update atau tambahkan NEXT_PUBLIC_BASE_URL
if ($content -match '(?m)^NEXT_PUBLIC_BASE_URL=.*$') {
    $content = $content -replace '(?m)^NEXT_PUBLIC_BASE_URL=.*$', "NEXT_PUBLIC_BASE_URL=$appUrl"
} else {
    $content = $content.TrimEnd() + "`nNEXT_PUBLIC_BASE_URL=$appUrl`n"
}

Set-Content -Path $envFile -Value $content -NoNewline -Encoding UTF8

Write-Host "[update-env-ip] .env.local berhasil diperbarui."
Write-Host ""

# ── Jalankan Next.js dengan IP sebagai hostname ───────────────────────────────
# Menggunakan IP nyata (bukan 0.0.0.0) agar output Network URL tampil lengkap.

$projectRoot = [System.IO.Path]::GetFullPath("$PSScriptRoot\..")
$env:NODE_OPTIONS = "--max-old-space-size=4096"

Set-Location $projectRoot
& npx --yes concurrently --kill-others --names "NEXT,CRON" --prefix-colors "blue,yellow" "node node_modules/next/dist/bin/next dev --hostname $ip --port $port" "node scripts/cron.js"
