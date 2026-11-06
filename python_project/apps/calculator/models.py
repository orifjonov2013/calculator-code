from django.db import models


class CalculationHistory(models.Model):
    MODE_CHOICES = [
        ('scientific', 'Scientific Keypad'),
        ('nlp', 'Natural Language Math'),
        ('algebra', 'Algebraic Solver'),
        ('calculus', 'Calculus (Derivative / Integral)'),
        ('matrix', 'Matrix Operations'),
        ('ocr', 'Photo / OCR Vision'),
    ]

    raw_input = models.TextField(help_text="Original raw text or expression")
    parsed_expression = models.TextField(blank=True, default="", help_text="Normalized SymPy expression")
    result = models.TextField(help_text="Final calculated result")
    latex = models.TextField(blank=True, default="", help_text="LaTeX representation")
    steps = models.JSONField(default=list, help_text="List of step-by-step breakdown dicts")
    mode = models.CharField(max_length=32, choices=MODE_CHOICES, default='scientific')
    created_at = models.DateTimeField(auto_now_add=True)
    execution_time_ms = models.FloatField(default=0.0)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Calculation Histories'

    def __str__(self):
        return f"[{self.mode}] {self.raw_input[:30]} -> {self.result[:30]}"
