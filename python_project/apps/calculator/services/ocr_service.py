"""Math Homework OCR & Vision Recognition Service.

Uses Google GenAI Gemini Vision multimodal processing to extract
typeset or handwritten math equations from photos and pass them to
the calculation and step breakdown pipeline.
"""
import os
import base64
from typing import Dict, Any, Optional
from google import genai
from google.genai import types


class MathOCRService:
    @classmethod
    def process_image(cls, image_bytes: bytes, mime_type: str = "image/jpeg") -> Dict[str, Any]:
        """Sends an image to Gemini Vision to extract math formulas and step solutions."""
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return {
                "success": False,
                "error": "GEMINI_API_KEY is not configured.",
                "message": "Set GEMINI_API_KEY to enable AI Vision Math OCR."
            }

        try:
            client = genai.Client(api_key=api_key)

            prompt = (
                "You are an expert mathematical OCR and solver assistant. "
                "Analyze the math problem or handwritten calculation in this photo.\n"
                "1. Transcribe the exact mathematical expression or equation in standard text notation.\n"
                "2. Transcribe it in LaTeX notation.\n"
                "3. Solve the problem completely with full intermediate algebraic step-by-step breakdown.\n"
                "Respond strictly with valid JSON with keys: "
                "'transcription' (string standard notation e.g. '2*x + 5 = 15'), "
                "'latex' (string LaTeX equation), "
                "'final_answer' (string final answer), "
                "'steps' (array of objects with 'step' integer, 'title' string, 'expression' string, 'explanation' string)."
            )

            response = client.models.generate_content(
                model="gemini-3.8-flash",
                contents=[
                    types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                    prompt
                ],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                )
            )

            import json
            result_json = json.loads(response.text)
            return {
                "success": True,
                "data": result_json
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": f"Vision OCR failed: {e}"
            }
