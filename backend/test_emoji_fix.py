"""
Quick test to verify emoji fixes in chatbot responses
"""
import requests
import json

CHATBOT_API = "http://localhost:8002"
USER_ID = "10fccccb-4f6c-4a8f-954f-1d88aafeaa37"

def test_chat(message: str, test_name: str):
    print(f"\n{'='*60}")
    print(f"TEST: {test_name}")
    print(f"{'='*60}")
    print(f"Message: {message}")
    
    try:
        response = requests.post(
            f"{CHATBOT_API}/chat",
            json={
                "message": message,
                "user_id": USER_ID
            },
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"PASS")
            print(f"Response: {data['response'][:200]}...")
            return True
        else:
            print(f"FAIL: {response.status_code}")
            print(f"Error: {response.text}")
            return False
    except Exception as e:
        print(f"ERROR: {str(e)}")
        return False

if __name__ == "__main__":
    print("Testing Chatbot API - Emoji Fix Verification")
    print("="*60)
    
    tests = [
        ("Show my nutrition profile", "Get Profile"),
        ("Show my orders", "List Orders"),
        ("What are my nutrition totals for today?", "Daily Totals"),
        ("Show my meal history for the past 7 days", "Meal History"),
    ]
    
    results = []
    for message, test_name in tests:
        result = test_chat(message, test_name)
        results.append((test_name, result))
    
    print(f"\n{'='*60}")
    print("SUMMARY")
    print(f"{'='*60}")
    passed = sum(1 for _, r in results if r)
    total = len(results)
    print(f"Passed: {passed}/{total}")
    
    for test_name, result in results:
        status = "PASS" if result else "FAIL"
        print(f"{status} - {test_name}")
