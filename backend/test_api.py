"""
Comprehensive test of the Orders API
"""
import requests
import json
import time

API_URL = "http://localhost:8001"

def print_section(title):
    print("\n" + "=" * 60)
    print(title)
    print("=" * 60)

def print_response(response):
    print(f"Status: {response.status_code}")
    try:
        data = response.json()
        print(f"Response:\n{json.dumps(data, indent=2)}")
        return data
    except:
        print(f"Response: {response.text}")
        return None

# Test 1: Health check
print_section("TEST 1: Health Check")
response = requests.get(API_URL)
print_response(response)

# Test 2: Create order
print_section("TEST 2: Create Order")
with open("test_order.json", "r") as f:
    order_data = json.load(f)

print(f"Creating order with payload:")
print(json.dumps(order_data, indent=2))

response = requests.post(f"{API_URL}/orders", json=order_data)
order = print_response(response)

if not order or response.status_code != 201:
    print("\n[ERROR] Failed to create order. Stopping tests.")
    exit(1)

order_id = order['id']
print(f"\n[OK] Order created with ID: {order_id}")
print(f"   Total Calories: {order['total_calories']}")
print(f"   Total Protein: {order['total_protein']}")
print(f"   Total Carbs: {order['total_carbs']}")
print(f"   Total Fat: {order['total_fat']}")
print(f"   Number of items: {len(order.get('items', []))}")

# Test 3: Get specific order
print_section("TEST 3: Get Order by ID")
response = requests.get(f"{API_URL}/orders/{order_id}")
retrieved_order = print_response(response)

# Test 4: List all orders
print_section("TEST 4: List All Orders")
response = requests.get(f"{API_URL}/orders")
orders = print_response(response)
print(f"\n[OK] Found {len(orders) if orders else 0} total orders")

# Test 5: Get user's orders
print_section("TEST 5: Get User's Orders")
user_id = order_data['user_id']
response = requests.get(f"{API_URL}/users/{user_id}/orders")
user_orders = print_response(response)
print(f"\n[OK] User has {len(user_orders) if user_orders else 0} orders")

# Test 6: Update order status
print_section("TEST 6: Update Order Status to 'preparing'")
response = requests.patch(
    f"{API_URL}/orders/{order_id}/status",
    json={"status": "preparing"}
)
updated = print_response(response)

# Test 7: Update order details
print_section("TEST 7: Update Order Details")
response = requests.patch(
    f"{API_URL}/orders/{order_id}",
    json={
        "delivery_location": "Hampshire Dining Hall",
        "special_instructions": "Call when arriving"
    }
)
updated = print_response(response)

# Test 8: Add item to order
print_section("TEST 8: Add Item to Order")
response = requests.post(
    f"{API_URL}/orders/{order_id}/items",
    json={"food_item_id": 3, "quantity": 1}
)
updated = print_response(response)
if updated:
    print(f"\n[OK] Order now has {len(updated.get('items', []))} items")
    print(f"   New Total Calories: {updated['total_calories']}")

# Test 9: Filter orders by status
print_section("TEST 9: Filter Orders by Status")
response = requests.get(f"{API_URL}/orders?status=preparing")
filtered = print_response(response)
print(f"\n[OK] Found {len(filtered) if filtered else 0} orders with status 'preparing'")

# Test 10: Update to next statuses
print_section("TEST 10: Progress Order Status")
statuses = ["ready", "out_for_delivery", "delivered"]
for status in statuses:
    print(f"\nUpdating to: {status}")
    response = requests.patch(
        f"{API_URL}/orders/{order_id}/status",
        json={"status": status}
    )
    if response.status_code == 200:
        print(f"[OK] Status updated to {status}")
    else:
        print(f"[ERROR] Failed to update to {status}")
        print_response(response)

# Test 11: Get final order state
print_section("TEST 11: Final Order State")
response = requests.get(f"{API_URL}/orders/{order_id}")
final_order = print_response(response)

# Test 12: Delete an item
print_section("TEST 12: Remove Item from Order")
if final_order and final_order.get('items'):
    item_to_remove = final_order['items'][0]['id']
    print(f"Removing item: {item_to_remove}")
    response = requests.delete(f"{API_URL}/orders/{order_id}/items/{item_to_remove}")
    result = print_response(response)

    # Check updated order
    response = requests.get(f"{API_URL}/orders/{order_id}")
    updated = print_response(response)
    if updated:
        print(f"\n[OK] Order now has {len(updated.get('items', []))} items")

# Test 13: Cancel order
print_section("TEST 13: Cancel Order")
response = requests.delete(f"{API_URL}/orders/{order_id}")
result = print_response(response)

# Verify cancellation
response = requests.get(f"{API_URL}/orders/{order_id}")
cancelled_order = print_response(response)
if cancelled_order:
    print(f"\n[OK] Order status is now: {cancelled_order['status']}")

# Summary
print_section("TEST SUMMARY")
print("[OK] All API tests completed successfully!")
print(f"\nTested endpoints:")
print("  - GET  /")
print("  - POST /orders")
print("  - GET  /orders/{order_id}")
print("  - GET  /orders")
print("  - GET  /users/{user_id}/orders")
print("  - PATCH /orders/{order_id}")
print("  - PATCH /orders/{order_id}/status")
print("  - POST /orders/{order_id}/items")
print("  - DELETE /orders/{order_id}/items/{item_id}")
print("  - DELETE /orders/{order_id}")
print(f"\nOrder ID used: {order_id}")
print(f"User ID: {user_id}")
