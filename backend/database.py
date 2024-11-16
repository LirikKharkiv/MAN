from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from pydantic import BaseModel, EmailStr, Field, ValidationError
import os
import logging



DB_CONFIG = {
    'DB_HOST': os.getenv("DB_HOST", "localhost"),
    'DB_USER': os.getenv("DB_USER", "root"),
    'DB_PASSWORD': os.getenv("DB_PASSWORD", ""),
    'DB_NAME': os.getenv("DB_NAME", "signup"),
}

DB_URL = f"mysql+pymysql://{DB_CONFIG['DB_USER']}:{DB_CONFIG['DB_PASSWORD']}@{DB_CONFIG['DB_HOST']}/{DB_CONFIG['DB_NAME']}"
engine = create_engine(DB_URL, echo=True)
Session = sessionmaker(bind=engine)


def execute_db_operation(sql: str, values: dict) -> None:
    with Session() as session:
        session.execute(text(sql), values)
        session.commit()
