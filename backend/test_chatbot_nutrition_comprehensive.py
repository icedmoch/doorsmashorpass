"""
Comprehensive Test Suite for Chatbot Nutrition API Integration
Tests all nutrition features through the chatbot API to ensure proper integration
"""
import requests
import json
from datetime import datetime
import sys

# Helper to safely print text with emojis on Windows
def safe_print(text):
    """Print text safely, handling Unicode encoding issues on Windows"""
    try:
        print(text)
    except UnicodeEncodeError:
        # Remove non-ASCII characters if encoding fails
        print(text.encode('ascii', 'ignore').decode('ascii'))

# Configuration
CHATBOT_API_URL = "http://localhost:8002"
MAIN_API_URL = "http://localhost:8000"
TEST_USER_ID = "10fccccb-4f6c-4a8f-954f-1d88aafeaa37"

# Test data from database
TEST_DATE = "Tue November 11, 2025"
TEST_DATE_ISO = "2025-11-11"  # YYYY-MM-DD format for nutrition API
TEST_FOOD_ITEM_ID = 68  # Big Mack Burger
TEST_LOCATION = "Berkshire"

def print_test_header(test_name):
    """Print a formatted test header"""
    print(f"\n{'='*80}")
    print(f"  TEST: {test_name}")
    print(f"{'='*80}")

def print_result(success, message):
    """Print a formatted test result"""
    status = "PASS" if success else "FAIL"
    print(f"{status} - {message}")

def send_chatbot_message(message, user_location=None):
    """Send a message to the chatbot and return the response"""
    payload = {
        "message": message,
        "user_id": TEST_USER_ID
    }
    if user_location:
        payload["user_location"] = user_location

    try:
        response = requests.post(f"{CHATBOT_API_URL}/chat", json=payload, timeout=30)
        response.raise_for_status()
        data = response.json()
        return {
            "success": True,
            "response": data.get("response", ""),
            "raw": data
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "response": ""
        }

def check_api_health():
    """Check if APIs are running"""
    print_test_header("API Health Check")

    # Check Chatbot API
    try:
        response = requests.get(f"{CHATBOT_API_URL}/", timeout=5)
        chatbot_ok = response.status_code == 200
        print_result(chatbot_ok, f"Chatbot API ({CHATBOT_API_URL})")
        if chatbot_ok:
            data = response.json()
            print(f"   Model: {data.get('model', 'N/A')}")
            print(f"   Version: {data.get('version', 'N/A')}")
    except Exception as e:
        print_result(False, f"Chatbot API - {str(e)}")
        return False

    # Check Main API
    try:
        response = requests.get(f"{MAIN_API_URL}/health", timeout=5)
        main_ok = response.status_code == 200
        print_result(main_ok, f"Main API ({MAIN_API_URL})")
    except Exception as e:
        print_result(False, f"Main API - {str(e)}")
        return False

    return chatbot_ok and main_ok

def test_search_nutrition_food_items():
    """Test nutrition food search functionality"""
    print_test_header("Test 1: Search Nutrition Food Items")

    # Test 1a: Search with date filter
    message = f"Search nutrition database for items on {TEST_DATE_ISO}"
    result = send_chatbot_message(message)

    if result["success"]:
        response_text = result["response"].lower()
        has_items = "found" in response_text or "item" in response_text
        print_result(has_items, f"Search with date filter")
        safe_print(f"   Response preview: {result['response'][:200]}...")
    else:
        print_result(False, f"Search failed: {result.get('error', 'Unknown error')}")

    # Test 1b: Search for specific food
    message = f"Search for burger items in nutrition database on {TEST_DATE_ISO}"
    result = send_chatbot_message(message)

    if result["success"]:
        response_text = result["response"].lower()
        has_burger = "burger" in response_text or "big mack" in response_text
        print_result(has_burger, "Search for specific food")
        safe_print(f"   Response preview: {result['response'][:200]}...")
    else:
        print_result(False, f"Search failed: {result.get('error', 'Unknown error')}")

def test_log_meal():
    """Test meal logging functionality"""
    print_test_header("Test 2: Log Meal to Nutrition Tracker")

    message = f"Log food item ID {TEST_FOOD_ITEM_ID} as 1 serving for lunch today"
    result = send_chatbot_message(message)

    if result["success"]:
        response_text = result["response"].lower()
        logged = "logged" in response_text or "success" in response_text
        has_calories = "calor" in response_text
        print_result(logged and has_calories, "Meal logged successfully")
        safe_print(f"   Response: {result['response'][:300]}...")
    else:
        print_result(False, f"Log meal failed: {result.get('error', 'Unknown error')}")

def test_daily_nutrition_totals():
    """Test daily nutrition totals"""
    print_test_header("Test 3: Get Daily Nutrition Totals")

    message = "What are my nutrition totals for today?"
    result = send_chatbot_message(message)

    if result["success"]:
        response_text = result["response"].lower()
        has_calories = "calor" in response_text
        has_protein = "protein" in response_text
        has_macros = has_calories and has_protein
        print_result(has_macros, "Daily totals retrieved")
        safe_print(f"   Response: {result['response'][:300]}...")
    else:
        print_result(False, f"Get totals failed: {result.get('error', 'Unknown error')}")

def test_meal_history():
    """Test meal history retrieval"""
    print_test_header("Test 4: Get Meal History")

    message = "Show me my meal history for the past 7 days"
    result = send_chatbot_message(message)

    if result["success"]:
        response_text = result["response"].lower()
        has_history = "history" in response_text or "meal" in response_text or "day" in response_text
        print_result(has_history, "Meal history retrieved")
        safe_print(f"   Response: {result['response'][:300]}...")
    else:
        print_result(False, f"Get history failed: {result.get('error', 'Unknown error')}")

def test_nutrition_profile():
    """Test nutrition profile retrieval"""
    print_test_header("Test 5: Get Nutrition Profile")

    message = "Show me my nutrition profile"
    result = send_chatbot_message(message)

    if result["success"]:
        response_text = result["response"].lower()
        has_profile = "profile" in response_text or "bmr" in response_text or "tdee" in response_text
        print_result(has_profile, "Nutrition profile retrieved")
        safe_print(f"   Response: {result['response'][:300]}...")
    else:
        print_result(False, f"Get profile failed: {result.get('error', 'Unknown error')}")

def test_update_profile():
    """Test nutrition profile update"""
    print_test_header("Test 6: Update Nutrition Profile")

    message = "Update my weight to 72 kg"
    result = send_chatbot_message(message)

    if result["success"]:
        response_text = result["response"].lower()
        updated = "updated" in response_text or "success" in response_text
        has_metrics = "bmr" in response_text or "tdee" in response_text
        print_result(updated and has_metrics, "Profile updated with recalculated metrics")
        safe_print(f"   Response: {result['response'][:300]}...")
    else:
        print_result(False, f"Update profile failed: {result.get('error', 'Unknown error')}")

def test_order_search():
    """Test order search functionality"""
    print_test_header("Test 7: Search Food Items for Ordering")

    message = f"What's available for lunch at {TEST_LOCATION} on {TEST_DATE}?"
    result = send_chatbot_message(message)

    if result["success"]:
        response_text = result["response"].lower()
        has_items = "found" in response_text or "item" in response_text
        has_nutrition = "cal" in response_text or "protein" in response_text
        print_result(has_items and has_nutrition, "Order menu search with nutrition info")
        safe_print(f"   Response preview: {result['response'][:200]}...")
    else:
        print_result(False, f"Order search failed: {result.get('error', 'Unknown error')}")

def test_create_order_with_location():
    """Test order creation with GPS location"""
    print_test_header("Test 8: Create Order with Location")

    # Simulate GPS location
    user_location = {
        "latitude": 42.3886,
        "longitude": -72.5292
    }

    message = f"I want to order Big Mack Burger from {TEST_LOCATION}, deliver to Southwest Dorms"
    result = send_chatbot_message(message, user_location)

    if result["success"]:
        response_text = result["response"].lower()
        # Chatbot should ask follow-up questions or create the order
        is_processing = any(word in response_text for word in ["order", "deliver", "location", "confirm"])
        print_result(is_processing, "Order processing initiated")
        safe_print(f"   Response: {result['response'][:300]}...")
    else:
        print_result(False, f"Create order failed: {result.get('error', 'Unknown error')}")

def test_conversational_flow():
    """Test natural conversational flow"""
    print_test_header("Test 9: Conversational Flow")

    # Multi-turn conversation
    conversations = [
        "Hi, what can you help me with?",
        "I want to track my nutrition",
        f"Search for chicken items on {TEST_DATE_ISO}",
    ]

    all_success = True
    for i, message in enumerate(conversations, 1):
        result = send_chatbot_message(message)
        if result["success"]:
            print_result(True, f"Turn {i}: '{message[:40]}...'")
            print(f"   Bot: {result['response'][:150]}...")
        else:
            print_result(False, f"Turn {i} failed: {result.get('error', 'Unknown error')}")
            all_success = False

    print_result(all_success, "Multi-turn conversation handled correctly")

def test_error_handling():
    """Test error handling"""
    print_test_header("Test 10: Error Handling")

    # Test with invalid food item ID
    message = "Log food item ID 999999 for lunch"
    result = send_chatbot_message(message)

    if result["success"]:
        response_text = result["response"].lower()
        has_error_message = "error" in response_text or "not found" in response_text or "failed" in response_text
        print_result(has_error_message, "Graceful error handling for invalid ID")
        safe_print(f"   Response: {result['response'][:200]}...")
    else:
        print_result(True, "API returned error as expected")

def run_all_tests():
    """Run all tests in sequence"""
    print("\n" + "="*80)
    print("  CHATBOT NUTRITION API - COMPREHENSIVE TEST SUITE")
    print("="*80)
    print(f"  Test User: {TEST_USER_ID}")
    print(f"  Test Date: {TEST_DATE} ({TEST_DATE_ISO})")
    print(f"  Chatbot API: {CHATBOT_API_URL}")
    print(f"  Main API: {MAIN_API_URL}")
    print("="*80)

    # Health check first
    if not check_api_health():
        print("\nCRITICAL: APIs are not running. Please start them first:")
        print("   Terminal 1: cd backend && python main.py")
        print("   Terminal 2: cd backend && python chatbot_api.py")
        return

    # Run all tests
    tests = [
        test_search_nutrition_food_items,
        test_log_meal,
        test_daily_nutrition_totals,
        test_meal_history,
        test_nutrition_profile,
        test_update_profile,
        test_order_search,
        test_create_order_with_location,
        test_conversational_flow,
        test_error_handling,
    ]

    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"\nTEST FAILED WITH EXCEPTION: {str(e)}")
            import traceback
            traceback.print_exc()

    # Summary
    print("\n" + "="*80)
    print("  TEST SUITE COMPLETE")
    print("="*80)
    print("\nAll tests executed. Review results above for any failures.")
    print("\nNext Steps:")
    print("   1. Fix any failing tests")
    print("   2. Test frontend integration")
    print("   3. Deploy to production")

if __name__ == "__main__":
    run_all_tests()
