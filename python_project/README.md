# 🔬 OmniMath AI — Next-Generation Scientific Calculator

An enterprise-grade, full-stack AI-powered scientific calculator combining **Django REST Framework (DRF)**, **SymPy Symbolic Engine**, and **Aiogram 3** for Telegram.

---

## 🌟 Key Architecture & Features

### 1. Django REST Framework (Smart Math Engine)
- **Endpoint:** `POST /api/v1/calculate/`
- **SymPy Symbolic Engine:** Evaluates arithmetic, irreducible fractions (`a/b`), algebraic equations, polynomial factoring, matrices, derivatives, integrals, and limits.
- **Step-by-Step Solver:** Returns an array of intermediate algebraic breakdown steps with mathematical rationales.
- **Natural Language Math:** Automatically parses queries like `"solve 5x + 10 = 25"`, `"derivative of x^2 + 3x"`, and `"sum of 1/2 and 3/4"`.
- **Vision OCR:** `POST /api/v1/ocr/` recognizes handwriting and textbook problems from photos using Gemini Vision.

### 2. Aiogram 3 (Telegram Bot Interface)
- **Citizen-Style Scientific Keypad:** 7-row interactive inline keyboard with `2nd/Shift`, `RAD/DEG`, `M+`/`MR`, fractions `a/b`, powers `x^y`, roots `√x`, and factorials.
- **Real-Time Display:** Uses Telegram's `edit_text` API for zero-lag screen updates as buttons are tapped.
- **Show Steps Toggle:** Clean `[📖 Show Steps]` inline button that expands the full intermediate algebraic explanation in place.
- **Photo Homework Solver:** Snap a picture and receive recognized LaTeX with complete step-by-step solutions.

---

## 🚀 Quickstart & Installation

### Option A: Using Docker Compose (Recommended)
```bash
# 1. Clone repository
git clone https://github.com/your-username/omnimath-ai.git
cd omnimath-ai/python_project

# 2. Configure environment variables
cp .env.example .env
# Edit .env and enter your TELEGRAM_BOT_TOKEN and GEMINI_API_KEY

# 3. Launch both Django DRF backend & Aiogram 3 bot
docker compose up --build
```

### Option B: Local Setup with Virtual Environment
```bash
# 1. Create and activate Python 3.11 virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run database migrations
python manage.py migrate

# 4. Start DRF development server
python manage.py runserver 0.0.0.0:8000

# 5. In a second terminal, start the Aiogram 3 bot
python -m bot.main
```

---

## 📡 API Reference

### `POST /api/v1/calculate/`
**Request Body:**
```json
{
  "expression": "solve 5*x + 10 = 25",
  "angle_mode": "RAD",
  "include_steps": true
}
```

**Response:**
```json
{
  "success": true,
  "input": "solve 5*x + 10 = 25",
  "parsed_expression": "5*x + 10 = 25",
  "result": "x = 3",
  "numeric_result": 3,
  "fraction": null,
  "latex": "5 x + 10 = 25 \\implies x \\in \\{3\\}",
  "type": "equation",
  "is_symbolic": true,
  "steps": [
    {
      "step": 1,
      "title": "Identify Equation",
      "expression": "5*x + 10 = 25",
      "explanation": "Given algebraic equation to solve for variable x."
    },
    {
      "step": 2,
      "title": "Move All Terms to One Side (Standard Form)",
      "expression": "5 x - 15 = 0",
      "explanation": "Subtract the right-hand side from the left-hand side."
    },
    {
      "step": 3,
      "title": "Isolate the Variable Term",
      "expression": "5 x = 15",
      "explanation": "Add 15 to both sides."
    },
    {
      "step": 4,
      "title": "Divide by the Leading Coefficient",
      "expression": "x = \\frac{15}{5} = 3",
      "explanation": "Divide both sides by 5 to isolate x."
    }
  ],
  "execution_time_ms": 14.2
}
```

---

## 🧪 Running Tests
```bash
python manage.py test apps.calculator.tests
```
