#!/usr/bin/env pwsh
# Test Runner Script for Chatbot + Orders Integration
# This script starts the necessary servers and runs the test suite

Write-Host "`n==================================================================" -ForegroundColor Cyan
Write-Host "  Chatbot + Orders API Integration Test Runner" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan

# Kill any existing processes on these ports
Write-Host "`nCleaning up existing processes..." -ForegroundColor Yellow
$ports = @(8000, 8002)
foreach ($port in $ports) {
    $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($conn) {
        $processId = $conn.OwningProcess | Select-Object -Unique
        foreach ($pid in $processId) {
            Write-Host "  Stopping process $pid on port $port" -ForegroundColor Yellow
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        }
    }
}

Start-Sleep -Seconds 2

# Start Main API (port 8000)
Write-Host "`nStarting Main API on port 8000..." -ForegroundColor Green
$mainJob = Start-Job -ScriptBlock {
    Set-Location "C:\Users\yzkrm\Desktop\Github\student-eats-ai\backend"
    python main.py
}
Write-Host "  Job ID: $($mainJob.Id)" -ForegroundColor Gray

# Wait for Main API
Start-Sleep -Seconds 5
Write-Host "  Checking Main API..." -ForegroundColor Gray
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000" -TimeoutSec 2 -UseBasicParsing
    Write-Host "  ✓ Main API is running!" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Main API not responding" -ForegroundColor Red
}

# Start Chatbot API (port 8002)
Write-Host "`nStarting Chatbot API on port 8002..." -ForegroundColor Green
$chatbotJob = Start-Job -ScriptBlock {
    Set-Location "C:\Users\yzkrm\Desktop\Github\student-eats-ai\backend"
    python chatbot_api.py
}
Write-Host "  Job ID: $($chatbotJob.Id)" -ForegroundColor Gray

# Wait for Chatbot API
Start-Sleep -Seconds 5
Write-Host "  Checking Chatbot API..." -ForegroundColor Gray
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8002" -TimeoutSec 2 -UseBasicParsing
    Write-Host "  ✓ Chatbot API is running!" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Chatbot API not responding" -ForegroundColor Red
}

# Run the test suite
Write-Host "`n==================================================================" -ForegroundColor Cyan
Write-Host "  Running Test Suite" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan

python test_chatbot_orders_integration.py

# Cleanup
Write-Host "`n==================================================================" -ForegroundColor Cyan
Write-Host "  Cleaning Up" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan

Write-Host "Stopping servers..." -ForegroundColor Yellow
Stop-Job -Job $mainJob, $chatbotJob -ErrorAction SilentlyContinue
Remove-Job -Job $mainJob, $chatbotJob -Force -ErrorAction SilentlyContinue

foreach ($port in $ports) {
    $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($conn) {
        $processId = $conn.OwningProcess | Select-Object -Unique
        foreach ($pid in $processId) {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        }
    }
}

Write-Host "`n✓ Test run complete!" -ForegroundColor Green
Write-Host "==================================================================`n" -ForegroundColor Cyan
