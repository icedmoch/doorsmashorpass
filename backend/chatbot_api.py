"""
AI Chatbot API for UMass Dining Hall Orders
Uses PydanticAI with Gemini to help users create orders from dining hall menus
Stores chat history in Supabase and uses current date for menu queries
Integrated with Nutrition API and Orders API via HTTP
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pydantic_ai import Agent, RunContext
from dataclasses import dataclass
from datetime import datetime
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv
from typing import Optional, List
from supabase import create_client, Client
import httpx

load_dotenv()

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in .env file")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# API Base URLs (configurable)
NUTRITION_API_BASE = os.getenv("NUTRITION_API_BASE", "http://localhost:8000")
ORDERS_API_BASE = os.getenv("ORDERS_API_BASE", "http://localhost:8000")

<<<<<<< HEAD
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
=======
@app.on_event("startup")
async def startup():
>>>>>>> dbda1f1fece40435be928702eaaaedc169b10ca1
    os.environ.setdefault("GOOGLE_API_KEY", os.getenv("GOOGLE_API_KEY", ""))
    yield
    # Shutdown (if needed)

app = FastAPI(title="DoorSmash AI Chatbot API", lifespan=lifespan)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserLocation(BaseModel):
    latitude: float
    longitude: float

class ChatRequest(BaseModel):
    message: str
    user_id: str  # UUID of the user
    user_location: Optional[UserLocation] = None  # GPS coordinates from browser

class ChatResponse(BaseModel):
    response: str

# Helper functions for chat history
async def save_chat_message(user_id: str, role: str, message: str):
    """Save a chat message to Supabase"""
    try:
        supabase.table("chat_history").insert({
            "user_id": user_id,
            "role": role,
            "message": message
        }).execute()
    except Exception as e:
        print(f"Error saving chat message: {e}")

async def get_chat_history(user_id: str, limit: int = 10) -> List[dict]:
    """Get recent chat history for context"""
    try:
        response = supabase.table("chat_history")\
            .select("role, message, created_at")\
            .eq("user_id", user_id)\
            .order("created_at", desc=True)\
            .limit(limit)\
            .execute()

        # Reverse to get chronological order
        return list(reversed(response.data)) if response.data else []
    except Exception as e:
        print(f"Error fetching chat history: {e}")
        return []

def get_current_date_formatted() -> str:
    """Get current date in the format used by food_items table"""
    # Format: "Fri November 08, 2025"
    return datetime.now().strftime("%a %B %d, %Y")

def normalize_date_format(date_str: str) -> str:
    """Normalize various date formats to match database format 'Mon November 10, 2025'"""
    try:
        from dateutil import parser
        # Try to parse the date string flexibly
        parsed_date = parser.parse(date_str, fuzzy=True)
        # Format to match database: "Mon November 10, 2025"
        return parsed_date.strftime("%a %B %d, %Y")
    except:
        # If parsing fails, try some manual conversions
        date_str = date_str.strip()

        # Replace full day names with abbreviations
        day_mapping = {
            'Monday': 'Mon', 'Tuesday': 'Tue', 'Wednesday': 'Wed',
            'Thursday': 'Thu', 'Friday': 'Fri', 'Saturday': 'Sat', 'Sunday': 'Sun'
        }

        for full_day, abbr_day in day_mapping.items():
            if full_day in date_str:
                date_str = date_str.replace(full_day, abbr_day)
                break

        # Ensure there's a comma after the day number if it's missing
        # Pattern: "Mon November 10 2025" -> "Mon November 10, 2025"
        import re
        date_str = re.sub(r'(\d{1,2})\s+(\d{4})', r'\1, \2', date_str)

        return date_str

def get_available_dates_for_location(location: Optional[str] = None) -> List[str]:
    """Get list of available dates in the database"""
    try:
        query = supabase.table("food_items").select("date")
        if location:
            query = query.ilike("location", f"%{location}%")

        response = query.execute()

        # Extract unique dates
        dates = list(set([item['date'] for item in response.data if 'date' in item]))
        return sorted(dates)
    except:
        return []

def is_weekend(date_str: str) -> bool:
    """Check if a date string represents a weekend (Saturday or Sunday)"""
    try:
        # Check if the date string starts with 'Sat' or 'Sun'
        date_str = date_str.strip()
        if date_str.startswith('Sat') or date_str.startswith('Sun'):
            return True

        # Alternative: parse the date and check day of week
        from dateutil import parser
        parsed_date = parser.parse(date_str, fuzzy=True)
        # weekday() returns 5 for Saturday, 6 for Sunday
        return parsed_date.weekday() in [5, 6]
    except:
        return False

# Dependencies for the agent
@dataclass
class ChatbotDeps:
    user_id: str
    chat_history: List[dict]
    user_location: Optional[dict] = None  # {latitude: float, longitude: float}
    http_client: httpx.AsyncClient = None  # HTTP client for API calls

# Create the agent with Gemini
agent = Agent(
    'google-gla:gemini-2.5-flash',
    deps_type=ChatbotDeps,
    system_prompt="""You are a helpful UMass dining hall assistant for DoorSmash.

YOUR ROLE:
1. ORDERS - Browse dining hall menus, create/manage food delivery orders
2. NUTRITION - Track meals, monitor calories/macros, manage health goals
3. PROFILE - Help users set dietary preferences, goals, and health metrics
4. INTEGRATION - Offer to track ordered food in nutrition log (always ask first!)

ORDER CREATION PROCESS - FOLLOW THIS STRICTLY:
When a user wants to create an order, you MUST collect ALL information before calling create_order:

REQUIRED FIELDS:
1. food_item_ids - Which items they want (from search results)
2. quantities - How many of each item
3. delivery_location - WHERE to deliver (text address)
   - Ask: "Where would you like this delivered?"
   - Examples: "Southwest Dorms", "Baker Hall Room 420", "Central Campus"

OPTIONAL BUT IMPORTANT FIELDS:
4. delivery_latitude & delivery_longitude - User's current location coordinates
   - Ask: "Can you share your current location? This helps our drivers find you faster!"
   - If they can't share, that's okay - just use the text address
5. delivery_time - WHEN to deliver
   - Ask: "When would you like this delivered?" or "ASAP or specific time?"
6. special_instructions - Dietary needs, allergies, preferences
   - Ask: "Any dietary restrictions, allergies, or special requests?"
7. delivery_option - "delivery" or "pickup"
   - Ask: "Would you like delivery or pickup?"

CONVERSATION FLOW FOR ORDERS:
1. User browses items → Show them options with IDs
2. User selects items → Acknowledge their choices
3. **ASK FOLLOW-UP QUESTIONS** → Collect all missing information one by one
4. Confirm order summary → Show all details before creating
5. Create order → Only after you have all required info

IMPORTANT BEHAVIORS:
- **ALWAYS ask follow-up questions** - Don't assume information!
- Be conversational - don't ask everything at once
- If user says "order X", ask for delivery location and other details
- Show nutritional information (calories, protein, carbs, fat)
- Help users make healthy choices
- Remember conversation context to avoid repeating questions
- If creating order fails due to missing info, ask for it specifically

EXAMPLE CONVERSATION:
User: "I want to order Scrambled Eggs"
You: "Great choice! The Scrambled Eggs have 110 cal and 10.6g protein. Where would you like this delivered?"
User: "Southwest Dorms"
You: "Perfect! Can you share your current location? This helps our drivers find you faster. (It's optional if you prefer not to)"
User: "Sure, lat 42.3886, long -72.5292"
You: "Thanks! Any dietary restrictions or special requests?"
User: "No peanuts please"
You: "Got it! When would you like delivery? ASAP or a specific time?"
User: "ASAP"
You: "Perfect! Here's your order summary: [details]. Should I place this order?"

Order statuses: 'pending' (default) or 'delivered'
Auto-calculated fields: total_calories, total_protein, total_carbs, total_fat"""
)

@agent.system_prompt
def add_current_date(ctx: RunContext[ChatbotDeps]) -> str:
    """Add current date and location info to system prompt dynamically"""
    current_date = get_current_date_formatted()
    # Get available dates from database
    try:
        available_dates = get_available_dates_for_location()[:5]  # Get first 5 dates
        dates_str = ", ".join(available_dates) if available_dates else "checking database..."
    except:
        dates_str = "checking database..."

    # Add location info if available
    location_info = ""
    if ctx.deps.user_location:
        lat = ctx.deps.user_location.get('latitude')
        lon = ctx.deps.user_location.get('longitude')
        location_info = f"\n- User's current location: ({lat:.4f}, {lon:.4f}) - AUTOMATICALLY CAPTURED!"

    return f"""CURRENT CONTEXT:
- Today's date: {current_date}
- When users ask about food "today" or don't specify a date, use today's date
- Available dining halls: Berkshire, Worcester, Franklin, Hampshire
- Meal types: Breakfast, Lunch, Dinner
- Sample available menu dates: {dates_str}{location_info}

AUTOMATIC LOCATION FEATURE:
- If user has shared their location, it's available in context
- When creating orders, USE the captured location coordinates automatically
- Ask: "I have your current location. Would you like delivery here?"
- If they confirm, use the coordinates in create_order
- This makes delivery faster and more accurate!

IMPORTANT DATE HANDLING:
- The search_food_items tool accepts flexible date formats
- You can use dates like "Monday November 10 2025" or "Mon November 10, 2025"
- If user asks for a specific day (e.g., "Monday"), try to infer the date or ask for clarification
- If no menu is found for a date, the tool will suggest available dates"""

@agent.tool
async def search_food_items(
    ctx: RunContext[ChatbotDeps],
    location: Optional[str] = None,
    meal_type: Optional[str] = None,
    search_term: Optional[str] = None,
    date: Optional[str] = None
) -> str:
    """Search for available food items from dining halls.

    Args:
        location: Filter by dining hall (Berkshire, Worcester, Franklin, Hampshire)
        meal_type: Filter by meal (Breakfast, Lunch, Dinner)
        search_term: Search for items containing this text (case-insensitive)
        date: Filter by date. Can be in formats like:
              - "Mon November 10, 2025" (exact format in DB)
              - "Monday November 10 2025" (will be converted)
              - "November 10 2025" (will try to match)
              - "today" or None (uses current date)

    Returns a formatted list of food items with IDs, names, nutritional info, and location.
    """
    try:
        # Use current date if not specified or if "today"
        if not date or date.lower() == "today":
            date = get_current_date_formatted()
        else:
            # Normalize date format to match database format "Mon November 10, 2025"
            # Handle various input formats
            date = normalize_date_format(date)

        # Check if the date is a weekend (Saturday or Sunday)
        if is_weekend(date):
            return "Grab N Go is closed for the weekend 😔\n\nDining halls are closed on Saturdays and Sundays. Please check weekday menus (Monday-Friday)."

        # Build query
        query = supabase.table("food_items").select("*")

        if date:
            query = query.eq("date", date)
        if location:
            query = query.ilike("location", f"%{location}%")
        if meal_type:
            query = query.eq("meal_type", meal_type)
        if search_term:
            query = query.ilike("name", f"%{search_term}%")

        # Execute query
        response = query.limit(15).execute()

        if not response.data:
            # If no results, try to suggest available dates
            available_dates = get_available_dates_for_location(location)
            date_msg = f" for {date}" if date else ""
            suggestions = f"\n\nAvailable dates: {', '.join(available_dates[:5])}" if available_dates else ""
            return f"No food items found{date_msg}. Try different search criteria or check if menus are available for this date.{suggestions}"

        # Format results
        result_lines = [f"🍽️ Found {len(response.data)} items{' for ' + date if date else ''}:\n"]

        for i, item in enumerate(response.data, 1):
            result_lines.append(
                f"{i}. **{item['name']}** (ID: {item['id']})\n"
                f"   📍 {item.get('location', 'Unknown')} - {item.get('meal_type', 'N/A')}\n"
                f"   🔥 {item['calories']} cal | 💪 {item['protein']}g protein | "
                f"🍚 {item['total_carb']}g carbs | 🥑 {item['total_fat']}g fat"
            )

        return "\n\n".join(result_lines)

    except Exception as e:
        return f"Error searching food items: {str(e)}"

@agent.tool
async def create_order(
    ctx: RunContext[ChatbotDeps],
    food_item_ids: list[int],
    quantities: list[int],
    delivery_location: str,
    delivery_latitude: Optional[float] = None,
    delivery_longitude: Optional[float] = None,
    delivery_time: Optional[str] = None,
    special_instructions: Optional[str] = None,
    delivery_option: Optional[str] = "delivery"
) -> str:
    """Create a new order for the user.

    Args:
        food_item_ids: List of food item IDs to order (from search results)
        quantities: Quantities for each item (must match length of food_item_ids)
        delivery_location: WHERE to deliver (REQUIRED - text address like "Southwest Dorms", "Room 420 Baker Hall")
        delivery_latitude: Latitude coordinate of delivery location (OPTIONAL but recommended)
        delivery_longitude: Longitude coordinate of delivery location (OPTIONAL but recommended)
        delivery_time: WHEN to deliver (OPTIONAL - ISO timestamp like "2025-11-08T18:00:00Z")
        special_instructions: OPTIONAL special requests (allergies, dietary restrictions, preferences, etc.)
        delivery_option: "delivery" or "pickup" (defaults to "delivery")

    Returns order confirmation with ID, items, and nutritional totals.

    IMPORTANT: Before calling this tool, make sure you have:
    - At least one food item ID
    - Delivery location (text address)
    - User's current location coordinates if available
    If any required information is missing, ask the user first!
    """
    try:
        if len(food_item_ids) != len(quantities):
            return "Error: Number of items and quantities must match."

        if not delivery_location:
            return "Error: delivery_location is required. Please provide where you want the order delivered."

        # Get food item details from Supabase
        food_items_data = []
        for food_id in food_item_ids:
            response = supabase.table("food_items").select("*").eq("id", food_id).execute()
            if not response.data:
                return f"Error: Food item ID {food_id} not found."
            food_items_data.append(response.data[0])

        # Build order payload
        items = []
        for food_data, qty in zip(food_items_data, quantities):
            items.append({
                "food_item_id": food_data["id"],
                "quantity": qty
            })

        order_data = {
            "user_id": ctx.deps.user_id,
            "delivery_location": delivery_location,
            "items": items,
            "status": "pending"  # Default status
        }

        if delivery_time:
            order_data["delivery_time"] = delivery_time
        if special_instructions:
            order_data["special_instructions"] = special_instructions

        # Create order in database
        # First create the order
        order_insert = {
            "user_id": ctx.deps.user_id,
            "delivery_location": delivery_location,
            "status": "pending",
            "delivery_option": delivery_option
        }
        if delivery_time:
            order_insert["delivery_time"] = delivery_time
        if special_instructions:
            order_insert["special_instructions"] = special_instructions
        if delivery_latitude is not None:
            order_insert["delivery_latitude"] = delivery_latitude
        if delivery_longitude is not None:
            order_insert["delivery_longitude"] = delivery_longitude

        order_response = supabase.table("orders").insert(order_insert).execute()

        if not order_response.data:
            return "Error: Failed to create order."

        order_id = order_response.data[0]["id"]

        # Add order items
        total_cals = 0
        total_protein = 0.0
        total_carbs = 0.0
        total_fat = 0.0

        for food_data, qty in zip(food_items_data, quantities):
            item_data = {
                "order_id": order_id,
                "food_item_id": food_data["id"],
                "food_item_name": food_data["name"],
                "quantity": qty,
                "calories": food_data.get("calories"),
                "protein": float(food_data.get("protein", 0)),
                "carbs": float(food_data.get("total_carb", 0)),
                "fat": float(food_data.get("total_fat", 0)),
                "dining_hall": food_data.get("location")
            }

            supabase.table("order_items").insert(item_data).execute()

            # Calculate totals
            total_cals += (food_data.get("calories", 0) * qty)
            total_protein += (float(food_data.get("protein", 0)) * qty)
            total_carbs += (float(food_data.get("total_carb", 0)) * qty)
            total_fat += (float(food_data.get("total_fat", 0)) * qty)

        # Update order with totals
        supabase.table("orders").update({
            "total_calories": total_cals,
            "total_protein": total_protein,
            "total_carbs": total_carbs,
            "total_fat": total_fat
        }).eq("id", order_id).execute()

        # Format response
        items_list = "\n".join([
            f"- {food_data['name']} x{qty} ({food_data.get('location', 'N/A')})"
            for food_data, qty in zip(food_items_data, quantities)
        ])

        # Add location coordinates if provided
        location_details = f"📍 Delivery: {delivery_location}"
        if delivery_latitude and delivery_longitude:
            location_details += f"\n🗺️ Coordinates: ({delivery_latitude}, {delivery_longitude})"

        # Add delivery option if not default
        delivery_info = ""
        if delivery_option and delivery_option != "delivery":
            delivery_info = f"\n🚗 Option: {delivery_option.capitalize()}"

        # Add special instructions if provided
        special_notes = ""
        if special_instructions:
            special_notes = f"\n📝 Special Instructions: {special_instructions}"

        return f"""✅ Order created successfully!

📦 Order ID: {order_id}
{location_details}{delivery_info}
⏰ Status: pending{special_notes}

🍽️ Items:
{items_list}

📊 Nutritional Totals:
- Calories: {total_cals} kcal
- Protein: {total_protein:.1f}g
- Carbs: {total_carbs:.1f}g
- Fat: {total_fat:.1f}g

Your order is being prepared! 🎉"""

    except Exception as e:
        return f"Error creating order: {str(e)}"

@agent.tool
async def get_my_orders(ctx: RunContext[ChatbotDeps], status: Optional[str] = None) -> str:
    """Get all orders for the current user.

    Args:
        status: Optional filter by status (pending or delivered)

    Returns list of user's orders with details.
    """
    try:
        query = supabase.table("orders").select("*").eq("user_id", ctx.deps.user_id)

        if status:
            query = query.eq("status", status)

        response = query.order("created_at", desc=True).execute()

        if not response.data:
            return "You have no orders yet. Would you like to create one?"

        result_lines = [f"📦 Your Orders ({len(response.data)} total):\n"]

        for order in response.data:
            # Get order items
            items_response = supabase.table("order_items").select("*").eq("order_id", order["id"]).execute()
            items_count = len(items_response.data) if items_response.data else 0

            status_emoji = "⏳" if order['status'] == 'pending' else "✅"

            result_lines.append(
                f"{status_emoji} Order {order['id'][:8]}...\n"
                f"   Status: {order['status']}\n"
                f"   Items: {items_count}\n"
                f"   Calories: {order.get('total_calories', 0)} kcal\n"
                f"   Delivery: {order['delivery_location']}\n"
                f"   Created: {order['created_at']}"
            )

        return "\n\n".join(result_lines)

    except Exception as e:
        return f"Error fetching orders: {str(e)}"

@agent.tool
async def get_order_details(ctx: RunContext[ChatbotDeps], order_id: str) -> str:
    """Get detailed information about a specific order.

    Args:
        order_id: The UUID of the order

    Returns full order details with all items and nutritional breakdown.
    """
    try:
        # Get order
        order_response = supabase.table("orders").select("*").eq("id", order_id).execute()

        if not order_response.data:
            return f"Order {order_id} not found."

        order = order_response.data[0]

        # Get order items
        items_response = supabase.table("order_items").select("*").eq("order_id", order_id).execute()

        items_list = []
        if items_response.data:
            for item in items_response.data:
                items_list.append(
                    f"- {item['food_item_name']} x{item['quantity']}\n"
                    f"  📍 {item.get('dining_hall', 'N/A')}\n"
                    f"  ({item.get('calories', 0)} cal, {item.get('protein', 0)}g protein, "
                    f"{item.get('carbs', 0)}g carbs, {item.get('fat', 0)}g fat)"
                )

        items_str = "\n".join(items_list) if items_list else "No items"

        status_emoji = "⏳" if order['status'] == 'pending' else "✅"

        return f"""📦 Order Details:

🆔 ID: {order['id']}
{status_emoji} Status: {order['status']}
📍 Delivery: {order['delivery_location']}
⏰ Created: {order['created_at']}
📝 Special Instructions: {order.get('special_instructions') or 'None'}

🍽️ Items:
{items_str}

📊 Nutritional Totals:
- Calories: {order.get('total_calories', 0)} kcal
- Protein: {order.get('total_protein', 0)}g
- Carbs: {order.get('total_carbs', 0)}g
- Fat: {order.get('total_fat', 0)}g"""

    except Exception as e:
        return f"Error fetching order: {str(e)}"

# ==================== NUTRITION API TOOLS ====================

@agent.tool
async def search_nutrition_food_items(
    ctx: RunContext[ChatbotDeps],
    query: str = "",
    limit: int = 20,
    date: Optional[str] = None
) -> str:
    """Search food items in nutrition database (different from order menus).

    Args:
        query: Search term for food name (empty returns all items)
        limit: Max results (default 20, max 200)
        date: Optional date filter in YYYY-MM-DD format (e.g., "2025-11-10" for November 10, 2025)

    Returns list of food items with nutrition info for tracking meals.
    Note: The API automatically converts YYYY-MM-DD to the database date format.
    """
    try:
        params = {"q": query, "limit": limit}
        if date:
            params["date"] = date

        response = await ctx.deps.http_client.get(
            f"{NUTRITION_API_BASE}/api/nutrition/food-items/search",
            params=params,
            timeout=10.0
        )
        if response.status_code == 200:
            items = response.json()
            if not items:
                return f"No food items found for '{query}'"

            result_lines = [f"🔍 Found {len(items)} nutrition items:\n"]
            for i, item in enumerate(items[:limit], 1):
                result_lines.append(
                    f"{i}. **{item['name']}** (ID: {item['id']})\n"
                    f"   Serving: {item['serving_size']}\n"
                    f"   📊 {item['calories']} cal | 💪 {item['protein']}g protein | "
                    f"🍚 {item['total_carb']}g carbs | 🥑 {item['total_fat']}g fat\n"
                    f"   📍 {item.get('location', 'N/A')} - {item.get('meal_type', 'N/A')}"
                )
            return "\n".join(result_lines)
        else:
            return f"Error searching food items: {response.status_code}"
    except Exception as e:
        return f"Error searching nutrition food items: {str(e)}"

@agent.tool
async def log_meal_to_nutrition(
    ctx: RunContext[ChatbotDeps],
    food_item_id: int,
    servings: float = 1.0,
    meal_category: str = "Lunch",
    entry_date: Optional[str] = None
) -> str:
    """Log a meal to user's nutrition tracker.

    Args:
        food_item_id: ID of food item from nutrition database
        servings: Number of servings (default 1.0)
        meal_category: "Breakfast", "Lunch", or "Dinner"
        entry_date: Date (YYYY-MM-DD, defaults to today)

    Returns confirmation with nutritional totals.
    """
    try:
        payload = {
            "profile_id": ctx.deps.user_id,
            "food_item_id": food_item_id,
            "servings": servings,
            "meal_category": meal_category
        }
        if entry_date:
            payload["entry_date"] = entry_date

        response = await ctx.deps.http_client.post(
            f"{NUTRITION_API_BASE}/api/nutrition/meals",
            json=payload,
            timeout=10.0
        )
        if response.status_code == 201:
            meal = response.json()
            food = meal.get('food_item', {})
            total_cals = food.get('calories', 0) * servings
            total_protein = food.get('protein', 0) * servings
            total_carbs = food.get('total_carb', 0) * servings
            total_fat = food.get('total_fat', 0) * servings

            return f"""✅ Meal logged successfully!

📝 Entry: {food.get('name', 'Unknown')}
🍽️ Servings: {servings}
📅 Category: {meal_category}

📊 Nutritional Impact:
- Calories: {total_cals:.0f} kcal
- Protein: {total_protein:.1f}g
- Carbs: {total_carbs:.1f}g
- Fat: {total_fat:.1f}g"""
        else:
            error_detail = response.json().get('detail', 'Unknown error')
            return f"Error logging meal: {error_detail}"
    except Exception as e:
        return f"Error logging meal: {str(e)}"

@agent.tool
async def get_daily_nutrition_totals(
    ctx: RunContext[ChatbotDeps],
    date: Optional[str] = None
) -> str:
    """Get total nutrition intake for a specific date or today.

    Args:
        date: Date in YYYY-MM-DD format (defaults to today)

    Returns daily nutritional totals and meal count.
    """
    try:
        endpoint = f"{NUTRITION_API_BASE}/api/nutrition/totals/user/{ctx.deps.user_id}"
        if date:
            endpoint += f"/date/{date}"
        else:
            endpoint += "/today"

        response = await ctx.deps.http_client.get(endpoint, timeout=10.0)
        if response.status_code == 200:
            totals = response.json()
            return f"""📊 Nutrition Summary for {totals.get('date', 'today')}:

🔥 Calories: {totals.get('calories', 0)} kcal
💪 Protein: {totals.get('protein', 0):.1f}g
🍚 Carbs: {totals.get('total_carb', 0):.1f}g
🥑 Fat: {totals.get('total_fat', 0):.1f}g
🧂 Sodium: {totals.get('sodium', 0):.0f}mg
🌾 Fiber: {totals.get('dietary_fiber', 0):.1f}g
🍬 Sugars: {totals.get('sugars', 0):.1f}g

🍽️ Meals logged: {totals.get('meal_count', 0)}"""
        else:
            return f"Error fetching nutrition totals: {response.status_code}"
    except Exception as e:
        return f"Error getting daily totals: {str(e)}"

@agent.tool
async def get_meal_history(
    ctx: RunContext[ChatbotDeps],
    days: int = 7
) -> str:
    """Get user's meal history for the past N days.

    Args:
        days: Number of days of history (1-30, default 7)

    Returns weekly meal history with daily totals.
    """
    try:
        response = await ctx.deps.http_client.get(
            f"{NUTRITION_API_BASE}/api/nutrition/meals/user/{ctx.deps.user_id}/history",
            params={"days": min(days, 30)},
            timeout=10.0
        )
        if response.status_code == 200:
            history = response.json()
            daily_totals = history.get('daily_totals', {})

            if not daily_totals:
                return "No meal history found for this period."

            result_lines = [f"📅 Meal History ({history.get('start_date')} to {history.get('end_date')}):\n"]

            for date, totals in daily_totals.items():
                result_lines.append(
                    f"**{date}**\n"
                    f"  🔥 {totals['calories']} cal | 💪 {totals['protein']:.1f}g P | "
                    f"🍚 {totals['total_carb']:.1f}g C | 🥑 {totals['total_fat']:.1f}g F\n"
                    f"  🍽️ {totals['meal_count']} meals"
                )

            return "\n".join(result_lines)
        else:
            return f"Error fetching meal history: {response.status_code}"
    except Exception as e:
        return f"Error getting meal history: {str(e)}"

@agent.tool
async def get_user_nutrition_profile(ctx: RunContext[ChatbotDeps]) -> str:
    """Get user's nutrition profile including health metrics and goals.

    Returns profile with BMR, TDEE, dietary preferences, and nutrition goals.
    """
    try:
        response = await ctx.deps.http_client.get(
            f"{NUTRITION_API_BASE}/api/nutrition/profiles/{ctx.deps.user_id}",
            timeout=10.0
        )
        if response.status_code == 200:
            profile = response.json()

            result = f"""👤 Nutrition Profile:

📋 Basic Info:
- Name: {profile.get('full_name', 'Not set')}
- Age: {profile.get('age', 'Not set')}
- Sex: {profile.get('sex', 'Not set')}
- Height: {profile.get('height_inches', 'Not set')} inches
- Weight: {profile.get('weight_lbs', 'Not set')} lbs

📊 Metabolic Rates:
- BMR: {profile.get('bmr', 'Not calculated')} cal/day
- TDEE: {profile.get('tdee', 'Not calculated')} cal/day
- Activity Level: {profile.get('activity_level', 'Not set')}/5

🎯 Daily Goals:
- Calories: {profile.get('goal_calories', 'Not set')} kcal
- Protein: {profile.get('goal_protein', 'Not set')}g
- Carbs: {profile.get('goal_carbs', 'Not set')}g
- Fat: {profile.get('goal_fat', 'Not set')}g

🥗 Dietary Preferences: {', '.join(profile.get('dietary_preferences', [])) or 'None set'}
📝 Goals: {profile.get('goals', 'Not set')}"""

            return result
        elif response.status_code == 404:
            return "❌ No nutrition profile found. User needs to complete onboarding."
        else:
            return f"Error fetching profile: {response.status_code}"
    except Exception as e:
        return f"Error getting nutrition profile: {str(e)}"

@agent.tool
async def update_nutrition_profile(
    ctx: RunContext[ChatbotDeps],
    age: Optional[int] = None,
    sex: Optional[str] = None,
    height_inches: Optional[float] = None,
    weight_lbs: Optional[float] = None,
    activity_level: Optional[int] = None,
    goals: Optional[str] = None,
    goal_calories: Optional[int] = None
) -> str:
    """Update user's nutrition profile and health metrics.

    Args:
        age: Age in years
        sex: "Male", "Female", or "Other"
        height_inches: Height in inches
        weight_lbs: Weight in pounds
        activity_level: 1 (sedentary) to 5 (very active)
        goals: Text description of fitness/nutrition goals
        goal_calories: Daily calorie goal

    Returns updated profile with recalculated BMR/TDEE.
    """
    try:
        update_data = {}
        if age is not None:
            update_data["age"] = age
        if sex is not None:
            update_data["sex"] = sex
        if height_inches is not None:
            update_data["height_inches"] = height_inches
        if weight_lbs is not None:
            update_data["weight_lbs"] = weight_lbs
        if activity_level is not None:
            update_data["activity_level"] = activity_level
        if goals is not None:
            update_data["goals"] = goals
        if goal_calories is not None:
            update_data["goal_calories"] = goal_calories

        if not update_data:
            return "No fields provided to update."

        response = await ctx.deps.http_client.patch(
            f"{NUTRITION_API_BASE}/api/nutrition/profiles/{ctx.deps.user_id}",
            json=update_data,
            timeout=10.0
        )
        if response.status_code == 200:
            profile = response.json()
            return f"""✅ Profile updated successfully!

Updated metrics:
- BMR: {profile.get('bmr', 'N/A')} cal/day
- TDEE: {profile.get('tdee', 'N/A')} cal/day

Your body now burns approximately {profile.get('tdee', 0)} calories per day based on your updated metrics."""
        else:
            error_detail = response.json().get('detail', 'Unknown error')
            return f"Error updating profile: {error_detail}"
    except Exception as e:
        return f"Error updating nutrition profile: {str(e)}"

# ==================== ORDER MANAGEMENT TOOLS ====================

@agent.tool
async def update_order_status(
    ctx: RunContext[ChatbotDeps],
    order_id: str,
    new_status: str
) -> str:
    """Update the status of an existing order.

    Args:
        order_id: UUID of the order
        new_status: New status - "pending", "preparing", "ready", "out_for_delivery", "delivered", "completed", "cancelled"

    Returns updated order details.
    """
    try:
        response = await ctx.deps.http_client.patch(
            f"{ORDERS_API_BASE}/orders/{order_id}/status",
            json={"status": new_status},
            timeout=10.0
        )
        if response.status_code == 200:
            order = response.json()
            return f"""✅ Order status updated!

Order ID: {order['id'][:8]}...
New Status: {order['status']}
Delivery: {order['delivery_location']}"""
        else:
            error_detail = response.json().get('detail', 'Unknown error')
            return f"Error updating order status: {error_detail}"
    except Exception as e:
        return f"Error updating order status: {str(e)}"

@agent.tool
async def add_item_to_order(
    ctx: RunContext[ChatbotDeps],
    order_id: str,
    food_item_id: int,
    quantity: int = 1
) -> str:
    """Add an item to an existing order.

    Args:
        order_id: UUID of the order
        food_item_id: ID of food item to add
        quantity: Quantity to add (default 1)

    Returns updated order with new totals.
    """
    try:
        response = await ctx.deps.http_client.post(
            f"{ORDERS_API_BASE}/orders/{order_id}/items",
            json={"food_item_id": food_item_id, "quantity": quantity},
            timeout=10.0
        )
        if response.status_code == 200:
            order = response.json()
            return f"""✅ Item added to order!

Order ID: {order['id'][:8]}...
Total Items: {len(order.get('items', []))}
New Total: {order.get('total_calories', 0)} cal"""
        else:
            error_detail = response.json().get('detail', 'Unknown error')
            return f"Error adding item: {error_detail}"
    except Exception as e:
        return f"Error adding item to order: {str(e)}"

@agent.tool
async def remove_item_from_order(
    ctx: RunContext[ChatbotDeps],
    order_id: str,
    item_id: str
) -> str:
    """Remove an item from an existing order.

    Args:
        order_id: UUID of the order
        item_id: UUID of the order item to remove

    Returns confirmation message.
    """
    try:
        response = await ctx.deps.http_client.delete(
            f"{ORDERS_API_BASE}/orders/{order_id}/items/{item_id}",
            timeout=10.0
        )
        if response.status_code == 200:
            result = response.json()
            return f"✅ {result.get('message', 'Item removed successfully')}"
        else:
            error_detail = response.json().get('detail', 'Unknown error')
            return f"Error removing item: {error_detail}"
    except Exception as e:
        return f"Error removing item from order: {str(e)}"

@agent.tool
async def cancel_order(ctx: RunContext[ChatbotDeps], order_id: str) -> str:
    """Cancel an existing order.

    Args:
        order_id: UUID of the order to cancel

    Returns confirmation message.
    """
    try:
        response = await ctx.deps.http_client.delete(
            f"{ORDERS_API_BASE}/orders/{order_id}",
            timeout=10.0
        )
        if response.status_code == 200:
            result = response.json()
            return f"✅ {result.get('message', 'Order cancelled successfully')}"
        else:
            error_detail = response.json().get('detail', 'Unknown error')
            return f"Error cancelling order: {error_detail}"
    except Exception as e:
        return f"Error cancelling order: {str(e)}"

@app.get("/")
async def root():
    return {
        "message": "DoorSmash AI Chatbot API - Complete Food Ordering & Nutrition Platform",
        "version": "4.0.0",
        "model": "google-gla:gemini-2.5-flash",
        "features": {
            "orders": [
                "Browse dining hall menus by location/date/meal type",
                "Create orders with delivery tracking",
                "Update order status (pending → delivered)",
                "Add/remove items from existing orders",
                "Cancel orders",
                "View order history and details"
            ],
            "nutrition": [
                "Search food items database",
                "Log meals with servings tracking",
                "View daily nutrition totals (calories, macros, fiber, sodium)",
                "Get weekly meal history",
                "View/update user nutrition profile",
                "BMR & TDEE calculations",
                "Dietary goals and preferences"
            ],
            "integration": [
                "Auto-suggest logging ordered food to nutrition tracker",
                "Chat history with Supabase",
                "Location-aware features",
                "Multi-user support"
            ]
        },
        "endpoints": {
            "chat": "/chat - Main chatbot endpoint",
            "history": "/history/{user_id} - Get chat history",
            "docs": "/docs - API documentation"
        }
    }

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Chat endpoint that processes user messages and responds using the AI agent."""
    try:
        # Get chat history for context
        chat_history = await get_chat_history(request.user_id, limit=10)

        # Save user message
        await save_chat_message(request.user_id, "user", request.message)

        # Prepare user location if provided
        user_location_dict = None
        if request.user_location:
            user_location_dict = {
                "latitude": request.user_location.latitude,
                "longitude": request.user_location.longitude
            }

        # Create HTTP client for API calls
        async with httpx.AsyncClient() as http_client:
            # Run agent with context
            deps = ChatbotDeps(
                user_id=request.user_id,
                chat_history=chat_history,
                user_location=user_location_dict,
                http_client=http_client
            )

            result = await agent.run(request.message, deps=deps)

            # Save assistant response
            await save_chat_message(request.user_id, "assistant", result.output)

            return ChatResponse(response=result.output)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/history/{user_id}")
async def get_history(user_id: str, limit: int = 20):
    """Get chat history for a user"""
    history = await get_chat_history(user_id, limit=limit)
    return {"history": history}

@app.delete("/history/{user_id}")
async def clear_history(user_id: str):
    """Clear chat history for a user"""
    try:
        supabase.table("chat_history").delete().eq("user_id", user_id).execute()
        return {"message": "Chat history cleared"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
