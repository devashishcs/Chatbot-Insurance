from flask import Blueprint, request, jsonify
from chatbot.insurance_db import INSURANCE_DATABASE

insurance_bp = Blueprint("insurance", __name__)


@insurance_bp.route("/types", methods=["GET"])
def get_types():
    """Get available insurance types and age brackets"""
    return jsonify({
        "insurance_types": list(INSURANCE_DATABASE.keys()),
        "age_brackets": {
            insurance_type: list(brackets.keys())
            for insurance_type, brackets in INSURANCE_DATABASE.items()
        },
        "status": "success"
    })

@insurance_bp.route("/quote", methods=["POST"])
def get_quote():
    """Get insurance quote directly"""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400
    
    age = data.get('age')
    insurance_type = data.get('insurance_type')
    
    if not age or not insurance_type:
        return jsonify({"error": "Age and insurance_type are required"}), 400
    
    if not isinstance(age, int) or age < 18 or age > 100:
        return jsonify({"error": "Age must be between 18 and 100"}), 400
    
    if insurance_type not in INSURANCE_DATABASE:
        return jsonify({"error": f"Invalid insurance type. Available: {list(INSURANCE_DATABASE.keys())}"}), 400
    
    # Get age bracket
    if insurance_type == "health":
        if 18 <= age <= 25: age_bracket = "18-25"
        elif 26 <= age <= 35: age_bracket = "26-35"
        elif 36 <= age <= 50: age_bracket = "36-50"
        elif 51 <= age <= 65: age_bracket = "51-65"
        else: age_bracket = None
    elif insurance_type == "life":
        if 18 <= age <= 30: age_bracket = "18-30"
        elif 31 <= age <= 45: age_bracket = "31-45"
        elif 46 <= age <= 60: age_bracket = "46-60"
        else: age_bracket = None
    elif insurance_type == "auto":
        if 18 <= age <= 25: age_bracket = "18-25"
        elif 26 <= age <= 40: age_bracket = "26-40"
        elif 41 <= age <= 65: age_bracket = "41-65"
        else: age_bracket = None
    else:
        age_bracket = None
    
    if not age_bracket or age_bracket not in INSURANCE_DATABASE[insurance_type]:
        return jsonify({"error": "No insurance options available for this age and type"}), 404
    
    quote = INSURANCE_DATABASE[insurance_type][age_bracket]
    
    return jsonify({
        "age": age,
        "insurance_type": insurance_type,
        "age_bracket": age_bracket,
        "quote": quote,
        "status": "success"
    })