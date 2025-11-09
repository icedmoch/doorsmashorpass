# 🤖 Chatbot + Orders API Integration Guide

## Overview

The DoorSmash AI Chatbot now has **full integration** with the Orders API, providing comprehensive order management capabilities through natural conversation. This integration allows users to:

- Browse dining hall menus
- Create orders through conversation
- View and manage all orders
- Track order history and statistics
- Update order status
- Add/remove items from orders
- Get insights and analytics

## Architecture

```
┌─────────────────┐
│   Frontend      │
│   (React)       │
└────────┬────────┘
         │
         ├──────────────┐
         │              │
┌────────▼────────┐  ┌──▼─────────────┐
│  Chatbot API    │  │  Orders API    │
│  (Port 8002)    │  │  (Port 8000)   │
└────────┬────────┘  └──┬─────────────┘
         │              │
         └──────┬───────┘
                │
         ┌──────▼──────┐
         │  Supabase   │
         │  Database   │
         └─────────────┘
```

## Features

### 1. Menu Browsing
- Search by dining hall, meal type, date
- View nutritional information
- Filter by dietary preferences

### 2. Order Creation
- Conversational order flow
- GPS location support
- Special instructions
- Delivery time scheduling
- Pickup/delivery options

### 3. Order Management
- View all orders with full details
- Filter by status (pending, preparing, ready, out_for_delivery, delivered, completed, cancelled)
- Get detailed order breakdown
- Update order status
- Add/remove items from existing orders
- Cancel orders

### 4. Analytics & Insights
- Order statistics (total orders, spending patterns)
- Favorite items tracking
- Nutritional trends
- Delivery preferences analysis
- Weekly/monthly summaries

## API Endpoints

### Chatbot API (Port 8002)

**Base URL:** `http://localhost:8002`

#### POST `/chat`
Send a message to the chatbot.

**Request:**
```json
{
  "message": "Show me my orders",
  "user_id": "uuid-here",
  "user_location": {
    "latitude": 42.3886,
    "longitude": -72.5292
  }
}
```

**Response:**
```json
{
  "response": "Your Orders (2 total):\n\nOrder #76eebcdf\n  Status: Pending\n  Items: 3\n  ..."
}
```

#### GET `/history/{user_id}`
Get chat history for a user.

#### DELETE `/history/{user_id}`
Clear chat history for a user.

## Available Chatbot Tools

The chatbot has access to the following tools for order management:

### Order Tools

1. **search_food_items** - Search dining hall menus
2. **create_order** - Create new orders
3. **get_my_orders** - List user's orders with filters
4. **get_order_details** - Get detailed order information
5. **update_order_status** - Change order status
6. **add_item_to_order** - Add items to existing order
7. **remove_item_from_order** - Remove items from order
8. **cancel_order** - Cancel an order
9. **get_order_statistics** - Get analytics and insights

### Nutrition Tools

10. **search_nutrition_food_items** - Search nutrition database
11. **log_meal_to_nutrition** - Log meals
12. **get_daily_nutrition_totals** - Get daily totals
13. **get_meal_history** - Get meal history
14. **get_user_nutrition_profile** - View profile
15. **update_nutrition_profile** - Update profile

## Example Conversations

### Creating an Order

```
User: I want to order breakfast

Bot: Let me show you what's available for breakfast today.
     Found 15 items:
     1. Scrambled Eggs (ID: 1234)
        Location: Berkshire - Breakfast
        110 cal | 10.6g protein | 2g carbs | 7g fat

User: I'll take the scrambled eggs

Bot: Great choice! The Scrambled Eggs have 110 cal and 10.6g protein. 
     Where would you like this delivered?

User: Southwest Dorms

Bot: Perfect! Can you share your current location? This helps our 
     drivers find you faster. (It's optional if you prefer not to)

User: latitude 42.3886, longitude -72.5292

Bot: Thanks! Any dietary restrictions or special requests?

User: No peanuts please

Bot: Got it! When would you like delivery? ASAP or a specific time?

User: ASAP

Bot: Perfect! Here's your order summary:
     Items: Scrambled Eggs x1
     Delivery: Southwest Dorms (GPS: 42.3886, -72.5292)
     Special Instructions: No peanuts
     Total: 110 cal | 10.6g protein
     
     Should I place this order?

User: Yes

Bot: Order created successfully!
     Order ID: abc12345
     Status: pending
     ...
```

### Viewing Order History

```
User: Show me all my orders

Bot: Your Orders (5 total):

     Order #abc12345
       Status: Delivered
       Items: 2
         - Scrambled Eggs x1
         - Toast x2
       Nutrition: 320 cal | 15g protein | 45g carbs | 8g fat
       Delivery: Southwest Dorms (GPS: 42.3886, -72.5292)
       Created: 2025-11-09 08:30
     
     Order #def67890
       Status: Pending
       Items: 1
       ...
```

### Getting Analytics

```
User: Show me my order statistics

Bot: Order Statistics (Last 30 days)

     OVERVIEW:
     Total Orders: 15
     Active Orders: 2
     Completed Orders: 12
     Cancelled Orders: 1

     DELIVERY PREFERENCES:
     Delivery: 10 orders (66.7%)
     Pickup: 5 orders (33.3%)

     NUTRITIONAL SUMMARY:
     Total Calories Consumed: 8,450 kcal
     Total Protein Consumed: 425.5g
     Average Calories per Order: 704 kcal

     YOUR FAVORITE ITEMS:
       1. Scrambled Eggs - ordered 8 times
       2. Grilled Chicken - ordered 6 times
       3. Caesar Salad - ordered 5 times
       4. Brown Rice - ordered 4 times
       5. Salmon - ordered 3 times

     INSIGHTS:
     - You've completed 12 orders successfully
     - Average order nutrition: 704 cal
     - You prefer delivery orders
     - You might want to track some of these meals in your nutrition log!
```

## Testing

### Run Comprehensive Integration Tests

```powershell
cd backend
python test_chatbot_orders_integration.py
```

This runs a suite of 10 comprehensive tests:

1. ✅ Search and view menu
2. ✅ Create order through conversation
3. ✅ View order details
4. ✅ List all orders
5. ✅ Filter orders by status
6. ✅ Order statistics and insights
7. ✅ Update order status
8. ✅ Add item to order
9. ✅ Comprehensive conversation flow
10. ✅ Data consistency verification

### Manual Testing

**Start the servers:**

```powershell
# Terminal 1: Start backend (Orders API + Nutrition API)
cd backend
python main.py

# Terminal 2: Start Chatbot API
cd backend
python chatbot_api.py

# Terminal 3: Start frontend
cd frontend
npm run dev
```

**Test with curl:**

```powershell
# Test chatbot endpoint
$body = @{
    message = "Show me my orders"
    user_id = "your-user-id-here"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:8002/chat -Method POST -Body $body -ContentType "application/json"
```

## Database Schema

### Orders Table
```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    delivery_location TEXT NOT NULL,
    delivery_latitude FLOAT,
    delivery_longitude FLOAT,
    delivery_time TIMESTAMPTZ,
    special_instructions TEXT,
    delivery_option TEXT DEFAULT 'delivery',
    status TEXT DEFAULT 'pending',
    total_calories INT DEFAULT 0,
    total_protein NUMERIC DEFAULT 0,
    total_carbs NUMERIC DEFAULT 0,
    total_fat NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Order Items Table
```sql
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id),
    food_item_id BIGINT REFERENCES food_items(id),
    food_item_name TEXT NOT NULL,
    quantity INT DEFAULT 1,
    calories INT,
    protein NUMERIC,
    carbs NUMERIC,
    fat NUMERIC,
    dining_hall TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Chat History Table
```sql
CREATE TABLE chat_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    role TEXT CHECK (role IN ('user', 'assistant', 'system')),
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Row Level Security (RLS)

The integration respects Supabase RLS policies:

### Orders Table
- ✅ Users can view their own orders
- ✅ Users can create orders
- ✅ Users can update their own orders
- ✅ Deliverers can view/update orders they're delivering
- ✅ Anyone can view available deliveries

### Order Items Table
- ✅ Anyone can view order items (for menu browsing)
- ✅ Authenticated users can insert order items

### Chat History Table
- ✅ Users can view their own chat history
- ✅ Users can delete their own chat history
- ✅ Service role has full access

## Environment Variables

Add to your `.env` file:

```env
# Supabase
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-key

# AI
GOOGLE_API_KEY=your-gemini-api-key

# API Base URLs (optional)
NUTRITION_API_BASE=http://localhost:8000
ORDERS_API_BASE=http://localhost:8000
```

## Troubleshooting

### Chatbot not responding
- Check if chatbot API is running on port 8002
- Verify Google API key is set
- Check terminal for errors

### Orders not showing
- Verify user_id is correct
- Check RLS policies in Supabase
- Ensure orders exist in database

### Connection errors
- Make sure all services are running:
  - Main API (port 8000)
  - Chatbot API (port 8002)
  - Frontend (port 5173)
- Check Supabase connection

### Testing failures
- Ensure test user exists in database
- Check that food items are seeded
- Verify all APIs are accessible

## Performance Considerations

1. **Chat History Limit**: Limited to last 10 messages for context
2. **Order Queries**: Optimized with indexes on user_id and created_at
3. **Statistics**: Limited to 100 most recent orders
4. **Caching**: Consider implementing Redis for frequently accessed data

## Security Best Practices

1. **Authentication**: Always pass user tokens for authenticated requests
2. **RLS**: Leverage Supabase RLS for data isolation
3. **Input Validation**: All inputs validated by Pydantic models
4. **Rate Limiting**: Consider implementing rate limits on chat endpoint
5. **API Keys**: Never expose API keys in frontend

## Future Enhancements

- [ ] Real-time order status updates via WebSocket
- [ ] Voice ordering support
- [ ] Multi-language support
- [ ] Order recommendations based on history
- [ ] Integration with payment systems
- [ ] Push notifications for order status
- [ ] Group ordering capabilities
- [ ] Schedule recurring orders

## Support

For issues or questions:
1. Check the test output for specific errors
2. Review Supabase logs
3. Check API server logs
4. Verify database schema matches documentation

## License

This integration is part of the DoorSmash project.
