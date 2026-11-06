import React from 'react';
import { MathStep } from '../types/calculator';
import { CheckCircle2, ChevronRight, Copy, Sparkles } from 'lucide-react';

interface StepBreakdownViewProps {
  steps: MathStep[];
  latex?: string;
  result: string;
}

export const StepBreakdownView: React.FC<StepBreakdownViewProps> = ({ steps, latex, result }) => {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!steps || steps.length === 0) {
    return (
      <div className="p-3 bg-slate-900/50 rounded-lg text-slate-400 text-xs italic">
        Direct calculation result. No intermediate reduction steps required.
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold border-b border-emerald-950/60 pb-1.5">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          Step-by-Step Algebraic Breakdown ({steps.length} Steps)
        </span>
        <span className="text-slate-400 font-mono text-[10px]">SymPy Engine</span>
      </div>

      <div className="space-y-2.5">
        {steps.map((s, idx) => (
          <div
            key={idx}
            className="group relative bg-slate-900/80 border border-slate-800 hover:border-emerald-700/60 transition-all rounded-lg p-3 text-xs shadow-sm"
          >
            {/* Step Header */}
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold flex items-center justify-center text-[10px] border border-emerald-500/30">
                  {s.step || idx + 1}
                </span>
                <span className="font-semibold text-slate-200">{s.title}</span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(s.expression, idx)}
                title="Copy step expression"
                className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
              >
                {copiedIndex === idx ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Expression Box */}
            <div className="my-1.5 px-2.5 py-1.5 bg-slate-950/90 rounded border border-slate-800/80 font-mono text-emerald-300 text-xs md:text-sm overflow-x-auto">
              <code>{s.expression}</code>
            </div>

            {/* Step Explanation */}
            <p className="text-slate-400 text-[11px] leading-relaxed flex items-start gap-1">
              <ChevronRight className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
              <span>{s.explanation}</span>
            </p>
          </div>
        ))}
      </div>

      {latex && (
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 text-[11px] font-mono text-slate-300 flex items-center justify-between">
          <div className="truncate">
            <span className="text-slate-400">LaTeX: </span>
            <code>{latex}</code>
          </div>
          <button
            type="button"
            onClick={() => copyToClipboard(latex, 999)}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium ml-2 shrink-0 cursor-pointer"
          >
            {copiedIndex === 999 ? 'Copied' : 'Copy'}
          </button>
        </div>
      )}
    </div>
  );
};
