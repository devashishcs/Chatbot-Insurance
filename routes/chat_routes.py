from flask import Blueprint, request, jsonify
from chatbot.chatbot_api import InsuranceChatbotAPI
from chatbot.state import ChatbotState
from chatbot.utils import async_route
import uuid
from datetime import datetime

chat_bp = Blueprint("chat", __name__)

chatbot = InsuranceChatbotAPI()
conversation_states = {}

@chat_bp.route("/start", methods=["POST"])
def start_conversation():
    """Start a new conversation"""
    conversation_id = str(uuid.uuid4())
    
    # Initialize conversation state
    conversation_states[conversation_id] = {
        "state": ChatbotState(
            messages=[],
            user_age=None,
            insurance_type=None,
            user_query="",
            relevant_docs=[],
            missing_info=[],
            conversation_stage="start",
            last_response="",
            insured_for=None,
            intent=None, # Initialize intent as None
            greeting_detected=False  # Initialize greeting_detected as False
        ),
        "created_at": datetime.now(),
        "last_activity": datetime.now()
    }
    
    return jsonify({
        "conversation_id": conversation_id,
        "message": "Hi! I'm your insurance assistant. How can I help you find the right insurance today?",
        "status": "success"
    })

@chat_bp.route("/<conversation_id>", methods=["POST"])
@async_route
async def chat_message(conversation_id):
    """Send a message in an existing conversation"""
    if not chatbot:
        return jsonify({"error": "Chatbot not initialized. Please check OpenAI API key."}), 500
    
    # Get request data
    data = request.get_json()
    if not data or 'message' not in data:
        return jsonify({"error": "Message is required"}), 400
    
    user_message = data['message']
    
    # Check if conversation exists
    if conversation_id not in conversation_states:
        return jsonify({"error": "Conversation not found"}), 404
    
    # Get conversation state
    conversation = conversation_states[conversation_id]
    state = conversation["state"]
    
    try:
        # Process message
        response, updated_state = await chatbot.chat(user_message, state)
        
        # Update conversation state
        conversation_states[conversation_id] = {
            "state": updated_state,
            "created_at": conversation["created_at"],
            "last_activity": datetime.now()
        }
        print(f"Updated conversation state for {conversation_id}: {updated_state}")
        return jsonify({
            "response": response,
            "conversation_id": conversation_id,
            "user_info": {
                "age": updated_state.get("user_age"),
                "insurance_type": updated_state.get("insurance_type"),
                "insured_for": updated_state.get("insured_for"),
                "intent": updated_state.get("intent")
            },
            "status": "success"
        })
        
    except Exception as e:
        return jsonify({
            "error": f"Error processing message: {str(e)}",
            "status": "error"
        }), 500

@chat_bp.route("/<conversation_id>/history", methods=["GET"])
def get_history(conversation_id):
    """Get conversation history"""
    if conversation_id not in conversation_states:
        return jsonify({"error": "Conversation not found"}), 404
    
    conversation = conversation_states[conversation_id]
    state = conversation["state"]
    
    return jsonify({
        "conversation_id": conversation_id,
        "messages": state.get("messages", []),
        "user_info": {
            "age": state.get("user_age"),
            "insurance_type": state.get("insurance_type")
        },
        "created_at": conversation["created_at"].isoformat(),
        "last_activity": conversation["last_activity"].isoformat(),
        "status": "success"
    })
