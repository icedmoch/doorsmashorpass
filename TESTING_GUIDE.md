# Testing Guide - Student Eats AI

## Quick Status Check ✅

### Backend Status
- ✅ **Running**: Backend server is live on `http://localhost:8000`
- ✅ **Database**: 500 food items available in Supabase
- ✅ **APIs**: Nutrition API and Orders API fully functional

### What Was Fixed
1. **Menu Search** - Fixed React Hook dependency issues:
   - Converted `fetchFoodItems` to `useCallback` with proper dependencies
   - Wrapped `diningHalls` array in `useMemo` to prevent re-renders
   - Added console.logs for debugging

2. **Nutrition Add Meal** - Added detailed logging:
   - Added console.logs throughout `handleAddMeal` function
   - Tracks each step: user auth, food creation, meal entry

## How to Test the Fixes

### 1. Start the Servers

**Backend** (if not running):
```powershell
cd c:\Users\yzkrm\Desktop\Github\student-eats-ai\backend
python main.py
```

**Frontend**:
```powershell
cd c:\Users\yzkrm\Desktop\Github\student-eats-ai\frontend
npm run dev
```

### 2. Test Menu Search

1. Open frontend at `http://localhost:5173`
2. Navigate to **Menu** page
3. Open browser DevTools (F12) → Console tab
4. Try searching for food:
   - Type "chicken" in search box
   - Watch console logs:
     ```
     Searching for: chicken
     Fetched items: X
     Filtered items: X
     ```
5. Select different dining halls to filter results

**Expected Behavior**:
- Search results update as you type
- Console shows search queries and item counts
- No infinite loops or React Hook warnings

### 3. Test Add Meal (Nutrition Page)

1. Navigate to **Nutrition** page
2. Click **Add Meal** button
3. Open browser DevTools (F12) → Console tab
4. Fill in meal form:
   - Name: "Test Meal"
   - Calories: "300"
   - Protein: "25"
   - Carbs: "30"
   - Fat: "10"
5. Click **Add Meal**
6. Watch console logs:
   ```
   🍽️ Starting handleAddMeal...
   Form data: {name: "Test Meal", calories: "300", ...}
   ✅ User authenticated: <user-id>
   📅 Current date: 2024-01-XX
   🍔 Creating food item...
   ✅ Food item created: {id: ..., name: "Test Meal", ...}
   📝 Creating meal entry...
   ✅ Meal entry created!
   ```

**Expected Behavior**:
- Toast notification: "Meal added!"
- Dialog closes
- Meal appears in your nutrition log
- Total calories update

### 4. Test API Endpoints Directly

Run the test script:
```powershell
cd c:\Users\yzkrm\Desktop\Github\student-eats-ai\backend
python test_endpoints.py
```

**Expected Output**:
```
🧪 Testing GET /...
Status: 200
Response: {'message': 'Student Eats API', ...}

🧪 Testing GET /api/nutrition/food-items...
Status: 200
✅ Found 5 items
   Sample: Grilled Chicken Breast

🧪 Testing GET /api/nutrition/food-items/search...
Status: 200
✅ Found X items matching 'chicken'
   - Chicken Breast
   - Chicken Stir Fry
   - ...
```

## Common Issues & Solutions

### Issue: Backend not responding
**Solution**: Check if server is running
```powershell
# Should show: "Uvicorn running on http://0.0.0.0:8000"
curl http://localhost:8000
```

### Issue: No food items in Menu
**Possible Causes**:
1. Database connection issue - check backend `.env` file
2. API call failing - check browser Network tab (F12)
3. CORS issue - backend should have `allow_origins=["*"]`

**Debug Steps**:
1. Open browser console
2. Look for error messages
3. Check Network tab for failed requests
4. Verify `VITE_API_URL=http://localhost:8000` in `frontend/.env.local`

### Issue: Add Meal not working
**Debug Steps**:
1. Open browser console
2. Click "Add Meal"
3. Look for console logs with emoji icons (🍽️, ✅, ❌)
4. If you see ❌ error, check the error message
5. Common issues:
   - Not logged in → Redirect to auth page
   - Missing form fields → Fill all required fields
   - API connection issue → Check backend is running

### Issue: Search not working
**Debug Steps**:
1. Open browser console
2. Type in search box
3. Look for logs: "Searching for: <query>"
4. Check "Fetched items: X" count
5. If count is 0, backend may be empty or API failing

## Debugging Tips

### Enable Verbose Logging

**Frontend** - Already added:
- Menu.tsx: logs search queries and item counts
- Nutrition.tsx: logs each step of adding a meal

**Backend** - Check FastAPI logs:
- Terminal shows all incoming requests
- Look for 404, 500 errors
- Check stack traces for issues

### Browser DevTools

**Console Tab** (F12):
- Shows all console.log() messages
- Red errors indicate failures
- Yellow warnings are usually safe

**Network Tab** (F12):
- Click "Fetch/XHR" filter
- See all API calls
- Check status codes (200 = success, 404 = not found, 500 = server error)
- Click request to see response data

**React DevTools**:
- Install React DevTools extension
- Inspect component state
- Check useEffect dependencies

## What's Next?

Once both features are working:
1. Test full user flow: Browse Menu → Add to Cart → Checkout
2. Test nutrition tracking: Add Meal → View totals → Delete meal
3. Test order flow: Create order → View in Order History
4. Consider removing console.logs if everything works

## Need Help?

If issues persist:
1. Share browser console output
2. Share backend terminal output
3. Share any error messages
4. Describe what you tried
