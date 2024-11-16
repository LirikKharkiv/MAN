import os
import json
import logging
import bcrypt
import jwt
import datetime
import requests
import database



from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from pydantic import BaseModel, EmailStr, Field, ValidationError

# Load environment variables
load_dotenv()

# Setup Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Database Configuration
DB_CONFIG = {
    'DB_HOST': os.getenv("DB_HOST", "localhost"),
    'DB_USER': os.getenv("DB_USER", "root"),
    'DB_PASSWORD': os.getenv("DB_PASSWORD", ""),
    'DB_NAME': os.getenv("DB_NAME", "signup"),
}

DB_URL = f"mysql+pymysql://{DB_CONFIG['DB_USER']}:{DB_CONFIG['DB_PASSWORD']}@{DB_CONFIG['DB_HOST']}/{DB_CONFIG['DB_NAME']}"
engine = create_engine(DB_URL)
Session = sessionmaker(bind=engine)

# Models
class Question(BaseModel):
    test_code: str
    question_text: str
    options: list
    correct_answers: list

class UserSignup(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(..., min_length=8)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TestCode(BaseModel):
    subject: str
    topic: str
    code: str

# JWT Secret Keys
SECRET_KEY = os.getenv("SECRET_KEY", "your_secret_key")
REFRESH_SECRET_KEY = os.getenv("REFRESH_SECRET_KEY", "your_refresh_secret_key")

# JWT Utility Functions
def create_token(email: str, duration: datetime.timedelta, refresh: bool = False) -> str:
    try:
        token = jwt.encode({
            'email': email,
            'exp': datetime.datetime.utcnow() + duration
        }, SECRET_KEY if not refresh else REFRESH_SECRET_KEY, algorithm='HS256')
        return token
    except Exception as e:
        logger.error(f"Error creating token: {str(e)}")
        raise

# Database Operation Function
def execute_db_operation(sql: str, values: dict) -> None:
    with Session() as session:
        session.execute(text(sql), values)
        session.commit()

@app.errorhandler(Exception)
def handle_exception(e):
    logger.error(f"An error occurred: {str(e)}")
    return jsonify({"error": str(e)}), 500

@app.route('/add_question', methods=['POST'])
def add_question():
    try:
        question = Question(**request.json)
        logger.info(f"Attempting to add question: {question.dict()}")

        sql = "INSERT INTO questions (test_code, question_text, options, correct_answers) VALUES (:test_code, :question_text, :options, :correct_answers)"
        values = {
            "test_code": question.test_code,
            "question_text": question.question_text,
            "options": json.dumps(question.options),
            "correct_answers": json.dumps(question.correct_answers),
        }
        execute_db_operation(sql, values)
        logger.info("Question added successfully.")
        return jsonify({"message": "Question added successfully", "question": question.dict()}), 201

    except ValidationError as e:
        logger.error(f"Validation error: {e}")
        return jsonify({"error": "Invalid input"}), 400

@app.route('/questions/<test_code>', methods=['GET'])
def get_questions(test_code: str):
    logger.info(f"Retrieving questions for test code: {test_code}")
    try:
        with Session() as session:
            sql = "SELECT * FROM questions WHERE test_code = :test_code"
            result = session.execute(text(sql), {"test_code": test_code})
            questions = result.fetchall()
            if questions:
                return jsonify([dict(row) for row in questions]), 200
            else:
                return jsonify({"error": "Questions not found for the provided test code"}), 404
    except Exception as e:
        logger.error(f"Error retrieving questions: {str(e)}")
        return jsonify({"error": "An error occurred while retrieving questions."}), 500

@app.route('/signup', methods=['POST'])
def signup():
    user = UserSignup(**request.json)
    user.password = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    sql = "INSERT INTO login (name, email, password) VALUES (:name, :email, :password)"
    values = {"name": user.name, "email": user.email, "password": user.password}

    try:
        execute_db_operation(sql, values)
        return jsonify({"message": "User  registered successfully"}), 201
    except ValidationError as e:
        logger.error(f"Validation error: {e}")
        return jsonify({"error": "Invalid input"}), 400
    except Exception as e:
        logger.error(f"Error registering user: {str(e)}")
        return jsonify({"error": "An error occurred during signup."}), 500

@app.route('/login', methods=['POST'])
def login():
    user = UserLogin(**request.json)
    
    with Session() as session:
        sql = "SELECT * FROM login WHERE email = :email"
        result = session.execute(text(sql), {"email": user.email})
        data = result.fetchone()

        if data is None or not bcrypt.checkpw(user.password.encode('utf-8'), data[3].encode('utf-8')):
            logger.warning("Invalid credentials.")
            return jsonify({"error": "Invalid credentials"}), 401

        access_token = create_token(data[2], datetime.timedelta(minutes=15))  # email
        refresh_token = create_token(data[2], datetime.timedelta(days=7), refresh=True)

        # Store the refresh token in the database associated with the user
        sql = "UPDATE login SET refresh_token = :refresh_token WHERE email = :email"
        execute_db_operation(sql, {"refresh_token": refresh_token, "email": data[2]})

        return jsonify({
            "id": data[0],
            "name": data[1],
            "email": data[2],
            "access_token": access_token,
            "refresh_token": refresh_token  
        }), 200

@app.route('/refresh', methods=['POST'])
def refresh():
    refresh_token = request.json.get('refresh_token')
    try:
        payload = jwt.decode(refresh_token, REFRESH_SECRET_KEY, algorithms=['HS256'])
        new_access_token = create_token(payload['email'], datetime.timedelta(minutes=15))
        return jsonify({"access_token": new_access_token}), 200
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Refresh token expired."}), 403
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid refresh token."}), 403

@app.route('/create_test', methods=['POST'])
def create_test():
    logger.info("Received a request to create a test.")
    
    data = request.get_json()
    logger.info(f"Data received: {data}")

    if not data or 'subject' not in data or 'topic' not in data or 'code' not in data:
        logger.error("Missing required fields.")
        return jsonify({"error": "Missing required fields."}), 400

    subject = data['subject']
    topic = data['topic']
    code = data['code']  

    try:
        with Session() as session:
            sql = "SELECT * FROM tests WHERE code = :code"
            result = session.execute(text(sql), {"code": code})
            existing_test = result.fetchone()
            if existing_test:
                return jsonify({'error': 'Test code already exists.'}), 400

            sql = "INSERT INTO tests (subject, topic, code) VALUES (:subject, :topic, :code)"
            values = {"subject": subject, "topic": topic, "code": code}
            execute_db_operation(session, sql, values)  # Pass the session to the operation

            # Prepare request to AI.py
            ai_response = requests.post('http://localhost:8082/generate_questions', json={
                "subject": subject,
                "topic": topic,
                "code": code
            })

            if ai_response.status_code == 200:
                questions_data = ai_response.json().get('questions', [])
                logger.info(f"Questions generated successfully: {questions_data}")

                for q in questions_data:
                    sql = "INSERT INTO questions (test_code, question_text, options, correct_answers) VALUES (:test_code, :question_text, :options, :correct_answers)"
                    values = {
                        "test_code": code,
                        "question_text": q['question'],
                        "options": json.dumps(q['options']),
                        "correct_answers": json.dumps(q['correct_answers']),
                    }
                    execute_db_operation(session, sql, values)  # Pass the session to the operation

                return jsonify({"message": "Test created and questions saved successfully.", "test_code": code}), 201

            logger.error("Failed to generate questions from AI.")
            return jsonify({"error": "Failed to generate questions."}), 500

    except Exception as e:
        logger.error(f"Error creating test: {str(e)}")
        return jsonify({"error": "An error occurred while creating the test."}), 500

def execute_db_operation(session, sql, values):
    """Function to execute a given SQL operation. Adds exception handling."""
    try:
        session.execute(text(sql), values)
        session.commit()
    except Exception as e:
        session.rollback()
        logger.error(f"Database operation failed: {str(e)}")
        raise

@app.route('/check_test_code/<code>', methods=['GET'])
def check_test_code(code: str):
    logger.info(f"Checking existence of test code: {code}")
    try:
        with Session() as session:
            sql = "SELECT * FROM tests WHERE code = :code"
            result = session.execute(text(sql), {"code": code})
            existing_test = result.fetchone()
            return jsonify({"exists": existing_test is not None}), 200
    except Exception as e:
        logger.error(f"Error checking test code: {str(e)}")
        return jsonify({"error": "An error occurred while checking test code."}), 500

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8081)  # Main server