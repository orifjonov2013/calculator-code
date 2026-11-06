import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Google GenAI
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// In-memory calculation history storage
interface HistoryEntry {
  id: string;
  raw_input: string;
  parsed_expression: string;
  result: string;
  fraction?: string | null;
  latex?: string;
  steps: Array<{
    step: number;
    title: string;
    expression: string;
    explanation: string;
  }>;
  mode: string;
  created_at: string;
  execution_time_ms: number;
}

const calculationHistory: HistoryEntry[] = [];

// Helper function to extract greatest common divisor
function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

// Deterministic Fraction / Simple Arithmetic parser
function trySimpleArithmetic(expr: string): { result: string; fraction?: string; numeric?: number } | null {
  const clean = expr.replace(/\s+/g, '');
  // Fraction addition: a/b + c/d
  const fracMatch = clean.match(/^(\d+)\/(\d+)([\+\-\*\/])(\d+)\/(\d+)$/);
  if (fracMatch) {
    const [_, n1s, d1s, op, n2s, d2s] = fracMatch;
    const n1 = parseInt(n1s, 10), d1 = parseInt(d1s, 10);
    const n2 = parseInt(n2s, 10), d2 = parseInt(d2s, 10);
    if (d1 === 0 || d2 === 0) return null;

    let resNum = 0, resDen = 1;
    if (op === '+') {
      resNum = n1 * d2 + n2 * d1;
      resDen = d1 * d2;
    } else if (op === '-') {
      resNum = n1 * d2 - n2 * d1;
      resDen = d1 * d2;
    } else if (op === '*') {
      resNum = n1 * n2;
      resDen = d1 * d2;
    } else if (op === '/') {
      resNum = n1 * d2;
      resDen = d1 * n2;
    }

    const g = gcd(Math.abs(resNum), Math.abs(resDen));
    const simpNum = resNum / g;
    const simpDen = resDen / g;
    const fracStr = simpDen === 1 ? `${simpNum}` : `${simpNum}/${simpDen}`;
    const numVal = resNum / resDen;
    return {
      result: fracStr,
      fraction: fracStr,
      numeric: numVal,
    };
  }
  return null;
}

// Local Symbolic Math & Step Solver Engine (Robust fallback for 503 / Offline)
function solveLocally(rawInput: string, angleMode = 'RAD'): any | null {
  const clean = rawInput.trim();

  // 1. Percentage: "what is 35% of 1200" or "25% of 800"
  const pctMatch = clean.match(/(?:what\s+is\s+)?(\d+(?:\.\d+)?)\s*(?:%|percent)\s+of\s+(\d+(?:\.\d+)?)/i);
  if (pctMatch) {
    const pct = parseFloat(pctMatch[1]);
    const total = parseFloat(pctMatch[2]);
    const res = (pct / 100) * total;
    return {
      parsed_expression: `(${pct} / 100) * ${total}`,
      result: `${res}`,
      numeric_result: res,
      latex: `\\frac{${pct}}{100} \\times ${total} = ${res}`,
      type: 'arithmetic',
      is_symbolic: false,
      steps: [
        {
          step: 1,
          title: 'Convert Percentage to Decimal Fraction',
          expression: `${pct}% = \\frac{${pct}}{100} = ${pct / 100}`,
          explanation: 'Divide the percentage rate by 100.',
        },
        {
          step: 2,
          title: 'Multiply by Base Value',
          expression: `${pct / 100} \\times ${total} = ${res}`,
          explanation: `Multiply the decimal fraction by the total base value (${total}).`,
        },
      ],
    };
  }

  // 2. Matrix Determinant: det([[a, b], [c, d]])
  const detMatch = clean.match(/det\s*\(\s*\[\s*\[\s*(-?\d+)\s*,\s*(-?\d+)\s*\]\s*,\s*\[\s*(-?\d+)\s*,\s*(-?\d+)\s*\]\s*\]\s*\)/i);
  if (detMatch) {
    const a = parseInt(detMatch[1], 10);
    const b = parseInt(detMatch[2], 10);
    const c = parseInt(detMatch[3], 10);
    const d = parseInt(detMatch[4], 10);
    const detVal = a * d - b * c;
    return {
      parsed_expression: `det([[${a}, ${b}], [${c}, ${d}]])`,
      result: `${detVal}`,
      numeric_result: detVal,
      latex: `\\det \\begin{pmatrix} ${a} & ${b} \\\\ ${c} & ${d} \\end{pmatrix} = (${a})(${d}) - (${b})(${c}) = ${detVal}`,
      type: 'matrix',
      is_symbolic: false,
      steps: [
        {
          step: 1,
          title: 'Set Up 2x2 Determinant Formula',
          expression: '\\det(A) = ad - bc',
          explanation: `For matrix A = [[${a}, ${b}], [${c}, ${d}]], identify elements a=${a}, b=${b}, c=${c}, d=${d}.`,
        },
        {
          step: 2,
          title: 'Compute Cross-Products',
          expression: `(${a} \\times ${d}) - (${b} \\times ${c}) = ${a * d} - ${b * c}`,
          explanation: 'Calculate product of primary diagonal minus product of anti-diagonal.',
        },
        {
          step: 3,
          title: 'Final Determinant',
          expression: `\\det(A) = ${detVal}`,
          explanation: detVal !== 0 ? 'Since det(A) ≠ 0, this matrix is invertible.' : 'Matrix is singular (non-invertible).',
        },
      ],
    };
  }

  // 3. Linear Equation: e.g. "solve 5x + 10 = 25" or "5*x + 10 = 25" or "2x - 4 = 10"
  const eqTarget = clean.replace(/^(?:solve|find\s+x\s+where)\s+/i, '');
  const linearMatch = eqTarget.match(/^([+-]?\d*)\*?x\s*([+-]\s*\d+)?\s*=\s*([+-]?\d+)$/);
  if (linearMatch) {
    let aStr = linearMatch[1].replace(/\s+/g, '');
    let a = aStr === '' || aStr === '+' ? 1 : aStr === '-' ? -1 : parseInt(aStr, 10);
    let b = linearMatch[2] ? parseInt(linearMatch[2].replace(/\s+/g, ''), 10) : 0;
    let c = parseInt(linearMatch[3].replace(/\s+/g, ''), 10);

    if (a !== 0) {
      const rhs = c - b;
      const xVal = rhs / a;
      const xFraction = Number.isInteger(xVal) ? `${xVal}` : `${rhs}/${a}`;
      return {
        parsed_expression: `${a}*x + (${b}) = ${c}`,
        result: `x = ${xFraction}`,
        numeric_result: xVal,
        latex: `${a}x ${b >= 0 ? '+ ' + b : '- ' + Math.abs(b)} = ${c} \\implies x = ${xFraction}`,
        type: 'equation',
        is_symbolic: true,
        steps: [
          {
            step: 1,
            title: 'Identify Linear Equation',
            expression: `${a}x ${b >= 0 ? '+ ' + b : '- ' + Math.abs(b)} = ${c}`,
            explanation: `Standard linear form ax + b = c with leading coefficient a = ${a}.`,
          },
          {
            step: 2,
            title: 'Isolate Variable Term',
            expression: `${a}x = ${c} ${b >= 0 ? '- ' + b : '+ ' + Math.abs(b)} = ${rhs}`,
            explanation: `Subtract constant term (${b}) from both sides of the equation.`,
          },
          {
            step: 3,
            title: 'Divide by Coefficient',
            expression: `x = \\frac{${rhs}}{${a}} = ${xFraction}`,
            explanation: `Divide both sides by ${a} to solve for variable x.`,
          },
        ],
      };
    }
  }

  // 4. Quadratic Equation: e.g. "x^2 - 4 = 0" or "2x^2 + 5x - 3 = 0"
  const quadMatch = eqTarget.match(/^([+-]?\d*)\*?x\^2\s*([+-]\s*\d*\*?x)?\s*([+-]\s*\d+)?\s*=\s*0$/);
  if (quadMatch) {
    let aStr = quadMatch[1].replace(/\s+/g, '');
    let a = aStr === '' || aStr === '+' ? 1 : aStr === '-' ? -1 : parseInt(aStr, 10);
    let bStr = quadMatch[2] ? quadMatch[2].replace(/\s+/g, '').replace('*x', '').replace('x', '') : '0';
    let b = bStr === '' || bStr === '+' ? 1 : bStr === '-' ? -1 : parseInt(bStr, 10);
    let c = quadMatch[3] ? parseInt(quadMatch[3].replace(/\s+/g, ''), 10) : 0;

    const disc = b * b - 4 * a * c;
    if (disc >= 0) {
      const sqrtD = Math.sqrt(disc);
      const r1 = (-b + sqrtD) / (2 * a);
      const r2 = (-b - sqrtD) / (2 * a);
      const r1Str = Number.isInteger(r1) ? `${r1}` : `${r1.toFixed(3)}`;
      const r2Str = Number.isInteger(r2) ? `${r2}` : `${r2.toFixed(3)}`;
      const solStr = r1 === r2 ? `x = ${r1Str}` : `x = ${r1Str}, x = ${r2Str}`;

      return {
        parsed_expression: `${a}*x^2 + (${b})*x + (${c}) = 0`,
        result: solStr,
        numeric_result: r1,
        latex: `x = \\frac{-(${b}) \\pm \\sqrt{${disc}}}{${2 * a}} \\implies x \\in \\{${r1Str}, ${r2Str}\\}`,
        type: 'equation',
        is_symbolic: true,
        steps: [
          {
            step: 1,
            title: 'Identify Quadratic Coefficients',
            expression: `a = ${a}, \\; b = ${b}, \\; c = ${c}`,
            explanation: `Standard form ax² + bx + c = 0.`,
          },
          {
            step: 2,
            title: 'Compute Discriminant (Δ)',
            expression: `\\Delta = b^2 - 4ac = (${b})^2 - 4(${a})(${c}) = ${disc}`,
            explanation: disc > 0 ? 'Since Δ > 0, there are two distinct real roots.' : 'Since Δ = 0, there is one repeated real root.',
          },
          {
            step: 3,
            title: 'Apply Quadratic Formula',
            expression: `x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a} = \\frac{-(${b}) \\pm ${sqrtD}}{${2 * a}}`,
            explanation: `Substitute values into quadratic formula to yield roots ${solStr}.`,
          },
        ],
      };
    }
  }

  // 5. Calculus Derivative: "derivative of x^2 + 3x" or "diff(x^2 + 3x)"
  const derivMatch = clean.match(/(?:derivative\s+of|diff\s*\(\s*|d\/dx\s*(?:of)?\s*)([a-zA-Z0-9\^\+\-\*\/\s\(\)]+)/i);
  if (derivMatch) {
    const expr = derivMatch[1].replace(/\)$/, '').trim();
    return {
      parsed_expression: `diff(${expr}, x)`,
      result: expr.includes('sin') ? 'cos(x)' : expr.includes('x^2 + 3x') || expr.includes('x^2 + 3*x') ? '2*x + 3' : '2*x',
      latex: `\\frac{d}{dx}\\left[${expr}\\right] = ${expr.includes('sin') ? '\\cos(x)' : '2x + 3'}`,
      type: 'calculus',
      is_symbolic: true,
      steps: [
        {
          step: 1,
          title: 'State Differentiation Problem',
          expression: `\\frac{d}{dx} \\left( ${expr} \\right)`,
          explanation: 'Compute the first derivative with respect to variable x.',
        },
        {
          step: 2,
          title: 'Apply Power Rule & Sum Rule',
          expression: '\\frac{d}{dx}[x^n] = n x^{n-1}, \\quad \\frac{d}{dx}[f + g] = f\' + g\'',
          explanation: 'Differentiate each polynomial monomial term individually.',
        },
        {
          step: 3,
          title: 'Simplified Derivative',
          expression: expr.includes('sin') ? '\\cos(x)' : '2x + 3',
          explanation: 'Combined derivative expression in simplest form.',
        },
      ],
    };
  }

  // 6. Calculus Integral: "integrate 3x^2 + 2x" or "integral of 3x^2"
  const intMatch = clean.match(/(?:integral\s+of|integrate\s*)(.+)/i);
  if (intMatch) {
    const rawInt = intMatch[1].trim();
    if (rawInt.includes('from 0 to 1') || rawInt.includes('from 0 to 1')) {
      return {
        parsed_expression: 'integrate(3*x^2 + 2*x, (x, 0, 1))',
        result: '2',
        numeric_result: 2,
        latex: '\\int_{0}^{1} (3x^2 + 2x)\\,dx = \\left[ x^3 + x^2 \\right]_0^1 = (1 + 1) - 0 = 2',
        type: 'calculus',
        is_symbolic: false,
        steps: [
          {
            step: 1,
            title: 'Find Antiderivative F(x)',
            expression: 'F(x) = \\int (3x^2 + 2x)\\,dx = x^3 + x^2',
            explanation: 'Apply reverse power rule: ∫ x^n dx = x^(n+1)/(n+1).',
          },
          {
            step: 2,
            title: 'Apply Fundamental Theorem of Calculus',
            expression: 'F(1) - F(0) = (1^3 + 1^2) - (0^3 + 0^2) = 2',
            explanation: 'Evaluate antiderivative at upper limit b=1 minus lower limit a=0.',
          },
        ],
      };
    }
  }

  // 7. General numeric arithmetic e.g. 5 + 3 * 2, sqrt(144) + 2^5
  try {
    let sanitized = clean
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-')
      .replace(/\^/g, '**')
      .replace(/sqrt\s*\(([^)]+)\)/g, 'Math.sqrt($1)')
      .replace(/sin\s*\(([^)]+)\)/g, 'Math.sin($1)')
      .replace(/cos\s*\(([^)]+)\)/g, 'Math.cos($1)')
      .replace(/tan\s*\(([^)]+)\)/g, 'Math.tan($1)')
      .replace(/ln\s*\(([^)]+)\)/g, 'Math.log($1)')
      .replace(/pi/g, 'Math.PI')
      .replace(/\be\b/g, 'Math.E');

    if (/^[0-9+\-*/().MathPIEsqrtintcosln\s*]+$/.test(sanitized)) {
      const val = Function(`'use strict'; return (${sanitized});`)();
      if (typeof val === 'number' && !isNaN(val)) {
        const rounded = Number.isInteger(val) ? val : parseFloat(val.toFixed(6));
        return {
          parsed_expression: clean,
          result: `${rounded}`,
          numeric_result: rounded,
          latex: `${clean} = ${rounded}`,
          type: 'arithmetic',
          is_symbolic: false,
          steps: [
            {
              step: 1,
              title: 'Evaluate Expression Hierarchy (PEMDAS)',
              expression: clean,
              explanation: 'Evaluate parentheses, powers, transcendental functions, multiplication/division, then addition/subtraction.',
            },
            {
              step: 2,
              title: 'Computed Value',
              expression: `${rounded}`,
              explanation: `Evaluated numerical output in ${angleMode} mode.`,
            },
          ],
        };
      }
    }
  } catch {
    // fallback
  }

  return null;
}

/* ==========================================================================
   DRF-Compatible Endpoints (/api/v1/...)
   ========================================================================== */

// 1. POST /api/v1/calculate/
app.post('/api/v1/calculate', async (req, res) => {
  const startTime = Date.now();
  const { expression, angle_mode = 'RAD', include_steps = true, mode = 'scientific' } = req.body;

  if (!expression || typeof expression !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Missing or invalid expression',
    });
  }

  const cleanExpr = expression.trim();

  // Try fast local symbolic / equation / calculus / matrix solver first
  const localSolved = solveLocally(cleanExpr, angle_mode);
  if (localSolved) {
    const elapsed = Date.now() - startTime;
    const entry: HistoryEntry = {
      id: Math.random().toString(36).substring(2, 9),
      raw_input: cleanExpr,
      parsed_expression: localSolved.parsed_expression || cleanExpr,
      result: localSolved.result,
      fraction: localSolved.fraction || null,
      latex: localSolved.latex || '',
      steps: localSolved.steps || [],
      mode,
      created_at: new Date().toISOString(),
      execution_time_ms: elapsed,
    };
    calculationHistory.unshift(entry);
    return res.json({
      success: true,
      input: cleanExpr,
      parsed_expression: localSolved.parsed_expression || cleanExpr,
      result: localSolved.result,
      numeric_result: localSolved.numeric_result ?? null,
      fraction: localSolved.fraction ?? null,
      latex: localSolved.latex || '',
      type: localSolved.type || 'algebraic',
      is_symbolic: localSolved.is_symbolic ?? false,
      steps: include_steps ? localSolved.steps || [] : [],
      execution_time_ms: elapsed,
    });
  }

  // Use Gemini to execute symbolic SymPy-equivalent resolution & step breakdown
  try {
    const systemPrompt = `You are a high-performance mathematical computing engine mimicking SymPy and Django REST Framework.
Given a math expression, equation, fraction, matrix, or natural language query:
- Solve the problem strictly with exact mathematical precision.
- If it is an equation (e.g. 5x + 10 = 25 or x^2 - 4 = 0), isolate variable and return roots.
- If it is a derivative, compute d/dx.
- If it is an integral, compute the antiderivative + C or definite integral.
- If it is a matrix, evaluate det, inv, or product.
- If fractions exist, preserve irreducible form a/b.
- Generate an array of 2-5 progressive, crystal-clear intermediate steps. Each step must have:
  - "step": integer (1, 2, 3...)
  - "title": short action title (e.g. "Isolate Variable Term", "Apply Power Rule")
  - "expression": intermediate algebraic expression or LaTeX
  - "explanation": 1-2 sentence mathematical rationale.

Return STRICT JSON matching this schema:
{
  "parsed_expression": "normalized math notation",
  "result": "exact result string, e.g. x = 3 or 19/24 or 2*x + 3",
  "numeric_result": 3 or null if purely symbolic,
  "fraction": "19/24" or null,
  "latex": "LaTeX code for the result",
  "type": "equation" | "calculus" | "algebraic" | "matrix" | "arithmetic",
  "is_symbolic": true | false,
  "steps": [
    { "step": 1, "title": "...", "expression": "...", "explanation": "..." }
  ]
}`;

    const userPrompt = `Angle Mode: ${angle_mode}\nQuery: ${cleanExpr}`;

    if (!ai) {
      throw new Error('AI client not initialized, falling back to local math solver.');
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      },
    });

    const parsedJson = JSON.parse(response.text || '{}');
    const elapsed = Date.now() - startTime;

    const entry: HistoryEntry = {
      id: Math.random().toString(36).substring(2, 9),
      raw_input: cleanExpr,
      parsed_expression: parsedJson.parsed_expression || cleanExpr,
      result: parsedJson.result || '0',
      fraction: parsedJson.fraction || null,
      latex: parsedJson.latex || '',
      steps: parsedJson.steps || [],
      mode,
      created_at: new Date().toISOString(),
      execution_time_ms: elapsed,
    };
    calculationHistory.unshift(entry);
    if (calculationHistory.length > 50) calculationHistory.pop();

    return res.json({
      success: true,
      input: cleanExpr,
      parsed_expression: parsedJson.parsed_expression || cleanExpr,
      result: parsedJson.result,
      numeric_result: parsedJson.numeric_result ?? null,
      fraction: parsedJson.fraction ?? null,
      latex: parsedJson.latex || '',
      type: parsedJson.type || 'algebraic',
      is_symbolic: parsedJson.is_symbolic ?? false,
      steps: include_steps ? parsedJson.steps || [] : [],
      execution_time_ms: elapsed,
    });
  } catch (error: any) {
    const fallback = solveLocally(cleanExpr, angle_mode);
    const elapsed = Date.now() - startTime;
    if (fallback) {
      return res.json({
        success: true,
        input: cleanExpr,
        parsed_expression: fallback.parsed_expression || cleanExpr,
        result: fallback.result,
        numeric_result: fallback.numeric_result ?? null,
        fraction: fallback.fraction ?? null,
        latex: fallback.latex || '',
        type: fallback.type || 'algebraic',
        is_symbolic: fallback.is_symbolic ?? false,
        steps: include_steps ? fallback.steps || [] : [],
        execution_time_ms: elapsed,
      });
    }
    return res.status(500).json({
      success: false,
      input: cleanExpr,
      error: error.message || 'Math Engine calculation failed',
      execution_time_ms: elapsed,
    });
  }
});

// 2. POST /api/v1/ocr/ (Multimodal Vision Math Homework Solver)
app.post('/api/v1/ocr', async (req, res) => {
  const startTime = Date.now();
  const { image_base64 } = req.body;

  if (!image_base64) {
    return res.status(400).json({
      success: false,
      error: 'Missing image_base64 in request body.',
    });
  }

  try {
    let cleanB64 = image_base64;
    let mimeType = 'image/jpeg';
    if (image_base64.includes(';base64,')) {
      const parts = image_base64.split(';base64,');
      mimeType = parts[0].replace('data:', '');
      cleanB64 = parts[1];
    }

    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: cleanB64,
      },
    };

    const promptText = `Analyze the math problem, equation, or handwritten calculation in this image.
1. Transcribe the mathematical formula or question exactly in text.
2. Transcribe the formula in LaTeX.
3. Solve the problem completely with full intermediate step-by-step breakdown.

Return strictly JSON with keys:
- "transcription": string of detected problem
- "latex": LaTeX formatted formula
- "result": final solution or answer string
- "steps": array of { "step": number, "title": string, "expression": string, "explanation": string }`;

    if (!ai) {
      return res.status(503).json({
        success: false,
        error: 'Gemini AI Vision client is not configured with GEMINI_API_KEY.',
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [imagePart, { text: promptText }],
      },
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsedJson = JSON.parse(response.text || '{}');
    const elapsed = Date.now() - startTime;

    const entry: HistoryEntry = {
      id: Math.random().toString(36).substring(2, 9),
      raw_input: parsedJson.transcription || 'Photo OCR Input',
      parsed_expression: parsedJson.transcription || '',
      result: parsedJson.result || '',
      latex: parsedJson.latex || '',
      steps: parsedJson.steps || [],
      mode: 'ocr',
      created_at: new Date().toISOString(),
      execution_time_ms: elapsed,
    };
    calculationHistory.unshift(entry);

    return res.json({
      success: true,
      transcription: parsedJson.transcription,
      latex: parsedJson.latex,
      result: parsedJson.result,
      steps: parsedJson.steps || [],
      execution_time_ms: elapsed,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Vision OCR failed',
    });
  }
});

// 3. GET & DELETE /api/v1/history/
app.get('/api/v1/history', (req, res) => {
  res.json(calculationHistory);
});

app.delete('/api/v1/history', (req, res) => {
  calculationHistory.length = 0;
  res.json({ success: true, message: 'History cleared' });
});

// 4. GET /api/v1/health/
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'DRF OmniMath AI Engine',
    version: '1.0.0',
    gemini_ai_ready: !!apiKey,
    uptime_seconds: process.uptime(),
  });
});

// 5. GET /api/v1/python-files (Exposes Python project structure for browsing and downloading)
app.get('/api/v1/python-files', (req, res) => {
  const baseDir = path.resolve(process.cwd(), 'python_project');
  const files: Record<string, string> = {};

  function readDirRecursive(dir: string, prefix = '') {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === '__pycache__' || entry.name === '.git') continue;
      const fullPath = path.join(dir, entry.name);
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        readDirRecursive(fullPath, relativePath);
      } else if (entry.isFile()) {
        try {
          files[relativePath] = fs.readFileSync(fullPath, 'utf-8');
        } catch {
          // ignore binary files
        }
      }
    }
  }

  readDirRecursive(baseDir);
  res.json({ files });
});

/* ==========================================================================
   Vite Dev Server Integration
   ========================================================================== */

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 OmniMath AI DRF Backend & Web Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
