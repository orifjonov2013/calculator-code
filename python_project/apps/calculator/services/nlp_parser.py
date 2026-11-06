"""Natural Language Mathematical Parsing Service.

Parses plain English math queries into canonical symbolic representations.
"""
import re
from typing import Dict, Any, Optional


class NaturalLanguageMathParser:
    PATTERNS = [
        # Derivatives: "derivative of x^2 + 3x", "d/dx of sin(x)", "differentiate 2x"
        (
            r'^(?:derivative\s+of|diff\s+of|differentiate|find\s+derivative\s+of|d/dx\s+of?)\s+(.+?)(?:\s+with\s+respect\s+to\s+([a-zA-Z]))?$',
            lambda m: f"diff({m.group(1)}, {m.group(2) or 'x'})",
            'calculus'
        ),
        # Integrals: "integral of x^2", "integrate sin(x)", "antiderivative of e^x"
        (
            r'^(?:integral\s+of|integrate|antiderivative\s+of|find\s+integral\s+of)\s+(.+?)(?:\s+from\s+([^\s]+)\s+to\s+([^\s]+))?$',
            lambda m: f"integrate({m.group(1)}, (x, {m.group(2)}, {m.group(3)}))" if m.group(2) else f"integrate({m.group(1)}, x)",
            'calculus'
        ),
        # Equations: "solve 5x + 10 = 25", "find x where 2x - 4 = 10"
        (
            r'^(?:solve|find\s+[a-zA-Z]\s+(?:in|for|where))\s+(.+)$',
            lambda m: m.group(1),
            'algebra'
        ),
        # Simplification: "simplify (x^2 - 1)/(x - 1)"
        (
            r'^(?:simplify|reduce)\s+(.+)$',
            lambda m: f"simplify({m.group(1)})",
            'algebra'
        ),
        # Factoring: "factor x^2 + 5x + 6"
        (
            r'^(?:factor|factorize)\s+(.+)$',
            lambda m: f"factor({m.group(1)})",
            'algebra'
        ),
        # Expansion: "expand (x + 2)^3"
        (
            r'^(?:expand|multiply\s+out)\s+(.+)$',
            lambda m: f"expand({m.group(1)})",
            'algebra'
        ),
        # Percentages: "25% of 800", "what is 15 percent of 200"
        (
            r'^(?:what\s+is\s+)?(\d+(?:\.\d+)?)\s*(?:%|percent)\s+of\s+(\d+(?:\.\d+)?)$',
            lambda m: f"({m.group(1)} / 100) * {m.group(2)}",
            'scientific'
        ),
        # Sum/Difference: "sum of 1/2 and 3/4"
        (
            r'^(?:sum\s+of|add)\s+(.+?)\s+and\s+(.+)$',
            lambda m: f"({m.group(1)}) + ({m.group(2)})",
            'scientific'
        ),
        # Determinant: "determinant of [[1, 2], [3, 4]]"
        (
            r'^(?:determinant\s+of|det\s+of)\s+(.+)$',
            lambda m: f"det({m.group(1)})",
            'matrix'
        ),
    ]

    @classmethod
    def parse_query(cls, raw_query: str) -> Dict[str, Any]:
        """Translates natural language text into a structured expression."""
        clean = raw_query.strip()

        for pattern, transformer, mode in cls.PATTERNS:
            match = re.match(pattern, clean, re.IGNORECASE)
            if match:
                try:
                    transformed = transformer(match)
                    return {
                        "is_nlp": True,
                        "raw_query": raw_query,
                        "transformed_expression": transformed,
                        "inferred_mode": mode,
                    }
                except Exception:
                    pass

        # If no explicit regex match, return raw cleaned expression
        return {
            "is_nlp": False,
            "raw_query": raw_query,
            "transformed_expression": clean,
            "inferred_mode": 'scientific',
        }
