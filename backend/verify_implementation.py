"""
Final Verification Script - NEXT_STEPS.md Implementation
Tests all emoji-fixed functions to ensure they work correctly
"""
import requests
import json
import sys

CHATBOT_API = "http://localhost:8002"
USER_ID = "10fccccb-4f6c-4a8f-954f-1d88aafeaa37"

def check_api_health():
    """Check if APIs are running"""
    print("\n" + "="*60)
    print("CHECKING API HEALTH")
    print("="*60)
    
    try:
        response = requests.get(f"{CHATBOT_API}/", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"PASS - Chatbot API is running")
            print(f"  Version: {data.get('version', 'unknown')}")
            print(f"  Model: {data.get('model', 'unknown')}")
            return True
        else:
            print(f"FAIL - Chatbot API returned {response.status_code}")
            return False
    except Exception as e:
        print(f"FAIL - Cannot connect to Chatbot API: {e}")
        print("\nPlease start the chatbot API:")
        print("  cd backend")
        print("  python chatbot_api.py")
        return False

def test_function(message: str, function_name: str, check_for_emojis: bool = True):
    """Test a chatbot function and check for emojis"""
    print(f"\n{'-'*60}")
    print(f"Testing: {function_name}")
    print(f"Query: {message}")
    print(f"{'-'*60}")
    
    try:
        response = requests.post(
            f"{CHATBOT_API}/chat",
            json={"message": message, "user_id": USER_ID},
            timeout=30
        )
        
        if response.status_code != 200:
            print(f"FAIL - HTTP {response.status_code}")
            print(f"Error: {response.text[:200]}")
            return False
        
        data = response.json()
        response_text = data.get('response', '')
        
        # Check for common emojis
        emoji_chars = ['📦', '📍', '🔥', '💪', '🍚', '🥑', '📊', '⏳', '✅', '🍽️', '📅', '🧂', '🌾', '🍬', '🔍', '🆔', '⏰', '📝']
        found_emojis = [emoji for emoji in emoji_chars if emoji in response_text]
        
        if check_for_emojis and found_emojis:
            print(f"FAIL - Found emojis: {', '.join(found_emojis)}")
            print(f"Response preview: {response_text[:150]}...")
            return False
        
        print(f"PASS - No emojis found")
        print(f"Response length: {len(response_text)} characters")
        print(f"Preview: {response_text[:100]}...")
        return True
        
    except Exception as e:
        print(f"FAIL - Exception: {str(e)}")
        return False

def main():
    print("\n" + "="*60)
    print("NEXT_STEPS.md IMPLEMENTATION VERIFICATION")
    print("="*60)
    print(f"Chatbot API: {CHATBOT_API}")
    print(f"Test User: {USER_ID}")
    print("="*60)
    
    # Check API health first
    if not check_api_health():
        sys.exit(1)
    
    # Test cases for emoji-fixed functions
    tests = [
        ("Show my nutrition profile", "get_user_nutrition_profile"),
        ("Show my orders", "get_my_orders"),
        ("What are my nutrition totals for today?", "get_daily_nutrition_totals"),
        ("Show my meal history for the past 7 days", "get_meal_history"),
        ("Search for burger items", "search_nutrition_food_items"),
    ]
    
    print("\n" + "="*60)
    print("RUNNING EMOJI VERIFICATION TESTS")
    print("="*60)
    
    results = []
    for message, function_name in tests:
        result = test_function(message, function_name)
        results.append((function_name, result))
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    passed = sum(1 for _, r in results if r)
    total = len(results)
    
    print(f"\nResults: {passed}/{total} tests passed")
    print()
    
    for function_name, result in results:
        status = "PASS" if result else "FAIL"
        symbol = "+" if result else "X"
        print(f"  [{symbol}] {status} - {function_name}")
    
    print("\n" + "="*60)
    
    if passed == total:
        print("SUCCESS - All emoji fixes verified!")
        print("="*60)
        print("\nNext steps:")
        print("1. Test the frontend at http://localhost:5173/chatbot")
        print("2. Try voice input/output features")
        print("3. Create test orders and track nutrition")
        return 0
    else:
        print("INCOMPLETE - Some tests failed")
        print("="*60)
        print("\nTroubleshooting:")
        print("1. Restart the chatbot API to clear cache")
        print("2. Check if system prompt update is active")
        print("3. Clear chat history if needed")
        return 1

if __name__ == "__main__":
    sys.exit(main())
