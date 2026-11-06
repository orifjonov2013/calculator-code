"""Real-Time Interactive Citizen Keypad Handler for Aiogram 3."""
import uuid
import aiohttp
from aiogram import Router, F
from aiogram.types import CallbackQuery
from aiogram.fsm.context import FSMContext

from bot.config import settings
from bot.keyboards.scientific_keypad import get_scientific_keypad
from bot.keyboards.solution_keyboards import get_solution_keyboard

router = Router(name="calculator_keypad")

# Cache recent step breakdowns in-memory for immediate toggle
STEPS_CACHE = {}


def format_display(buffer: str, angle_mode: str, is_shift: bool, memory_val: str) -> str:
    """Formats the Citizen calculator LCD screen display."""
    clean_buf = buffer if buffer else "0"
    if len(clean_buf) > 30:
        display_str = "..." + clean_buf[-27:]
    else:
        display_str = clean_buf

    shift_status = "ON (2nd)" if is_shift else "OFF"
    mem_flag = f"[M={memory_val}]" if memory_val != "0" else "[M=0]"

    return (
        f"┌───────────────────────────────┐\n"
        f"│ 📟 *CITIZEN SCIENTIFIC CALCULATOR*  │\n"
        f"├───────────────────────────────┤\n"
        f"│ `{display_str}`\n"
        f"└───────────────────────────────┘\n"
        f"Mode: *{angle_mode}* | Shift: *{shift_status}* | Mem: *{mem_flag}*"
    )


@router.callback_query(F.data.startswith("k:"))
async def keypad_button_tap(query: CallbackQuery, state: FSMContext) -> None:
    """Handles all button taps on the scientific keypad with real-time screen editing."""
    action = query.data.split(":", 1)[1]
    data = await state.get_data()

    buffer = data.get("buffer", "0")
    last_ans = data.get("last_answer", "0")
    memory = data.get("memory", "0")
    is_shift = data.get("is_shift", False)
    angle_mode = data.get("angle_mode", "RAD")

    # Shift toggle
    if action == "shift":
        is_shift = not is_shift
        await state.update_data(is_shift=is_shift)
        await query.message.edit_text(
            format_display(buffer, angle_mode, is_shift, memory),
            reply_markup=get_scientific_keypad(is_shift, angle_mode, memory != "0"),
            parse_mode="Markdown"
        )
        await query.answer()
        return

    # Angle mode toggle
    if action == "angle_mode":
        angle_mode = "DEG" if angle_mode == "RAD" else "RAD"
        await state.update_data(angle_mode=angle_mode)
        await query.message.edit_text(
            format_display(buffer, angle_mode, is_shift, memory),
            reply_markup=get_scientific_keypad(is_shift, angle_mode, memory != "0"),
            parse_mode="Markdown"
        )
        await query.answer(f"Switched to {angle_mode}")
        return

    # All Clear (AC)
    if action == "ac":
        buffer = "0"
        await state.update_data(buffer="0")
        await query.message.edit_text(
            format_display(buffer, angle_mode, is_shift, memory),
            reply_markup=get_scientific_keypad(is_shift, angle_mode, memory != "0"),
            parse_mode="Markdown"
        )
        await query.answer("Cleared")
        return

    # Backspace / Delete
    if action == "del":
        buffer = buffer[:-1] if len(buffer) > 1 else "0"
        await state.update_data(buffer=buffer)
        await query.message.edit_text(
            format_display(buffer, angle_mode, is_shift, memory),
            reply_markup=get_scientific_keypad(is_shift, angle_mode, memory != "0"),
            parse_mode="Markdown"
        )
        await query.answer()
        return

    # Memory Operations
    if action == "mc":
        memory = "0"
        await state.update_data(memory="0")
        await query.message.edit_text(
            format_display(buffer, angle_mode, is_shift, memory),
            reply_markup=get_scientific_keypad(is_shift, angle_mode, False),
            parse_mode="Markdown"
        )
        await query.answer("Memory Cleared")
        return

    if action == "mr":
        if buffer == "0":
            buffer = memory
        else:
            buffer += memory
        await state.update_data(buffer=buffer)
        await query.message.edit_text(
            format_display(buffer, angle_mode, is_shift, memory),
            reply_markup=get_scientific_keypad(is_shift, angle_mode, memory != "0"),
            parse_mode="Markdown"
        )
        await query.answer(f"Recalled: {memory}")
        return

    if action in ("m_plus", "m_minus"):
        try:
            # Query backend to evaluate current buffer
            async with aiohttp.ClientSession() as session:
                async with session.post(settings.calculator_api_url, json={"expression": buffer}) as resp:
                    res_json = await resp.json()
                    val = float(res_json.get("numeric_result", res_json.get("result", 0)))
            cur_mem = float(memory)
            new_mem = cur_mem + val if action == "m_plus" else cur_mem - val
            memory = str(round(new_mem, 6))
            await state.update_data(memory=memory)
            await query.answer(f"Memory: {memory}")
        except Exception:
            await query.answer("Error updating memory")
        return

    # Evaluation (=)
    if action == "=":
        await query.answer("Calculating...")
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    settings.calculator_api_url,
                    json={
                        "expression": buffer,
                        "angle_mode": angle_mode,
                        "include_steps": True
                    },
                    timeout=settings.request_timeout
                ) as resp:
                    result = await resp.json()

            if not result.get("success"):
                err_msg = result.get("message", "Syntax error.")
                await query.message.answer(f"❌ *Math Error:*\n`{err_msg}`", parse_mode="Markdown")
                return

            calc_id = str(uuid.uuid4())[:8]
            final_ans = str(result.get("result"))
            STEPS_CACHE[calc_id] = {
                "input": buffer,
                "result": final_ans,
                "latex": result.get("latex", ""),
                "fraction": result.get("fraction"),
                "steps": result.get("steps", []),
                "is_visible": False,
            }

            # Update display screen with final answer
            await state.update_data(buffer=final_ans, last_answer=final_ans)
            await query.message.edit_text(
                format_display(final_ans, angle_mode, is_shift, memory),
                reply_markup=get_scientific_keypad(is_shift, angle_mode, memory != "0"),
                parse_mode="Markdown"
            )

            # Post calculation card with step toggle button
            msg_text = (
                f"✅ *Calculation Result*\n\n"
                f"📥 *Input:* `{buffer}`\n"
                f"📤 *Result:* `{final_ans}`\n"
            )
            if result.get("fraction"):
                msg_text += f"🔢 *Fraction Form:* `{result['fraction']}`\n"
            if result.get("latex"):
                msg_text += f"📐 *LaTeX:* `{result['latex']}`\n"

            msg_text += f"\n⏱️ *Computation Time:* `{result.get('execution_time_ms', 0)} ms`"

            await query.message.answer(
                msg_text,
                parse_mode="Markdown",
                reply_markup=get_solution_keyboard(calc_id, is_steps_visible=False)
            )

        except Exception as e:
            await query.message.answer(f"❌ *Connection Error:* {e}")
        return

    # Fraction button: inserts a/b format
    if action == "frac":
        to_append = "/"
    elif action == "ans":
        to_append = last_ans
    else:
        to_append = action

    # Append character to buffer
    if buffer == "0" and to_append not in ("+", "-", "*", "/", "^", ".", ")"):
        buffer = to_append
    else:
        buffer += to_append

    await state.update_data(buffer=buffer)
    await query.message.edit_text(
        format_display(buffer, angle_mode, is_shift, memory),
        reply_markup=get_scientific_keypad(is_shift, angle_mode, memory != "0"),
        parse_mode="Markdown"
    )
    await query.answer()


@router.callback_query(F.data.startswith("step_toggle:"))
async def toggle_steps_view(query: CallbackQuery) -> None:
    """Toggles intermediate algebraic step-by-step breakdown visibility."""
    calc_id = query.data.split(":", 1)[1]
    item = STEPS_CACHE.get(calc_id)

    if not item:
        await query.answer("Steps session expired. Calculate again.", show_alert=True)
        return

    # Toggle visibility
    item["is_visible"] = not item["is_visible"]
    STEPS_CACHE[calc_id] = item

    base_text = (
        f"✅ *Calculation Result*\n\n"
        f"📥 *Input:* `{item['input']}`\n"
        f"📤 *Result:* `{item['result']}`\n"
    )
    if item.get("fraction"):
        base_text += f"🔢 *Fraction:* `{item['fraction']}`\n"

    if item["is_visible"]:
        steps = item.get("steps", [])
        if not steps:
            steps_text = "\n\n📖 *Step-by-Step Breakdown:*\n_Direct evaluation (no intermediate reduction steps needed)._"
        else:
            steps_text = "\n\n📖 *Step-by-Step Solution Breakdown:*\n"
            for s in steps:
                steps_text += (
                    f"\n*Step {s['step']}: {s['title']}*\n"
                    f"👉 `{s['expression']}`\n"
                    f"_{s['explanation']}_\n"
                )
        full_text = base_text + steps_text
    else:
        full_text = base_text

    await query.message.edit_text(
        full_text,
        parse_mode="Markdown",
        reply_markup=get_solution_keyboard(calc_id, is_steps_visible=item["is_visible"])
    )
    await query.answer("Steps updated!")
