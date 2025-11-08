"""
Nutrition Database Interface
All database operations for nutrition tracking
"""
from typing import Optional, Dict, List
from datetime import datetime, timedelta
from supabase import Client
from nutrition_models import (
    UserProfileCreate, UserProfileResponse, UserProfileUpdate,
    FoodItemCreate, FoodItemResponse,
    MealEntryCreate, MealEntryResponse,
    calculate_user_metrics
)


class NutritionDatabase:
    """Database interface for nutrition operations"""
    
    def __init__(self, supabase_client: Client):
        self.client = supabase_client
    
    # ==================== USER/PROFILE OPERATIONS ====================
    
    async def create_or_update_profile(self, user_id: str, profile: UserProfileCreate) -> UserProfileResponse:
        """Create or update a user profile with BMR/TDEE calculations"""
        bmr, tdee = calculate_user_metrics(
            profile.weight_kg,
            profile.height_cm,
            profile.age,
            profile.sex,
            profile.activity_level
        )
        
        data = {
            "age": profile.age,
            "sex": profile.sex,
            "height_cm": profile.height_cm,
            "weight_kg": profile.weight_kg,
            "activity_level": profile.activity_level,
            "bmr": bmr,
            "tdee": tdee
        }
        
        if profile.email:
            data["email"] = profile.email
        if profile.full_name:
            data["full_name"] = profile.full_name
        
        # Upsert profile (update if exists, insert if not)
        response = self.client.table("profiles").upsert(
            {**data, "id": user_id},
            on_conflict="id"
        ).execute()
        
        if response.data:
            result = response.data[0]
            return UserProfileResponse(
                id=result["id"],
                email=result.get("email"),
                full_name=result.get("full_name"),
                age=result["age"],
                sex=result["sex"],
                height_cm=result["height_cm"],
                weight_kg=result["weight_kg"],
                activity_level=result["activity_level"],
                bmr=result["bmr"],
                tdee=result["tdee"],
                created_at=result.get("created_at")
            )
        
        raise Exception("Failed to create/update profile")
    
    async def get_profile(self, user_id: str) -> Optional[UserProfileResponse]:
        """Get user profile by ID"""
        response = self.client.table("profiles").select("*").eq("id", user_id).execute()
        
        if response.data:
            data = response.data[0]
            return UserProfileResponse(
                id=data["id"],
                email=data.get("email"),
                full_name=data.get("full_name"),
                age=data.get("age"),
                sex=data.get("sex"),
                height_cm=data.get("height_cm"),
                weight_kg=data.get("weight_kg"),
                activity_level=data.get("activity_level"),
                bmr=data.get("bmr"),
                tdee=data.get("tdee"),
                created_at=data.get("created_at")
            )
        
        return None
    
    async def update_profile(self, user_id: str, updates: UserProfileUpdate) -> UserProfileResponse:
        """Update specific fields of user profile"""
        # Get current profile
        current = await self.get_profile(user_id)
        if not current:
            raise Exception(f"Profile {user_id} not found")
        
        # Build update data with only provided fields
        data = {}
        if updates.age is not None:
            data["age"] = updates.age
        if updates.sex is not None:
            data["sex"] = updates.sex
        if updates.height_cm is not None:
            data["height_cm"] = updates.height_cm
        if updates.weight_kg is not None:
            data["weight_kg"] = updates.weight_kg
        if updates.activity_level is not None:
            data["activity_level"] = updates.activity_level
        if updates.email is not None:
            data["email"] = updates.email
        if updates.full_name is not None:
            data["full_name"] = updates.full_name
        
        # Recalculate BMR/TDEE if health metrics changed
        if any(k in data for k in ["age", "sex", "height_cm", "weight_kg", "activity_level"]):
            # Use updated values or current values
            weight = data.get("weight_kg", current.weight_kg)
            height = data.get("height_cm", current.height_cm)
            age = data.get("age", current.age)
            sex = data.get("sex", current.sex)
            activity = data.get("activity_level", current.activity_level)
            
            bmr, tdee = calculate_user_metrics(weight, height, age, sex, activity)
            data["bmr"] = bmr
            data["tdee"] = tdee
        
        # Update profile
        response = self.client.table("profiles").update(data).eq("id", user_id).execute()
        
        if response.data:
            result = response.data[0]
            return UserProfileResponse(
                id=result["id"],
                email=result.get("email"),
                full_name=result.get("full_name"),
                age=result["age"],
                sex=result["sex"],
                height_cm=result["height_cm"],
                weight_kg=result["weight_kg"],
                activity_level=result["activity_level"],
                bmr=result["bmr"],
                tdee=result["tdee"],
                created_at=result.get("created_at")
            )
        
        raise Exception("Failed to update profile")
    
    # ==================== FOOD ITEM OPERATIONS ====================
    
    async def create_food_item(self, food: FoodItemCreate) -> FoodItemResponse:
        """Create a new food item or return existing if duplicate"""
        data = {
            "name": food.name,
            "serving_size": food.serving_size,
            "calories": food.calories,
            "total_fat": food.total_fat,
            "sodium": food.sodium,
            "total_carb": food.total_carb,
            "dietary_fiber": food.dietary_fiber,
            "sugars": food.sugars,
            "protein": food.protein,
            "location": food.location,
            "date": food.date,
            "meal_type": food.meal_type
        }
        
        # Try to insert, if duplicate exists, get existing
        try:
            response = self.client.table("food_items").insert(data).execute()
            if response.data:
                item = response.data[0]
                return FoodItemResponse(**item)
        except Exception:
            # If duplicate, find and return existing
            if food.location and food.date and food.meal_type:
                response = self.client.table("food_items").select("*").match({
                    "name": food.name,
                    "location": food.location,
                    "date": food.date,
                    "meal_type": food.meal_type
                }).execute()
                if response.data:
                    item = response.data[0]
                    return FoodItemResponse(**item)
        
        raise Exception(f"Failed to create food item: {food.name}")
    
    async def get_food_item(self, food_id: int) -> Optional[FoodItemResponse]:
        """Get food item by ID"""
        response = self.client.table("food_items").select("*").eq("id", food_id).execute()
        if response.data:
            return FoodItemResponse(**response.data[0])
        return None
    
    async def search_food_items(self, query: str, limit: int = 50) -> List[FoodItemResponse]:
        """Search food items by name"""
        response = self.client.table("food_items").select("*").ilike("name", f"%{query}%").limit(limit).execute()
        return [FoodItemResponse(**item) for item in response.data]
    
    async def get_food_items_by_location_date(self, location: str, date: str) -> Dict[str, List[FoodItemResponse]]:
        """Get foods grouped by meal type for a specific location and date"""
        response = self.client.table("food_items").select("*").match({
            "location": location,
            "date": date
        }).execute()
        
        foods_by_meal = {"Breakfast": [], "Lunch": [], "Dinner": []}
        
        for data in response.data:
            food = FoodItemResponse(**data)
            meal_type = data.get("meal_type", "Lunch")
            if meal_type in foods_by_meal:
                foods_by_meal[meal_type].append(food)
        
        return foods_by_meal
    
    async def list_food_items(self, limit: int = 100, offset: int = 0) -> List[FoodItemResponse]:
        """List all food items with pagination"""
        response = self.client.table("food_items").select("*").order("name").limit(limit).offset(offset).execute()
        return [FoodItemResponse(**item) for item in response.data]
    
    # ==================== MEAL ENTRY OPERATIONS ====================
    
    async def create_meal_entry(self, entry: MealEntryCreate) -> MealEntryResponse:
        """Add a meal entry for a user"""
        # Set default date to today if not provided
        entry_date = entry.entry_date or datetime.now().date().isoformat()
        
        data = {
            "profile_id": entry.profile_id,
            "food_item_id": entry.food_item_id,
            "entry_date": entry_date,
            "meal_category": entry.meal_category,
            "servings": entry.servings
        }
        
        response = self.client.table("meal_entries").insert(data).execute()
        if not response.data:
            raise Exception("Failed to create meal entry")
        
        meal_entry = response.data[0]
        
        # Fetch with food item details
        return await self.get_meal_entry(meal_entry["id"])
    
    async def get_meal_entry(self, entry_id: int) -> Optional[MealEntryResponse]:
        """Get meal entry by ID with food details"""
        response = self.client.table("meal_entries").select(
            "*, food_items(*)"
        ).eq("id", entry_id).execute()
        
        if response.data:
            data = response.data[0]
            food_data = data.get("food_items", {})
            
            return MealEntryResponse(
                id=data["id"],
                profile_id=data["profile_id"],
                food_item_id=data["food_item_id"],
                entry_date=data["entry_date"],
                meal_category=data["meal_category"],
                servings=data["servings"],
                created_at=data.get("created_at"),
                food_name=food_data.get("name"),
                serving_size=food_data.get("serving_size"),
                calories=food_data.get("calories"),
                total_fat=food_data.get("total_fat"),
                sodium=food_data.get("sodium"),
                total_carb=food_data.get("total_carb"),
                dietary_fiber=food_data.get("dietary_fiber"),
                sugars=food_data.get("sugars"),
                protein=food_data.get("protein"),
                location=food_data.get("location")
            )
        
        return None
    
    async def get_meals_for_date(self, profile_id: str, date: str) -> Dict[str, List[MealEntryResponse]]:
        """Get all meals for a profile on a specific date, grouped by meal category"""
        response = self.client.table("meal_entries").select(
            "*, food_items(*)"
        ).eq("profile_id", profile_id).eq("entry_date", date).execute()
        
        meals_by_category = {"Breakfast": [], "Lunch": [], "Dinner": []}
        
        for data in response.data:
            food_data = data.get("food_items", {})
            
            entry = MealEntryResponse(
                id=data["id"],
                profile_id=data["profile_id"],
                food_item_id=data["food_item_id"],
                entry_date=data["entry_date"],
                meal_category=data["meal_category"],
                servings=data["servings"],
                created_at=data.get("created_at"),
                food_name=food_data.get("name"),
                serving_size=food_data.get("serving_size"),
                calories=food_data.get("calories"),
                total_fat=food_data.get("total_fat"),
                sodium=food_data.get("sodium"),
                total_carb=food_data.get("total_carb"),
                dietary_fiber=food_data.get("dietary_fiber"),
                sugars=food_data.get("sugars"),
                protein=food_data.get("protein"),
                location=food_data.get("location")
            )
            
            meals_by_category[entry.meal_category].append(entry)
        
        return meals_by_category
    
    async def get_meals_date_range(self, profile_id: str, start_date: str, end_date: str) -> Dict[str, Dict[str, List[MealEntryResponse]]]:
        """Get meals for a date range"""
        result = {}
        
        start = datetime.fromisoformat(start_date).date()
        end = datetime.fromisoformat(end_date).date()
        
        current_date = start
        while current_date <= end:
            date_str = current_date.isoformat()
            result[date_str] = await self.get_meals_for_date(profile_id, date_str)
            current_date += timedelta(days=1)
        
        return result
    
    async def update_meal_entry_servings(self, entry_id: int, servings: float) -> MealEntryResponse:
        """Update servings for a meal entry"""
        response = self.client.table("meal_entries").update(
            {"servings": servings}
        ).eq("id", entry_id).execute()
        
        if not response.data:
            raise Exception(f"Meal entry {entry_id} not found")
        
        return await self.get_meal_entry(entry_id)
    
    async def delete_meal_entry(self, entry_id: int) -> bool:
        """Delete a meal entry"""
        response = self.client.table("meal_entries").delete().eq("id", entry_id).execute()
        return len(response.data) > 0
    
    async def get_daily_totals(self, profile_id: str, date: str) -> Dict[str, float]:
        """Calculate total nutrition for a profile on a specific date"""
        meals = await self.get_meals_for_date(profile_id, date)
        
        totals = {
            "calories": 0.0,
            "total_fat": 0.0,
            "sodium": 0.0,
            "total_carb": 0.0,
            "dietary_fiber": 0.0,
            "sugars": 0.0,
            "protein": 0.0,
            "meal_count": 0
        }
        
        for category in meals.values():
            for entry in category:
                servings = entry.servings or 1.0
                totals["calories"] += (entry.calories or 0) * servings
                totals["total_fat"] += (entry.total_fat or 0) * servings
                totals["sodium"] += (entry.sodium or 0) * servings
                totals["total_carb"] += (entry.total_carb or 0) * servings
                totals["dietary_fiber"] += (entry.dietary_fiber or 0) * servings
                totals["sugars"] += (entry.sugars or 0) * servings
                totals["protein"] += (entry.protein or 0) * servings
                totals["meal_count"] += 1
        
        return totals
