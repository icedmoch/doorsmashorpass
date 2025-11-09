"""
Quick test to verify API endpoints are working
"""
import requests

BASE_URL = "http://localhost:8000"

def test_food_items():
    """Test listing food items"""
    print("🧪 Testing GET /api/nutrition/food-items...")
    response = requests.get(f"{BASE_URL}/api/nutrition/food-items?limit=5")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        items = response.json()
        print(f"✅ Found {len(items)} items")
        if items:
            print(f"   Sample: {items[0]['name']}")
    else:
        print(f"❌ Error: {response.text}")
    print()

def test_search():
    """Test searching food items"""
    print("🧪 Testing GET /api/nutrition/food-items/search...")
    response = requests.get(f"{BASE_URL}/api/nutrition/food-items/search?query=chicken&limit=3")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        items = response.json()
        print(f"✅ Found {len(items)} items matching 'chicken'")
        for item in items:
            print(f"   - {item['name']}")
    else:
        print(f"❌ Error: {response.text}")
    print()

def test_root():
    """Test root endpoint"""
    print("🧪 Testing GET /...")
    response = requests.get(BASE_URL)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

if __name__ == "__main__":
    print("=" * 50)
    print("Testing Backend API Endpoints")
    print("=" * 50)
    print()
    
    test_root()
    test_food_items()
    test_search()
    
    print("=" * 50)
    print("✨ Testing complete!")
    print("=" * 50)
