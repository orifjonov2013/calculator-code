"""Aiogram 3 FSM States for Calculator and Bot interactions."""
from aiogram.fsm.state import State, StatesGroup


class CalculatorStates(StatesGroup):
    idle = State()
    waiting_for_math_text = State()
    waiting_for_photo_ocr = State()
