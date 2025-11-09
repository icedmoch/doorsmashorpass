# StudentEats API Integration Guide

This document describes the integration between the backend FastAPI services and the React frontend.

## Architecture Overview

The application uses a **client-server architecture** with:
- **Backend**: FastAPI (Python) running on port 8000
- **Frontend**: React + Vite running on port 5173
- **Database**: Supabase (PostgreSQL)

## Backend Setup

### 1. Environment Configuration

Create a `.env` file in the `backend/` directory:

```env
SUPABASE_URL=https://btevtyamuxysdmenjsdi.supabase.co
SUPABASE_KEY=your_supabase_anon_key_here
PORT=8000
```

### 2. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 3. Run the Backend Server

The backend includes two APIs unified in `main.py`:
- **Orders API**: Food ordering and delivery management
- **Nutrition API**: Nutrition tracking and meal logging

```bash
# Run the unified API
python main.py

# Or run individually:
# python orders_api.py    # Port 8001
# python nutrition_api.py # Port 8002
```

The server will run on `http://localhost:8000`

## Frontend Setup

### 1. Environment Configuration

Create a `.env.local` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:8000
```

### 2. Install Dependencies

```bash
cd frontend
npm install
```

### 3. Run the Frontend

```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## API Endpoints

### Nutrition API (`/api/nutrition`)

#### User Profiles
- `POST /api/nutrition/profiles/{user_id}` - Create or update profile
- `GET /api/nutrition/profiles/{user_id}` - Get user profile
- `PATCH /api/nutrition/profiles/{user_id}` - Update profile fields

#### Food Items
- `GET /api/nutrition/food-items` - List all food items (with pagination)
- `GET /api/nutrition/food-items/{id}` - Get specific food item
- `GET /api/nutrition/food-items/search?q={query}` - Search food items by name
- `GET /api/nutrition/food-items/location/{location}/date/{date}` - Get menu by location and date
- `POST /api/nutrition/food-items` - Create new food item

#### Meal Entries
- `POST /api/nutrition/meals` - Add meal entry
- `GET /api/nutrition/meals/{id}` - Get meal entry details
- `PATCH /api/nutrition/meals/{id}` - Update meal servings
- `DELETE /api/nutrition/meals/{id}` - Delete meal entry
- `GET /api/nutrition/meals/user/{user_id}/today` - Get today's meals
- `GET /api/nutrition/meals/user/{user_id}/date/{date}` - Get meals by date
- `GET /api/nutrition/meals/user/{user_id}/history?days={n}` - Get meal history

#### Nutrition Totals
- `GET /api/nutrition/totals/user/{user_id}/today` - Get today's totals
- `GET /api/nutrition/totals/user/{user_id}/date/{date}` - Get daily totals for specific date

### Orders API (`/orders`)

#### Orders
- `POST /orders` - Create new order
- `GET /orders` - List orders (with filters: user_id, status, limit)
- `GET /orders/{order_id}` - Get specific order
- `PATCH /orders/{order_id}` - Update order details
- `PATCH /orders/{order_id}/status` - Update order status
- `DELETE /orders/{order_id}` - Cancel order

#### Order Items
- `POST /orders/{order_id}/items` - Add item to order
- `DELETE /orders/{order_id}/items/{item_id}` - Remove item from order

#### User Orders
- `GET /users/{user_id}/orders` - Get all orders for a user

## Frontend API Integration

### API Service Layer (`frontend/src/lib/api.ts`)

The frontend uses a centralized API service that handles:
- HTTP requests with proper headers
- Error handling and response parsing
- TypeScript type definitions

Example usage:

```typescript
import { nutritionApi, ordersApi } from '@/lib/api';

// Search for food items
const foods = await nutritionApi.searchFoodItems('chicken', 50);

// Create an order
const order = await ordersApi.createOrder({
  user_id: userId,
  delivery_location: 'Dorm Building A',
  items: [
    { food_item_id: 123, quantity: 2 },
    { food_item_id: 456, quantity: 1 }
  ]
});

// Get today's nutrition totals
const totals = await nutritionApi.getTodaysTotals(userId);
```

### Updated Components

The following pages have been updated to use the API service:

1. **Nutrition Page** (`frontend/src/pages/Nutrition.tsx`)
   - Fetches meals from `/api/nutrition/meals/user/{user_id}/today`
   - Creates meals via `/api/nutrition/meals`
   - Updates and deletes meals through API endpoints

2. **Checkout Page** (`frontend/src/pages/Checkout.tsx`)
   - Creates orders via `/orders`
   - Includes order items and nutritional information

3. **Menu Page** (`frontend/src/pages/Menu.tsx`)
   - Searches food items via `/api/nutrition/food-items/search`
   - Lists available food items from the database

4. **Order History Page** (`frontend/src/pages/OrderHistory.tsx`)
   - Fetches user orders via `/users/{user_id}/orders`
   - Displays order details and status

## Testing the Integration

### 1. Start Both Services

```bash
# Terminal 1 - Backend
cd backend
python main.py

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 2. Test Nutrition Tracking

1. Navigate to `/student/nutrition`
2. Click "Add Meal" to create a meal entry
3. View today's nutrition totals and charts

### 3. Test Food Ordering

1. Navigate to `/student/menu`
2. Search or browse food items
3. Add items to cart
4. Go to checkout and place an order
5. View order history at `/student/order-history`

### 4. Test API Directly

You can test the API using the interactive docs at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## CORS Configuration

The backend is configured to allow requests from any origin during development:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change in production!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**⚠️ Important**: Update `allow_origins` in production to only include your frontend domain.

## Database Schema

### Tables Used

- **profiles**: User health metrics and TDEE calculations
- **food_items**: Food database with nutritional information
- **meal_entries**: User meal logs
- **orders**: Food delivery orders
- **order_items**: Items in each order

### Key Relationships

- `meal_entries.profile_id` → `profiles.id`
- `meal_entries.food_item_id` → `food_items.id`
- `orders.user_id` → `profiles.id`
- `order_items.order_id` → `orders.id`

## Troubleshooting

### Backend Issues

1. **Module not found errors**
   ```bash
   pip install -r requirements.txt
   ```

2. **Supabase connection errors**
   - Verify `.env` file has correct `SUPABASE_URL` and `SUPABASE_KEY`
   - Check network connection

3. **Port already in use**
   ```bash
   # Change PORT in .env or kill the process
   lsof -ti:8000 | xargs kill -9  # Mac/Linux
   ```

### Frontend Issues

1. **API connection refused**
   - Ensure backend is running on port 8000
   - Check `VITE_API_URL` in `.env.local`

2. **CORS errors**
   - Backend CORS middleware should allow all origins in development
   - Clear browser cache

3. **TypeScript errors**
   ```bash
   npm run build
   ```

## Future Enhancements

- [ ] Add authentication headers to API requests
- [ ] Implement request caching for food items
- [ ] Add real-time order status updates (WebSocket/SSE)
- [ ] Optimize search with debouncing
- [ ] Add pagination for large result sets
- [ ] Implement offline support with service workers

## API Documentation

For detailed API documentation, run the backend and visit:
- http://localhost:8000/docs (Swagger UI)
- http://localhost:8000/redoc (ReDoc)
