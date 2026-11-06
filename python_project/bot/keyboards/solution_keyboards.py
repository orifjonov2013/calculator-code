"""Solution and Steps Toggle Keyboards for Aiogram 3."""
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.utils.keyboard import InlineKeyboardBuilder


def get_solution_keyboard(calc_id: str, is_steps_visible: bool = False) -> InlineKeyboardMarkup:
    """Builds interactive action buttons for a calculation result message."""
    builder = InlineKeyboardBuilder()

    steps_btn_text = "📕 Hide Steps" if is_steps_visible else "📖 Show Steps (Breakdown)"

    builder.row(
        InlineKeyboardButton(text=steps_btn_text, callback_data=f"step_toggle:{calc_id}"),
        InlineKeyboardButton(text="🧮 New Calculation", callback_data="bot:open_keypad"),
    )
    builder.row(
        InlineKeyboardButton(text="📷 Solve from Photo", callback_data="bot:mode_photo"),
        InlineKeyboardButton(text="💡 Try NLP Example", callback_data="bot:nlp_example"),
    )

    return builder.as_markup()
