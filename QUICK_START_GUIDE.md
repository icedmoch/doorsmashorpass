# Quick Start Guide - DoorSmashOrPass

## 🚀 Start All Services

### Option 1: PowerShell Script (Recommended)
```powershell
.\start-dev.ps1
```

### Option 2: Manual Start

**Terminal 1 - Main API:**
```powershell
cd backend
python main.py
```

**Terminal 2 - Chatbot API:**
```powershell
cd backend
python chatbot_api.py
```

**Terminal 3 - Frontend:**
```powershell
cd frontend
npm run dev
```

## 🌐 Access Points

- **Frontend:** http://localhost:5173
- **Chatbot Page:** http://localhost:5173/chatbot
- **Main API Docs:** http://localhost:8000/docs
- **Chatbot API Docs:** http://localhost:8002/docs

## 🧪 Test the Chatbot

### 1. Open Chatbot Page
Navigate to: http://localhost:5173/chatbot

### 2. Sign In
Use your Supabase credentials or test user:
- User ID: `10fccccb-4f6c-4a8f-954f-1d88aafeaa37`

### 3. Try These Commands

#### Nutrition Queries
```
Show me chicken items for November 11, 2025
What are my nutrition totals for today?
Show me my nutrition profile
Log Big Mack Burger (ID 68) for lunch
Show my meal history for the past 7 days
Update my activity level to 3
```

#### Order Queries
```
I want to order a burger
Show my orders
What's the status of my order?
Search for breakfast items at Berkshire
```

#### Conversational
```
What's for lunch today?
Find high protein meals
Help me track my calories
What are healthy options?
```

## 🎤 Voice Features

1. **Voice Input:** Click the microphone icon to speak your query
2. **Voice Output:** Click the speaker icon on any assistant message to hear it

## 📊 Features Available

### Nutrition Tracking
- ✅ Search 1000+ dining hall food items
- ✅ Log meals with servings
- ✅ View daily nutrition totals
- ✅ Track meal history (7-30 days)
- ✅ Manage nutrition profile (BMR, TDEE, goals)

### Food Ordering
- ✅ Browse dining hall menus by date/location
- ✅ Create orders with delivery tracking
- ✅ View order history
- ✅ Update order status
- ✅ Add/remove items from orders

### AI Assistant
- ✅ Natural language understanding
- ✅ Conversational context
- ✅ Voice input/output (ElevenLabs)
- ✅ Location-aware features
- ✅ Personalized recommendations

## 🔧 Troubleshooting

### Chatbot Not Responding
1. Check if both APIs are running (ports 8000 and 8002)
2. Verify Supabase connection in `.env`
3. Check Google API key for Gemini
4. Clear browser cache and reload

### Voice Not Working
1. Grant microphone permissions in browser
2. Check ElevenLabs API key in `.env`
3. Ensure HTTPS or localhost (required for microphone access)

### Database Errors
1. Verify Supabase credentials in `.env`
2. Check if user profile exists
3. Ensure RLS policies are disabled for testing

### Port Already in Use
```powershell
# Find process using port 8000
netstat -ano | findstr :8000

# Kill process (replace PID)
taskkill /PID <PID> /F
```

## 📝 Environment Variables

### Backend `.env`
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
GOOGLE_API_KEY=your_gemini_api_key
ELEVENLABS_API_KEY=your_elevenlabs_key
```

### Frontend `.env`
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:8000
VITE_CHATBOT_API_URL=http://localhost:8002
VITE_ELEVENLABS_API_KEY=your_elevenlabs_key
```

## 🎯 Test Food Item IDs

Use these for quick testing:
- **68:** Big Mack Burger (551 cal, 29.6g protein)
- **55:** Blueberry Yogurt Parfait (285 cal, 7.3g protein)

## 📅 Test Dates

Available menu dates:
- November 11, 2025 (Mon November 11, 2025)
- November 10, 2025 (Sun November 10, 2025)
- November 9, 2025 (Sat November 09, 2025)

## 🔗 API Endpoints Quick Reference

### Nutrition API (Port 8000)
- `GET /api/nutrition/food-items/search?q={query}&date={date}`
- `POST /api/nutrition/meals`
- `GET /api/nutrition/totals/user/{user_id}/today`
- `GET /api/nutrition/profiles/{user_id}`
- `PATCH /api/nutrition/profiles/{user_id}`

### Chatbot API (Port 8002)
- `POST /chat` - Send message to AI assistant
- `GET /history/{user_id}` - Get chat history
- `DELETE /history/{user_id}` - Clear chat history

## 💡 Tips

1. **Use Suggestions:** Click the suggestion chips for quick queries
2. **Be Specific:** Include dates, locations, or meal types for better results
3. **Voice Commands:** Speak naturally, the AI understands context
4. **Order Flow:** The chatbot will ask follow-up questions to complete orders
5. **Nutrition Tracking:** Log meals immediately after ordering for accurate tracking

## 🎉 You're Ready!

The application is fully functional. Start chatting with the AI assistant to:
- Find and order food from UMass dining halls
- Track your nutrition and reach your health goals
- Get personalized dietary recommendations
- Manage your meal history and orders

Enjoy using DoorSmashOrPass! 🍽️
