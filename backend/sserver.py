import os
import logging
import bcrypt
import jwt
import json
import datetime
import random
import nest_asyncio
nest_asyncio.apply()
from g4f.client import Client
from fastapi import FastAPI, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel, EmailStr, Field
from transformers import pipeline
from database import Session, execute_db_operation
from sqlalchemy import text
from fastapi.responses import JSONResponse

app = FastAPI()

# Adding CORS middleware correctly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with specific origins if possible
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

load_dotenv()

logging.basicConfig(level=logging.INFO, format='%(asctime)s = %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserSignup(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(..., min_length=8)

SECRET_KEY = os.getenv("SECRET_KEY", "your_secret_key")
REFRESH_SECRET_KEY = os.getenv("REFRESH_SECRET_KEY", "your_refresh_secret_key")

def create_token(email: str, duration: datetime.timedelta, refresh: bool = False) -> str:
    try:
        token = jwt.encode({
            'email': email,
            'exp': datetime.datetime.utcnow() + duration,
        }, SECRET_KEY if not refresh else REFRESH_SECRET_KEY, algorithm='HS256')
        return token
    except Exception as e:
        logger.error(f"Error in create_token: {e}")
        raise

@app.exception_handler(Exception)
async def handle_exception(request, exc):
    logger.error(f'An error occurred: {str(exc)}', exc_info=True)
    return JSONResponse(status_code=500, content={"error": "An internal server error occurred."})

@app.post('/login')
async def login(user: UserLogin):
    logger.info(f"Login attempt for {user.email}")
    
    with Session() as session:
        sql = 'SELECT * FROM login WHERE email = :email'
        result = session.execute(text(sql), {'email': user.email})
        data = result.fetchone()

        if data is None or not bcrypt.checkpw(user.password.encode('utf-8'), data[3].encode('utf-8')):
            logger.warning('Invalid credentials.')
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials.")

        access_token = create_token(data[2], datetime.timedelta(minutes=15))  # data[2] is the email
        refresh_token = create_token(data[2], datetime.timedelta(days=7), refresh=True)

        sql = "UPDATE login SET refresh_token = :refresh_token WHERE email = :email"
        execute_db_operation(sql, {"refresh_token": refresh_token, "email": user.email})

        return JSONResponse(content={
            "id": data[0],
            "name": data[1],
            "email": data[2],
            "access_token": access_token,
            "refresh_token": refresh_token
        }, status_code=200)

@app.post('/refresh')
async def refresh(request: Request):
    refresh_token = request.json.get('refresh_token')
    try:
        payload = jwt.decode(refresh_token, REFRESH_SECRET_KEY, algorithms=['HS256'])
        new_access_token = create_token(payload['email'], datetime.timedelta(minutes=15))
        return JSONResponse(content={"access_token": new_access_token}, status_code=200)
    except jwt.ExpiredSignatureError:
        return JSONResponse(content={"error": "Refresh token expired. Please login again."}, status_code=401)
    except jwt.InvalidTokenError:
        return JSONResponse(content={"error": "Invalid token. Please login again."}, status_code=401)

@app.post("/signup")
async def signup(user: UserSignup):
    hashed_password = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    with Session() as session:
        # Check for existing user
        existing_user = session.execute(
            text('SELECT email FROM login WHERE email = :email'),
            {'email': user.email}
        ).fetchone()

        if existing_user:
            raise HTTPException(status_code=409, detail="Email already exists.")

        sql = "INSERT INTO login (name, email, password) VALUES (:name, :email, :password)"
        values = {"name": user.name, "email": user.email, "password": hashed_password}

        try:
            execute_db_operation(sql, values)
            return JSONResponse(content={"message": "User created successfully."}, status_code=201)
        except Exception as e:
            logger.error(f"Error registering user: {str(e)}")
            raise HTTPException(status_code=500, detail="An error occurred while creating user.")

@app.post("/generate_code")
async def generate_code(prompt: str):
    # Generate a random code with digits up to 8 characters
    code_length = random.randint(4, 8)
    code = ''.join(str(random.randint(0, 9)) for _ in range(code_length))

    return JSONResponse(content={"generated_code": code}, status_code=200)

@app.post("/create_test")
async def create_test():
    # Generate random coefficients for the quadratic equation
    a = random.randint(1, 10)
    b = random.randint(-20, 20)
    c = random.randint(1, 10)

    # Ensure the roots of the equation are even numbers
    while True:
        d = b**2 - 4*a*c
        if d >= 0 and (d ** 0.5) % 2 == 0:
            break
        a = random.randint(1, 10)
        b = random.randint(-20, 20)
        c = random.randint(1, 10)

    # Create a prompt for the code generation endpoint
    prompt = f"Generate a Python function to solve the quadratic equation {a}x² + {b}x + {c} = 0"

    # Call the code generation endpoint
    response = await generate_code(prompt)

    # Extract the generated code from the response content
    generated_code = response.body.decode('utf-8')  # Decode the response body
    generated_code_content = json.loads(generated_code)  # Parse the JSON content
    generated_code_value = generated_code_content.get("generated_code")

    # Create the prompt for the AI model
    prompt_template = {
        "questions": [
            {
                "question": f"Найдите корни квадратного уравнения {a}x² + {b}x + {c} = 0.",
                "options": [
                    {"id": 1, "text": "(1, 3)"},
                    {"id": 2, "text": "(3, -1)"},
                    {"id": 3, "text": "(2, 4)"},
                    {"id": 4, "text": "(0, 6)"}
                ],
                "correctAnswers": [3]
            }
        ]
    }

    prompt = json.dumps(prompt_template)
    generated_tests = await create_completion(prompt)
    return JSONResponse(content=generated_tests, status_code=200)

async def create_completion(prompt):
    client = Client()
    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.8
    )
    return response

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8081)