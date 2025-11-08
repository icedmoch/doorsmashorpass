# Agentic Order Assistant Setup

## Architecture

- **Orders API** (port 8001): Mock orders database with search and confirm endpoints
- **Chatbot API** (port 8002): Agentic PydanticAI chatbot with Gemini that uses tools to interact with orders
- **Streamlit UI** (port 8501): Chat interface for testing

## Setup

1. Install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

2. Set Google API key in `backend/.env`:
```
GOOGLE_API_KEY=your-key-here
```

3. Switch to backend directory

4. Start the orders API:
```bash
fastapi run orders_api.py --port 8001
```

5. Start the chatbot API (new terminal):
```bash
python backend/chatbot_api.py
fastapi run orders_api.py --port 8002
```

## How It Works

The agent has 3 tools:
- **search_orders**: Search all orders or filter by status
- **get_order_details**: Get specific order info
- **confirm_order**: Confirm an order

The agent autonomously decides which tools to use based on your request.

## Example Queries

- "Show me all pending orders"
- "What's the status of order ORD001?"
- "Confirm order ORD002"
- "List all orders and confirm the burger order"
