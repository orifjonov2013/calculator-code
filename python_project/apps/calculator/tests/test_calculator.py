"""Unit and integration tests for MathEngine, StepSolver, and DRF API."""
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status

from apps.calculator.services.math_engine import MathEngine
from apps.calculator.services.step_solver import StepSolver
from apps.calculator.services.nlp_parser import NaturalLanguageMathParser


class MathEngineTestCase(TestCase):
    def test_fractions_evaluation(self):
        result = MathEngine.evaluate("3/8 + 5/12")
        self.assertTrue(result['success'])
        self.assertEqual(result['fraction'], "19/24")

    def test_equation_solver(self):
        result = MathEngine.evaluate("5*x + 10 = 25")
        self.assertTrue(result['success'])
        self.assertIn("3", result['result'])

    def test_quadratic_solver(self):
        result = MathEngine.evaluate("x^2 - 9 = 0")
        self.assertTrue(result['success'])
        self.assertIn("-3", result['result'])
        self.assertIn("3", result['result'])

    def test_derivative(self):
        result = MathEngine.evaluate("diff(x**2 + 3*x, x)")
        self.assertTrue(result['success'])
        self.assertEqual(result['result'], "2*x + 3")

    def test_matrix_determinant(self):
        result = MathEngine.evaluate("det([[1, 2], [3, 4]])")
        self.assertTrue(result['success'])
        self.assertEqual(result['result'], "-2")


class StepSolverTestCase(TestCase):
    def test_step_generation_for_equation(self):
        eval_res = MathEngine.evaluate("2*x + 4 = 10")
        steps = StepSolver.generate_steps("2*x + 4 = 10", eval_res)
        self.assertGreaterEqual(len(steps), 3)
        self.assertIn("step", steps[0])
        self.assertIn("title", steps[0])
        self.assertIn("explanation", steps[0])


class NLPParserTestCase(TestCase):
    def test_natural_language_parsing(self):
        nlp = NaturalLanguageMathParser.parse_query("derivative of x^2 + 3x")
        self.assertTrue(nlp['is_nlp'])
        self.assertIn("diff", nlp['transformed_expression'])

        solve_nlp = NaturalLanguageMathParser.parse_query("solve 5x + 10 = 25")
        self.assertTrue(solve_nlp['is_nlp'])
        self.assertEqual(solve_nlp['inferred_mode'], 'algebra')


class CalculateAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_api_calculate_endpoint(self):
        url = reverse('calculate')
        response = self.client.post(url, {
            "expression": "solve 3*x - 9 = 0",
            "include_steps": True
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertIn("3", data['result'])
        self.assertGreater(len(data['steps']), 0)
