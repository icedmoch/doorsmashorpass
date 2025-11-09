# Start Backend and Frontend

# Start backend server
Write-Host "Starting backend server..." -ForegroundColor Green
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd backend; python main.py"

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start frontend dev server
Write-Host "Starting frontend dev server..." -ForegroundColor Green
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "`nBoth servers are starting..." -ForegroundColor Yellow
Write-Host "Backend: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
