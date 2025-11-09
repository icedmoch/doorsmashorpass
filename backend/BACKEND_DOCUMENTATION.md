# Door Smash or Pass Backend Documentation

## Overview
The Door Smash or Pass backend is a comprehensive FastAPI-based service that provides nutrition tracking, food ordering, and AI chatbot capabilities for college students. The system is built with a modular architecture and integrates with Supabase for data persistence.

---

## Architecture

### Main Entry Point: `main.py`
**Purpose**: Unified API service that combines all sub-applications into a single FastAPI instance.

**Features**:
- Mounts Orders API at `/orders`
- Mounts Nutrition API at root level
- Provides unified health check endpoint
- Runs on port 8000 by default
- CORS middleware for cross-origin requests

**Key Endpoints**:
- `GET /` - API overview and service listing
- `GET /health` - Health check for all services
- `/docs` - Auto-generated Swagger documentation

---

## Core APIs

### 1. Nutrition API (`nutrition_api.py`)

**Purpose**: Complete nutrition tracking system with meal logging, food database management, and user health profiles.

#### Main Features:

##### User Profile Management
- **Create/Update Profile** - `POST /api/nutrition/profiles/{user_id}`
  - Stores user health metrics (age, sex, height, weight, activity level)
  - Auto-calculates BMR (Basal Metabolic Rate) and TDEE (Total Daily Energy Expenditure)
  - Supports metric and imperial units

- **Get Profile** - `GET /api/nutrition/profiles/{user_id}`
  - Retrieves complete user health profile
  - Returns calculated nutrition goals

- **Delete Profile** - `DELETE /api/nutrition/profiles/{user_id}`
  - Removes user profile from system

##### Food Item Management
- **Search Food Items** - `GET /api/nutrition/food-items/search`
  - Query parameter `q` for search term (empty = all items)
  - Optional `date` filter (YYYY-MM-DD format)
  - Returns food items with complete nutrition data
  - Converts date from YYYY-MM-DD to database format ("Day Month DD, YYYY")

- **Get Available Dates** - `GET /api/nutrition/food-items/available-dates`
  - Lists all dates that have menu data
  - Used for date selection in UI

- **Get Food Item by ID** - `GET /api/nutrition/food-items/{id}`
  - Retrieves single food item details

- **List All Food Items** - `GET /api/nutrition/food-items`
  - Paginated listing with limit/offset
  - Default limit: 100 items

- **Get Menu by Location/Date** - `GET /api/nutrition/food-items/location/{location}/date/{date}`
  - Returns foods grouped by meal type (Breakfast, Lunch, Dinner)
  - Specific to dining hall location

- **Create Food Item** - `POST /api/nutrition/food-items`
  - Admin endpoint to add new food items
  - Requires complete nutrition data

##### Meal Entry Management
- **Create Meal Entry** - `POST /api/nutrition/meals`
  - Log meals consumed by users
  - Links to food_items table
  - Supports multiple servings
  - Tracks meal category (Breakfast/Lunch/Dinner)
  - Stores entry date for planning future meals

- **Get Meals by Date** - `GET /api/nutrition/meals/{user_id}/date/{date}`
  - Retrieves all meals for a specific date
  - Returns grouped by meal category
  - Includes complete nutrition totals

- **Get Meal History** - `GET /api/nutrition/meals/{user_id}/history`
  - Gets meals for a date range
  - Default: last 7 days
  - Returns daily totals and meal details

- **Update Meal Entry** - `PATCH /api/nutrition/meals/{entry_id}`
  - Modify servings or meal category
  - Recalculates nutrition totals

- **Delete Meal Entry** - `DELETE /api/nutrition/meals/{entry_id}`
  - Remove meal from log

##### Daily Nutrition Summary
- **Get Daily Totals** - `GET /api/nutrition/meals/{user_id}/daily-totals`
  - Aggregates all meals for a specific date
  - Returns total calories, protein, carbs, fat
  - Compares against user's TDEE goals

##### Bulk Menu Upload
- **Upload Menu JSON** - `POST /api/nutrition/food-items/upload-menu`
  - Bulk import food items from JSON file
  - Validates data structure
  - Prevents duplicates
  - Returns import statistics

---

### 2. Orders API (`orders_api.py`)

**Purpose**: Food ordering and delivery management system for campus dining halls.

#### Main Features:

##### Order Management
- **Create Order** - `POST /orders`
  - Creates new food order with multiple items
  - Validates food items exist
  - Calculates total nutrition (calories, protein, carbs, fat)
  - Supports delivery scheduling
  - Status tracking (pending → preparing → ready → delivered)

- **Get Order** - `GET /orders/{order_id}`
  - Retrieves complete order details
  - Includes all order items with nutrition info

- **List Orders** - `GET /orders`
  - Lists all orders with optional filters:
    - By user_id
    - By status
    - Date range filtering
  - Paginated results

- **Update Order** - `PATCH /orders/{order_id}`
  - Modify delivery location, time, or instructions
  - Cannot modify items after creation

- **Update Order Status** - `PATCH /orders/{order_id}/status`
  - Progress order through delivery workflow
  - Valid statuses: pending, preparing, ready, out_for_delivery, delivered, completed, cancelled

- **Cancel Order** - `DELETE /orders/{order_id}`
  - Soft delete by setting status to cancelled

##### Order Items Management
- **Get Order Items** - `GET /orders/{order_id}/items`
  - Lists all items in an order
  - Includes food details and nutrition per item

- **Add Item to Order** - `POST /orders/{order_id}/items`
  - Add items to existing orders
  - Only for orders in "pending" status

- **Remove Item from Order** - `DELETE /orders/{order_id}/items/{item_id}`
  - Remove specific items from order
  - Recalculates order totals

##### User Order History
- **Get User Orders** - `GET /orders/user/{user_id}`
  - All orders for a specific user
  - Sorted by creation date (newest first)
  - Optional status filtering

---

### 3. AI Chatbot API (`chatbot_api.py`)

**Purpose**: Conversational AI assistant using PydanticAI + Google Gemini to help users order food and get nutrition information.

#### Main Features:

##### Chat Interaction
- **Send Message** - `POST /chat`
  - Process user messages with AI
  - Maintains conversation context
  - Supports natural language queries
  - Optional GPS location for delivery

##### Agent Capabilities:
The AI agent can:
1. **Search Food Items**
   - Query dining hall menus by date
   - Filter by location, meal type, or dietary preferences
   - Provide nutrition information

2. **Create Orders**
   - Build orders through conversation
   - Add multiple items with quantities
   - Set delivery location and time
   - Handle special instructions

3. **Get Menu Information**
   - List available dining halls
   - Show daily menus
   - Filter by meal times
   - Date-based queries

4. **Order Management**
   - View order history
   - Check order status
   - Calculate nutrition totals

##### Context Management:
- **Chat History** - Stored in Supabase `chat_history` table
  - Last 10 messages retrieved for context
  - Includes role (user/assistant) and timestamps
  - Per-user conversation tracking

- **Date Normalization**
  - Converts user date inputs to database format
  - Supports natural language dates ("today", "tomorrow")
  - Format: "Mon November 10, 2025"

##### Tools Available to AI:
- `search_food_items(query, date, location, meal_type)`
- `get_menu_for_date(date, location)`
- `create_order(user_id, items, delivery_location, delivery_time)`
- `get_order_status(order_id)`

---

## Data Layer

### Database Interface: `nutrition_db.py`

**Purpose**: Abstraction layer for all Supabase database operations.

#### Key Methods:

##### Profile Operations
- `create_or_update_profile(user_id, profile)` - Upsert user profiles
- `get_profile(user_id)` - Retrieve user profile
- `delete_profile(user_id)` - Remove profile

##### Food Item Operations
- `create_food_item(food_data)` - Insert new food item
- `get_food_item(item_id)` - Retrieve single item
- `search_food_items(query, limit, date)` - Search with filters
- `list_food_items(limit, offset)` - Paginated listing
- `get_food_items_by_location_date(location, date)` - Location-specific menu
- `get_available_dates()` - List dates with menu data
- `bulk_insert_food_items(items)` - Batch insert for menu uploads

##### Meal Entry Operations
- `create_meal_entry(entry_data)` - Log meal
- `get_meal_entry(entry_id)` - Retrieve entry
- `get_meals_by_date(user_id, date)` - Daily meals grouped by category
- `get_meal_history(user_id, start_date, end_date)` - Date range query
- `update_meal_entry(entry_id, updates)` - Modify entry
- `delete_meal_entry(entry_id)` - Remove entry
- `get_daily_totals(user_id, date)` - Aggregate nutrition

##### Date Conversion
- Converts between YYYY-MM-DD (API) and "Day Month DD, YYYY" (database)
- Uses `datetime.strptime()` and `strftime()`

---

## Data Models

### Pydantic Models: `nutrition_models.py`

**Purpose**: Data validation and serialization using Pydantic.

#### User Profile Models
- `UserProfileBase` - Base fields (age, sex, height, weight, activity level)
- `UserProfileCreate` - Creation payload
- `UserProfileUpdate` - Update payload (all optional)
- `UserProfileResponse` - Response with calculated BMR/TDEE

#### Food Item Models
- `FoodItemBase` - Core nutrition data
  - name, serving_size, calories
  - protein, total_carb, total_fat
  - sodium, dietary_fiber, sugars
- `FoodItemCreate` - With location, date, meal_type
- `FoodItemResponse` - With id and timestamps

#### Meal Entry Models
- `MealEntryBase` - Entry fundamentals (profile_id, food_item_id, servings)
- `MealEntryCreate` - With meal_category and entry_date
- `MealEntryUpdate` - Modifiable fields
- `MealEntryResponse` - Complete entry with nutrition

#### Aggregate Models
- `DailyNutritionTotals` - Daily summary stats
- `MealsByCategory` - Grouped by Breakfast/Lunch/Dinner
- `WeeklyMealHistory` - Multi-day view

#### Utility Functions
- `calculate_user_metrics(weight, height, age, sex, activity)` - BMR/TDEE calculation
  - Uses Mifflin-St Jeor Equation for BMR
  - Applies activity multipliers for TDEE

---

## Utility Modules

### Menu Utilities: `nutrition_utils.py`

**Purpose**: Helper functions for menu processing and validation.

#### Functions:
- `load_dining_hall_menus_from_json(file_path)` - Parse menu JSON files
- `parse_dining_hall_menu(menu_data)` - Extract food items from menus
- `validate_menu_json(data)` - Ensure JSON structure is correct
- `convert_menu_to_food_items(menu)` - Transform menu format to food items

---

### Web Scraper: `scraper.py`

**Purpose**: Automated web scraping to collect dining hall menu data.

#### Features:
- **Playwright-based** - Headless browser automation
- **Multi-date scraping** - Extracts available dates from dropdown
- **Menu parsing** - BeautifulSoup for HTML parsing
- **Supabase integration** - Direct insertion into database
- **Deduplication** - Prevents duplicate entries

#### Functions:
- `get_available_dates(page, base_url)` - Extract date options
- `parse_menu_from_html(html, date, location)` - Parse HTML to structured data
- `scrape_location(location_url, location_name)` - Full scrape for one location
- `scrape_all_locations()` - Scrape all dining halls
- `upload_to_supabase(food_items)` - Batch insert with conflict handling

#### Supported Locations:
- Worcester Dining Hall
- Hampshire Dining Hall
- Franklin Dining Hall
- Berkshire Dining Hall

---

## Configuration & Environment

### Environment Variables (`.env`)
```bash
SUPABASE_URL=<your-supabase-project-url>
SUPABASE_KEY=<your-supabase-anon-key>
GOOGLE_API_KEY=<gemini-api-key>  # For chatbot
PORT=8000  # Optional, defaults to 8000
```

### Dependencies (`requirements.txt`)
Key packages:
- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `supabase` - Database client
- `pydantic` - Data validation
- `pydantic-ai` - AI agent framework
- `python-dotenv` - Environment management
- `playwright` - Web scraping
- `beautifulsoup4` - HTML parsing
- `python-dateutil` - Date parsing

---

## Database Schema (Supabase)

### Tables:

#### `profiles`
- `id` (uuid, primary key) - User ID
- `age` (int)
- `sex` (text) - "Male", "Female", "Other"
- `height_inches` (float) - Actually stores cm despite name
- `weight_lbs` (float) - Actually stores kg despite name
- `activity_level` (text) - sedentary, lightly_active, moderately_active, very_active, extremely_active
- `bmr` (float) - Calculated
- `tdee` (float) - Calculated
- `email` (text, optional)
- `full_name` (text, optional)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### `food_items`
- `id` (serial, primary key)
- `name` (text)
- `serving_size` (text)
- `calories` (float)
- `protein` (float)
- `total_carb` (float)
- `total_fat` (float)
- `sodium` (float)
- `dietary_fiber` (float)
- `sugars` (float)
- `location` (text) - Dining hall name
- `date` (text) - Format: "Mon November 10, 2025"
- `meal_type` (text) - Breakfast, Lunch, Dinner
- `created_at` (timestamp)

#### `meal_entries`
- `id` (serial, primary key)
- `profile_id` (uuid, foreign key → profiles)
- `food_item_id` (int, foreign key → food_items)
- `servings` (float)
- `meal_category` (text) - Breakfast, Lunch, Dinner
- `entry_date` (text) - Format: "YYYY-MM-DD"
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### `orders`
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key → profiles)
- `delivery_location` (text)
- `delivery_time` (timestamp, optional)
- `special_instructions` (text, optional)
- `status` (text) - pending, preparing, ready, out_for_delivery, delivered, completed, cancelled
- `total_calories` (int)
- `total_protein` (float)
- `total_carbs` (float)
- `total_fat` (float)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### `order_items`
- `id` (uuid, primary key)
- `order_id` (uuid, foreign key → orders)
- `food_item_id` (int, foreign key → food_items)
- `food_item_name` (text)
- `quantity` (int)
- `calories` (int)
- `protein` (float)
- `carbs` (float)
- `fat` (float)
- `created_at` (timestamp)

#### `chat_history`
- `id` (serial, primary key)
- `user_id` (uuid, foreign key → profiles)
- `role` (text) - "user" or "assistant"
- `message` (text)
- `created_at` (timestamp)

---

## API Workflows

### 1. User Onboarding
```
1. User creates account → profile created
2. POST /api/nutrition/profiles/{user_id} with health data
3. Backend calculates BMR/TDEE
4. Profile stored with nutrition goals
```

### 2. Meal Logging
```
1. GET /api/nutrition/food-items/search?q=chicken&date=2025-11-10
2. User selects food item
3. POST /api/nutrition/meals with food_item_id, servings, date
4. Entry stored and linked to user profile
5. GET /api/nutrition/meals/{user_id}/daily-totals to see progress
```

### 3. Order Creation
```
1. Browse menu: GET /api/nutrition/food-items/search?date=2025-11-10
2. Add items to cart (frontend state)
3. POST /orders with items array
4. Backend validates items, calculates totals
5. Order created with "pending" status
6. Track with GET /orders/{order_id}
```

### 4. AI-Assisted Ordering
```
1. POST /chat with "I want chicken from Worcester today"
2. AI searches menu, presents options
3. User confirms selections
4. AI creates order via internal API call
5. Returns order confirmation
```

---

## Testing Files

### Available Test Scripts:
- `test_api.py` - General API endpoint tests
- `test_nutrition_api.py` - Nutrition-specific tests
- `test_chatbot.py` - Chatbot functionality tests
- `test_endpoints.py` - Endpoint validation
- `test_integration.py` - End-to-end integration tests
- `test_add_meal.py` - Meal entry testing
- `test_search.py` - Search functionality tests

---

## Development Scripts

### `start-backend.ps1`
PowerShell script to start the backend server:
```powershell
cd backend
python main.py
```

### `seed_data.py`
Populates database with sample data for testing:
- Creates test user profiles
- Inserts sample food items
- Creates example orders

---

## API Response Formats

### Success Response Example:
```json
{
  "id": "123",
  "name": "Grilled Chicken",
  "calories": 165,
  "protein": 31.0,
  "location": "Worcester",
  "date": "Mon November 10, 2025"
}
```

### Error Response Example:
```json
{
  "detail": "Profile not found"
}
```

HTTP Status Codes Used:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## Security Considerations

### Current Implementation:
- CORS enabled for all origins (development mode)
- Supabase RLS (Row Level Security) can be enabled
- No authentication middleware currently
- API keys stored in environment variables

### Production Recommendations:
1. Implement JWT authentication
2. Restrict CORS to specific frontend domains
3. Enable Supabase RLS policies
4. Add rate limiting
5. Input sanitization and validation
6. HTTPS only

---

## Performance Optimizations

### Database:
- Indexed columns: `user_id`, `food_item_id`, `date`, `location`
- Batch inserts for menu uploads
- Pagination for large result sets

### API:
- Async/await throughout for non-blocking I/O
- Connection pooling via Supabase client
- Query result caching opportunities (not implemented)

### AI Chatbot:
- Chat history limited to last 10 messages
- Efficient context building
- Tool call optimization

---

## Monitoring & Logging

### Health Checks:
- `GET /health` - Main API health
- Returns service availability status

### Logging:
- Console logging for development
- Error tracking in try/catch blocks
- Request logging via FastAPI middleware

---

## Future Enhancements

### Planned Features:
1. **User Authentication** - JWT-based auth system
2. **Real-time Notifications** - Order status updates via WebSockets
3. **Analytics Dashboard** - Nutrition trends and insights
4. **Payment Integration** - Stripe/PayPal for order payments
5. **Image Recognition** - Upload food photos for nutrition estimation
6. **Recipe Suggestions** - Meal planning based on nutrition goals
7. **Social Features** - Share meals and recipes
8. **Mobile API** - Optimized endpoints for mobile apps

### Technical Improvements:
- Redis caching layer
- Background job processing (Celery)
- GraphQL endpoint option
- API versioning
- Enhanced error handling
- Comprehensive test coverage
- CI/CD pipeline
- Docker containerization

---

## Contact & Support

For questions or issues related to the backend:
1. Check API documentation at `/docs`
2. Review test files for usage examples
3. Consult this documentation
4. Check Supabase dashboard for data issues

---

*Last Updated: November 8, 2025*
*Version: 1.0.0*
