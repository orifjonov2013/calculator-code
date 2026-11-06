import React from 'react';
import { Camera, Sparkles, X, Check } from 'lucide-react';

interface SampleProblem {
  id: string;
  title: string;
  category: string;
  expression: string;
  description: string;
  svgBadge: string;
}

export const SAMPLE_PROBLEMS: SampleProblem[] = [
  {
    id: 'quad',
    title: 'Quadratic Equation Homework',
    category: 'Algebra',
    expression: 'solve 2*x^2 + 5*x - 3 = 0',
    description: 'Find real roots using discriminant and quadratic formula.',
    svgBadge: '2x² + 5x - 3 = 0',
  },
  {
    id: 'integral',
    title: 'Definite Integral Homework',
    category: 'Calculus',
    expression: 'integrate 3*x^2 + 2*x from 0 to 1',
    description: 'Fundamental Theorem of Calculus and antiderivative power rule.',
    svgBadge: '∫₀¹ (3x² + 2x) dx',
  },
  {
    id: 'deriv',
    title: 'Chain Rule Derivative',
    category: 'Calculus',
    expression: 'derivative of sin(x^2 + 3*x)',
    description: 'Compute rate of change d/dx using chain rule f\'(g(x))*g\'(x).',
    svgBadge: 'd/dx [sin(x² + 3x)]',
  },
  {
    id: 'matrix',
    title: '2x2 Matrix Determinant',
    category: 'Linear Algebra',
    expression: 'det([[4, 7], [2, 6]])',
    description: 'Calculate determinant det(A) = ad - bc and check invertibility.',
    svgBadge: '|4  7|\n|2  6|',
  },
  {
    id: 'fractions',
    title: 'Fraction Arithmetic',
    category: 'Arithmetic',
    expression: '3/8 + 5/12',
    description: 'Find lowest common denominator (LCD) and simplify fraction.',
    svgBadge: '3/8 + 5/12',
  },
  {
    id: 'poly',
    title: 'Polynomial Factoring',
    category: 'Algebra',
    expression: 'factor x^3 - 8',
    description: 'Difference of cubes factorization: a³ - b³ = (a - b)(a² + ab + b²).',
    svgBadge: 'x³ - 8',
  },
];

interface SampleProblemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (problem: SampleProblem) => void;
}

export const SampleProblemsModal: React.FC<SampleProblemsModalProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-5 shadow-2xl relative">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Sample Math Problems & Photo OCR Presets</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400 mt-2">
          Select a sample math problem to simulate instant photo/OCR solving with intermediate step-by-step breakdown.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 max-h-[60vh] overflow-y-auto pr-1">
          {SAMPLE_PROBLEMS.map((prob) => (
            <div
              key={prob.id}
              onClick={() => {
                onSelect(prob);
                onClose();
              }}
              className="group p-3.5 bg-slate-950/70 border border-slate-800 hover:border-emerald-500/70 rounded-xl cursor-pointer transition-all hover:bg-slate-900/90 text-left flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-semibold">
                    {prob.category}
                  </span>
                  <Sparkles className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                </div>
                <h4 className="text-sm font-semibold text-slate-200 group-hover:text-white mb-1">
                  {prob.title}
                </h4>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {prob.description}
                </p>
              </div>

              {/* Problem Badge */}
              <div className="mt-3 px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded font-mono text-xs text-emerald-400 font-medium group-hover:border-emerald-600/50">
                {prob.svgBadge}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
