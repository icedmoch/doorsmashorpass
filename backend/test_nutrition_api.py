"""
Test script for Nutrition API
Run this to test all nutrition endpoints
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8002"  # or 8000 if using main.py

# Test user ID (use your actual Supabase user UUID)
TEST_USER_ID = "10fccccb-4f6c-4a8f-954f-1d88aafeaa37"


def print_response(name: str, response: requests.Response):
    """Pretty print API response"""
    print(f"\n{'='*60}")
    print(f"TEST: {name}")
    print(f"{'='*60}")
    print(f"Status Code: {response.status_code}")
    try:
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except:
        print(f"Response: {response.text}")
    print()


def test_health():
    """Test health check"""
    response = requests.get(f"{BASE_URL}/health")
    print_response("Health Check", response)
    return response.status_code == 200


def test_create_profile():
    """Test creating/updating user profile"""
    profile_data = {
        "age": 20,
        "sex": "M",
        "height_cm": 175.0,
        "weight_kg": 70.0,
        "activity_level": 3,
        "email": "test@umass.edu",
        "full_name": "Test User"
    }
    
    response = requests.post(
        f"{BASE_URL}/api/nutrition/profiles/{TEST_USER_ID}",
        json=profile_data
    )
    print_response("Create/Update Profile", response)
    return response.status_code in [200, 201]


def test_get_profile():
    """Test getting user profile"""
    response = requests.get(f"{BASE_URL}/api/nutrition/profiles/{TEST_USER_ID}")
    print_response("Get Profile", response)
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ BMR: {data['bmr']} calories/day")
        print(f"✅ TDEE: {data['tdee']} calories/day")
    
    return response.status_code == 200


def test_create_food_item():
    """Test creating a custom food item"""
    food_data = {
        "name": "Test Grilled Chicken",
        "serving_size": "4 oz",
        "calories": 165,
        "total_fat": 3.6,
        "sodium": 74,
        "total_carb": 0,
        "dietary_fiber": 0,
        "sugars": 0,
        "protein": 31,
        "location": "Custom",
        "date": datetime.now().date().isoformat(),
        "meal_type": "Lunch"
    }
    
    response = requests.post(
        f"{BASE_URL}/api/nutrition/food-items",
        json=food_data
    )
    print_response("Create Food Item", response)
    
    if response.status_code in [200, 201]:
        return response.json()["id"]
    return None


def test_search_food_items():
    """Test searching food items"""
    response = requests.get(
        f"{BASE_URL}/api/nutrition/food-items/search",
        params={"q": "chicken", "limit": 5}
    )
    print_response("Search Food Items", response)
    return response.status_code == 200


def test_create_meal_entry(food_item_id: int):
    """Test adding a meal entry"""
    meal_data = {
        "profile_id": TEST_USER_ID,
        "food_item_id": food_item_id,
        "meal_category": "Lunch",
        "servings": 1.5,
        "entry_date": datetime.now().date().isoformat()
    }
    
    response = requests.post(
        f"{BASE_URL}/api/nutrition/meals",
        json=meal_data
    )
    print_response("Create Meal Entry", response)
    
    if response.status_code in [200, 201]:
        return response.json()["id"]
    return None


def test_get_todays_meals():
    """Test getting today's meals"""
    response = requests.get(
        f"{BASE_URL}/api/nutrition/meals/user/{TEST_USER_ID}/today"
    )
    print_response("Get Today's Meals", response)
    return response.status_code == 200


def test_get_todays_totals():
    """Test getting today's nutrition totals"""
    response = requests.get(
        f"{BASE_URL}/api/nutrition/totals/user/{TEST_USER_ID}/today"
    )
    print_response("Get Today's Totals", response)
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Total Calories: {data['calories']}")
        print(f"✅ Total Protein: {data['protein']}g")
        print(f"✅ Meal Count: {data['meal_count']}")
    
    return response.status_code == 200


def test_get_meal_history():
    """Test getting 7-day meal history"""
    response = requests.get(
        f"{BASE_URL}/api/nutrition/meals/user/{TEST_USER_ID}/history",
        params={"days": 7}
    )
    print_response("Get 7-Day Meal History", response)
    return response.status_code == 200


def test_update_meal_servings(meal_id: int):
    """Test updating meal servings"""
    response = requests.patch(
        f"{BASE_URL}/api/nutrition/meals/{meal_id}",
        json={"servings": 2.0}
    )
    print_response("Update Meal Servings", response)
    return response.status_code == 200


def test_delete_meal(meal_id: int):
    """Test deleting a meal entry"""
    response = requests.delete(f"{BASE_URL}/api/nutrition/meals/{meal_id}")
    print_response("Delete Meal Entry", response)
    return response.status_code == 200


def run_all_tests():
    """Run all tests in sequence"""
    print("\n" + "="*60)
    print("NUTRITION API TEST SUITE")
    print("="*60)
    print(f"Testing against: {BASE_URL}")
    print(f"Test User ID: {TEST_USER_ID}")
    print()
    
    results = []
    
    # Test 1: Health check
    results.append(("Health Check", test_health()))
    
    # Test 2: Create/Update Profile
    results.append(("Create Profile", test_create_profile()))
    
    # Test 3: Get Profile
    results.append(("Get Profile", test_get_profile()))
    
    # Test 4: Create Food Item
    food_id = test_create_food_item()
    results.append(("Create Food Item", food_id is not None))
    
    # Test 5: Search Food Items
    results.append(("Search Food Items", test_search_food_items()))
    
    if food_id:
        # Test 6: Create Meal Entry
        meal_id = test_create_meal_entry(food_id)
        results.append(("Create Meal Entry", meal_id is not None))
        
        # Test 7: Get Today's Meals
        results.append(("Get Today's Meals", test_get_todays_meals()))
        
        # Test 8: Get Today's Totals
        results.append(("Get Today's Totals", test_get_todays_totals()))
        
        # Test 9: Get Meal History
        results.append(("Get Meal History", test_get_meal_history()))
        
        if meal_id:
            # Test 10: Update Meal Servings
            results.append(("Update Meal Servings", test_update_meal_servings(meal_id)))
            
            # Test 11: Delete Meal Entry
            results.append(("Delete Meal Entry", test_delete_meal(meal_id)))
    
    # Print summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {name}")
    
    print()
    print(f"Results: {passed}/{total} tests passed")
    print("="*60)
    
    return passed == total


if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)
