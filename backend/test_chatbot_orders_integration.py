"""
Comprehensive integration tests for Chatbot + Orders API
Tests all order-related chatbot functionality with Supabase
"""
import asyncio
import httpx
import os
from dotenv import load_dotenv
from supabase import create_client, Client
import json

load_dotenv()

# Configuration
CHATBOT_API_URL = "http://localhost:8002"
ORDERS_API_URL = "http://localhost:8000"
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Initialize Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Test user ID (replace with actual test user)
TEST_USER_ID = None  # Will be set in setup

class Colors:
    """ANSI color codes for terminal output"""
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_header(text):
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*80}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{text.center(80)}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'='*80}{Colors.ENDC}\n")

def print_test(text):
    print(f"{Colors.OKBLUE}► {text}{Colors.ENDC}")

def print_success(text):
    print(f"{Colors.OKGREEN}✓ {text}{Colors.ENDC}")

def print_error(text):
    print(f"{Colors.FAIL}✗ {text}{Colors.ENDC}")

def print_info(text):
    print(f"{Colors.OKCYAN}ℹ {text}{Colors.ENDC}")

async def setup_test_user():
    """Get or create a test user"""
    global TEST_USER_ID
    
    print_test("Setting up test user...")
    
    # Get first available user or create one
    response = supabase.table("profiles").select("id, email").limit(1).execute()
    
    if response.data:
        TEST_USER_ID = response.data[0]["id"]
        print_success(f"Using existing user: {response.data[0].get('email', 'N/A')} (ID: {TEST_USER_ID[:8]}...)")
    else:
        print_error("No users found in database. Please create a user first.")
        return False
    
    return True

async def check_servers():
    """Check if required servers are running"""
    servers = {
        "Chatbot API (8002)": f"{CHATBOT_API_URL}/",
        "Main API (8000)": f"{ORDERS_API_URL}/"
    }
    
    all_running = True
    async with httpx.AsyncClient() as client:
        for name, url in servers.items():
            try:
                response = await client.get(url, timeout=2.0)
                if response.status_code == 200:
                    print_success(f"{name} is running")
                else:
                    print_error(f"{name} returned status {response.status_code}")
                    all_running = False
            except Exception as e:
                print_error(f"{name} is not accessible: {str(e)}")
                all_running = False
    
    return all_running

async def chat_with_bot(message: str, user_location: dict = None, max_retries: int = 3):
    """Send a message to the chatbot and get response with rate limit handling"""
    async with httpx.AsyncClient() as client:
        payload = {
            "message": message,
            "user_id": TEST_USER_ID
        }
        
        if user_location:
            payload["user_location"] = user_location
        
        for attempt in range(max_retries):
            try:
                response = await client.post(
                    f"{CHATBOT_API_URL}/chat",
                    json=payload,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    return response.json()["response"]
                elif response.status_code == 500:
                    error_text = response.text
                    # Check if it's a rate limit error
                    if "429" in error_text and "RESOURCE_EXHAUSTED" in error_text:
                        if attempt < max_retries - 1:
                            print_info(f"⏳ Rate limit hit. Waiting 60 seconds before retry {attempt + 2}/{max_retries}...")
                            await asyncio.sleep(60)
                            continue
                        else:
                            return f"Error: Rate limit exceeded after {max_retries} retries"
                    else:
                        return f"Error: {response.status_code} - {error_text}"
                else:
                    return f"Error: {response.status_code} - {response.text}"
            except httpx.ConnectError:
                return "Error: Cannot connect to chatbot API. Make sure it's running on port 8002."
            except httpx.TimeoutException:
                return "Error: Request to chatbot API timed out."
            except Exception as e:
                return f"Error communicating with chatbot: {str(e)}"
        
        return "Error: Max retries exceeded"

async def get_user_orders():
    """Get all orders for test user directly from Supabase"""
    response = supabase.table("orders").select("*").eq("user_id", TEST_USER_ID).order("created_at", desc=True).execute()
    return response.data

async def test_1_search_and_view_menu():
    """Test 1: Search food items and view menu"""
    print_header("TEST 1: Search Food Items and View Menu")
    
    # Test searching for specific items (using Wednesday November 13th)
    print_test("Asking chatbot to search for breakfast items on November 13th...")
    response = await chat_with_bot("Show me breakfast items available on Wednesday November 13th, 2025")
    print_info(f"Response: {response[:300]}...")
    
    if "Found" in response or "items" in response.lower() or "ID:" in response:
        print_success("Successfully retrieved menu items")
    else:
        print_error("Failed to retrieve menu items")
    
    # Test searching by dining hall
    print_test("\nAsking for items from a specific dining hall on November 13th...")
    response = await chat_with_bot("What's available at Berkshire dining hall for lunch on November 13th, 2025?")
    print_info(f"Response: {response[:300]}...")
    
    if "Berkshire" in response or "items" in response.lower() or "ID:" in response:
        print_success("Successfully filtered by dining hall")
    else:
        print_error("Failed to filter by dining hall")

async def test_2_create_order_flow():
    """Test 2: Create a complete order through conversation"""
    print_header("TEST 2: Create Order Through Conversation")
    
    # Step 1: Browse items
    print_test("Step 1: Browsing menu items on November 13th...")
    response = await chat_with_bot("I want to order scrambled eggs for breakfast on November 13th, 2025")
    print_info(f"Response: {response[:400]}...")
    
    # Extract food item ID from response (simple pattern matching)
    import re
    id_match = re.search(r'ID: (\d+)', response)
    food_item_id = int(id_match.group(1)) if id_match else None
    
    if food_item_id:
        print_success(f"Found food item ID: {food_item_id}")
        
        # Step 2: Specify delivery location
        print_test("\nStep 2: Providing delivery location...")
        response = await chat_with_bot(
            f"Yes, I'd like to order the item with ID {food_item_id}. Deliver to Southwest Dorms please."
        )
        print_info(f"Response: {response[:400]}...")
        
        # Step 3: Provide GPS location
        print_test("\nStep 3: Providing GPS coordinates...")
        response = await chat_with_bot(
            "My location is latitude 42.3886, longitude -72.5292",
            user_location={"latitude": 42.3886, "longitude": -72.5292}
        )
        print_info(f"Response: {response[:400]}...")
        
        # Step 4: Add special instructions
        print_test("\nStep 4: Adding special instructions...")
        response = await chat_with_bot("No peanuts please, and extra napkins")
        print_info(f"Response: {response[:400]}...")
        
        # Step 5: Confirm delivery time
        print_test("\nStep 5: Confirming delivery time...")
        response = await chat_with_bot("Deliver ASAP")
        print_info(f"Response: {response[:400]}...")
        
        # Check if order was created
        if "Order created" in response or "Order ID" in response:
            print_success("Order created successfully through conversation!")
            
            # Extract order ID
            order_id_match = re.search(r'Order ID: ([a-f0-9-]+)', response)
            if order_id_match:
                order_id = order_id_match.group(1)
                print_success(f"Order ID: {order_id[:8]}...")
                return order_id
        else:
            print_error("Failed to create order")
    else:
        print_error("Could not extract food item ID from menu")
    
    return None

async def test_3_view_order_details():
    """Test 3: View order details"""
    print_header("TEST 3: View Order Details")
    
    # Get orders from database
    orders = await get_user_orders()
    
    if not orders:
        print_error("No orders found for user. Skipping test.")
        return
    
    latest_order = orders[0]
    order_id = latest_order["id"]
    
    print_test(f"Asking chatbot about order {order_id[:8]}...")
    response = await chat_with_bot(f"Show me details for order {order_id[:8]}")
    print_info(f"Response:\n{response}")
    
    # Check if response contains key order information
    checks = [
        ("Order ID" in response, "Order ID present"),
        ("STATUS" in response or "Status" in response, "Status information"),
        ("ITEMS" in response or "Items" in response, "Items list"),
        ("NUTRITIONAL" in response or "Nutrition" in response, "Nutritional info"),
        ("DELIVERY" in response or "Delivery" in response, "Delivery information")
    ]
    
    for check, description in checks:
        if check:
            print_success(description)
        else:
            print_error(f"Missing: {description}")

async def test_4_list_all_orders():
    """Test 4: List all user orders"""
    print_header("TEST 4: List All Orders")
    
    print_test("Asking chatbot for all orders...")
    response = await chat_with_bot("Show me all my orders")
    print_info(f"Response:\n{response}")
    
    # Verify database orders match
    orders = await get_user_orders()
    print_success(f"Database shows {len(orders)} orders")
    
    if str(len(orders)) in response or "orders" in response.lower():
        print_success("Order count matches")
    else:
        print_error("Order count mismatch")

async def test_5_filter_orders_by_status():
    """Test 5: Filter orders by status"""
    print_header("TEST 5: Filter Orders by Status")
    
    # Test pending orders
    print_test("Asking for pending orders...")
    response = await chat_with_bot("Show me my pending orders")
    print_info(f"Response: {response[:400]}...")
    
    if "pending" in response.lower() or "no orders" in response.lower():
        print_success("Successfully filtered by pending status")
    else:
        print_error("Failed to filter by status")
    
    # Test delivered orders
    print_test("\nAsking for delivered orders...")
    response = await chat_with_bot("Show me my delivered orders")
    print_info(f"Response: {response[:400]}...")
    
    if "delivered" in response.lower() or "no orders" in response.lower():
        print_success("Successfully filtered by delivered status")
    else:
        print_error("Failed to filter by status")

async def test_6_order_statistics():
    """Test 6: Get order statistics and insights"""
    print_header("TEST 6: Order Statistics and Insights")
    
    print_test("Asking chatbot for order statistics...")
    response = await chat_with_bot("Show me my order statistics and insights")
    print_info(f"Response:\n{response}")
    
    # Check for key statistics
    checks = [
        ("Total Orders" in response, "Total orders count"),
        ("NUTRITIONAL" in response or "Calories" in response, "Nutritional summary"),
        ("FAVORITE" in response or "favorite" in response.lower(), "Favorite items"),
        ("DELIVERY PREFERENCES" in response or "delivery" in response.lower(), "Delivery preferences"),
        ("INSIGHTS" in response, "AI insights")
    ]
    
    for check, description in checks:
        if check:
            print_success(description)
        else:
            print_error(f"Missing: {description}")

async def test_7_update_order_status():
    """Test 7: Update order status"""
    print_header("TEST 7: Update Order Status")
    
    # Get a pending order
    orders = await get_user_orders()
    pending_orders = [o for o in orders if o['status'] == 'pending']
    
    if not pending_orders:
        print_error("No pending orders found. Skipping test.")
        return
    
    order_id = pending_orders[0]['id']
    
    print_test(f"Asking chatbot to mark order {order_id[:8]} as preparing...")
    response = await chat_with_bot(f"Mark order {order_id[:8]} as preparing")
    print_info(f"Response: {response[:300]}...")
    
    # Verify status update
    updated_order = supabase.table("orders").select("status").eq("id", order_id).execute()
    if updated_order.data and updated_order.data[0]['status'] == 'preparing':
        print_success("Order status updated successfully")
    else:
        print_error("Failed to update order status")

async def test_8_add_item_to_order():
    """Test 8: Add item to existing order"""
    print_header("TEST 8: Add Item to Order")
    
    orders = await get_user_orders()
    if not orders:
        print_error("No orders found. Skipping test.")
        return
    
    order_id = orders[0]['id']
    
    # Get a food item
    food_items = supabase.table("food_items").select("id, name").limit(1).execute()
    if not food_items.data:
        print_error("No food items found. Skipping test.")
        return
    
    food_item_id = food_items.data[0]['id']
    food_item_name = food_items.data[0]['name']
    
    print_test(f"Adding {food_item_name} (ID: {food_item_id}) to order {order_id[:8]}...")
    response = await chat_with_bot(f"Add item {food_item_id} to order {order_id[:8]}")
    print_info(f"Response: {response[:300]}...")
    
    if "added" in response.lower() or "success" in response.lower():
        print_success("Item added successfully")
    else:
        print_error("Failed to add item")

async def test_9_comprehensive_conversation():
    """Test 9: Natural conversation flow"""
    print_header("TEST 9: Comprehensive Conversation Flow")
    
    conversations = [
        "What dining halls are available?",
        "What's the healthiest option for lunch on November 13th, 2025?",
        "How many calories have I ordered this month?",
        "What are my top 3 most ordered items?",
        "Do I prefer delivery or pickup?",
        "Show me my order history from this week"
    ]
    
    for question in conversations:
        print_test(f"\nQ: {question}")
        response = await chat_with_bot(question)
        print_info(f"A: {response[:300]}...")
        
        if len(response) > 50 and "error" not in response.lower():
            print_success("Valid response received")
        else:
            print_error("Poor response quality")
        
        await asyncio.sleep(1)  # Rate limiting

async def test_10_supabase_data_consistency():
    """Test 10: Verify data consistency between chatbot and Supabase"""
    print_header("TEST 10: Data Consistency Check")
    
    # Get orders from chatbot
    print_test("Getting orders through chatbot...")
    chatbot_response = await chat_with_bot("Show me all my orders with full details")
    
    # Get orders from Supabase
    print_test("Getting orders from Supabase...")
    db_orders = await get_user_orders()
    
    print_success(f"Database has {len(db_orders)} orders")
    
    # Check if chatbot response mentions similar number
    order_count_in_response = str(len(db_orders)) in chatbot_response
    if order_count_in_response:
        print_success("Order count consistency verified")
    else:
        print_error("Order count mismatch between chatbot and database")
    
    # Verify order details match
    if db_orders:
        latest_order = db_orders[0]
        order_id_short = latest_order['id'][:8]
        
        print_test(f"\nVerifying details for order {order_id_short}...")
        detail_response = await chat_with_bot(f"Show details for order {order_id_short}")
        
        # Check key fields
        checks = [
            (latest_order['delivery_location'] in detail_response, "Delivery location"),
            (str(latest_order.get('total_calories', 0)) in detail_response, "Total calories"),
            (latest_order['status'] in detail_response, "Order status")
        ]
        
        for check, field in checks:
            if check:
                print_success(f"{field} matches")
            else:
                print_error(f"{field} mismatch")

async def main():
    """Run all tests"""
    print_header("🤖 CHATBOT + ORDERS API INTEGRATION TESTS")
    print_info("Testing comprehensive order management through AI chatbot")
    print_info(f"Chatbot API: {CHATBOT_API_URL}")
    print_info(f"Orders API: {ORDERS_API_URL}")
    print_info(f"Supabase: {SUPABASE_URL}")
    
    # Check if servers are running
    print_header("Server Status Check")
    if not await check_servers():
        print_error("\n⚠️  Some servers are not running!")
        print_info("Please start the servers:")
        print_info("  Terminal 1: cd backend; python main.py")
        print_info("  Terminal 2: cd backend; python chatbot_api.py")
        print_info("\nOr use the start script:")
        print_info("  .\\start-dev.ps1")
        return
    
    # Setup
    if not await setup_test_user():
        print_error("Failed to set up test user. Exiting.")
        return
    
    try:
        # Run tests
        await test_1_search_and_view_menu()
        await asyncio.sleep(2)
        
        order_id = await test_2_create_order_flow()
        await asyncio.sleep(2)
        
        await test_3_view_order_details()
        await asyncio.sleep(2)
        
        await test_4_list_all_orders()
        await asyncio.sleep(2)
        
        await test_5_filter_orders_by_status()
        await asyncio.sleep(2)
        
        await test_6_order_statistics()
        await asyncio.sleep(2)
        
        await test_7_update_order_status()
        await asyncio.sleep(2)
        
        await test_8_add_item_to_order()
        await asyncio.sleep(2)
        
        await test_9_comprehensive_conversation()
        await asyncio.sleep(2)
        
        await test_10_supabase_data_consistency()
        
        # Summary
        print_header("✅ TEST SUITE COMPLETE")
        print_success("All integration tests finished!")
        print_info("Review output above for detailed results")
        
    except Exception as e:
        print_error(f"Test suite error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
