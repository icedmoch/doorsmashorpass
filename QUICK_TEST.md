# 🚀 Quick Start - Test Your Fixes

## Start Servers

**Terminal 1 - Backend**:
```powershell
cd c:\Users\yzkrm\Desktop\Github\student-eats-ai\backend
python main.py
```
✅ Should see: `Uvicorn running on http://0.0.0.0:8000`

**Terminal 2 - Frontend**:
```powershell
cd c:\Users\yzkrm\Desktop\Github\student-eats-ai\frontend
npm run dev
```
✅ Should see: `Local: http://localhost:5173/`

---

## Test Menu Search 🔍

1. Open `http://localhost:5173`
2. Go to **Menu** page
3. Open DevTools (F12) → **Console** tab
4. Type "chicken" in search box
5. ✅ Should see logs:
   ```
   Searching for: chicken
   Fetched items: X
   Filtered items: X
   ```

---

## Test Add Meal ➕

1. Go to **Nutrition** page
2. Click **Add Meal** button
3. DevTools should already be open → **Console** tab
4. Fill in form and click Add
5. ✅ Should see logs:
   ```
   🍽️ Starting handleAddMeal...
   ✅ User authenticated: ...
   🍔 Creating food item...
   ✅ Food item created: ...
   📝 Creating meal entry...
   ✅ Meal entry created!
   ```

---

## Common Issues

| Issue | Solution |
|-------|----------|
| Backend won't start | Check if port 8000 is in use |
| Frontend won't start | Check if port 5173 is in use |
| No food items | Backend not connected, check `.env` |
| Can't add meal | Make sure you're logged in |
| Search not working | Check console for errors |

---

## What Was Fixed

✅ **Menu Search**: Fixed React Hook dependencies  
✅ **Add Meal**: Added detailed console logging

---

## Need More Help?

📖 See **TESTING_GUIDE.md** for detailed instructions  
🐛 See **BUG_FIXES.md** for technical details  
📡 See **API_INTEGRATION.md** for API documentation

---

**Backend**: ✅ Running (Terminal ID: c059a4fc-cfdf-4f1b-afbb-067b398d9b69)  
**Database**: ✅ 500 food items available  
**Status**: 🎯 Ready for testing!
