"""
Orders API with FastAPI and Supabase
Provides endpoints for managing food orders from UMass dining halls
"""
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from supabase import create_client, Client
import os
from dotenv import load_dotenv
import uuid

load_dotenv()

app = FastAPI(
    title="DoorSmash Orders API",
    description="Order management system for UMass dining hall delivery",
    version="1.0.0"
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update with specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in .env file")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


# ==================== PYDANTIC MODELS ====================

class OrderItemCreate(BaseModel):
    food_item_id: int
    quantity: int = Field(default=1, gt=0)


class OrderItemResponse(BaseModel):
    id: str
    order_id: str
    food_item_id: int
    food_item_name: str
    quantity: int
    calories: Optional[int]
    protein: Optional[float]
    carbs: Optional[float]
    fat: Optional[float]
    created_at: datetime


class OrderCreate(BaseModel):
    user_id: str  # UUID as string
    delivery_location: str
    delivery_time: Optional[datetime] = None
    special_instructions: Optional[str] = None
    items: List[OrderItemCreate]


class OrderUpdate(BaseModel):
    delivery_location: Optional[str] = None
    delivery_time: Optional[datetime] = None
    special_instructions: Optional[str] = None


class OrderStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(pending|preparing|ready|out_for_delivery|delivered|completed|cancelled)$")


class OrderResponse(BaseModel):
    id: str
    user_id: str
    delivery_location: str
    delivery_time: Optional[datetime]
    special_instructions: Optional[str]
    status: str
    total_calories: int
    total_protein: float
    total_carbs: float
    total_fat: float
    created_at: datetime
    updated_at: datetime
    items: Optional[List[OrderItemResponse]] = None


# ==================== HELPER FUNCTIONS ====================

async def get_food_item_details(food_item_id: int):
    """Fetch food item details from food_items table"""
    response = supabase.table("food_items").select("*").eq("id", food_item_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail=f"Food item {food_item_id} not found")
    return response.data[0]


async def calculate_and_update_order_totals(order_id: str):
    """Calculate and update order totals using the database function"""
    try:
        supabase.rpc("calculate_order_totals", {"order_uuid": order_id}).execute()
    except Exception as e:
        print(f"Warning: Could not calculate order totals: {e}")


# ==================== API ENDPOINTS ====================

@app.get("/")
async def root():
    return {
        "message": "DoorSmash Orders API",
        "version": "1.0.0",
        "endpoints": {
            "orders": "/orders",
            "docs": "/docs"
        }
    }


@app.post("/orders", response_model=OrderResponse, status_code=201)
async def create_order(order: OrderCreate):
    """
    Create a new order with items

    - Validates that food items exist
    - Creates order and order items
    - Calculates nutritional totals
    """
    # Validate user exists
    user_response = supabase.table("profiles").select("id").eq("id", order.user_id).execute()
    if not user_response.data:
        raise HTTPException(status_code=404, detail=f"User {order.user_id} not found")

    # Create the order
    order_data = {
        "user_id": order.user_id,
        "delivery_location": order.delivery_location,
        "delivery_time": order.delivery_time.isoformat() if order.delivery_time else None,
        "special_instructions": order.special_instructions,
        "status": "pending"
    }

    order_response = supabase.table("orders").insert(order_data).execute()
    if not order_response.data:
        raise HTTPException(status_code=500, detail="Failed to create order")

    created_order = order_response.data[0]
    order_id = created_order["id"]

    # Add order items
    order_items = []
    for item in order.items:
        # Get food item details
        food_item = await get_food_item_details(item.food_item_id)

        # Create order item
        item_data = {
            "order_id": order_id,
            "food_item_id": item.food_item_id,
            "food_item_name": food_item["name"],
            "quantity": item.quantity,
            "calories": food_item.get("calories"),
            "protein": float(food_item.get("protein", 0)),
            "carbs": float(food_item.get("total_carb", 0)),
            "fat": float(food_item.get("total_fat", 0))
        }

        item_response = supabase.table("order_items").insert(item_data).execute()
        if item_response.data:
            order_items.append(item_response.data[0])

    # Calculate totals
    await calculate_and_update_order_totals(order_id)

    # Fetch updated order with items
    return await get_order(order_id)


@app.get("/orders", response_model=List[OrderResponse])
async def list_orders(
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    status: Optional[str] = Query(None, description="Filter by order status"),
    limit: int = Query(50, le=100, description="Maximum number of orders to return")
):
    """
    List orders with optional filters

    - Filter by user_id and/or status
    - Returns orders with their items
    - Sorted by creation date (newest first)
    """
    query = supabase.table("orders").select("*")

    if user_id:
        query = query.eq("user_id", user_id)
    if status:
        query = query.eq("status", status)

    query = query.order("created_at", desc=True).limit(limit)

    response = query.execute()

    # Fetch items for each order
    orders = []
    for order_data in response.data:
        items_response = supabase.table("order_items").select("*").eq("order_id", order_data["id"]).execute()
        order_data["items"] = items_response.data
        orders.append(order_data)

    return orders


@app.get("/orders/{order_id}", response_model=OrderResponse)
async def get_order(order_id: str):
    """
    Get a specific order by ID with all items
    """
    # Fetch order
    response = supabase.table("orders").select("*").eq("id", order_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")

    order_data = response.data[0]

    # Fetch order items
    items_response = supabase.table("order_items").select("*").eq("order_id", order_id).execute()
    order_data["items"] = items_response.data

    return order_data


@app.patch("/orders/{order_id}", response_model=OrderResponse)
async def update_order(order_id: str, order_update: OrderUpdate):
    """
    Update order details (delivery location, time, special instructions)
    """
    # Check if order exists
    existing = supabase.table("orders").select("id").eq("id", order_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")

    # Build update data
    update_data = {}
    if order_update.delivery_location is not None:
        update_data["delivery_location"] = order_update.delivery_location
    if order_update.delivery_time is not None:
        update_data["delivery_time"] = order_update.delivery_time.isoformat()
    if order_update.special_instructions is not None:
        update_data["special_instructions"] = order_update.special_instructions

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    # Update order
    supabase.table("orders").update(update_data).eq("id", order_id).execute()

    return await get_order(order_id)


@app.patch("/orders/{order_id}/status", response_model=OrderResponse)
async def update_order_status(order_id: str, status_update: OrderStatusUpdate):
    """
    Update order status

    Valid statuses: pending, preparing, ready, out_for_delivery, delivered, completed, cancelled
    """
    # Check if order exists
    existing = supabase.table("orders").select("id, status").eq("id", order_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")

    # Update status
    supabase.table("orders").update({"status": status_update.status}).eq("id", order_id).execute()

    return await get_order(order_id)


@app.post("/orders/{order_id}/items", response_model=OrderResponse)
async def add_order_item(order_id: str, item: OrderItemCreate):
    """
    Add an item to an existing order
    """
    # Check if order exists
    existing = supabase.table("orders").select("id").eq("id", order_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")

    # Get food item details
    food_item = await get_food_item_details(item.food_item_id)

    # Create order item
    item_data = {
        "order_id": order_id,
        "food_item_id": item.food_item_id,
        "food_item_name": food_item["name"],
        "quantity": item.quantity,
        "calories": food_item.get("calories"),
        "protein": float(food_item.get("protein", 0)),
        "carbs": float(food_item.get("total_carb", 0)),
        "fat": float(food_item.get("total_fat", 0))
    }

    supabase.table("order_items").insert(item_data).execute()

    # Recalculate totals
    await calculate_and_update_order_totals(order_id)

    return await get_order(order_id)


@app.delete("/orders/{order_id}/items/{item_id}")
async def delete_order_item(order_id: str, item_id: str):
    """
    Remove an item from an order
    """
    # Verify the item belongs to this order
    item_response = supabase.table("order_items").select("*").eq("id", item_id).eq("order_id", order_id).execute()
    if not item_response.data:
        raise HTTPException(status_code=404, detail=f"Order item {item_id} not found in order {order_id}")

    # Delete the item
    supabase.table("order_items").delete().eq("id", item_id).execute()

    # Recalculate totals
    await calculate_and_update_order_totals(order_id)

    return {"message": f"Item {item_id} removed from order {order_id}"}


@app.delete("/orders/{order_id}")
async def cancel_order(order_id: str):
    """
    Cancel an order (soft delete by setting status to 'cancelled')
    """
    # Check if order exists
    existing = supabase.table("orders").select("id").eq("id", order_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")

    # Update status to cancelled
    supabase.table("orders").update({"status": "cancelled"}).eq("id", order_id).execute()

    return {"message": f"Order {order_id} cancelled successfully"}


@app.get("/users/{user_id}/orders", response_model=List[OrderResponse])
async def get_user_orders(
    user_id: str,
    status: Optional[str] = Query(None, description="Filter by status"),
    limit: int = Query(20, le=100)
):
    """
    Get all orders for a specific user
    """
    return await list_orders(user_id=user_id, status=status, limit=limit)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
