# Start Backend, Chatbot, and Frontend

# Start backend server
Write-Host "Starting backend server..." -ForegroundColor Green
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd backend; uv venv; .venv\Scripts\activate; uv pip install -r requirements.txt; python main.py"

# Wait a moment for backend to start
Start-Sleep -Seconds 2

# Start chatbot server
Write-Host "Starting chatbot server..." -ForegroundColor Green
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd backend; .venv\Scripts\activate; python chatbot_api.py"

# Wait a moment for chatbot to start
Start-Sleep -Seconds 2

# Start frontend dev server
Write-Host "Starting frontend dev server..." -ForegroundColor Green
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "`nAll servers are starting..." -ForegroundColor Yellow
Write-Host "Backend: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Chatbot: http://localhost:8002" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "Chatbot Docs: http://localhost:8002/docs" -ForegroundColor Cyan
