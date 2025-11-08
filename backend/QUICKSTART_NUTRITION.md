# 🚀 Quick Start - Nutrition API

## Start the API (3 steps)

```powershell
# 1. Navigate to backend
cd backend

# 2. Install dependencies (first time only)
pip install -r requirements.txt

# 3. Start the API
python nutrition_api.py
```

**API will start on:** http://localhost:8002

**Documentation:** http://localhost:8002/docs

---

## Test It Works

```powershell
python test_nutrition_api.py
```

Expected output: `11/11 tests passed ✅`

---

## Key Endpoints

### User Profile
```http
POST /api/nutrition/profiles/{user_id}
{
  "age": 20,
  "sex": "M",
  "height_cm": 175,
  "weight_kg": 70,
  "activity_level": 3
}
```

### Add Meal
```http
POST /api/nutrition/meals
{
  "profile_id": "user-uuid",
  "food_item_id": 123,
  "meal_category": "Lunch",
  "servings": 1.5
}
```

### Get Today's Meals
```http
GET /api/nutrition/meals/user/{user_id}/today
```

### Get Nutrition Totals
```http
GET /api/nutrition/totals/user/{user_id}/today
```

---

## Environment Setup

Create `.env` in backend folder:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key_here
```

---

## 🎯 What's Different from calorie_tracker?

| Feature | calorie_tracker (Old) | nutrition_api (New) |
|---------|---------------------|---------------------|
| Interface | Streamlit UI | REST API |
| Access | Local only | Frontend integration |
| Validation | Python dataclasses | Pydantic models |
| Docs | README only | Auto-generated Swagger |
| Testing | Manual | Automated test suite |
| Performance | Sync | Async |

---

## ✅ You Can Now Delete

Once tested and working:

```powershell
# Delete the old folder
Remove-Item -Recurse -Force calorie_tracker
```

All functionality is now in `backend/nutrition_api.py`!

---

## 📱 Frontend Integration

Add to `.env`:
```env
VITE_API_BASE_URL=http://localhost:8002
```

Example fetch:
```typescript
const response = await fetch(
  `${import.meta.env.VITE_API_BASE_URL}/api/nutrition/meals/user/${userId}/today`
);
const meals = await response.json();
```

---

## 🆘 Troubleshooting

**Port in use?**
```powershell
# Kill process on port 8002
netstat -ano | findstr :8002
taskkill /PID <PID> /F
```

**Can't connect to Supabase?**
- Check `.env` has correct credentials
- Visit Supabase dashboard to verify project is active

**Import errors?**
```powershell
cd backend
pip install --upgrade -r requirements.txt
```

---

## 📞 Need Help?

1. Check full docs: `backend/README_NUTRITION_API.md`
2. View API docs: http://localhost:8002/docs (when running)
3. Run tests: `python test_nutrition_api.py`
