# 🧪 Chatbot Nutrition API Testing Guide

## ✅ What's Been Done

1. **Fixed merge conflict** in `chatbot_api.py` using modern FastAPI lifespan approach
2. **Verified Supabase database** - All tables exist and have data:
   - ✅ `food_items` - 755 items with nutrition data
   - ✅ `meal_entries` - Ready for meal logging
   - ✅ `profiles` - 7 user profiles
   - ✅ `chat_history` - 52 chat messages
   - ✅ `orders` & `order_items` - Order management ready
3. **Created comprehensive test suite** at `backend/test_chatbot_nutrition_comprehensive.py`

## 🚀 How to Test

### Step 1: Start All Services

Open PowerShell and run:

```powershell
.\start-dev.ps1
```

This will start:
- **Backend API** on http://localhost:8000
- **Chatbot API** on http://localhost:8002
- **Frontend** on http://localhost:5173

Wait about 10 seconds for all services to fully start.

### Step 2: Run Comprehensive Tests

Open a **new PowerShell window** and run:

```powershell
cd backend
.\.venv\Scripts\activate
python test_chatbot_nutrition_comprehensive.py
```

## 📋 What the Tests Cover

The test suite will verify **10 key features**:

### 1. **Search Nutrition Food Items**
- Tests date filtering (YYYY-MM-DD format)
- Tests specific food search (e.g., "burger")

### 2. **Log Meal to Nutrition Tracker**
- Tests meal logging with servings
- Verifies nutritional data is returned

### 3. **Get Daily Nutrition Totals**
- Tests retrieving today's calories, protein, carbs, fat
- Verifies meal count is included

### 4. **Get Meal History**
- Tests 7-day meal history retrieval
- Verifies daily totals are calculated

### 5. **Get Nutrition Profile**
- Tests profile retrieval with BMR/TDEE
- Verifies health metrics and goals

### 6. **Update Nutrition Profile**
- Tests profile updates (e.g., weight change)
- Verifies automatic BMR/TDEE recalculation

### 7. **Search Food Items for Ordering**
- Tests order menu search
- Verifies nutrition info is included in results

### 8. **Create Order with GPS Location**
- Tests order creation with coordinates
- Verifies location data is captured

### 9. **Conversational Flow**
- Tests multi-turn conversation
- Verifies context is maintained

### 10. **Error Handling**
- Tests graceful error messages
- Verifies invalid IDs are handled properly

## 🎯 Expected Results

You should see output like:

```
================================================================================
  CHATBOT NUTRITION API - COMPREHENSIVE TEST SUITE
================================================================================
  Test User: 10fccccb-4f6c-4a8f-954f-1d88aafeaa37
  Test Date: Tue November 11, 2025 (2025-11-11)
  Chatbot API: http://localhost:8002
  Main API: http://localhost:8000
================================================================================

================================================================================
  TEST: API Health Check
================================================================================
✅ PASS - Chatbot API (http://localhost:8002)
   Model: google-gla:gemini-2.5-flash
   Version: 4.0.0
✅ PASS - Main API (http://localhost:8000)

================================================================================
  TEST: Test 1: Search Nutrition Food Items
================================================================================
✅ PASS - Search with date filter
   Response preview: 🔍 Found 17 nutrition items:...
✅ PASS - Search for specific food
   Response preview: ...Big Mack Burger...

... (more tests)

================================================================================
  TEST SUITE COMPLETE
================================================================================

✅ All tests executed. Review results above for any failures.
```

## 🔧 Database Test Data Available

Your database has menu data for these dates:
- **Tue November 11, 2025** (multiple dining halls)
- **Wed November 12, 2025**
- **Tue November 18, 2025**
- **Wed November 19, 2025**

Sample food items from **Berkshire Lunch** on Nov 11:
- ID 67: Aloo Gobi (51 cal, 1.6g protein)
- ID 68: Big Mack Burger (551 cal, 29.6g protein)
- ID 69: Butter Chicken Rasoi (167 cal, 10.8g protein)
- ID 70: Chana Masala Rasoi (167 cal, 7.9g protein)
- ID 71: French Fries (193 cal, 1.8g protein)

Test user ID: `10fccccb-4f6c-4a8f-954f-1d88aafeaa37`

## 🐛 Troubleshooting

### "Cannot connect to APIs"
- Make sure `start-dev.ps1` is still running
- Check that ports 8000 and 8002 are not blocked
- Wait 10-15 seconds after starting for APIs to fully initialize

### "Food item not found"
- The test uses date `2025-11-11` which has data
- Make sure main API is connected to Supabase
- Check `.env` file has correct `SUPABASE_URL` and `SUPABASE_KEY`

### "Profile not found"
- The test user `10fccccb-4f6c-4a8f-954f-1d88aafeaa37` exists in your DB
- If you want to test with your own user, update `TEST_USER_ID` in the test file

### Tests are slow
- This is normal - the chatbot uses Gemini AI which can take 3-10 seconds per response
- Total test suite takes ~2-5 minutes

## 📊 Manual Testing via Frontend

After automated tests pass, you can test manually:

1. **Open Frontend**: http://localhost:5173
2. **Navigate to Chatbot** page
3. **Try these queries**:

```
"Search for chicken items on 2025-11-11"
"Log food item ID 68 for lunch"
"What are my nutrition totals for today?"
"Show my meal history"
"Show my nutrition profile"
"Update my weight to 75 kg"
```

## ✅ Success Criteria

The chatbot integration is working correctly if:

1. ✅ All 10 automated tests pass
2. ✅ Chatbot responds with relevant nutrition data
3. ✅ Meals are logged to database correctly
4. ✅ Daily totals are calculated accurately
5. ✅ Profile updates trigger BMR/TDEE recalculation
6. ✅ Frontend chatbot component displays responses properly
7. ✅ No errors in API console logs

## 📝 Next Steps After Testing

Once all tests pass:

1. **Test Frontend Integration** - Use the chatbot UI to verify end-to-end flow
2. **Check Supabase Data** - Verify meals are being logged in `meal_entries` table
3. **Review Security** - Check that advisors show no critical issues
4. **Deploy to Production** - Use your deployment process

## 🎉 Current Status

- ✅ Chatbot API code fixed (lifespan approach)
- ✅ Database schema verified
- ✅ Test data confirmed
- ✅ Comprehensive test suite created
- ⏳ **Ready for testing** - Run the tests now!

---

**Need Help?** Check the console output for detailed error messages and response previews.
