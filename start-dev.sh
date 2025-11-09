#!/bin/bash

# IMPORTANT: need to have set .venv in backend already
# the command to create it is: cd backend && python3 -m venv .venv && cd ..

# Kill existing processes on ports 8000, 8002, and 8080
ports=(8000 8002 5173)
for port in "${ports[@]}"; do
    pids=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pids" ]; then
        echo -e "\033[0;33mKilling process(es) on port $port\033[0m"
        kill -9 $pids 2>/dev/null
    fi
done

# Start Backend, Chatbot, and Frontend

# Start backend server
echo -e "\033[0;32mStarting backend server...\033[0m"
osascript -e 'tell app "Terminal" to do script "cd '"$(pwd)"'/backend && source .venv/bin/activate && uv pip install -r requirements.txt && python main.py"'

# Wait a moment for backend to start
sleep 2

# Start chatbot server
echo -e "\033[0;32mStarting chatbot server...\033[0m"
osascript -e 'tell app "Terminal" to do script "cd '"$(pwd)"'/backend && source .venv/bin/activate && python chatbot_api.py"'

# Wait a moment for chatbot to start
sleep 2

# Start frontend dev server
echo -e "\033[0;32mStarting frontend dev server...\033[0m"
osascript -e 'tell app "Terminal" to do script "cd '"$(pwd)"'/frontend && npm run dev"'

echo -e "\n\033[0;33mAll servers are starting...\033[0m"
echo -e "\033[0;36mBackend: http://localhost:8000\033[0m"
echo -e "\033[0;36mChatbot: http://localhost:8002\033[0m"
echo -e "\033[0;36mFrontend: http://localhost:8080\033[0m"
echo -e "\033[0;36mAPI Docs: http://localhost:8000/docs\033[0m"
echo -e "\033[0;36mChatbot Docs: http://localhost:8002/docs\033[0m"
