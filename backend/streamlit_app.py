import streamlit as st
import requests
from streamlit_javascript import st_javascript

st.title("🤖 Agentic Order Assistant")

API_URL = "http://localhost:8002/chat"

if "messages" not in st.session_state:
    st.session_state.messages = []

if "user_location" not in st.session_state:
    st.session_state.user_location = None

# Sidebar for user configuration and instructions
with st.sidebar:
    st.markdown("### User Configuration")
    user_id = st.text_input(
        "User UUID",
        value="10fccccb-4f6c-4a8f-954f-1d88aafeaa37",
        help="Enter your user UUID from Supabase profiles table"
    )

    st.markdown("### Location")
    if st.button("📍 Get My Location"):
        # JavaScript to get geolocation
        location_js = """
        await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                (position) => resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                }),
                (error) => reject(error)
            );
        });
        """
        try:
            location = st_javascript(location_js)
            if location:
                st.session_state.user_location = location
                st.success(f"Location captured: {location['latitude']:.4f}, {location['longitude']:.4f}")
        except:
            st.warning("Could not get location. Please allow location access in your browser.")

    if st.session_state.user_location:
        st.info(f"📌 Current: {st.session_state.user_location['latitude']:.4f}, {st.session_state.user_location['longitude']:.4f}")
        if st.button("Clear Location"):
            st.session_state.user_location = None
            st.rerun()

    st.markdown("### Setup")
    st.markdown("1. Start orders API: `python backend/orders_api.py`")
    st.markdown("2. Start chatbot: `python backend/chatbot_api.py`")
    st.markdown("3. Set GOOGLE_API_KEY in backend/.env")
    st.markdown("### Try asking:")
    st.markdown("- Show me breakfast items from Worcester")
    st.markdown("- What food has the most protein?")
    st.markdown("- Create an order with French Toast Sticks")
    st.markdown("- Show me my orders")

    if st.button("Clear Chat"):
        st.session_state.messages = []
        st.rerun()

# Display chat history
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# Chat input
if prompt := st.chat_input("Ask about orders..."):
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    with st.chat_message("assistant"):
        try:
            # Prepare request payload
            payload = {
                "message": prompt,
                "user_id": user_id
            }

            # Include location if available
            if st.session_state.user_location:
                payload["user_location"] = st.session_state.user_location

            response = requests.post(API_URL, json=payload)
            if response.status_code == 200:
                bot_response = response.json()["response"]
                st.markdown(bot_response)
                st.session_state.messages.append({"role": "assistant", "content": bot_response})
            else:
                st.error(f"API Error: {response.status_code}")
        except Exception as e:
            st.error(f"Could not connect to API. Ensure both servers are running. Error: {e}")
