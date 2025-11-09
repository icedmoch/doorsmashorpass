# Start Backend Server
Set-Location -Path "$PSScriptRoot"
Write-Host "🚀 Starting Backend Server..." -ForegroundColor Green
Write-Host "📍 Location: $PSScriptRoot" -ForegroundColor Cyan
python main.py
