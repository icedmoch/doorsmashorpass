"""
Seed Sample Food Items
Adds sample food items to the database for testing
"""
import asyncio
from nutrition_db import NutritionDatabase
from nutrition_models import FoodItemCreate
from supabase import create_client
from dotenv import load_dotenv
import os
from datetime import datetime

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

async def seed_food_items():
    """Add sample food items to database"""
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    nutrition_db = NutritionDatabase(supabase)
    
    today = datetime.now().strftime("%Y-%m-%d")
    
    sample_foods = [
        FoodItemCreate(
            name="Grilled Chicken Breast",
            calories=165,
            protein=31.0,
            total_carb=0.0,
            total_fat=3.6,
            sodium=74.0,
            dietary_fiber=0.0,
            sugars=0.0,
            serving_size="100g",
            location="Worcester",
            meal_type="Lunch",
            date=today
        ),
        FoodItemCreate(
            name="Brown Rice",
            calories=112,
            protein=2.6,
            total_carb=23.5,
            total_fat=0.9,
            sodium=5.0,
            dietary_fiber=1.8,
            sugars=0.4,
            serving_size="100g cooked",
            location="Worcester",
            meal_type="Lunch",
            date=today
        ),
        FoodItemCreate(
            name="Steamed Broccoli",
            calories=35,
            protein=2.4,
            total_carb=7.2,
            total_fat=0.4,
            sodium=41.0,
            dietary_fiber=2.6,
            sugars=1.4,
            serving_size="100g",
            location="Worcester",
            meal_type="Lunch",
            date=today
        ),
        FoodItemCreate(
            name="Greek Yogurt",
            calories=97,
            protein=9.0,
            total_carb=3.6,
            total_fat=5.0,
            sodium=36.0,
            dietary_fiber=0.0,
            sugars=3.6,
            serving_size="100g",
            location="Franklin",
            meal_type="Breakfast",
            date=today
        ),
        FoodItemCreate(
            name="Oatmeal",
            calories=68,
            protein=2.4,
            total_carb=12.0,
            total_fat=1.4,
            sodium=49.0,
            dietary_fiber=1.7,
            sugars=0.3,
            serving_size="100g cooked",
            location="Franklin",
            meal_type="Breakfast",
            date=today
        ),
        FoodItemCreate(
            name="Banana",
            calories=89,
            protein=1.1,
            total_carb=22.8,
            total_fat=0.3,
            sodium=1.0,
            dietary_fiber=2.6,
            sugars=12.2,
            serving_size="1 medium",
            location="Franklin",
            meal_type="Breakfast",
            date=today
        ),
        FoodItemCreate(
            name="Caesar Salad",
            calories=184,
            protein=10.0,
            total_carb=11.0,
            total_fat=12.0,
            sodium=470.0,
            dietary_fiber=2.0,
            sugars=3.0,
            serving_size="1 bowl",
            location="Hampshire",
            meal_type="Lunch",
            date=today
        ),
        FoodItemCreate(
            name="Salmon Fillet",
            calories=206,
            protein=22.0,
            total_carb=0.0,
            total_fat=12.0,
            sodium=59.0,
            dietary_fiber=0.0,
            sugars=0.0,
            serving_size="100g",
            location="Hampshire",
            meal_type="Dinner",
            date=today
        ),
        FoodItemCreate(
            name="Quinoa",
            calories=120,
            protein=4.4,
            total_carb=21.3,
            total_fat=1.9,
            sodium=7.0,
            dietary_fiber=2.8,
            sugars=0.9,
            serving_size="100g cooked",
            location="Hampshire",
            meal_type="Dinner",
            date=today
        ),
        FoodItemCreate(
            name="Turkey Sandwich",
            calories=320,
            protein=28.0,
            total_carb=35.0,
            total_fat=8.0,
            sodium=850.0,
            dietary_fiber=3.0,
            sugars=4.0,
            serving_size="1 sandwich",
            location="Berkshire",
            meal_type="Lunch",
            date=today
        ),
        FoodItemCreate(
            name="Chicken Stir Fry",
            calories=285,
            protein=25.0,
            total_carb=22.0,
            total_fat=10.0,
            sodium=680.0,
            dietary_fiber=4.0,
            sugars=6.0,
            serving_size="1 plate",
            location="Worcester",
            meal_type="Dinner",
            date=today
        ),
        FoodItemCreate(
            name="Protein Smoothie",
            calories=220,
            protein=25.0,
            total_carb=28.0,
            total_fat=3.0,
            sodium=150.0,
            dietary_fiber=4.0,
            sugars=18.0,
            serving_size="16 oz",
            location="Franklin",
            meal_type="Breakfast",
            date=today
        ),
    ]
    
    print("🌱 Seeding sample food items...")
    created_count = 0
    
    for food in sample_foods:
        try:
            result = await nutrition_db.create_food_item(food)
            print(f"✅ Created: {food.name} ({food.location})")
            created_count += 1
        except Exception as e:
            print(f"⚠️  {food.name} may already exist: {str(e)[:50]}")
    
    print(f"\n✨ Done! Created {created_count} new food items")
    print(f"Total items in database: {len(await nutrition_db.list_food_items(limit=500))}")

if __name__ == "__main__":
    asyncio.run(seed_food_items())
