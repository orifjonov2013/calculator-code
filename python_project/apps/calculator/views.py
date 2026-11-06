"""DRF Views for AI-Powered Scientific Calculator."""
import time
import base64
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import CalculationHistory
from .serializers import (
    CalculationRequestSerializer,
    CalculationResponseSerializer,
    OCRRequestSerializer,
    CalculationHistorySerializer,
)
from .services.math_engine import MathEngine
from .services.step_solver import StepSolver
from .services.nlp_parser import NaturalLanguageMathParser
from .services.ocr_service import MathOCRService


class CalculateAPIView(APIView):
    """
    POST /api/v1/calculate/
    Processes complex math, fractions, matrices, equations, and natural language queries,
    returning final results along with structured step-by-step breakdowns.
    """

    def post(self, request, *args, **kwargs):
        start_time = time.time()
        serializer = CalculationRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                "success": False,
                "error": "Validation Error",
                "details": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        raw_expr = data['expression']
        angle_mode = data.get('angle_mode', 'RAD')
        include_steps = data.get('include_steps', True)

        # Step 1: Natural Language Pre-Processing
        nlp_res = NaturalLanguageMathParser.parse_query(raw_expr)
        target_expr = nlp_res['transformed_expression']
        inferred_mode = nlp_res['inferred_mode']

        # Step 2: SymPy Math Evaluation
        eval_res = MathEngine.evaluate(target_expr, angle_mode=angle_mode)

        if not eval_res.get('success'):
            return Response({
                "success": False,
                "input": raw_expr,
                "error": eval_res.get('error', 'Calculation Error'),
                "message": eval_res.get('message', 'Unable to parse expression.')
            }, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

        # Step 3: Step-by-Step Solver Breakdown
        steps = []
        if include_steps:
            steps = StepSolver.generate_steps(target_expr, eval_res)

        elapsed_ms = round((time.time() - start_time) * 1000, 2)

        # Step 4: Record History Log
        try:
            CalculationHistory.objects.create(
                raw_input=raw_expr,
                parsed_expression=target_expr,
                result=str(eval_res.get('result', '')),
                latex=str(eval_res.get('latex', '')),
                steps=steps,
                mode=inferred_mode,
                execution_time_ms=elapsed_ms
            )
        except Exception:
            pass  # DB write failure shouldn't abort API response

        payload = {
            "success": True,
            "input": raw_expr,
            "parsed_expression": target_expr,
            "result": eval_res.get('result'),
            "numeric_result": eval_res.get('numeric_result'),
            "fraction": eval_res.get('fraction'),
            "latex": eval_res.get('latex'),
            "type": eval_res.get('type', 'algebraic'),
            "is_symbolic": eval_res.get('is_symbolic', False),
            "steps": steps,
            "execution_time_ms": elapsed_ms,
        }

        return Response(payload, status=status.HTTP_200_OK)


class OCRCalculateAPIView(APIView):
    """
    POST /api/v1/ocr/
    Accepts an uploaded image or base64 image data of math homework/formulas,
    performs Gemini Vision OCR, and returns the step-by-step solution.
    """

    def post(self, request, *args, **kwargs):
        start_time = time.time()
        serializer = OCRRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        image_file = request.FILES.get('image')
        image_base64 = request.data.get('image_base64')

        if not image_file and not image_base64:
            return Response({
                "success": False,
                "error": "No image provided. Pass multipart 'image' or 'image_base64'."
            }, status=status.HTTP_400_BAD_REQUEST)

        if image_file:
            image_bytes = image_file.read()
            mime_type = image_file.content_type or 'image/jpeg'
        else:
            # Clean base64 header if present
            if ',' in image_base64:
                header, b64data = image_base64.split(',', 1)
                mime_type = header.split(';')[0].replace('data:', '')
            else:
                b64data = image_base64
                mime_type = 'image/jpeg'
            image_bytes = base64.b64decode(b64data)

        ocr_result = MathOCRService.process_image(image_bytes, mime_type=mime_type)
        if not ocr_result.get('success'):
            return Response(ocr_result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        data = ocr_result.get('data', {})
        elapsed_ms = round((time.time() - start_time) * 1000, 2)

        return Response({
            "success": True,
            "transcription": data.get('transcription'),
            "latex": data.get('latex'),
            "result": data.get('final_answer'),
            "steps": data.get('steps', []),
            "execution_time_ms": elapsed_ms,
        }, status=status.HTTP_200_OK)


class HistoryAPIView(APIView):
    """GET /api/v1/history/ to fetch past calculations, DELETE to clear."""

    def get(self, request):
        history = CalculationHistory.objects.all()[:50]
        serializer = CalculationHistorySerializer(history, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request):
        CalculationHistory.objects.all().delete()
        return Response({"success": True, "message": "History cleared."}, status=status.HTTP_200_OK)


class HealthCheckAPIView(APIView):
    """GET /api/v1/health/ to verify backend engine health."""

    def get(self, request):
        return Response({
            "status": "healthy",
            "service": "DRF OmniMath AI Engine",
            "version": "1.0.0",
            "sympy_ready": True
        })
