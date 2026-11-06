"""Photo Homework & Math OCR Handler for Aiogram 3."""
import io
import base64
import uuid
import aiohttp
from aiogram import Router, F, Bot
from aiogram.types import Message
from aiogram.fsm.context import FSMContext

from bot.config import settings
from bot.keyboards.solution_keyboards import get_solution_keyboard
from bot.handlers.calculator_keypad import STEPS_CACHE

router = Router(name="photo_ocr")


@router.message(F.photo)
async def handle_photo_math(message: Message, bot: Bot, state: FSMContext) -> None:
    """Processes incoming math homework photos via Gemini Vision OCR API."""
    photo = message.photo[-1]  # Highest resolution photo
    status_msg = await message.answer("📸 *Scanning photo & analyzing handwriting with Gemini Vision...*", parse_mode="Markdown")

    try:
        # 1. Download photo stream from Telegram
        file_io = io.BytesIO()
        await bot.download(photo.file_id, destination=file_io)
        file_io.seek(0)
        b64_image = base64.b64encode(file_io.read()).decode("utf-8")

        # 2. Call DRF OCR endpoint
        async with aiohttp.ClientSession() as session:
            async with session.post(
                settings.ocr_api_url,
                json={"image_base64": b64_image},
                timeout=45.0
            ) as resp:
                data = await resp.json()

        if not data.get("success"):
            err_msg = data.get("message", "Could not recognize mathematical handwriting.")
            await status_msg.edit_text(
                f"❌ *Vision OCR Error:*\n`{err_msg}`\n\n"
                "💡 Ensure the problem is well-lit and clearly written.",
                parse_mode="Markdown"
            )
            return

        calc_id = str(uuid.uuid4())[:8]
        final_ans = str(data.get("result", ""))
        STEPS_CACHE[calc_id] = {
            "input": data.get("transcription", "Math Problem"),
            "result": final_ans,
            "latex": data.get("latex", ""),
            "steps": data.get("steps", []),
            "is_visible": False,
        }

        response_text = (
            f"✨ *Math OCR Recognition Complete*\n\n"
            f"📝 *Recognized Problem:*\n`{data.get('transcription')}`\n\n"
            f"📐 *LaTeX Formula:*\n`{data.get('latex')}`\n\n"
            f"🎯 *Final Answer:*\n`{final_ans}`\n\n"
            f"⚡ *Vision OCR Latency:* `{data.get('execution_time_ms', 0)} ms`"
        )

        await status_msg.edit_text(
            response_text,
            parse_mode="Markdown",
            reply_markup=get_solution_keyboard(calc_id, is_steps_visible=False)
        )

    except Exception as e:
        await status_msg.edit_text(f"❌ *Failed to process image:* {e}")
