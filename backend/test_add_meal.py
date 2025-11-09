"""
Test adding a meal entry
"""
import requests
import json

BASE_URL = "http://localhost:8000"

print("Testing meal entry creation...")
print("=" * 50)

# Sample meal entry data
meal_data = {
    "profile_id": "91d32b59-bfb2-4e54-8178-930992100c5d",  # Your user ID
    "food_item_id": 273,  # 1% Milk from our earlier search
    "meal_category": "Breakfast",
    "servings": 1.0,
    "entry_date": "2025-11-08"
}

try:
    response = requests.post(
        f"{BASE_URL}/api/nutrition/meals",
        json=meal_data
    )
    print(f"Status Code: {response.status_code}")
    
    if response.status_code in [200, 201]:
        data = response.json()
        print(f"✅ SUCCESS! Meal entry created")
        print(f"Entry ID: {data.get('id')}")
        print(f"Food Item ID: {data.get('food_item_id')}")
        print(f"Meal Category: {data.get('meal_category')}")
        print(f"Servings: {data.get('servings')}")
    else:
        print(f"❌ ERROR: {response.status_code}")
        print(response.text)

except Exception as e:
    print(f"❌ Connection Error: {e}")
    print("Make sure backend is running on port 8000")
