# Next Steps - Orders API & Frontend Integration

## Current Status

**Working:**
- ✅ Core nutrition features (search, log meals, daily totals, profile)
- ✅ Both APIs running (Main: 8000, Chatbot: 8002)
- ✅ Chat history persistence (RLS disabled)
- ✅ Format compatibility fixed for nutrition endpoints

**Remaining Issues:**
- ❌ Orders API tools have emojis (causing 500 errors)
- ❌ Meal history tool has emojis
- ❌ Frontend not integrated yet

---

## Step 1: Remove Remaining Emojis from Orders Tools

**File:** `backend/chatbot_api.py`

### Tools to Fix:

**1. `get_meal_history_week` (around line 755)**
Search for emojis like 📊, 🔥, 💪 and remove them. Replace with plain text.

**2. `list_orders` (around line 512)**
```python
# Find and replace:
📦 → "Order"
⏳ → "pending" / ✅ → "completed"
📍 → "Location:"
🍽️ → "Items:"
```

**3. `get_order_details` (around line 556)**
```python
# Find and replace:
📦 → "Order Details:"
⏳/✅ → status text
📍 → "Delivery:"
🍽️ → "Items:"
📊 → "Nutritional Totals:"
```

### Quick Fix Command:
```bash
# Search for all remaining emojis
cd backend
grep -n "[😔🍽️📍🔥💪🍚🥑📦⏳✅🗺️🚗📝📊🎉]" chatbot_api.py

# Edit each line and replace emojis with plain text
```

---

## Step 2: Test Orders API Integration

**Run after fixing emojis:**

```bash
cd backend
.venv\Scripts\python.exe test_chatbot_nutrition_comprehensive.py
```

**Expected Results:**
- Test 7: Search Food Items for Ordering - PASS
- Test 8: Create Order with Location - PASS
- Test 9: Conversational Flow - PASS

---

## Step 3: Frontend Integration

### Backend Setup (Already Done)
- Main API: http://localhost:8000
- Chatbot API: http://localhost:8002

### Frontend Changes Needed

**File:** `frontend/src/lib/api.ts`

Add chatbot endpoint:
```typescript
// Chatbot API
const CHATBOT_API_URL = 'http://localhost:8002';

export async function sendChatMessage(
  message: string,
  userId: string,
  userLocation?: { latitude: number; longitude: number }
): Promise<{ response: string }> {
  const response = await fetch(`${CHATBOT_API_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      user_id: userId,
      user_location: userLocation
    })
  });

  if (!response.ok) {
    throw new Error(`Chatbot error: ${response.statusText}`);
  }

  return response.json();
}
```

### Frontend Component

**Create:** `frontend/src/components/Chatbot.tsx`

```typescript
import { useState } from 'react';
import { sendChatMessage } from '@/lib/api';

export function Chatbot({ userId }: { userId: string }) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;

    const userMsg = { role: 'user', content: message };
    setMessages(prev => [...prev, userMsg]);
    setMessage('');
    setLoading(true);

    try {
      const response = await sendChatMessage(message, userId);
      setMessages(prev => [...prev, { role: 'assistant', content: response.response }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] border rounded-lg">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] rounded-lg p-3 ${
              msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && <div className="text-gray-500">Thinking...</div>}
      </div>

      {/* Input area */}
      <div className="border-t p-4 flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about nutrition, meals, or order food..."
          className="flex-1 border rounded px-3 py-2"
        />
        <button
          onClick={handleSend}
          disabled={loading || !message.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
```

### Add to Page

**File:** `frontend/src/pages/Nutrition.tsx` or create new `frontend/src/pages/Chat.tsx`

```typescript
import { Chatbot } from '@/components/Chatbot';

export default function ChatPage() {
  const userId = "10fccccb-4f6c-4a8f-954f-1d88aafeaa37"; // Get from auth context

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">AI Assistant</h1>
      <Chatbot userId={userId} />
    </div>
  );
}
```

---

## Step 4: Testing Full Integration

### Test Chatbot Features

**1. Nutrition Search:**
```
User: "Show me chicken items for November 11, 2025"
Expected: List of chicken items with nutrition data
```

**2. Log Meal:**
```
User: "Log Big Mack Burger (ID 68) for lunch"
Expected: Meal logged with nutrition breakdown
```

**3. Get Totals:**
```
User: "What are my nutrition totals for today?"
Expected: Full breakdown of calories, protein, carbs, fat
```

**4. View Profile:**
```
User: "Show me my nutrition profile"
Expected: Age, height (99.8 inches/253.5 cm), weight (250 lbs/113.4 kg), BMR, TDEE
```

**5. Update Profile:**
```
User: "Update my activity level to 3"
Expected: Profile updated with new TDEE calculation
```

**6. Order Food:**
```
User: "I want to order a burger for delivery to room 123"
Expected: Order created with ID and nutrition totals
```


---

## Quick Reference

### API Endpoints

**Main API (8000):**
- `GET /api/nutrition/food-items/search?q={query}&date={date}` - Search food
- `POST /api/nutrition/meals` - Log meal
- `GET /api/nutrition/totals/user/{user_id}/today` - Daily totals
- `GET /api/nutrition/profiles/{user_id}` - Get profile
- `PATCH /api/nutrition/profiles/{user_id}` - Update profile

**Chatbot API (8002):**
- `POST /chat` - Send message to chatbot
  ```json
  {
    "message": "Your question here",
    "user_id": "uuid",
    "user_location": { "latitude": 42.3, "longitude": -72.6 }
  }
  ```

### User ID for Testing
```
10fccccb-4f6c-4a8f-954f-1d88aafeaa37
```

### Test Food Item IDs
- 68: Big Mack Burger (551 cal)
- 55: Blueberry Yogurt Parfait (285 cal)

---

## Common Issues & Solutions

**Issue:** 500 error from chatbot
**Solution:** Check for emojis in response, remove them

**Issue:** "Profile not found"
**Solution:** Ensure user profile exists in database

**Issue:** RLS policy blocking inserts
**Solution:** RLS is disabled for now, re-enable with proper policies for production

**Issue:** Chat history not persisting
**Solution:** Check Supabase connection and RLS status

**Issue:** Unit conversion wrong
**Solution:** Verify using cm/kg for storage, convert to inches/lbs for display

---

**Status:** Ready for orders API emoji cleanup and frontend integration
**Est. Time:** 30-60 minutes for remaining fixes
**Tools Used:** Supabase MCP, Context7 MCP, PydanticAI, Gemini 2.5 Flash
