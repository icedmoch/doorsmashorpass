"""Test order creation through chatbot API"""
import requests
import json

CHATBOT_API_URL = "http://localhost:8002"
TEST_USER_ID = "10fccccb-4f6c-4a8f-954f-1d88aafeaa37"

def test_order_creation():
    """Test creating an order through the chatbot"""

    # Test message to create an order
    message = "I want to order Big Mack Burger (ID 68) for delivery to Southwest Dorms room 123"

    payload = {
        "message": message,
        "user_id": TEST_USER_ID,
        "user_location": {
            "latitude": 42.3906,
            "longitude": -72.5301
        }
    }

    print(f"Testing order creation with message: {message}")
    print(f"User ID: {TEST_USER_ID}")
    print()

    try:
        response = requests.post(f"{CHATBOT_API_URL}/chat", json=payload)

        print(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print(f"Success! Response:")
            print(result.get('response', 'No response'))
        else:
            print(f"Error: {response.status_code}")
            print(f"Response: {response.text}")

    except Exception as e:
        print(f"Exception occurred: {e}")

if __name__ == "__main__":
    test_order_creation()
