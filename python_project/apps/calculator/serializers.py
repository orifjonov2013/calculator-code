"""DRF Serializers for Calculator API."""
from rest_framework import serializers
from .models import CalculationHistory


class StepSerializer(serializers.Serializer):
    step = serializers.IntegerField()
    title = serializers.CharField()
    expression = serializers.CharField()
    explanation = serializers.CharField()


class CalculationRequestSerializer(serializers.Serializer):
    expression = serializers.CharField(
        required=True,
        help_text="Mathematical expression, equation, fraction, matrix, or natural language query."
    )
    angle_mode = serializers.ChoiceField(
        choices=['RAD', 'DEG'],
        default='RAD',
        required=False,
        help_text="Trigonometric angle unit: RAD (Radians) or DEG (Degrees)."
    )
    include_steps = serializers.BooleanField(
        default=True,
        required=False,
        help_text="Whether to generate intermediate algebraic step-by-step breakdown."
    )
    mode = serializers.CharField(
        required=False,
        default='scientific',
        help_text="Calculation context: scientific, nlp, algebra, calculus, matrix."
    )


class CalculationResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    input = serializers.CharField()
    parsed_expression = serializers.CharField(required=False)
    result = serializers.CharField()
    numeric_result = serializers.FloatField(required=False, allow_null=True)
    fraction = serializers.CharField(required=False, allow_null=True)
    latex = serializers.CharField(required=False)
    type = serializers.CharField(required=False)
    is_symbolic = serializers.BooleanField(required=False)
    steps = StepSerializer(many=True, required=False)
    execution_time_ms = serializers.FloatField(required=False)
    error = serializers.CharField(required=False)


class OCRRequestSerializer(serializers.Serializer):
    image = serializers.ImageField(required=False, help_text="Uploaded homework/problem image file.")
    image_base64 = serializers.CharField(required=False, help_text="Base64 encoded image string.")


class CalculationHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = CalculationHistory
        fields = '__all__'
