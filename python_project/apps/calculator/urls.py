"""URLs for calculator API app."""
from django.urls import path
from .views import (
    CalculateAPIView,
    OCRCalculateAPIView,
    HistoryAPIView,
    HealthCheckAPIView,
)

urlpatterns = [
    path('calculate/', CalculateAPIView.as_view(), name='calculate'),
    path('ocr/', OCRCalculateAPIView.as_view(), name='ocr'),
    path('history/', HistoryAPIView.as_view(), name='history'),
    path('health/', HealthCheckAPIView.as_view(), name='health'),
]
