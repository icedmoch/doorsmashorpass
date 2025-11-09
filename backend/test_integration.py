#!/usr/bin/env python
"""
API Integration Test Script
Tests the connection between frontend and backend APIs
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

def test_health():
    """Test if backend is running"""
    print("🔍 Testing backend health...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Backend is healthy!")
            print(f"   Response: {response.json()}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend. Is it running on port 8000?")
        return False

def test_food_search():
    """Test food item search endpoint"""
    print("\n🔍 Testing food search...")
    try:
        response = requests.get(f"{BASE_URL}/api/nutrition/food-items/search?q=chicken&limit=5")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Food search works! Found {len(data)} items")
            if data:
                print(f"   Sample: {data[0]['name']} - {data[0]['calories']} cal")
            return True
        else:
            print(f"❌ Food search failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_create_food_item():
    """Test creating a food item"""
    print("\n🔍 Testing food item creation...")
    try:
        food_data = {
            "name": "Test Chicken Bowl",
            "calories": 450,
            "protein": 35.0,
            "total_carb": 40.0,
            "total_fat": 12.0,
            "sodium": 500.0,
            "dietary_fiber": 5.0,
            "sugars": 3.0,
            "serving_size": "1 bowl",
            "location": "Test Kitchen",
            "meal_type": "Lunch",
            "date": datetime.now().strftime("%Y-%m-%d")
        }
        
        response = requests.post(
            f"{BASE_URL}/api/nutrition/food-items",
            json=food_data
        )
        
        if response.status_code in [200, 201]:
            data = response.json()
            print(f"✅ Created food item: {data['name']} (ID: {data['id']})")
            return data['id']
        else:
            print(f"❌ Failed to create food item: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def test_list_food_items():
    """Test listing food items"""
    print("\n🔍 Testing food items list...")
    try:
        response = requests.get(f"{BASE_URL}/api/nutrition/food-items?limit=10")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Listed {len(data)} food items")
            return True
        else:
            print(f"❌ List failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_orders_list():
    """Test orders listing endpoint"""
    print("\n🔍 Testing orders list...")
    try:
        response = requests.get(f"{BASE_URL}/orders?limit=5")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Orders endpoint works! Found {len(data)} orders")
            return True
        else:
            print(f"❌ Orders list failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    print("=" * 60)
    print("StudentEats API Integration Test")
    print("=" * 60)
    
    results = []
    
    # Test 1: Health check
    results.append(("Health Check", test_health()))
    
    if not results[0][1]:
        print("\n⚠️  Backend is not running. Start it with: python backend/main.py")
        return
    
    # Test 2: Food search
    results.append(("Food Search", test_food_search()))
    
    # Test 3: List food items
    results.append(("List Food Items", test_list_food_items()))
    
    # Test 4: Create food item
    food_id = test_create_food_item()
    results.append(("Create Food Item", food_id is not None))
    
    # Test 5: Orders list
    results.append(("Orders List", test_orders_list()))
    
    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print(f"\nResults: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! Backend API is working correctly.")
    else:
        print("\n⚠️  Some tests failed. Check the output above for details.")

if __name__ == "__main__":
    main()
