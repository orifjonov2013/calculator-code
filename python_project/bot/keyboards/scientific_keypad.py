"""Citizen-Style Scientific Inline Keyboard for Aiogram 3."""
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.utils.keyboard import InlineKeyboardBuilder


def get_scientific_keypad(is_shift: bool = False, angle_mode: str = "RAD", has_memory: bool = False) -> InlineKeyboardMarkup:
    """Builds a rich Citizen-style scientific inline keyboard layout."""
    builder = InlineKeyboardBuilder()

    # Row 1: Function toggles & Memory registers
    shift_label = "🟡 2nd" if not is_shift else "⚪ 1st"
    deg_rad_label = f"📐 {angle_mode}"
    mr_label = "MR•" if has_memory else "MR"

    builder.row(
        InlineKeyboardButton(text=shift_label, callback_data="k:shift"),
        InlineKeyboardButton(text=deg_rad_label, callback_data="k:angle_mode"),
        InlineKeyboardButton(text="M+", callback_data="k:m_plus"),
        InlineKeyboardButton(text="M-", callback_data="k:m_minus"),
        InlineKeyboardButton(text=mr_label, callback_data="k:mr"),
        InlineKeyboardButton(text="MC", callback_data="k:mc"),
    )

    # Row 2: Powers, Roots, Fractions & Factorials
    if not is_shift:
        builder.row(
            InlineKeyboardButton(text="a/b", callback_data="k:frac"),
            InlineKeyboardButton(text="xʸ", callback_data="k:^"),
            InlineKeyboardButton(text="√x", callback_data="k:sqrt("),
            InlineKeyboardButton(text="x!", callback_data="k:!"),
            InlineKeyboardButton(text="1/x", callback_data="k:inv"),
            InlineKeyboardButton(text="|x|", callback_data="k:abs("),
        )
    else:
        builder.row(
            InlineKeyboardButton(text="d/dx", callback_data="k:diff("),
            InlineKeyboardButton(text="∫ dx", callback_data="k:integrate("),
            InlineKeyboardButton(text="³√x", callback_data="k:cbrt("),
            InlineKeyboardButton(text="x²", callback_data="k:^2"),
            InlineKeyboardButton(text="x³", callback_data="k:^3"),
            InlineKeyboardButton(text="10ˣ", callback_data="k:10^("),
        )

    # Row 3: Trigonometry & Logarithms
    if not is_shift:
        builder.row(
            InlineKeyboardButton(text="sin", callback_data="k:sin("),
            InlineKeyboardButton(text="cos", callback_data="k:cos("),
            InlineKeyboardButton(text="tan", callback_data="k:tan("),
            InlineKeyboardButton(text="ln", callback_data="k:ln("),
            InlineKeyboardButton(text="log", callback_data="k:log("),
            InlineKeyboardButton(text="eˣ", callback_data="k:exp("),
        )
    else:
        builder.row(
            InlineKeyboardButton(text="sin⁻¹", callback_data="k:asin("),
            InlineKeyboardButton(text="cos⁻¹", callback_data="k:acos("),
            InlineKeyboardButton(text="tan⁻¹", callback_data="k:atan("),
            InlineKeyboardButton(text="sinh", callback_data="k:sinh("),
            InlineKeyboardButton(text="cosh", callback_data="k:cosh("),
            InlineKeyboardButton(text="tanh", callback_data="k:tanh("),
        )

    # Row 4: Digits (7 8 9), parentheses & Backspace / AC
    builder.row(
        InlineKeyboardButton(text="7", callback_data="k:7"),
        InlineKeyboardButton(text="8", callback_data="k:8"),
        InlineKeyboardButton(text="9", callback_data="k:9"),
        InlineKeyboardButton(text="⌫ DEL", callback_data="k:del"),
        InlineKeyboardButton(text="AC", callback_data="k:ac"),
        InlineKeyboardButton(text="(", callback_data="k:("),
    )

    # Row 5: Digits (4 5 6) & Multiplication, Division, Closing Parenthesis
    builder.row(
        InlineKeyboardButton(text="4", callback_data="k:4"),
        InlineKeyboardButton(text="5", callback_data="k:5"),
        InlineKeyboardButton(text="6", callback_data="k:6"),
        InlineKeyboardButton(text="×", callback_data="k:*"),
        InlineKeyboardButton(text="÷", callback_data="k:/"),
        InlineKeyboardButton(text=")", callback_data="k:)"),
    )

    # Row 6: Digits (1 2 3) & Addition, Subtraction, Constants
    builder.row(
        InlineKeyboardButton(text="1", callback_data="k:1"),
        InlineKeyboardButton(text="2", callback_data="k:2"),
        InlineKeyboardButton(text="3", callback_data="k:3"),
        InlineKeyboardButton(text="+", callback_data="k:+"),
        InlineKeyboardButton(text="−", callback_data="k:-"),
        InlineKeyboardButton(text="π", callback_data="k:pi"),
    )

    # Row 7: Digits (0), Dot, e, ANS, Equal & Mode Switch
    builder.row(
        InlineKeyboardButton(text="0", callback_data="k:0"),
        InlineKeyboardButton(text=".", callback_data="k:."),
        InlineKeyboardButton(text="e", callback_data="k:e"),
        InlineKeyboardButton(text="Ans", callback_data="k:ans"),
        InlineKeyboardButton(text="=", callback_data="k:="),
        InlineKeyboardButton(text="⌨️ Text Mode", callback_data="bot:mode_text"),
    )

    return builder.as_markup()
