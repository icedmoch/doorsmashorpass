"""
Test script for Chatbot API integration with Nutrition and Orders APIs
Tests all new tools added to the chatbot
"""
import asyncio
import httpx
from datetime import datetime

# Configuration
CHATBOT_API_URL = "http://localhost:8002"
TEST_USER_ID = "10fccccb-4f6c-4a8f-954f-1d88aafeaa37"  # From database

# Test data
TEST_QUERIES = {
    "nutrition_search": [
        "Search for chicken items available on November 10, 2025",
        "Find all French Fries in the database",
        "Show me breakfast items from Berkshire",
    ],
    "nutrition_logging": [
        "Log the Spicy Deluxe Fried Chicken Sandwich (ID: 46) as 1 serving for lunch",
        "Add 2 servings of French Fries (ID: 44) to my lunch today",
    ],
    "nutrition_totals": [
        "What are my nutrition totals for today?",
        "Show me my daily calories and macros",
    ],
    "nutrition_history": [
        "Show me my meal history for the past 7 days",
        "What did I eat this week?",
    ],
    "nutrition_profile": [
        "Show me my nutrition profile",
        "What are my fitness goals and TDEE?",
    ],
    "order_search": [
        "What's available for lunch at Berkshire on Monday?",
        "Show me the menu for November 10, 2025",
    ],
    "order_creation": [
        "I want to order the Buffalo Chicken Wrap from Berkshire",
        "Create an order for Chicken Caesar Salad, deliver to Southwest Dorms",
    ],
    "order_management": [
        "Show me my recent orders",
        "What's the status of my last order?",
    ],
}

async def test_chatbot_endpoint(query: str, user_id: str = TEST_USER_ID):
    """Test a single chatbot query"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{CHATBOT_API_URL}/chat",
                json={
                    "message": query,
                    "user_id": user_id,
                    "user_location": {
                        "latitude": 42.3886,
                        "longitude": -72.5292
                    }
                },
                timeout=30.0
            )

            if response.status_code == 200:
                result = response.json()
                return {
                    "success": True,
                    "query": query,
                    "response": result.get("response", ""),
                    "status": response.status_code
                }
            else:
                return {
                    "success": False,
                    "query": query,
                    "error": f"HTTP {response.status_code}: {response.text}",
                    "status": response.status_code
                }
        except Exception as e:
            return {
                "success": False,
                "query": query,
                "error": str(e),
                "status": None
            }

async def test_all_categories():
    """Test all chatbot capabilities"""
    print("=" * 80)
    print("CHATBOT API INTEGRATION TEST")
    print("=" * 80)
    print(f"Testing chatbot at: {CHATBOT_API_URL}")
    print(f"Test user ID: {TEST_USER_ID}")
    print(f"Test date: {datetime.now().strftime('%Y-%m-%d')}")
    print("=" * 80)

    results = {}

    for category, queries in TEST_QUERIES.items():
        print(f"\n{'=' * 80}")
        print(f"Testing: {category.upper().replace('_', ' ')}")
        print(f"{'=' * 80}")

        category_results = []

        for i, query in enumerate(queries, 1):
            print(f"\n[{i}/{len(queries)}] Testing query:")
            print(f"  └─ {query}")

            result = await test_chatbot_endpoint(query)
            category_results.append(result)

            if result["success"]:
                print(f"  ✅ SUCCESS (HTTP {result['status']})")
                print(f"\n  Response Preview:")
                response_preview = result['response'][:300]
                if len(result['response']) > 300:
                    response_preview += "..."
                for line in response_preview.split('\n'):
                    print(f"    {line}")
            else:
                print(f"  ❌ FAILED")
                print(f"  Error: {result['error']}")

            # Small delay between requests
            await asyncio.sleep(1)

        results[category] = category_results

    # Summary
    print(f"\n{'=' * 80}")
    print("TEST SUMMARY")
    print(f"{'=' * 80}")

    total_tests = 0
    total_success = 0

    for category, category_results in results.items():
        success_count = sum(1 for r in category_results if r["success"])
        total_count = len(category_results)
        total_tests += total_count
        total_success += success_count

        status = "✅" if success_count == total_count else "⚠️"
        print(f"{status} {category.replace('_', ' ').title()}: {success_count}/{total_count} passed")

    print(f"\n{'=' * 80}")
    print(f"OVERALL: {total_success}/{total_tests} tests passed ({total_success/total_tests*100:.1f}%)")
    print(f"{'=' * 80}")

    return results

async def test_specific_use_cases():
    """Test specific use cases mentioned by the user"""
    print(f"\n{'=' * 80}")
    print("SPECIFIC USE CASE TESTS (November 10, 2025 Data)")
    print(f"{'=' * 80}")

    specific_tests = [
        # Nutrition search for Monday November 10
        {
            "name": "Search food items for November 10, 2025",
            "query": "Search for all available food items on 2025-11-10"
        },
        {
            "name": "Search chicken items for November 10",
            "query": "Find chicken items available on November 10, 2025"
        },
        # Order creation from November 10 menu
        {
            "name": "Order from November 10 menu",
            "query": "I want to order the Spicy Deluxe Fried Chicken Sandwich from the November 10 menu, deliver to Baker Hall"
        },
        # Nutrition logging
        {
            "name": "Log meal from database",
            "query": "Log Chicken Caesar Salad (ID: 49) as 1 serving for lunch today"
        },
        # Profile check
        {
            "name": "Check nutrition profile",
            "query": "Show me my current nutrition profile and goals"
        },
    ]

    for i, test in enumerate(specific_tests, 1):
        print(f"\n[{i}/{len(specific_tests)}] {test['name']}")
        print(f"  Query: {test['query']}")

        result = await test_chatbot_endpoint(test['query'])

        if result["success"]:
            print(f"  ✅ SUCCESS")
            print(f"\n  Response:")
            for line in result['response'].split('\n'):
                print(f"    {line}")
        else:
            print(f"  ❌ FAILED: {result['error']}")

        await asyncio.sleep(1)

async def main():
    """Run all tests"""
    print("\n🤖 Starting Chatbot Integration Tests...\n")

    # Check if chatbot API is running
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{CHATBOT_API_URL}/", timeout=5.0)
            if response.status_code == 200:
                api_info = response.json()
                print(f"✅ Chatbot API is running")
                print(f"   Version: {api_info.get('version', 'unknown')}")
                print(f"   Model: {api_info.get('model', 'unknown')}")
            else:
                print(f"⚠️  Chatbot API responded with status {response.status_code}")
    except Exception as e:
        print(f"❌ Cannot connect to Chatbot API at {CHATBOT_API_URL}")
        print(f"   Error: {e}")
        print(f"\n💡 Make sure the chatbot API is running:")
        print(f"   python backend/chatbot_api.py")
        return

    # Run all tests
    await test_all_categories()

    # Run specific use cases
    await test_specific_use_cases()

    print(f"\n{'=' * 80}")
    print("✅ All tests completed!")
    print(f"{'=' * 80}\n")

if __name__ == "__main__":
    asyncio.run(main())
