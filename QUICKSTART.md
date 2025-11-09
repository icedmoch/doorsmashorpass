# StudentEats - Quick Start Guide

## Prerequisites

- Python 3.8+
- Node.js 18+
- npm or bun

## Setup Instructions

### 1. Backend Setup

```powershell
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# The .env file should already be configured with Supabase credentials
```

### 2. Frontend Setup

```powershell
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
# OR if using bun:
bun install
```

### 3. Start Development Servers

#### Option A: Use the startup script (Windows PowerShell)

```powershell
# From the project root
.\start-dev.ps1
```

This will open two terminal windows:
- Backend server on http://localhost:8000
- Frontend dev server on http://localhost:5173

#### Option B: Manual start

```powershell
# Terminal 1 - Backend
cd backend
python main.py

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

## Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc

## Features Implemented

### ✅ Nutrition Tracking
- Track daily meals with calorie and macro information
- Search and add food items from dining halls
- View daily and weekly nutrition statistics
- Calculate BMR and TDEE based on user profile

### ✅ Food Ordering
- Browse dining hall menus
- Add items to cart
- Place orders with delivery details
- Track order status

### ✅ API Integration
- Unified backend API for all features
- Frontend API service layer for clean code
- Proper error handling and TypeScript types
- CORS configured for local development

## API Endpoints Reference

### Nutrition API
- `GET /api/nutrition/food-items/search?q=chicken` - Search food items
- `GET /api/nutrition/meals/user/{user_id}/today` - Get today's meals
- `POST /api/nutrition/meals` - Add meal entry
- `GET /api/nutrition/totals/user/{user_id}/today` - Get daily totals

### Orders API
- `POST /orders` - Create new order
- `GET /orders` - List orders
- `GET /orders/{order_id}` - Get order details
- `GET /users/{user_id}/orders` - Get user's orders

## Testing

### Test Nutrition Features
1. Go to `/student/nutrition`
2. Click "Add Meal"
3. Enter meal details (name, calories, protein, carbs, fat)
4. Submit and see it appear in today's meals
5. View updated nutrition statistics

### Test Ordering Features  
1. Go to `/student/menu`
2. Search for food items (they will be fetched from the backend)
3. Add items to cart
4. Click checkout
5. Select delivery location and time
6. Place order
7. View in order history

## Troubleshooting

### Backend won't start
- Check if Python and all dependencies are installed
- Verify `.env` file exists in `backend/` directory
- Check if port 8000 is available

### Frontend won't connect to backend
- Ensure backend is running on port 8000
- Check `.env.local` in `frontend/` has `VITE_API_URL=http://localhost:8000`
- Clear browser cache

### Database errors
- Verify Supabase credentials in backend `.env`
- Check internet connection (Supabase is cloud-hosted)

## Next Steps

- Add more food items to the database
- Implement user authentication flow
- Add payment processing
- Implement real-time order tracking
- Add delivery partner features

For detailed API documentation, see [API_INTEGRATION.md](./API_INTEGRATION.md)
