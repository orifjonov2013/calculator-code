"""Common command handlers (/start, /help, /mode) for Aiogram 3."""
from aiogram import Router, F
from aiogram.types import Message, CallbackQuery
from aiogram.filters import CommandStart, Command
from aiogram.fsm.context import FSMContext

from bot.keyboards.scientific_keypad import get_scientific_keypad
from bot.states.calc_states import CalculatorStates

router = Router(name="common_handlers")

START_MESSAGE = (
    "🔬 *Welcome to OmniMath AI — Next-Gen Scientific Calculator*\n\n"
    "Powered by *Django REST Framework*, *SymPy Symbolic Engine*, and *Gemini AI*\\.\n\n"
    "✨ *What I can do:*\n"
    "• *Citizen\\-Style Scientific Keypad:* Full inline buttons with fractions `a/b`, powers `xʸ`, roots `√`, memory `M+`, and trig functions\\.\n"
    "• *Smart Text Mode:* Type any equation or natural language query \\(e\\.g\\., `solve 5x + 10 = 25`, `derivative of x^2 + 3x`, `matrix det([[1,2],[3,4]])`\\)\\.\n"
    "• *Step\\-by\\-Step Solver:* Tap *\"Show Steps\"* on any result to unfold complete intermediate algebraic steps\\.\n"
    "• *Photo / OCR Solver:* Send a picture of handwritten math homework or a textbook equation for instant solutions\\.\n\n"
    "👇 *Tap a button below or send your math query directly:*"
)

KEYPAD_HEADER = (
    "┌───────────────────────────────┐\n"
    "│ 📟 *CITIZEN SCIENTIFIC CALCULATOR*  │\n"
    "├───────────────────────────────┤\n"
    "│ `0`                           │\n"
    "└───────────────────────────────┘\n"
    "Mode: *RAD* | Shift: *OFF* | Mem: *0*"
)


@router.message(CommandStart())
async def command_start_handler(message: Message, state: FSMContext) -> None:
    """Handles the /start command."""
    await state.set_state(CalculatorStates.idle)
    # Store initial keypad session
    await state.update_data(
        buffer="0",
        last_answer="0",
        memory="0",
        is_shift=False,
        angle_mode="RAD",
    )
    await message.answer(START_MESSAGE, parse_mode="MarkdownV2")
    await message.answer(
        KEYPAD_HEADER,
        parse_mode="MarkdownV2",
        reply_markup=get_scientific_keypad(is_shift=False, angle_mode="RAD", has_memory=False)
    )


@router.message(Command("help"))
async def command_help_handler(message: Message) -> None:
    """Handles the /help command."""
    help_text = (
        "📚 *OmniMath AI Help & Syntax Guide*\n\n"
        "*1. Basic & Scientific Arithmetic:*\n"
        "• `3/8 + 5/12` (Fractions auto-simplified)\n"
        "• `sin(pi / 4)` or `cos(45)` in DEG mode\n"
        "• `sqrt(144) + 2^5 - ln(e)`\n\n"
        "*2. Algebra & Equation Solving:*\n"
        "• `solve 2*x + 5 = 15`\n"
        "• `solve x^2 - 5*x + 6 = 0`\n"
        "• `factor x^3 - 8`\n\n"
        "*3. Calculus & Derivatives:*\n"
        "• `derivative of x^3 + 4*x^2 - 10`\n"
        "• `integral of sin(x)*cos(x) dx`\n\n"
        "*4. Matrices:*\n"
        "• `det([[1, 2], [3, 4]])`\n"
        "• `inv([[4, 7], [2, 6]])`\n\n"
        "*5. Photo OCR:*\n"
        "• Simply upload or snap a photo of any math equation!"
    )
    await message.answer(help_text, parse_mode="Markdown")


@router.message(Command("keypad"))
@router.callback_query(F.data == "bot:open_keypad")
async def open_keypad_handler(event: Message | CallbackQuery, state: FSMContext) -> None:
    """Opens or resets the interactive Citizen keypad."""
    await state.set_state(CalculatorStates.idle)
    await state.update_data(buffer="0")

    if isinstance(event, CallbackQuery):
        await event.message.answer(
            KEYPAD_HEADER,
            parse_mode="MarkdownV2",
            reply_markup=get_scientific_keypad(is_shift=False, angle_mode="RAD", has_memory=False)
        )
        await event.answer("Keypad opened!")
    else:
        await event.answer(
            KEYPAD_HEADER,
            parse_mode="MarkdownV2",
            reply_markup=get_scientific_keypad(is_shift=False, angle_mode="RAD", has_memory=False)
        )


@router.callback_query(F.data == "bot:mode_text")
async def switch_to_text_mode(query: CallbackQuery, state: FSMContext) -> None:
    """Prompt user to type natural language math."""
    await state.set_state(CalculatorStates.waiting_for_math_text)
    await query.message.answer(
        "⌨️ *Smart Text Mode Activated*\n\n"
        "Type any math expression, equation, or natural language query:\n"
        "• `solve 4x + 8 = 32`\n"
        "• `derivative of 3x^2 + 5x`\n"
        "• `simplify (x^2 - 4)/(x - 2)`\n"
        "• `what is 35% of 1200?`",
        parse_mode="Markdown"
    )
    await query.answer()


@router.callback_query(F.data == "bot:mode_photo")
async def prompt_photo_mode(query: CallbackQuery, state: FSMContext) -> None:
    """Prompt user to send a photo."""
    await state.set_state(CalculatorStates.waiting_for_photo_ocr)
    await query.message.answer(
        "📷 *Photo OCR Mode Activated*\n\n"
        "Send a photo or screenshot of your math homework/formula.\n"
        "The AI Vision engine will recognize the handwriting and calculate the step-by-step solution!",
        parse_mode="Markdown"
    )
    await query.answer()
