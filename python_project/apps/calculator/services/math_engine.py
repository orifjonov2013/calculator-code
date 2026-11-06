"""SymPy Symbolic & Numerical Math Engine.

Handles evaluation of expressions, fraction preservation, equations,
derivatives, integrals, limits, and matrices with clean error boundaries.
"""
from typing import Dict, Any, List, Optional, Tuple
import sympy as sp
from sympy.parsing.sympy_parser import (
    parse_expr,
    standard_transformations,
    implicit_multiplication_application,
    rationalize,
)
import re


class MathEngine:
    TRANSFORMATIONS = standard_transformations + (
        implicit_multiplication_application,
        rationalize,
    )

    @staticmethod
    def clean_input(expr_str: str) -> str:
        """Sanitize raw string: replace unicode math symbols and standard abbreviations."""
        s = expr_str.strip()
        replacements = {
            '×': '*',
            '÷': '/',
            '−': '-',
            '–': '-',
            '^': '**',
            '√': 'sqrt',
            'π': 'pi',
            '²': '**2',
            '³': '**3',
        }
        for old, new in replacements.items():
            s = s.replace(old, new)

        # Handle fractions like "3 a/b 4" or "3/4"
        s = re.sub(r'(\d+)\s+a/b\s+(\d+)', r'Rational(\1, \2)', s)
        return s

    @classmethod
    def evaluate(cls, expression: str, angle_mode: str = 'RAD') -> Dict[str, Any]:
        """Core calculation endpoint router for arithmetic, fractions, and algebra."""
        cleaned = cls.clean_input(expression)

        # Check if matrix expression e.g. [[1,2],[3,4]]
        if cleaned.startswith('[[') or 'Matrix(' in cleaned or 'det(' in cleaned:
            return cls._handle_matrix(cleaned)

        # Check if equality equation e.g. 5*x + 10 = 25
        if '=' in cleaned and not cleaned.startswith('=='):
            return cls._handle_equation(cleaned)

        # Try parsing expression with SymPy
        try:
            x, y, z, t = sp.symbols('x y z t')
            local_dict = {
                'x': x, 'y': y, 'z': z, 't': t,
                'pi': sp.pi, 'e': sp.E,
                'sqrt': sp.sqrt, 'sin': sp.sin, 'cos': sp.cos, 'tan': sp.tan,
                'asin': sp.asin, 'acos': sp.acos, 'atan': sp.atan,
                'ln': sp.log, 'log': sp.log, 'exp': sp.exp,
                'diff': sp.diff, 'integrate': sp.integrate, 'limit': sp.limit,
                'Matrix': sp.Matrix, 'Rational': sp.Rational,
            }

            parsed = parse_expr(cleaned, local_dict=local_dict, transformations=cls.TRANSFORMATIONS)

            # Degree handling if requested
            if angle_mode == 'DEG':
                # Convert sin(x) -> sin(deg2rad)
                pass

            simplified = sp.simplify(parsed)
            latex_res = sp.latex(simplified)

            # Check if symbolic or numeric
            numeric_val = None
            try:
                if simplified.is_number and not simplified.has(sp.I):
                    eval_f = float(simplified.evalf())
                    if eval_f.is_integer():
                        numeric_val = int(eval_f)
                    else:
                        numeric_val = round(eval_f, 8)
            except Exception:
                pass

            # Detect fraction form
            fraction_str = None
            if isinstance(simplified, sp.Rational):
                fraction_str = f"{simplified.p}/{simplified.q}"

            return {
                "success": True,
                "input": expression,
                "parsed": str(parsed),
                "result": str(simplified),
                "numeric_result": numeric_val,
                "fraction": fraction_str,
                "latex": latex_res,
                "is_symbolic": len(simplified.free_symbols) > 0,
                "variables": [str(s) for s in simplified.free_symbols],
            }
        except Exception as e:
            return {
                "success": False,
                "input": expression,
                "error": str(e),
                "message": f"Mathematical parsing error: {e}"
            }

    @classmethod
    def _handle_equation(cls, eq_str: str) -> Dict[str, Any]:
        """Solves algebraic equations like 2x + 5 = 15 or x^2 - 4 = 0."""
        lhs_str, rhs_str = eq_str.split('=', 1)
        x = sp.symbols('x')
        lhs = parse_expr(cls.clean_input(lhs_str), transformations=cls.TRANSFORMATIONS)
        rhs = parse_expr(cls.clean_input(rhs_str), transformations=cls.TRANSFORMATIONS)

        equation = sp.Eq(lhs, rhs)
        solutions = sp.solve(equation)
        latex_eq = sp.latex(equation)
        latex_sol = ", ".join([sp.latex(s) for s in solutions])

        return {
            "success": True,
            "type": "equation",
            "equation": str(equation),
            "solutions": [str(s) for s in solutions],
            "result": f"x = {', '.join(str(s) for s in solutions)}",
            "latex": f"{latex_eq} \\implies x \\in \\{{{latex_sol}\\}}",
            "is_symbolic": True,
        }

    @classmethod
    def _handle_matrix(cls, matrix_str: str) -> Dict[str, Any]:
        """Evaluates matrix expressions like det([[1, 2], [3, 4]]) or inv([[1, 2], [3, 4]])."""
        try:
            # Determinant check
            det_match = re.search(r'det\s*\((.*)\)', matrix_str, re.DOTALL)
            inv_match = re.search(r'inv\s*\((.*)\)', matrix_str, re.DOTALL)
            eig_match = re.search(r'eig\s*\((.*)\)', matrix_str, re.DOTALL)

            target = matrix_str
            operation = "evaluate"

            if det_match:
                target = det_match.group(1).strip()
                operation = "det"
            elif inv_match:
                target = inv_match.group(1).strip()
                operation = "inv"
            elif eig_match:
                target = eig_match.group(1).strip()
                operation = "eig"

            mat_obj = sp.Matrix(eval(target, {"__builtins__": None}, {}))

            if operation == "det":
                res = mat_obj.det()
                return {
                    "success": True,
                    "type": "matrix_det",
                    "result": str(res),
                    "latex": f"\\det(A) = {sp.latex(res)}",
                    "matrix_shape": list(mat_obj.shape),
                }
            elif operation == "inv":
                res = mat_obj.inv()
                return {
                    "success": True,
                    "type": "matrix_inv",
                    "result": str(res.tolist()),
                    "latex": f"A^{{-1}} = {sp.latex(res)}",
                    "matrix_shape": list(res.shape),
                }
            elif operation == "eig":
                eigenvals = mat_obj.eigenvals()
                return {
                    "success": True,
                    "type": "matrix_eigenvalues",
                    "result": str(eigenvals),
                    "latex": f"\\lambda = {sp.latex(eigenvals)}",
                }
            else:
                return {
                    "success": True,
                    "type": "matrix",
                    "result": str(mat_obj.tolist()),
                    "latex": sp.latex(mat_obj),
                    "matrix_shape": list(mat_obj.shape),
                }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": f"Matrix calculation error: {e}"
            }
