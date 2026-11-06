"""Aiogram 3 Main Bot Runner.

Initializes Telegram Bot, Dispatcher, Router Handlers, and Polling.
"""
import asyncio
import logging
import sys
from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.fsm.storage.memory import MemoryStorage

from bot.config import settings
from bot.handlers.common import router as common_router
from bot.handlers.calculator_keypad import router as keypad_router
from bot.handlers.text_solver import router as text_router
from bot.handlers.photo_ocr import router as photo_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("OmniMathBot")


async def main() -> None:
    """Entry point for running the Aiogram 3 Telegram Bot."""
    logger.info("Initializing OmniMath AI Telegram Bot (Aiogram 3.15)...")

    if not settings.telegram_bot_token or "SAMPLE" in settings.telegram_bot_token:
        logger.warning(
            "⚠️ TELEGRAM_BOT_TOKEN is not set or using placeholder! "
            "Please configure your bot token in .env or run with environment variable."
        )

    # Initialize Bot & Dispatcher
    bot = Bot(
        token=settings.telegram_bot_token,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML)
    )
    dp = Dispatcher(storage=MemoryStorage())

    # Register Routers in order
    dp.include_router(common_router)
    dp.include_router(keypad_router)
    dp.include_router(photo_router)
    dp.include_router(text_router)

    logger.info("Routers attached successfully: [Common, Keypad, PhotoOCR, TextSolver]")
    logger.info(f"Target DRF Calculator API URL: {settings.calculator_api_url}")

    try:
        # Drop pending updates to avoid processing old messages
        await bot.delete_webhook(drop_pending_updates=True)
        logger.info("🚀 OmniMath AI Bot polling started!")
        await dp.start_polling(bot)
    except Exception as e:
        logger.error(f"Bot error: {e}")
    finally:
        await bot.session.close()
        logger.info("Bot session closed gracefully.")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, SystemExit):
        logger.info("Bot stopped by user.")
