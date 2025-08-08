from flask import Blueprint, jsonify
from datetime import datetime, timedelta
from routes.chat_routes import conversation_states

admin_bp = Blueprint("admin", __name__)

# Cleanup old conversations (run periodically in production)
def cleanup_old_conversations():
    """Remove conversations older than 24 hours"""
    cutoff_time = datetime.now() - timedelta(hours=24)
    expired_conversations = [
        conv_id for conv_id, conv_data in conversation_states.items()
        if conv_data["last_activity"] < cutoff_time
    ]
    
    for conv_id in expired_conversations:
        del conversation_states[conv_id]
    
    return len(expired_conversations)

@admin_bp.route("/cleanup", methods=["POST"])
def cleanup():
    """Admin endpoint to cleanup old conversations"""
    cleaned_count = cleanup_old_conversations()
    return jsonify({
        "cleaned_conversations": cleaned_count,
        "active_conversations": len(conversation_states),
        "status": "success"
    })