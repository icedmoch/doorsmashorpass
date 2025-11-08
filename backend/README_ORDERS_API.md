# Orders API - Setup Complete ✅

## What Was Built

### 1. Database Schema (`init_orders_db.sql`)
- **`orders` table**: Stores order details (delivery location, time, status, nutritional totals)
- **`order_items` table**: Individual items in each order
- **Auto-calculation function**: `calculate_order_totals()` - sums up calories, protein, carbs, fat
- **Status flow**: pending → preparing → ready → out_for_delivery → delivered → completed

### 2. Orders API (`orders_api.py`)
Complete FastAPI application with 10 endpoints:
- `POST /orders` - Create order with items
- `GET /orders` - List all orders (with filters)
- `GET /orders/{order_id}` - Get specific order
- `PATCH /orders/{order_id}` - Update order details
- `PATCH /orders/{order_id}/status` - Update status
- `POST /orders/{order_id}/items` - Add item to order
- `DELETE /orders/{order_id}/items/{item_id}` - Remove item
- `DELETE /orders/{order_id}` - Cancel order
- `GET /users/{user_id}/orders` - Get user's orders
- `GET /docs` - Interactive API documentation

### 3. Test Scripts
- `prepare_test_order.py` - Generates test order with real food items
- `test_api.py` - Comprehensive test suite (13 tests covering all endpoints)
- `debug_supabase.py` - Database debugging tool
- `test_order.json` - Sample order payload (auto-generated)

### 4. Updated Documentation
- `CLAUDE.md` - Added complete Orders API documentation and testing instructions
- `requirements.txt` - Added supabase dependency

## Current State

✅ **Database**: Tables created in Supabase (orders, order_items)
✅ **API**: Running on http://localhost:8001 (background process)
✅ **Test Data**: Food items loaded, test user UUID obtained
⏳ **Next**: Run comprehensive tests

## How to Test

### Option 1: Run Automated Tests
```bash
cd backend
.venv/Scripts/python.exe test_api.py
```

This will test all endpoints automatically:
1. Create an order
2. Retrieve order by ID
3. List all orders
4. Get user's orders
5. Update order status (preparing → ready → out_for_delivery → delivered)
6. Update delivery details
7. Add items to order
8. Remove items from order
9. Cancel order
10. Verify all operations

### Option 2: Test Manually via Swagger UI
1. Open browser: http://localhost:8001/docs
2. Click on any endpoint to expand
3. Click "Try it out"
4. Fill in the request body (use `test_order.json` as reference)
5. Click "Execute"
6. See the response

### Option 3: Test with curl/Postman
```bash
# Create an order
curl -X POST http://localhost:8001/orders \
  -H "Content-Type: application/json" \
  -d @test_order.json

# Get all orders
curl http://localhost:8001/orders

# Get specific order
curl http://localhost:8001/orders/{order_id}
```

## Test User

**UUID**: `10fccccb-4f6c-4a8f-954f-1d88aafeaa37`
**Email**: `nkotturu@umass.edu`

## Sample Test Order Payload

The file `test_order.json` contains:
```json
{
  "user_id": "10fccccb-4f6c-4a8f-954f-1d88aafeaa37",
  "delivery_location": "Lewis Hall, 340, Thatcher Road, Amherst, Hampshire County, Massachusetts, 01003, United States",
  "delivery_time": "2025-11-08T12:00:00",
  "special_instructions": "Please leave at the front desk. No onions.",
  "items": [
    {"food_item_id": 1, "quantity": 1},  // BRK Brkfst Sausage Sandwich (406 cal)
    {"food_item_id": 2, "quantity": 2}   // Blueberry Scones (290 cal each)
  ]
}
```

## Expected Results

When you create an order, the API will:
1. ✅ Validate user exists in profiles
2. ✅ Validate food items exist in food_items table
3. ✅ Create the order with status "pending"
4. ✅ Create order_items with nutritional snapshots
5. ✅ Auto-calculate totals:
   - Total Calories: 986 (406 + 290 + 290)
   - Total Protein: 25.9g (17.9 + 4.0 + 4.0)
   - Total Carbs: ~120g
   - Total Fat: ~35g
6. ✅ Return complete order with all items

## Troubleshooting

### API Not Running?
```bash
cd backend
.venv/Scripts/python.exe orders_api.py
```

### User Not Found Error?
- The user UUID must exist in the `profiles` table
- Current test user: `10fccccb-4f6c-4a8f-954f-1d88aafeaa37`

### Food Items Not Found?
Run the calorie tracker setup:
```bash
cd calorie_tracker
.venv/Scripts/python.exe setup.py
```

### Database Connection Error?
Check `.env` file has:
```
SUPABASE_URL=https://btevtyamuxysdmenjsdi.supabase.co
SUPABASE_KEY=your_anon_key_here
```

## Next Steps After Testing

1. **Integrate with Frontend**: Connect Next.js to these API endpoints
2. **Add Authentication**: Integrate with Supabase Auth for user sessions
3. **Update AI Agent**: Modify `chatbot_api.py` to use real Orders API (currently uses mock)
4. **Add Pricing**: Extend order_items with price field
5. **Add Payment**: Integrate payment processing
6. **Real-time Updates**: Add WebSocket support for order status tracking

## API Documentation

Full interactive documentation available at:
- **Swagger UI**: http://localhost:8001/docs
- **ReDoc**: http://localhost:8001/redoc

## Files Created

```
backend/
├── orders_api.py              # Main Orders API (370 lines)
├── init_orders_db.sql         # Database schema
├── test_api.py                # Comprehensive test suite
├── prepare_test_order.py      # Test data generator
├── debug_supabase.py          # Database debugging
├── test_order.json            # Sample order payload
└── README_ORDERS_API.md       # This file
```

---

**Status**: ✅ Ready for Testing
**API URL**: http://localhost:8001
**Docs**: http://localhost:8001/docs
