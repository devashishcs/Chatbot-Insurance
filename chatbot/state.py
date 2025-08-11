from typing import TypedDict, List, Optional, Dict, Any

class ChatbotState(TypedDict):
    messages: List[Dict[str, str]]
    user_age: Optional[int]
    insurance_type: Optional[str]
    user_query: str
    relevant_docs: List[Dict[str, Any]]
    missing_info: List[str]
    conversation_stage: str
    last_response: str
    insured_for: Optional[str]
    intent: Optional[str]  # Added to track user intent
    greeting_detected: bool = False  # Track if greeting was detected