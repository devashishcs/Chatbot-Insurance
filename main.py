from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os

from chatbot.chatbot_api import InsuranceChatbotAPI
from chatbot.utils import async_route
from routes.chat_routes import chat_bp
from routes.insurance_routes import insurance_bp
from routes.admin_routes import admin_bp
from routes.error_handlers import register_error_handlers

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY', 'session-key')
CORS(app)

# Register Blueprints
app.register_blueprint(chat_bp, url_prefix="/api/chat")
app.register_blueprint(insurance_bp, url_prefix="/api/insurance")
app.register_blueprint(admin_bp, url_prefix="/api/admin")
register_error_handlers(app)

# Start app
if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=int(os.getenv('PORT', 5000)),
        debug=os.getenv('FLASK_ENV') == 'development'
    )