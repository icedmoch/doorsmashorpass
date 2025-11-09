import requests
import json

# Test the profile endpoint
url = "http://localhost:8002/chat"
payload = {
    "message": "Show me my nutrition profile",
    "user_id": "10fccccb-4f6c-4a8f-954f-1d88aafeaa37"
}

try:
    response = requests.post(url, json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e}")
    print(f"Response text: {response.text if 'response' in locals() else 'No response'}")
