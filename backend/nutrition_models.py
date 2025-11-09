"""
Nutrition Data Models
Pydantic models for FastAPI with BMR/TDEE calculations
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime


# ==================== REQUEST/RESPONSE MODELS ====================

class UserProfileBase(BaseModel):
    """Base user profile fields"""
    age: int = Field(..., ge=13, le=120, description="User age in years")
    sex: str = Field(..., description="Sex: Male, Female, or Other")
    height_cm: float = Field(..., ge=50, le=300, description="Height in centimeters")
    weight_kg: float = Field(..., ge=30, le=500, description="Weight in kilograms")
    activity_level: int = Field(..., ge=1, le=5, description="Activity level: 1=sedentary, 2=light, 3=moderate, 4=active, 5=very_active")


class UserProfileCreate(UserProfileBase):
    """Create user profile request"""
    email: Optional[str] = None
    full_name: Optional[str] = None


class UserProfileUpdate(BaseModel):
    """Update user profile request (all fields optional)"""
    age: Optional[int] = Field(None, ge=13, le=120)
    sex: Optional[str] = None
    height_cm: Optional[float] = Field(None, ge=50, le=300)
    weight_kg: Optional[float] = Field(None, ge=30, le=500)
    activity_level: Optional[int] = Field(None, ge=1, le=5)
    email: Optional[str] = None
    full_name: Optional[str] = None


class UserProfileResponse(UserProfileBase):
    """User profile with calculated values"""
    id: str  # UUID
    email: Optional[str] = None
    full_name: Optional[str] = None
    bmr: float = Field(..., description="Basal Metabolic Rate (calories/day)")
    tdee: float = Field(..., description="Total Daily Energy Expenditure (calories/day)")
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class FoodItemBase(BaseModel):
    """Base food item fields"""
    name: str = Field(..., min_length=1, max_length=200)
    serving_size: str = Field(..., min_length=1)
    calories: int = Field(..., ge=0)
    total_fat: float = Field(..., ge=0)
    sodium: float = Field(..., ge=0)
    total_carb: float = Field(..., ge=0)
    dietary_fiber: float = Field(..., ge=0)
    sugars: float = Field(..., ge=0)
    protein: float = Field(..., ge=0)


class FoodItemCreate(FoodItemBase):
    """Create food item request"""
    location: Optional[str] = Field(None, description="Dining hall location or 'Custom'")
    date: Optional[str] = Field(None, description="Date in any format")
    meal_type: Optional[str] = Field(None, description="Meal type: Breakfast, Lunch, or Dinner")


class FoodItemResponse(FoodItemBase):
    """Food item response"""
    id: int
    location: Optional[str] = None
    date: Optional[str] = None
    meal_type: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MealEntryBase(BaseModel):
    """Base meal entry fields"""
    food_item_id: int = Field(..., gt=0)
    meal_category: str = Field(..., pattern="^(Breakfast|Lunch|Dinner)$")
    servings: float = Field(1.0, gt=0, le=20)


class MealEntryCreate(MealEntryBase):
    """Create meal entry request"""
    profile_id: str = Field(..., description="User profile UUID")
    entry_date: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}-\d{2}$", description="Date in YYYY-MM-DD format, defaults to today")


class MealEntryUpdate(BaseModel):
    """Update meal entry request"""
    servings: float = Field(..., gt=0, le=20)


class MealEntryResponse(MealEntryBase):
    """Meal entry with food details"""
    id: int
    profile_id: str
    entry_date: str
    created_at: Optional[datetime] = None
    
    # Food item details (joined)
    food_name: Optional[str] = None
    serving_size: Optional[str] = None
    calories: Optional[int] = None
    total_fat: Optional[float] = None
    sodium: Optional[float] = None
    total_carb: Optional[float] = None
    dietary_fiber: Optional[float] = None
    sugars: Optional[float] = None
    protein: Optional[float] = None
    location: Optional[str] = None

    class Config:
        from_attributes = True


class DailyNutritionTotals(BaseModel):
    """Daily nutrition totals"""
    date: str
    calories: float
    total_fat: float
    sodium: float
    total_carb: float
    dietary_fiber: float
    sugars: float
    protein: float
    meal_count: int


class MealsByCategory(BaseModel):
    """Meals grouped by category"""
    Breakfast: list[MealEntryResponse] = []
    Lunch: list[MealEntryResponse] = []
    Dinner: list[MealEntryResponse] = []


class WeeklyMealHistory(BaseModel):
    """7 days of meal history"""
    profile_id: str
    start_date: str
    end_date: str
    meals_by_date: dict[str, MealsByCategory]
    daily_totals: dict[str, DailyNutritionTotals]


class MenuUploadRequest(BaseModel):
    """Request to upload dining hall menu data"""
    location: str = Field(..., description="Dining hall location")
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    meals: dict = Field(..., description="Meal data structure from JSON")


class MenuUploadResponse(BaseModel):
    """Response from menu upload"""
    success: bool
    items_processed: int
    items_created: int
    items_updated: int
    errors: list[str] = []


# ==================== HELPER FUNCTIONS ====================

def calculate_bmr(weight_kg: float, height_cm: float, age: int, sex: str) -> float:
    """
    Calculate Basal Metabolic Rate using Mifflin-St Jeor Equation
    BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + s
    where s = +5 for males and -161 for females
    """
    bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age)
    if sex.upper() in ['M', 'MALE']:
        bmr += 5
    else:
        bmr -= 161
    return round(bmr, 2)


def calculate_tdee(bmr: float, activity_level: int) -> float:
    """
    Calculate Total Daily Energy Expenditure based on activity level
    Activity levels: 1=sedentary, 2=light, 3=moderate, 4=active, 5=very_active
    """
    activity_multipliers = {
        1: 1.2,      # Sedentary - Little or no exercise
        2: 1.375,    # Light - Light exercise 1-3 days/week
        3: 1.55,     # Moderate - Moderate exercise 3-5 days/week
        4: 1.725,    # Active - Heavy exercise 6-7 days/week
        5: 1.9       # Very Active - Very heavy exercise, physical job
    }
    
    multiplier = activity_multipliers.get(activity_level, 1.2)
    tdee = bmr * multiplier
    return round(tdee, 2)


def calculate_user_metrics(weight_kg: float, height_cm: float, age: int, sex: str, activity_level: int) -> tuple[float, float]:
    """Calculate both BMR and TDEE for a user"""
    bmr = calculate_bmr(weight_kg, height_cm, age, sex)
    tdee = calculate_tdee(bmr, activity_level)
    return bmr, tdee
