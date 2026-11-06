"""Aiogram 3 Configuration & Settings."""
import os
from pydantic_settings import BaseSettings


class BotSettings(BaseSettings):
    telegram_bot_token: str = os.getenv("TELEGRAM_BOT_TOKEN", "1234567890:SAMPLE_TOKEN")
    calculator_api_url: str = os.getenv("CALCULATOR_API_URL", "http://localhost:8000/api/v1/calculate/")
    ocr_api_url: str = os.getenv("OCR_API_URL", "http://localhost:8000/api/v1/ocr/")
    request_timeout: float = 30.0

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = BotSettings()
