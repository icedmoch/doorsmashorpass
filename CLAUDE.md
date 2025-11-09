# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Using MCP Tools

**For Latest Documentation:**
- Use `context7` MCP server to retrieve up-to-date library documentation
- Call `mcp__context7__resolve-library-id` to find library IDs for packages like React, FastAPI, Supabase, etc.
- Call `mcp__context7__get-library-docs` with the library ID to fetch current documentation
- Example: For Supabase Python client docs, resolve "supabase-py" and fetch documentation

**For Supabase Database Operations:**
- Use `supabase` MCP server for testing and database operations
- List projects: `mcp__supabase__list_projects`
- Execute SQL queries: `mcp__supabase__execute_sql` for testing data queries
- Get advisors: `mcp__supabase__get_advisors` to check for security vulnerabilities and performance issues
- List tables: `mcp__supabase__list_tables` to understand database schema
- Apply migrations: `mcp__supabase__apply_migration` for DDL operations

**When to Use MCP Tools:**
- When user asks about library-specific features → Use context7 for latest docs
- When testing database queries → Use Supabase MCP to execute SQL directly
- When checking security/performance → Use `get_advisors` after schema changes
- When troubleshooting RLS issues → Use Supabase MCP to verify policies

## Project Overview

DoorSmashOrPass is a campus food delivery platform connecting students with student couriers, featuring AI-powered nutrition coaching. Built for HackUMass XIII.

**Tech Stack:**
- Frontend: React 18 + Vite + TypeScript + Tailwind + shadcn-ui
- Backend: FastAPI (Python) with 3 separate APIs
- Database: Supabase (PostgreSQL with RLS)
- AI: PydanticAI + Google Gemini 2.5 Flash
- Voice: ElevenLabs for speech-to-text and text-to-speech
- Deployment: AWS Lambda + ECR for web scraping

## Development Commands

### Quick Start (Windows PowerShell)
```powershell
# Prerequisites: Python 3.8+, Node.js 18+, backend/.venv created
.\start-dev.ps1
```

This script automatically:
- Kills processes on ports 8000, 8002, 8080
- Starts backend API (port 8000)
- Starts chatbot API (port 8002)
- Starts frontend dev server (port 5173)

### Manual Start

**Backend - Main API (port 8000):**
```powershell
cd backend
.venv\Scripts\activate
python main.py
```

**Backend - Chatbot API (port 8002):**
```powershell
cd backend
.venv\Scripts\activate
python chatbot_api.py
```

**Frontend (port 5173):**
```powershell
cd frontend
npm run dev
```

### Build Commands

**Frontend:**
```bash
npm run build          # Production build
npm run build:dev      # Development build
npm run preview        # Preview production build
npm run lint           # Run ESLint
```

**Backend:**
```bash
pip install -r requirements.txt  # Install dependencies
```

### Testing

**Comprehensive Test Suite:**
```bash
cd backend
.venv\Scripts\activate

# Run all verification tests
python verify_implementation.py              # Comprehensive system verification

# Individual test suites
python test_chatbot_nutrition_comprehensive.py  # 10 nutrition integration tests
python test_chatbot_orders_integration.py       # Order creation and management tests
python test_emoji_fix.py                        # Verify ASCII-only responses
python test_endpoints.py                        # Direct API endpoint tests
python test_integration.py                      # End-to-end integration tests
```

**Test Coverage:**
1. **Nutrition Features** - Search food items, log meals, get daily totals, meal history, profile management
2. **Order Features** - Create orders with GPS, retrieve orders, order status tracking
3. **Chatbot Integration** - Multi-turn conversations, context retention, tool execution
4. **Error Handling** - Invalid IDs, missing data, authentication failures
5. **Data Integrity** - BMR/TDEE calculations, nutrition totals, order item aggregation

**Manual Frontend Testing:**

1. Start all services with `.\start-dev.ps1`
2. Navigate to http://localhost:5173/chatbot
3. Test these chatbot queries:
   ```
   "Search for chicken items on 2025-11-11"
   "Log food item ID 68 for lunch"
   "What are my nutrition totals for today?"
   "Show my meal history for the past 7 days"
   "Show my nutrition profile"
   "Update my weight to 75 kg"
   "I want to order a burger"
   "Show my orders"
   ```

**Test Data:**

- **Test User ID:** `10fccccb-4f6c-4a8f-954f-1d88aafeaa37`
- **Test Food Items:**
  - ID 67: Aloo Gobi (51 cal, 1.6g protein)
  - ID 68: Big Mack Burger (551 cal, 29.6g protein)
  - ID 69: Butter Chicken Rasoi (167 cal, 10.8g protein)
  - ID 55: Blueberry Yogurt Parfait (285 cal, 7.3g protein)
- **Available Menu Dates:**
  - Tue November 11, 2025
  - Wed November 12, 2025
  - Tue November 18, 2025
  - Wed November 19, 2025

**Debugging Tests:**

Enable verbose logging in browser DevTools (F12 → Console):
- Menu.tsx logs search queries and item counts
- Nutrition.tsx logs each step of meal addition with emoji markers (🍽️, ✅, ❌)
- Check Network tab for failed API calls (status codes, response data)

**Expected Test Duration:**
- Full test suite: 2-5 minutes (AI responses take 3-10 seconds each)
- Individual tests: 10-60 seconds

## Testing Guide

### Test File Structure

**Backend Tests** (`backend/` directory):

| Test File | Purpose | What It Tests |
|-----------|---------|--------------|
| `verify_implementation.py` | Comprehensive system check | All features, emoji removal, API endpoints |
| `test_chatbot_nutrition_comprehensive.py` | Nutrition integration | 10 tests covering food search, meal logging, profiles |
| `test_chatbot_orders_integration.py` | Orders integration | Order creation, GPS location, order history |
| `test_emoji_fix.py` | ASCII validation | Verifies chatbot responses contain no emojis |
| `test_endpoints.py` | Direct API testing | Tests nutrition/orders endpoints without chatbot |
| `test_integration.py` | End-to-end flows | Full user journeys from search to order |
| `test_nutrition_api.py` | Nutrition API only | Profile CRUD, meal entries, daily totals |
| `test_api.py` | Orders API only | Order CRUD operations |
| `test_chatbot.py` | Chatbot basic | Message handling, history, context |

### Running Specific Test Scenarios

**Test Nutrition Tracking:**
```bash
cd backend
.venv\Scripts\activate

# Test meal logging flow
python -c "
import requests
response = requests.post('http://localhost:8002/chat', json={
    'message': 'Log food item ID 68 as 1 serving for lunch',
    'user_id': '10fccccb-4f6c-4a8f-954f-1d88aafeaa37'
})
print(response.json()['response'])
"

# Test daily totals
python -c "
import requests
response = requests.post('http://localhost:8002/chat', json={
    'message': 'What are my nutrition totals for today?',
    'user_id': '10fccccb-4f6c-4a8f-954f-1d88aafeaa37'
})
print(response.json()['response'])
"
```

**Test Order Creation:**
```bash
# With GPS location
python -c "
import requests
response = requests.post('http://localhost:8002/chat', json={
    'message': 'I want to order food item ID 68',
    'user_id': '10fccccb-4f6c-4a8f-954f-1d88aafeaa37',
    'user_location': {'latitude': 42.3868, 'longitude': -72.5301}
})
print(response.json()['response'])
"
```

**Test Database Directly (using Supabase MCP):**
```bash
# Query food items
mcp__supabase__execute_sql --project_id <your-project-id> --query "SELECT name, calories, protein FROM food_items WHERE date = 'Tue November 11, 2025' LIMIT 5"

# Check user profile
mcp__supabase__execute_sql --query "SELECT * FROM profiles WHERE id = '10fccccb-4f6c-4a8f-954f-1d88aafeaa37'"

# Verify meal entries
mcp__supabase__execute_sql --query "SELECT * FROM meal_entries WHERE user_id = '10fccccb-4f6c-4a8f-954f-1d88aafeaa37' ORDER BY entry_date DESC LIMIT 10"
```

### Testing Checklist

**Before Committing Changes:**
- [ ] Run `python verify_implementation.py` - all tests pass
- [ ] Test chatbot responses contain no emojis
- [ ] Check API docs at http://localhost:8000/docs for new endpoints
- [ ] Run Supabase advisors: `mcp__supabase__get_advisors --type security --type performance`
- [ ] Test RLS policies if modified database schema
- [ ] Verify frontend integration at http://localhost:5173

**When Adding New Features:**
- [ ] Write test in appropriate test file
- [ ] Test with chatbot if AI-related
- [ ] Test API endpoint directly
- [ ] Update CLAUDE.md if architecture changes
- [ ] Add test data entries if needed

**When Modifying Database Schema:**
- [ ] Use `mcp__supabase__apply_migration` for DDL changes
- [ ] Test RLS policies with different users
- [ ] Run `get_advisors` to check for issues
- [ ] Update order totals calculation if affecting orders/order_items
- [ ] Verify date formats match "Mon November 11, 2025" pattern

### Common Test Failures

**"Cannot connect to API":**
- Solution: Ensure `.\start-dev.ps1` is running and wait 10-15 seconds for startup
- Check ports: `netstat -ano | findstr :8000` and `netstat -ano | findstr :8002`

**"Food item not found":**
- Solution: Check date format matches `"Tue November 11, 2025"` (with day of week)
- Verify test data exists: Use Supabase MCP to query `food_items` table
- Check available dates in database

**"Profile not found":**
- Solution: Test user may not exist, create via Supabase Auth or use existing user
- Query profiles table: `mcp__supabase__execute_sql --query "SELECT id FROM profiles LIMIT 1"`

**"Emoji found in response":**
- Solution: Chatbot system prompt should specify ASCII-only responses
- Check `chatbot_api.py` system prompt includes "no emojis" instruction
- Clear chat history: `DELETE FROM chat_history WHERE user_id = ?`

**"Order totals incorrect":**
- Solution: Run `calculate_and_update_order_totals()` function
- Check order_items table has correct nutrition values
- Verify food_items referenced have valid nutrition data

**"Test timeout":**
- Solution: Gemini AI can take 3-10 seconds per response, increase timeout to 30s
- Check API logs for errors
- Verify Google API key is valid in `.env`

### Writing New Tests

**Template for Chatbot Tests:**
```python
import requests

CHATBOT_API = "http://localhost:8002"
USER_ID = "10fccccb-4f6c-4a8f-954f-1d88aafeaa37"

def test_new_feature():
    response = requests.post(f"{CHATBOT_API}/chat", json={
        "message": "Your test query",
        "user_id": USER_ID
    }, timeout=30)

    assert response.status_code == 200
    data = response.json()

    # Check response
    assert "expected_keyword" in data["response"].lower()

    # Check no emojis
    emoji_chars = ['📦', '📍', '🔥', '💪', '✅']
    for emoji in emoji_chars:
        assert emoji not in data["response"], f"Found emoji: {emoji}"
```

**Template for API Tests:**
```python
import requests

API_URL = "http://localhost:8000"

def test_nutrition_endpoint():
    response = requests.get(
        f"{API_URL}/api/nutrition/food-items/search",
        params={"q": "burger", "date": "2025-11-11"}
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert "name" in data[0]
    assert "calories" in data[0]
```

### Performance Testing

**Check Response Times:**
- Chatbot: Should respond within 10 seconds
- Nutrition API: Should respond within 500ms
- Orders API: Should respond within 1 second
- Food search: Should return results within 300ms

**Database Query Optimization:**
Use Supabase MCP to check slow queries:
```sql
-- Find slow queries
SELECT * FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0;
```

## Architecture

### Three-Layer API Structure

```
Frontend (React) → Backend APIs → Supabase
                   ├─ main.py (port 8000) - Unified router
                   ├─ chatbot_api.py (port 8002) - AI agent
                   └─ Routes from:
                      ├─ orders_api.py
                      └─ nutrition_api.py
```

**Key Design Decision:** `main.py` manually appends routes from `orders_api.py` and `nutrition_api.py` to avoid FastAPI mount() issues that break dependency injection. All routes serve from port 8000.

### API Responsibilities

**Orders API (`orders_api.py`):**
- Create/manage orders with delivery tracking
- Calculate nutrition totals from order items
- Key function: `calculate_and_update_order_totals()` - Aggregates nutrition from order_items table
- Uses RLS-aware Supabase client from JWT token

**Nutrition API (`nutrition_api.py`):**
- User profile management (BMR/TDEE calculations)
- Food item search from dining hall menus
- Meal logging and daily nutrition tracking
- Database layer: `nutrition_db.py` wraps all Supabase operations

**Chatbot API (`chatbot_api.py`):**
- PydanticAI agent with 8 tools for orders and nutrition
- Orchestrates via HTTP calls to other APIs
- Stores chat history in Supabase for context
- Dynamic system prompt includes: current date, user profile, chat history, available menu dates

### PydanticAI Agent Tools

The chatbot uses these tools (defined with `@agent.tool` decorator):

1. `search_food_items()` - Query food_items table by location, date, search term
2. `create_order()` - HTTP POST to Orders API
3. `get_my_orders()` - HTTP GET user's orders
4. `get_order_details()` - HTTP GET specific order
5. `log_meal_to_nutrition()` - HTTP POST to Nutrition API
6. `get_daily_nutrition_totals()` - HTTP GET nutrition summary
7. `get_user_nutrition_profile()` - HTTP GET user profile
8. `update_nutrition_profile()` - HTTP PATCH profile fields

**Agent Behavior:**
- Asks clarifying questions before actions
- Maintains conversation context from chat_history table
- Returns ASCII-only responses (no emojis for system compatibility)
- Automatically injects current date formatted as "Mon November 11, 2025"

### Database Schema (Supabase)

**Core Tables:**

| Table | Purpose | Key Relationships |
|-------|---------|------------------|
| `profiles` | User accounts with BMR/TDEE, dietary preferences | 1:1 with auth.users |
| `food_items` | Dining hall menus (scraped from UMass) | Public read, queried by date + location |
| `orders` | Customer orders with delivery details | 1:many with profiles, has order_items |
| `order_items` | Individual items in an order | many:1 with orders, references food_items |
| `meal_entries` | User nutrition log | many:1 with profiles |
| `chat_history` | Chatbot conversation history | many:1 with profiles |

**Critical Date Format:** Food items use format `"Mon November 11, 2025"` for consistent querying. The chatbot's `get_current_date_formatted()` function generates this format.

**Row Level Security (RLS):** All user data tables enforce `auth.uid() = user_id`. Frontend must pass JWT token in Authorization header.

### Frontend Architecture

**Key Pages:**
- `Chatbot.tsx` - AI conversation interface with voice I/O
- `Menu.tsx` - Browse dining hall menus
- `Nutrition.tsx` - Track meals and view statistics
- `Checkout.tsx` - Create orders
- `OrderHistory.tsx` - View past orders
- `Settings.tsx` - Update user profile

**Authentication Flow:**
1. `Auth.tsx` handles login/signup via Supabase Auth
2. `ProtectedRoute.tsx` guards authenticated pages
3. JWT token stored in localStorage via Supabase SDK
4. API calls automatically inject token via `src/lib/api.ts`

**State Management:**
- `CartContext.tsx` - Shopping cart state
- `@tanstack/react-query` - Server state caching
- Supabase client: `src/integrations/supabase/client.ts`

## Environment Variables

### Backend `.env`
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_service_role_key
GOOGLE_API_KEY=your_gemini_api_key
ELEVENLABS_API_KEY=your_elevenlabs_key
PORT=8000
NUTRITION_API_BASE=http://localhost:8000
ORDERS_API_BASE=http://localhost:8000
```

### Frontend `.env`
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=http://localhost:8000
VITE_CHATBOT_API_URL=http://localhost:8002
VITE_ELEVENLABS_API_KEY=your_elevenlabs_key
```

## Common Development Workflows

### Adding a New Chatbot Tool

1. Define tool function in `chatbot_api.py` with `@agent.tool` decorator
2. Add to `ChatbotDeps` dataclass if needs context
3. Update system prompt to mention new capability
4. Tool can either:
   - Query Supabase directly (like `search_food_items`)
   - Call other APIs via HTTPX (like `create_order`)

### Modifying Order Creation Flow

1. Update `OrderCreate` model in `orders_api.py`
2. Modify `POST /orders` endpoint logic
3. Ensure `calculate_and_update_order_totals()` runs after items added
4. Update chatbot's `create_order` tool if API contract changes

### Adding New Nutrition Endpoints

1. Add database function in `nutrition_db.py`
2. Create endpoint in `nutrition_api.py`
3. Routes automatically available via `main.py` (no mount needed)
4. Update chatbot tools if AI should access new endpoint

## Critical Implementation Details

### Emoji Removal
The system removes emojis from all chatbot responses for compatibility. This is handled in the agent's response processing.

### Order Total Calculation
Orders table stores pre-calculated totals (calories, protein, carbs, fat) computed from order_items. The `calculate_and_update_order_totals()` function must run after any order_items changes.

### Date Handling
- Backend uses `datetime.now().strftime("%a %B %d, %Y")` format
- Food items queried by this exact format
- Chatbot automatically injects current date into system prompt

### Authentication
- Frontend: Supabase Auth SDK manages JWT
- Backend: `get_supabase_client()` creates RLS-aware client from request token
- Chatbot: Forwards user tokens when calling other APIs via HTTPX

### Inter-API Communication
Chatbot API calls Orders/Nutrition APIs via HTTPX with proper authentication. Base URLs configurable via environment variables.

## Access Points

- Frontend: http://localhost:5173
- Main API Docs: http://localhost:8000/docs
- Chatbot API Docs: http://localhost:8002/docs
- Chatbot Page: http://localhost:5173/chatbot

## Known Issues & Fixes

- **Port conflicts:** Run `start-dev.ps1` which kills existing processes first
- **RLS errors:** Ensure JWT token passed in Authorization header
- **Missing nutrition totals:** Run `calculate_and_update_order_totals()` after order creation
- **Date query failures:** Verify date format matches `"Mon November 11, 2025"` pattern

## AWS Lambda Integration

The project includes Lambda functions for scraping UMass dining menus:
- Located in `lambda/` directory
- Uses custom Docker images deployed to AWS ECR
- Playwright for browser automation
- See `lambda/README.md` for deployment details

## Project Structure

```
doorsmashorpass/
├── backend/
│   ├── main.py              # Unified API entry point
│   ├── chatbot_api.py       # AI agent API
│   ├── orders_api.py        # Orders endpoints
│   ├── nutrition_api.py     # Nutrition endpoints
│   ├── nutrition_db.py      # Database operations
│   ├── nutrition_models.py  # Pydantic models
│   ├── scraper.py           # Menu scraping logic
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/           # Route components
│   │   ├── components/      # Reusable UI components
│   │   ├── integrations/    # Supabase client
│   │   ├── lib/             # API wrapper
│   │   └── contexts/        # React contexts
│   └── package.json
├── lambda/                  # AWS Lambda functions
├── start-dev.ps1           # Development startup script
└── README.md               # Project overview
```

## Tips for Future Development

1. **Always use RLS-aware Supabase clients** - Call `get_supabase_client()` with JWT token
2. **Keep chatbot system prompt updated** - It's the agent's "memory" of capabilities
3. **Test date formatting** - Food queries break with wrong date format
4. **Verify order totals** - Always recalculate after modifying order_items
5. **Use chat_history for context** - Chatbot retrieves last 10 messages automatically
6. **ASCII-only responses** - Chatbot removes emojis for system compatibility
