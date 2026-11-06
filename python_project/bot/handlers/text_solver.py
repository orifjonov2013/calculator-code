"""Smart Text & Natural Language Math Handler for Aiogram 3."""
import uuid
import aiohttp
from aiogram import Router, F
from aiogram.types import Message
from aiogram.fsm.context import FSMContext

from bot.config import settings
from bot.keyboards.solution_keyboards import get_solution_keyboard
from bot.handlers.calculator_keypad import STEPS_CACHE

router = Router(name="text_solver")


@router.message(F.text & ~F.text.startswith("/"))
async def handle_math_text(message: Message, state: FSMContext) -> None:
    """Processes natural language math, raw formulas, or equations."""
    user_text = message.text.strip()
    data = await state.get_data()
    angle_mode = data.get("angle_mode", "RAD")

    status_msg = await message.answer("🧠 *OmniMath AI Solving...*", parse_mode="Markdown")

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                settings.calculator_api_url,
                json={
                    "expression": user_text,
                    "angle_mode": angle_mode,
                    "include_steps": True,
                    "mode": "nlp"
                },
                timeout=settings.request_timeout
            ) as resp:
                data_resp = await resp.json()

        if not data_resp.get("success"):
            err_details = data_resp.get("message", data_resp.get("error", "Invalid mathematical expression."))
            await status_msg.edit_text(
                f"❌ *Could not solve expression:*\n`{err_details}`\n\n"
                "💡 *Tips:* Ensure balanced brackets, explicit multiplication (e.g. `5*x` or `5x`), or type `/help` for examples.",
                parse_mode="Markdown"
            )
            return

        calc_id = str(uuid.uuid4())[:8]
        final_ans = str(data_resp.get("result"))
        STEPS_CACHE[calc_id] = {
            "input": user_text,
            "result": final_ans,
            "latex": data_resp.get("latex", ""),
            "fraction": data_resp.get("fraction"),
            "steps": data_resp.get("steps", []),
            "is_visible": False,
        }

        # Update last answer in state
        await state.update_data(last_answer=final_ans)

        response_text = (
            f"🎯 *Solution Found*\n\n"
            f"📥 *Query:* `{user_text}`\n"
        )
        if data_resp.get("parsed_expression") and data_resp["parsed_expression"] != user_text:
            response_text += f"🔍 *Parsed Form:* `{data_resp['parsed_expression']}`\n"

        response_text += f"📤 *Result:* `{final_ans}`\n"

        if data_resp.get("fraction"):
            response_text += f"🔢 *Fraction Form:* `{data_resp['fraction']}`\n"
        if data_resp.get("latex"):
            response_text += f"📐 *LaTeX:* `{data_resp['latex']}`\n"

        response_text += f"\n⚡ *Engine:* SymPy + AI Solver ({data_resp.get('execution_time_ms', 0)} ms)"

        await status_msg.edit_text(
            response_text,
            parse_mode="Markdown",
            reply_markup=get_solution_keyboard(calc_id, is_steps_visible=False)
        )

    except Exception as e:
        await status_msg.edit_text(f"❌ *Backend API Connection Failed:* {e}")
