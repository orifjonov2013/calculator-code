"""Step-by-Step Mathematical Solver Engine.

Generates structured JSON step-by-step intermediate algebraic,
calculus, fraction, and matrix breakdowns.
"""
from typing import List, Dict, Any
import sympy as sp
import re


class StepSolver:
    @classmethod
    def generate_steps(cls, raw_input: str, parsed_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generates a structured list of steps with title, expression, and explanation."""
        steps: List[Dict[str, Any]] = []
        clean = raw_input.strip()

        # 1. Equation Solving Steps
        if '=' in clean and not clean.startswith('=='):
            return cls._solve_equation_steps(clean)

        # 2. Derivative Steps
        if 'diff(' in clean or 'derivative' in clean.lower() or 'd/dx' in clean:
            return cls._solve_derivative_steps(clean)

        # 3. Integral Steps
        if 'integrate(' in clean or 'integral' in clean.lower() or '∫' in clean:
            return cls._solve_integral_steps(clean)

        # 4. Fraction Arithmetic Steps (e.g., 3/8 + 5/12)
        if re.search(r'\d+\s*/\s*\d+\s*[\+\-\*\/]\s*\d+\s*/\s*\d+', clean):
            return cls._solve_fraction_steps(clean)

        # 5. Polynomial Factoring or Simplification
        if 'factor(' in clean or 'simplify(' in clean or '^2' in clean or '**2' in clean:
            return cls._solve_algebra_steps(clean, parsed_data)

        # 6. Matrix Determinant Steps
        if 'det(' in clean or parsed_data.get('type') == 'matrix_det':
            return cls._solve_matrix_det_steps(clean, parsed_data)

        # Default arithmetic / general algebraic step breakdown
        steps.append({
            "step": 1,
            "title": "Parse Original Expression",
            "expression": raw_input,
            "explanation": "Standardize mathematical notations, operators, and evaluate order of operations (PEMDAS/BODMAS)."
        })

        if parsed_data.get("fraction"):
            steps.append({
                "step": 2,
                "title": "Exact Fraction Representation",
                "expression": parsed_data.get("fraction"),
                "explanation": "Convert decimal approximations into irreducible rational fraction form a/b using greatest common divisor (GCD)."
            })

        steps.append({
            "step": len(steps) + 1,
            "title": "Final Evaluated Result",
            "expression": parsed_data.get("result", ""),
            "explanation": f"Evaluation complete. Decimal: {parsed_data.get('numeric_result', parsed_data.get('result'))}."
        })

        return steps

    @classmethod
    def _solve_equation_steps(cls, eq_str: str) -> List[Dict[str, Any]]:
        steps = []
        lhs_str, rhs_str = eq_str.split('=', 1)
        x = sp.symbols('x')

        steps.append({
            "step": 1,
            "title": "Identify Equation",
            "expression": f"{lhs_str.strip()} = {rhs_str.strip()}",
            "explanation": "Given algebraic equation to solve for variable x."
        })

        try:
            lhs = sp.sympify(lhs_str)
            rhs = sp.sympify(rhs_str)
            diff = sp.simplify(lhs - rhs)

            steps.append({
                "step": 2,
                "title": "Move All Terms to One Side (Standard Form)",
                "expression": f"{sp.latex(diff)} = 0",
                "explanation": "Subtract the right-hand side from the left-hand side to set the equation equal to zero."
            })

            # Check if linear ax + b = 0
            poly = sp.Poly(diff, x)
            degree = poly.degree()

            if degree == 1:
                a = poly.coeff_monomial(x)
                b = poly.coeff_monomial(1)
                steps.append({
                    "step": 3,
                    "title": "Isolate the Variable Term",
                    "expression": f"{sp.latex(a*x)} = {sp.latex(-b)}",
                    "explanation": f"Subtract the constant term ({b}) from both sides."
                })
                sol = -b / a
                steps.append({
                    "step": 4,
                    "title": "Divide by the Leading Coefficient",
                    "expression": f"x = \\frac{{{sp.latex(-b)}}}{{{sp.latex(a)}}} = {sp.latex(sol)}",
                    "explanation": f"Divide both sides by {a} to solve for x."
                })
            elif degree == 2:
                a = poly.coeff_monomial(x**2)
                b = poly.coeff_monomial(x)
                c = poly.coeff_monomial(1)
                disc = b**2 - 4*a*c

                steps.append({
                    "step": 3,
                    "title": "Quadratic Formula Identification",
                    "expression": "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
                    "explanation": f"Coefficients are a = {a}, b = {b}, c = {c}. Compute discriminant: Δ = {b}² - 4({a})({c}) = {disc}."
                })
                sols = sp.solve(sp.Eq(lhs, rhs))
                steps.append({
                    "step": 4,
                    "title": "Calculate Roots",
                    "expression": ", ".join([f"x_{i+1} = {sp.latex(s)}" for i, s in enumerate(sols)]),
                    "explanation": "Substitute discriminant into the quadratic formula to obtain the solution set."
                })
            else:
                sols = sp.solve(sp.Eq(lhs, rhs))
                steps.append({
                    "step": 3,
                    "title": "Factor and Solve Polynomial",
                    "expression": f"\\text{{Roots: }} {', '.join(sp.latex(s) for s in sols)}",
                    "explanation": f"Degree {degree} polynomial solved using symbolic factorization."
                })
        except Exception:
            steps.append({
                "step": 2,
                "title": "Solve Symbolically",
                "expression": eq_str,
                "explanation": "Isolate the unknown variable using algebraic equivalence transformations."
            })

        return steps

    @classmethod
    def _solve_derivative_steps(cls, text: str) -> List[Dict[str, Any]]:
        steps = []
        x = sp.symbols('x')
        # Extract target expression
        inner = re.sub(r'^(diff|derivative\s+of|d/dx)\s*\(?', '', text, flags=re.IGNORECASE).rstrip(')')
        try:
            expr = sp.sympify(inner)
            steps.append({
                "step": 1,
                "title": "State Differentiation Target",
                "expression": f"\\frac{{d}}{{dx}} \\left[ {sp.latex(expr)} \\right]",
                "explanation": "Compute the first derivative with respect to x."
            })
            # Apply sum rule if Add
            if expr.is_Add:
                terms = expr.args
                steps.append({
                    "step": 2,
                    "title": "Apply Sum Rule of Differentiation",
                    "expression": " + ".join([f"\\frac{{d}}{{dx}}[{sp.latex(t)}]" for t in terms]),
                    "explanation": "The derivative of a sum is the sum of the individual derivatives: (f + g)' = f' + g'."
                })
            deriv = sp.diff(expr, x)
            steps.append({
                "step": len(steps) + 1,
                "title": "Apply Power / Transcendental Rules & Simplify",
                "expression": sp.latex(deriv),
                "explanation": "Apply d/dx(x^n) = n*x^(n-1), trigonometry derivatives, and simplify common factors."
            })
        except Exception:
            steps.append({
                "step": 1,
                "title": "Differentiate Expression",
                "expression": text,
                "explanation": "Calculate rate of change d/dx."
            })
        return steps

    @classmethod
    def _solve_integral_steps(cls, text: str) -> List[Dict[str, Any]]:
        steps = []
        x = sp.symbols('x')
        inner = re.sub(r'^(integrate|integral\s+of|∫)\s*\(?', '', text, flags=re.IGNORECASE).rstrip(')').replace('dx', '')
        try:
            expr = sp.sympify(inner.strip())
            steps.append({
                "step": 1,
                "title": "Set Up Indefinite Integral",
                "expression": f"\\int {sp.latex(expr)} \\, dx",
                "explanation": "Identify the integrand function f(x) to integrate with respect to x."
            })
            antideriv = sp.integrate(expr, x)
            steps.append({
                "step": 2,
                "title": "Apply Fundamental Antiderivative Rules",
                "expression": f"{sp.latex(antideriv)} + C",
                "explanation": "Reverse power rule: ∫ x^n dx = x^(n+1)/(n+1) for n ≠ -1. Add constant of integration C."
            })
        except Exception:
            steps.append({
                "step": 1,
                "title": "Compute Antiderivative",
                "expression": text,
                "explanation": "Evaluate the indefinite integral with constant C."
            })
        return steps

    @classmethod
    def _solve_fraction_steps(cls, text: str) -> List[Dict[str, Any]]:
        steps = []
        try:
            expr = sp.sympify(text)
            steps.append({
                "step": 1,
                "title": "Fraction Arithmetic Setup",
                "expression": text,
                "explanation": "Evaluate fraction operation maintaining exact integer numerators and denominators."
            })
            steps.append({
                "step": 2,
                "title": "Find Lowest Common Denominator (LCD)",
                "expression": f"\\text{{Simplified form: }} \\frac{{{expr.p}}}{{{expr.q}}}",
                "explanation": f"Determine least common multiple (LCM) of denominators and reduce by GCD."
            })
            steps.append({
                "step": 3,
                "title": "Decimal Conversion",
                "expression": f"\\approx {round(float(expr), 6)}",
                "explanation": "Decimal equivalent for practical measurement."
            })
        except Exception:
            pass
        return steps

    @classmethod
    def _solve_algebra_steps(cls, text: str, parsed_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        steps = []
        try:
            expr = sp.sympify(text)
            factored = sp.factor(expr)
            expanded = sp.expand(expr)

            steps.append({
                "step": 1,
                "title": "Original Expression",
                "expression": sp.latex(expr),
                "explanation": "Initial algebraic polynomial expression."
            })
            if factored != expr:
                steps.append({
                    "step": 2,
                    "title": "Factorization into Irreducible Factors",
                    "expression": sp.latex(factored),
                    "explanation": "Find common monomials and factor quadratic or higher-degree terms."
                })
            steps.append({
                "step": len(steps) + 1,
                "title": "Simplified Result",
                "expression": parsed_data.get("latex", sp.latex(sp.simplify(expr))),
                "explanation": "Collect like terms and combine exponent powers."
            })
        except Exception:
            pass
        return steps

    @classmethod
    def _solve_matrix_det_steps(cls, text: str, parsed_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        return [
            {
                "step": 1,
                "title": "Construct Matrix A",
                "expression": "A = \\begin{pmatrix} a_{11} & a_{12} \\\\ a_{21} & a_{22} \\end{pmatrix}",
                "explanation": "Verify square matrix dimensions (n x n) required for determinant calculation."
            },
            {
                "step": 2,
                "title": "Laplace / Leibniz Determinant Expansion",
                "expression": "\\det(A) = \\sum_{\\sigma \\in S_n} \\text{sgn}(\\sigma) \\prod_{i=1}^n a_{i,\\sigma(i)}",
                "explanation": "For 2x2: (a*d - b*c). For 3x3: cofactor expansion along the first row."
            },
            {
                "step": 3,
                "title": "Computed Determinant Value",
                "expression": parsed_data.get("result", ""),
                "explanation": "If det(A) ≠ 0, the matrix is invertible (non-singular)."
            }
        ]
