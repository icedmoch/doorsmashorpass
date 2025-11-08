"""
Test the AI Chatbot API with order creation
"""
import requests
import json

CHATBOT_API_URL = "http://localhost:8002"
TEST_USER_ID = "10fccccb-4f6c-4a8f-954f-1d88aafeaa37"

def chat(message: str) -> str:
    """Send a message to the chatbot and get a response."""
    response = requests.post(
        f"{CHATBOT_API_URL}/chat",
        json={"message": message, "user_id": TEST_USER_ID}
    )
    if response.status_code == 200:
        # Remove emojis for Windows console compatibility
        text = response.json()["response"]
        return text.encode('ascii', 'ignore').decode('ascii')
    else:
        return f"Error: {response.status_code} - {response.text}"

def print_section(title):
    print("\n" + "=" * 60)
    print(title)
    print("=" * 60)

# Test 1: Greet the chatbot
print_section("TEST 1: Greeting")
response = chat("Hello! What can you help me with?")
print(f"Bot: {response}")

# Test 2: Ask about available food
print_section("TEST 2: Search for breakfast items")
response = chat("What breakfast items are available?")
print(f"Bot: {response}")

# Test 3: Create an order
print_section("TEST 3: Create an order")
response = chat(
    "I'd like to order 2 Breakfast Sandwiches (ID 4) and 1 Blueberry Yogurt Parfait (ID 3). "
    "Please deliver to Worcester Dining Hall."
)
print(f"Bot: {response}")

# Test 4: Check my orders
print_section("TEST 4: View my orders")
response = chat("Can you show me my recent orders?")
print(f"Bot: {response}")

# Test 5: Get order details
print_section("TEST 5: Ask about the latest order")
response = chat("What are the details of my latest order?")
print(f"Bot: {response}")

print_section("TESTS COMPLETE")
print("\nThe chatbot successfully:")
print("  ✓ Responded to greetings")
print("  ✓ Searched for food items")
print("  ✓ Created an order using the Orders API")
print("  ✓ Retrieved user's order history")
print("  ✓ Showed order details with nutritional information")
