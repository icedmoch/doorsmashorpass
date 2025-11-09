# 🤖 DoorSmash Chatbot API Integration Guide

## Overview

The DoorSmash AI Chatbot (v4.0.0) is now fully integrated with both the **Nutrition API** and **Orders API**, providing a comprehensive conversational interface for food ordering and nutrition tracking.

## 🚀 Quick Start

### 1. Start the Required Services

```bash
# Terminal 1: Start main API (includes nutrition and orders)
cd backend
python main.py
# Runs on port 8000

# Terminal 2: Start chatbot API
python chatbot_api.py
# Runs on port 8002
```

### 2. Configure Environment Variables

Create or update `.env` file:

```bash
# Required
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
GOOGLE_API_KEY=your_gemini_api_key

# Optional (defaults to localhost:8000)
NUTRITION_API_BASE=http://localhost:8000
ORDERS_API_BASE=http://localhost:8000
```

### 3. Test the Chatbot

```bash
# Run integration tests
python backend/test_chatbot_integration.py
```

## 📋 Chatbot Capabilities

### **1. Food Menu Search** (Original Feature)

Search dining hall menus by location, date, and meal type.

**Example Queries:**
- "What's available for lunch at Worcester today?"
- "Show me breakfast items at Berkshire"
- "Find all items with chicken on November 10, 2025"

**Tool:** `search_food_items`

### **2. Order Creation** (Original Feature)

Create food delivery orders with full details.

**Example Queries:**
- "I want to order Scrambled Eggs, deliver to Southwest Dorms"
- "Order the Spicy Deluxe Chicken Sandwich for ASAP delivery"
- "Create an order with French Fries and Fruit Salad"

**Tool:** `create_order`

**Required Information** (chatbot will ask if missing):
- Food items (from menu search)
- Delivery location
- Optional: delivery time, special instructions, dietary restrictions

### **3. Order Management** (NEW ✨)

Manage existing orders: update status, add/remove items, cancel.

**Example Queries:**
- "Show me my recent orders"
- "Update order #abc123 to 'out for delivery'"
- "Add French Fries to my order"
- "Remove item #xyz from my order"
- "Cancel my last order"

**Tools:**
- `get_my_orders` - View order history
- `get_order_details` - Get specific order details
- `update_order_status` - Change order status
- `add_item_to_order` - Add items to existing order
- `remove_item_from_order` - Remove items from order
- `cancel_order` - Cancel an order

**Valid Order Statuses:**
- `pending` (default)
- `preparing`
- `ready`
- `out_for_delivery`
- `delivered`
- `completed`
- `cancelled`

### **4. Nutrition Food Search** (NEW ✨)

Search the nutrition database for meal logging.

**Example Queries:**
- "Search nutrition database for chicken items"
- "Find French Fries in nutrition database"
- "Show available items for November 10, 2025"

**Tool:** `search_nutrition_food_items`

**Important Notes:**
- Use date format: `YYYY-MM-DD` (e.g., "2025-11-10" for November 10, 2025)
- Returns food item IDs needed for logging meals
- Different from order menu search (this is for nutrition tracking)

### **5. Meal Logging** (NEW ✨)

Log meals to your nutrition tracker with servings.

**Example Queries:**
- "Log Chicken Caesar Salad (ID: 49) as 1 serving for lunch"
- "Add 2 servings of French Fries to my dinner log"
- "Track the Spicy Deluxe Chicken Sandwich for today"

**Tool:** `log_meal_to_nutrition`

**Parameters:**
- `food_item_id` - From nutrition search results
- `servings` - Number of servings (default: 1.0)
- `meal_category` - "Breakfast", "Lunch", or "Dinner"
- `entry_date` - Optional (defaults to today)

### **6. Daily Nutrition Totals** (NEW ✨)

View your daily calorie and macro totals.

**Example Queries:**
- "What are my nutrition totals for today?"
- "Show me my calories and macros"
- "How much protein did I eat on November 8?"

**Tool:** `get_daily_nutrition_totals`

**Returns:**
- Total calories
- Protein, carbs, fat (grams)
- Sodium (mg)
- Dietary fiber (grams)
- Sugars (grams)
- Number of meals logged

### **7. Meal History** (NEW ✨)

Get your meal history for the past 1-30 days.

**Example Queries:**
- "Show me my meal history for this week"
- "What did I eat in the last 7 days?"
- "Give me a 14-day meal summary"

**Tool:** `get_meal_history`

**Returns:**
- Date-by-date breakdown
- Daily calorie and macro totals
- Number of meals per day

### **8. Nutrition Profile** (NEW ✨)

View your health metrics and nutrition goals.

**Example Queries:**
- "Show me my nutrition profile"
- "What's my TDEE and BMR?"
- "What are my fitness goals?"

**Tool:** `get_user_nutrition_profile`

**Returns:**
- Personal info (age, sex, height, weight)
- BMR (Basal Metabolic Rate)
- TDEE (Total Daily Energy Expenditure)
- Activity level
- Daily nutrition goals (calories, protein, carbs, fat)
- Dietary preferences

### **9. Profile Updates** (NEW ✨)

Update your health metrics and nutrition goals.

**Example Queries:**
- "Update my weight to 70 kg"
- "Set my daily calorie goal to 2200"
- "Change my activity level to 4"
- "Update my height to 175 cm"

**Tool:** `update_nutrition_profile`

**Updatable Fields:**
- `age` - Age in years
- `sex` - "Male", "Female", or "Other"
- `height_inches` - Height (stores in cm despite name)
- `weight_lbs` - Weight (stores in kg despite name)
- `activity_level` - 1 (sedentary) to 5 (very active)
- `goals` - Text description of fitness goals
- `goal_calories` - Daily calorie target

**Note:** BMR and TDEE are automatically recalculated when you update metrics.

## 🔗 Integration Pattern

### Auto-Log Orders to Nutrition Tracker

When a user creates an order, the chatbot will **ask** if they want to track it in their nutrition log.

**Example Flow:**
```
User: "Order the Chicken Caesar Salad for delivery"
Bot: [Creates order] "Order created! Would you like to log this to your nutrition tracker?"
User: "Yes"
Bot: [Logs meal] "✅ Meal logged successfully!"
```

**Implementation:** The chatbot is programmed to ask (not automatically log) as per your requirements.

## 📊 Database Schema Reference

### Food Items Table
- **Format:** Text dates like "Mon November 10, 2025"
- **Conversion:** API automatically converts from "YYYY-MM-DD" ✅
- **Columns:** id, name, location, meal_type, calories, protein, total_carb, total_fat, serving_size, date

### Sample Food Items (November 10, 2025)
| ID | Name | Location | Meal | Calories | Protein | Carbs | Fat |
|----|------|----------|------|----------|---------|-------|-----|
| 44 | French Fries | Berkshire | Lunch | 193 | 1.8g | 17.7g | 13.2g |
| 46 | Spicy Deluxe Fried Chicken Sandwich | Berkshire | Lunch | 539 | 27.6g | 40.1g | 31.0g |
| 48 | Buffalo Chicken Wrap | Berkshire | Lunch | 364 | 21.4g | 38.1g | 12.5g |
| 49 | Chicken Caesar Salad | Berkshire | Lunch | 107 | 15.3g | 5.3g | 2.4g |
| 50 | Fruit Salad | Berkshire | Lunch | 75 | 0.0g | 20.3g | 0.0g |

## 🧪 Testing

### Run Full Integration Test Suite

```bash
cd backend
python test_chatbot_integration.py
```

**Test Coverage:**
- ✅ Nutrition search (with November 10 data)
- ✅ Meal logging
- ✅ Daily nutrition totals
- ✅ Meal history
- ✅ Nutrition profile
- ✅ Order search
- ✅ Order creation
- ✅ Order management

### Manual Testing via API

```bash
# Test chatbot endpoint
curl -X POST http://localhost:8002/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Search for chicken items on November 10, 2025",
    "user_id": "10fccccb-4f6c-4a8f-954f-1d88aafeaa37"
  }'
```

### Check API Health

```bash
# Chatbot API
curl http://localhost:8002/

# Nutrition & Orders APIs
curl http://localhost:8000/
curl http://localhost:8000/health
```

## 🔧 Architecture

```
┌─────────────────┐
│   User Query    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│  Chatbot API (Port 8002)    │
│  - PydanticAI Agent         │
│  - Gemini 2.5 Flash         │
│  - 11 Agent Tools           │
└────────┬────────────────────┘
         │
         ├──────────────┬──────────────┐
         ▼              ▼              ▼
┌────────────┐  ┌──────────────┐  ┌──────────┐
│ Orders API │  │ Nutrition API│  │ Supabase │
│ (HTTP)     │  │ (HTTP)       │  │ (Direct) │
└────────────┘  └──────────────┘  └──────────┘
     │               │                  │
     └───────────────┴──────────────────┘
                     │
                     ▼
            ┌────────────────┐
            │ Supabase DB    │
            │ - food_items   │
            │ - orders       │
            │ - meal_entries │
            │ - profiles     │
            └────────────────┘
```

## 📝 Example Conversation Flows

### Flow 1: Complete Order with Nutrition Tracking

```
User: "What's available for lunch at Berkshire on Monday?"

Bot: 🍽️ Found 15 items for Mon November 10, 2025:
     1. French Fries (ID: 44)
        📍 Berkshire - Lunch
        🔥 193 cal | 💪 1.8g protein | 🍚 17.7g carbs | 🥑 13.2g fat
     [...]

User: "Order the Spicy Deluxe Fried Chicken Sandwich"

Bot: Great choice! The Spicy Deluxe Fried Chicken Sandwich has 539 cal
     and 27.6g protein. Where would you like this delivered?

User: "Baker Hall Room 304"

Bot: Can you share your current location? This helps our drivers find you faster.

User: "Yes, I'm at 42.3886, -72.5292"

Bot: Any dietary restrictions or special requests?

User: "No peanuts please"

Bot: When would you like delivery? ASAP or a specific time?

User: "ASAP"

Bot: ✅ Order created successfully!
     📦 Order ID: abc12345...
     📍 Delivery: Baker Hall Room 304
     🗺️ Coordinates: (42.3886, -72.5292)
     📝 Special Instructions: No peanuts please

     Would you like to log this to your nutrition tracker?

User: "Yes please"

Bot: ✅ Meal logged successfully!
     📝 Entry: Spicy Deluxe Fried Chicken Sandwich
     🍽️ Servings: 1
     📅 Category: Lunch
     📊 Nutritional Impact:
     - Calories: 539 kcal
     - Protein: 27.6g
     - Carbs: 40.1g
     - Fat: 31.0g
```

### Flow 2: Nutrition Profile & Goal Setting

```
User: "Show me my nutrition profile"

Bot: 👤 Nutrition Profile:
     📋 Basic Info:
     - Name: Test User
     - Age: 25
     - Sex: Male
     - Height: 175 cm
     - Weight: 70 kg

     📊 Metabolic Rates:
     - BMR: 1680 cal/day
     - TDEE: 2520 cal/day
     - Activity Level: 3/5

     🎯 Daily Goals:
     - Calories: 2200 kcal
     - Protein: 120g
     - Carbs: 250g
     - Fat: 70g

User: "Update my weight to 72 kg"

Bot: ✅ Profile updated successfully!
     Updated metrics:
     - BMR: 1710 cal/day
     - TDEE: 2565 cal/day

     Your body now burns approximately 2565 calories per day.
```

### Flow 3: Order Management

```
User: "Show me my orders"

Bot: 📦 Your Orders (3 total):
     ⏳ Order abc12345...
        Status: pending
        Items: 1
        Calories: 539 kcal
        Delivery: Baker Hall Room 304
        Created: 2025-11-08T14:30:00Z

User: "Update that order to 'preparing'"

Bot: ✅ Order status updated!
     Order ID: abc12345...
     New Status: preparing
     Delivery: Baker Hall Room 304
```

## 🚨 Common Issues & Solutions

### Issue: "Cannot connect to Chatbot API"
**Solution:** Make sure chatbot_api.py is running on port 8002
```bash
python backend/chatbot_api.py
```

### Issue: "No food items found for date"
**Solution:** Use YYYY-MM-DD format, not text dates
- ✅ Good: "2025-11-10"
- ❌ Bad: "Monday November 10"
- ❌ Bad: "Nov 10 2025"

### Issue: "Food item not found"
**Solution:** Search nutrition database first to get correct ID
```
User: "Search for chicken items on 2025-11-10"
Bot: [Shows results with IDs]
User: "Log item ID 49"
```

### Issue: "Order creation fails"
**Solution:** Provide all required information:
- Food item IDs (from menu search)
- Delivery location (text address)
- The chatbot will ask for missing info

### Issue: "Profile not found"
**Solution:** User needs to complete onboarding first
```
User: "Show my profile"
Bot: "❌ No nutrition profile found. User needs to complete onboarding."
```

## 🎯 Best Practices

1. **Search Before Ordering**
   - Always search menus first to get food item IDs
   - Use specific dates for accuracy

2. **Date Formats**
   - Orders: Use natural language ("Monday", "today")
   - Nutrition: Use YYYY-MM-DD format

3. **Meal Logging**
   - Search nutrition database (not order menus)
   - Get food_item_id from search results
   - Specify servings for accuracy

4. **Profile Management**
   - Update weight/height regularly for accurate TDEE
   - Set realistic nutrition goals
   - Activity level impacts TDEE calculation

5. **Order Management**
   - Track order IDs for updates
   - Use descriptive delivery locations
   - Add special instructions for dietary needs

## 📚 API Documentation

- **Chatbot API Docs:** http://localhost:8002/docs
- **Main API Docs:** http://localhost:8000/docs
- **Chatbot Info:** http://localhost:8002/
- **Health Check:** http://localhost:8000/health

## 🔐 Security Notes

- User authentication handled by Supabase
- All API calls use user_id for data isolation
- Chat history stored per user
- RLS (Row Level Security) enabled on Supabase tables

## 📞 Support

For issues or questions:
1. Check this guide
2. Run integration tests
3. Check API documentation
4. Review chatbot logs

---

**Version:** 4.0.0
**Last Updated:** November 8, 2025
**Model:** Google Gemini 2.5 Flash
**Integration:** Complete ✅
