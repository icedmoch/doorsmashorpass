"""
Quick test for search endpoint
"""
import requests
import json

BASE_URL = "http://localhost:8000"

print("Testing search endpoint...")
print("=" * 50)

try:
    response = requests.get(f"{BASE_URL}/api/nutrition/food-items/search?q=milk&limit=5")
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ SUCCESS! Found {len(data)} items")
        print()
        for item in data[:3]:
            print(f"📦 {item['name']}")
            print(f"   Location: {item.get('location', 'N/A')}")
            print(f"   Calories: {item['calories']}")
            print(f"   Date: {item.get('date', 'N/A')}")
            print()
    else:
        print(f"❌ ERROR: {response.status_code}")
        print(response.text)

except Exception as e:
    print(f"❌ Connection Error: {e}")
    print("Make sure backend is running on port 8000")
