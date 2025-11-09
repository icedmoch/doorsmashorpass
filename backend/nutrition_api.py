"""
Nutrition API - FastAPI Service
Complete nutrition tracking API with meal logging, food database, and profile management
"""
from fastapi import FastAPI, HTTPException, UploadFile, File, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
from datetime import datetime, timedelta
import os
import json
from dotenv import load_dotenv
from supabase import create_client, Client

from nutrition_models import (
    UserProfileCreate, UserProfileResponse, UserProfileUpdate,
    FoodItemCreate, FoodItemResponse,
    MealEntryCreate, MealEntryResponse, MealEntryUpdate,
    DailyNutritionTotals, MealsByCategory, WeeklyMealHistory,
    MenuUploadResponse
)
from nutrition_db import NutritionDatabase
from nutrition_utils import (
    load_dining_hall_menus_from_json,
    parse_dining_hall_menu,
    validate_menu_json
)

load_dotenv()

app = FastAPI(
    title="StudentEats Nutrition API",
    description="Nutrition tracking and meal logging API for college students",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update with specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in .env file")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
nutrition_db = NutritionDatabase(supabase)


# ==================== ROOT ====================

# Root endpoint commented out - handled by main.py
# @app.get("/")
# async def root():
#     return {
#         "message": "StudentEats Nutrition API",
#         "version": "1.0.0",
#         "endpoints": {
#             "profiles": "/api/nutrition/profiles",
#             "food_items": "/api/nutrition/food-items",
#             "meals": "/api/nutrition/meals",
#             "docs": "/docs"
#         }
#     }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


# ==================== USER PROFILE ENDPOINTS ====================

@app.post("/api/nutrition/profiles/{user_id}", response_model=UserProfileResponse, status_code=201)
async def create_or_update_profile(user_id: str, profile: UserProfileCreate):
    """
    Create or update user profile with health metrics
    
    Automatically calculates BMR (Basal Metabolic Rate) and TDEE (Total Daily Energy Expenditure)
    """
    try:
        return await nutrition_db.create_or_update_profile(user_id, profile)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/nutrition/profiles/{user_id}", response_model=UserProfileResponse)
async def get_profile(user_id: str):
    """Get user profile by ID"""
    profile = await nutrition_db.get_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail=f"Profile {user_id} not found")
    return profile


@app.patch("/api/nutrition/profiles/{user_id}", response_model=UserProfileResponse)
async def update_profile(user_id: str, updates: UserProfileUpdate):
    """
    Update specific fields of user profile
    
    Automatically recalculates BMR/TDEE if health metrics are updated
    """
    try:
        return await nutrition_db.update_profile(user_id, updates)
    except Exception as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=500, detail=str(e))


# ==================== FOOD ITEM ENDPOINTS ====================

@app.post("/api/nutrition/food-items", response_model=FoodItemResponse, status_code=201)
async def create_food_item(food: FoodItemCreate):
    """
    Create a new food item
    
    If a duplicate exists (same name, location, date, meal_type), returns the existing item
    """
    try:
        return await nutrition_db.create_food_item(food)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== FOOD ITEM ENDPOINTS ====================
# NOTE: Order matters! More specific routes must come before generic ones

@app.get("/api/nutrition/food-items/search", response_model=List[FoodItemResponse])
async def search_food_items(
    q: str = Query("", description="Search query (empty string returns all items)"),
    limit: int = Query(50, le=200),
    date: Optional[str] = Query(None, description="Filter by date (YYYY-MM-DD)")
):
    """Search food items by name, optionally filtered by date. Empty query returns all items."""
    try:
        return await nutrition_db.search_food_items(q, limit=limit, date=date)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/nutrition/food-items/available-dates")
async def get_available_dates():
    """Get list of dates that have food items available"""
    try:
        return await nutrition_db.get_available_dates()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/nutrition/food-items/location/{location}/date/{date}", response_model=dict)
async def get_menu_by_location_date(location: str, date: str):
    """
    Get dining hall menu for a specific location and date
    
    Returns meals grouped by category (Breakfast, Lunch, Dinner)
    """
    try:
        return await nutrition_db.get_food_items_by_location_date(location, date)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/nutrition/food-items", response_model=List[FoodItemResponse])
async def list_food_items(
    limit: int = Query(100, le=500, description="Maximum number of items to return"),
    offset: int = Query(0, ge=0, description="Number of items to skip")
):
    """List all food items with pagination"""
    try:
        return await nutrition_db.list_food_items(limit=limit, offset=offset)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/nutrition/food-items/{food_id}", response_model=FoodItemResponse)
async def get_food_item(food_id: int):
    """Get food item by ID"""
    food = await nutrition_db.get_food_item(food_id)
    if not food:
        raise HTTPException(status_code=404, detail=f"Food item {food_id} not found")
    return food


# ==================== MEAL ENTRY ENDPOINTS ====================

@app.post("/api/nutrition/meals", response_model=MealEntryResponse, status_code=201)
async def create_meal_entry(entry: MealEntryCreate):
    """
    Add a meal entry for a user
    
    If entry_date is not provided, defaults to today
    """
    try:
        # Validate that food item exists
        food = await nutrition_db.get_food_item(entry.food_item_id)
        if not food:
            raise HTTPException(status_code=404, detail=f"Food item {entry.food_item_id} not found")
        
        result = await nutrition_db.create_meal_entry(entry)
        return result
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"ERROR in create_meal_entry: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to create meal entry: {str(e)}")


@app.get("/api/nutrition/meals/{entry_id}", response_model=MealEntryResponse)
async def get_meal_entry(entry_id: int):
    """Get meal entry by ID with food details"""
    meal = await nutrition_db.get_meal_entry(entry_id)
    if not meal:
        raise HTTPException(status_code=404, detail=f"Meal entry {entry_id} not found")
    return meal


@app.patch("/api/nutrition/meals/{entry_id}", response_model=MealEntryResponse)
async def update_meal_entry(entry_id: int, update: MealEntryUpdate):
    """Update meal entry servings"""
    try:
        return await nutrition_db.update_meal_entry_servings(entry_id, update.servings)
    except Exception as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/nutrition/meals/{entry_id}")
async def delete_meal_entry(entry_id: int):
    """Delete a meal entry"""
    success = await nutrition_db.delete_meal_entry(entry_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Meal entry {entry_id} not found")
    return {"message": f"Meal entry {entry_id} deleted successfully"}


@app.get("/api/nutrition/meals/user/{user_id}/today", response_model=MealsByCategory)
async def get_todays_meals(user_id: str):
    """Get all meals for today for a user, grouped by category"""
    today = datetime.now().date().isoformat()
    try:
        meals = await nutrition_db.get_meals_for_date(user_id, today)
        return MealsByCategory(
            Breakfast=meals["Breakfast"],
            Lunch=meals["Lunch"],
            Dinner=meals["Dinner"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/nutrition/meals/user/{user_id}/date/{date}", response_model=MealsByCategory)
async def get_meals_by_date(user_id: str, date: str):
    """
    Get all meals for a specific date for a user, grouped by category
    
    Date format: YYYY-MM-DD
    """
    try:
        meals = await nutrition_db.get_meals_for_date(user_id, date)
        return MealsByCategory(
            Breakfast=meals["Breakfast"],
            Lunch=meals["Lunch"],
            Dinner=meals["Dinner"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/nutrition/meals/user/{user_id}/history", response_model=WeeklyMealHistory)
async def get_meal_history(
    user_id: str,
    days: int = Query(7, ge=1, le=30, description="Number of days of history")
):
    """
    Get meal history for a user
    
    Returns meals and daily totals for the specified number of days (default: 7)
    """
    try:
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=days - 1)
        
        meals_by_date = await nutrition_db.get_meals_date_range(
            user_id,
            start_date.isoformat(),
            end_date.isoformat()
        )
        
        # Calculate daily totals
        daily_totals = {}
        for date_str, meals in meals_by_date.items():
            totals = await nutrition_db.get_daily_totals(user_id, date_str)
            daily_totals[date_str] = DailyNutritionTotals(
                date=date_str,
                calories=totals["calories"],
                total_fat=totals["total_fat"],
                sodium=totals["sodium"],
                total_carb=totals["total_carb"],
                dietary_fiber=totals["dietary_fiber"],
                sugars=totals["sugars"],
                protein=totals["protein"],
                meal_count=totals["meal_count"]
            )
        
        # Convert meals to MealsByCategory format
        formatted_meals = {}
        for date_str, meals in meals_by_date.items():
            formatted_meals[date_str] = MealsByCategory(
                Breakfast=meals["Breakfast"],
                Lunch=meals["Lunch"],
                Dinner=meals["Dinner"]
            )
        
        return WeeklyMealHistory(
            profile_id=user_id,
            start_date=start_date.isoformat(),
            end_date=end_date.isoformat(),
            meals_by_date=formatted_meals,
            daily_totals=daily_totals
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== NUTRITION TOTALS ENDPOINTS ====================

@app.get("/api/nutrition/totals/user/{user_id}/today", response_model=DailyNutritionTotals)
async def get_todays_totals(user_id: str):
    """Get total nutrition intake for today"""
    today = datetime.now().date().isoformat()
    try:
        totals = await nutrition_db.get_daily_totals(user_id, today)
        return DailyNutritionTotals(
            date=today,
            calories=totals["calories"],
            total_fat=totals["total_fat"],
            sodium=totals["sodium"],
            total_carb=totals["total_carb"],
            dietary_fiber=totals["dietary_fiber"],
            sugars=totals["sugars"],
            protein=totals["protein"],
            meal_count=totals["meal_count"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/nutrition/totals/user/{user_id}/date/{date}", response_model=DailyNutritionTotals)
async def get_daily_totals(user_id: str, date: str):
    """
    Get total nutrition intake for a specific date
    
    Date format: YYYY-MM-DD
    """
    try:
        totals = await nutrition_db.get_daily_totals(user_id, date)
        return DailyNutritionTotals(
            date=date,
            calories=totals["calories"],
            total_fat=totals["total_fat"],
            sodium=totals["sodium"],
            total_carb=totals["total_carb"],
            dietary_fiber=totals["dietary_fiber"],
            sugars=totals["sugars"],
            protein=totals["protein"],
            meal_count=totals["meal_count"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== MENU UPLOAD ENDPOINTS ====================

@app.post("/api/nutrition/upload-menu", response_model=MenuUploadResponse)
async def upload_menu_json(file: UploadFile = File(...)):
    """
    Upload dining hall menu data from JSON file
    
    Expected JSON structure:
    {
        "Dining Hall Name": [
            {
                "date": "2025-11-08",
                "meals": {
                    "Breakfast": { ... },
                    "Lunch": { ... },
                    "Dinner": { ... }
                }
            }
        ]
    }
    """
    try:
        # Read and parse JSON
        content = await file.read()
        json_data = json.loads(content)
        
        # Validate structure
        is_valid, errors = validate_menu_json(json_data)
        if not is_valid:
            raise HTTPException(status_code=400, detail={"message": "Invalid JSON structure", "errors": errors})
        
        # Parse food items
        food_items = load_dining_hall_menus_from_json(json_data)
        
        # Insert items into database
        items_created = 0
        items_updated = 0
        upload_errors = []
        
        for food_item in food_items:
            try:
                result = await nutrition_db.create_food_item(food_item)
                if result:
                    items_created += 1
            except Exception as e:
                items_updated += 1  # Likely a duplicate, which is fine
        
        return MenuUploadResponse(
            success=True,
            items_processed=len(food_items),
            items_created=items_created,
            items_updated=items_updated,
            errors=upload_errors
        )
    
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON file")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/nutrition/upload-menu/location", response_model=MenuUploadResponse)
async def upload_location_menu(location: str, menu_data: dict = Body(...)):
    """
    Upload menu data for a specific location
    
    Expected structure:
    {
        "date": "2025-11-08",
        "meals": {
            "Breakfast": { ... },
            "Lunch": { ... },
            "Dinner": { ... }
        }
    }
    """
    try:
        # Parse food items
        food_items = parse_dining_hall_menu(menu_data, location)
        
        # Insert items into database
        items_created = 0
        items_updated = 0
        upload_errors = []
        
        for food_item in food_items:
            try:
                result = await nutrition_db.create_food_item(food_item)
                if result:
                    items_created += 1
            except Exception as e:
                items_updated += 1
        
        return MenuUploadResponse(
            success=True,
            items_processed=len(food_items),
            items_created=items_created,
            items_updated=items_updated,
            errors=upload_errors
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
