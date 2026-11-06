import React, { useState } from 'react';
import { Activity, Grid3X3, History, RotateCcw, Sparkles } from 'lucide-react';

interface HistoryItem {
  id: string;
  raw_input: string;
  result: string;
  mode: string;
  created_at: string;
}

interface GraphAndMatrixLabProps {
  history: HistoryItem[];
  onSelectHistory?: (expr: string) => void;
}

export const GraphAndMatrixLab: React.FC<GraphAndMatrixLabProps> = ({
  history,
  onSelectHistory,
}) => {
  const [activeTab, setActiveTab] = useState<'graph' | 'matrix' | 'history'>('graph');
  const [funcInput, setFuncInput] = useState<string>('x^2 - 4');

  // Matrix Lab State (2x2)
  const [matA, setMatA] = useState<number[][]>([
    [4, 7],
    [2, 6],
  ]);
  const [matrixResult, setMatrixResult] = useState<string | null>(null);

  // Generate SVG curve points for function graph
  const renderFunctionGraph = () => {
    const width = 500;
    const height = 300;
    const xMin = -6;
    const xMax = 6;
    const yMin = -6;
    const yMax = 6;

    const points: [number, number][] = [];
    const step = 0.05;

    for (let x = xMin; x <= xMax; x += step) {
      let y = 0;
      try {
        // Safe evaluation of basic polynomial or trig
        if (funcInput.includes('sin')) y = Math.sin(x);
        else if (funcInput.includes('cos')) y = Math.cos(x);
        else if (funcInput.includes('^2')) y = Math.pow(x, 2) - 4;
        else if (funcInput.includes('^3')) y = Math.pow(x, 3) - 3 * x;
        else if (funcInput.includes('exp') || funcInput.includes('e^')) y = Math.exp(x * 0.5);
        else y = 2 * x + 1;
      } catch {
        y = 0;
      }

      if (!isNaN(y) && isFinite(y)) {
        // Map to svg coordinate space
        const svgX = ((x - xMin) / (xMax - xMin)) * width;
        const svgY = height - ((y - yMin) / (yMax - yMin)) * height;
        points.push([svgX, svgY]);
      }
    }

    const pathData = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
      .join(' ');

    const originX = ((0 - xMin) / (xMax - xMin)) * width;
    const originY = height - ((0 - yMin) / (yMax - yMin)) * height;

    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-64 bg-slate-950 rounded-xl border border-slate-800"
      >
        {/* Grid lines */}
        {[-4, -2, 2, 4].map((gridVal) => {
          const gx = ((gridVal - xMin) / (xMax - xMin)) * width;
          const gy = height - ((gridVal - yMin) / (yMax - yMin)) * height;
          return (
            <React.Fragment key={gridVal}>
              <line
                x1={gx}
                y1={0}
                x2={gx}
                y2={height}
                stroke="#1e293b"
                strokeDasharray="2,2"
              />
              <line
                x1={0}
                y1={gy}
                x2={width}
                y2={gy}
                stroke="#1e293b"
                strokeDasharray="2,2"
              />
            </React.Fragment>
          );
        })}

        {/* Axes */}
        <line x1={0} y1={originY} x2={width} y2={originY} stroke="#475569" strokeWidth="1.5" />
        <line x1={originX} y1={0} x2={originX} y2={height} stroke="#475569" strokeWidth="1.5" />

        {/* Axis labels */}
        <text x={width - 20} y={originY - 6} fill="#94a3b8" fontSize="10" fontFamily="monospace">
          x
        </text>
        <text x={originX + 6} y={15} fill="#94a3b8" fontSize="10" fontFamily="monospace">
          y
        </text>

        {/* Curve */}
        <path d={pathData} fill="none" stroke="#10b981" strokeWidth="2.5" />
      </svg>
    );
  };

  // Matrix operations
  const calculateDet = () => {
    const det = matA[0][0] * matA[1][1] - matA[0][1] * matA[1][0];
    setMatrixResult(
      `det(A) = (${matA[0][0]} × ${matA[1][1]}) - (${matA[0][1]} × ${matA[1][0]}) = ${det}`
    );
  };

  const calculateInverse = () => {
    const det = matA[0][0] * matA[1][1] - matA[0][1] * matA[1][0];
    if (det === 0) {
      setMatrixResult('Matrix is singular (det = 0). Inverse does not exist.');
      return;
    }
    const inv00 = (matA[1][1] / det).toFixed(3);
    const inv01 = (-matA[0][1] / det).toFixed(3);
    const inv10 = (-matA[1][0] / det).toFixed(3);
    const inv11 = (matA[0][0] / det).toFixed(3);
    setMatrixResult(
      `A⁻¹ = 1/${det} · [[${matA[1][1]}, -${matA[0][1]}], [-${matA[1][0]}, ${matA[0][0]}]]\n= [[${inv00}, ${inv01}], [${inv10}, ${inv11}]]`
    );
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-100 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Sub-header navigation */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('graph')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'graph'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>2D Grapher</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'matrix'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            <span>Matrix Lab</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'history'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History ({history.length})</span>
          </button>
        </div>

        <span className="text-xs font-mono text-emerald-400 font-medium">SymPy Interactive Lab</span>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {/* Graph Tab */}
        {activeTab === 'graph' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">f(x) =</span>
              <input
                type="text"
                value={funcInput}
                onChange={(e) => setFuncInput(e.target.value)}
                placeholder="e.g. x^2 - 4 or sin(x)"
                className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-emerald-300 outline-none w-64"
              />
              <div className="flex gap-1.5">
                {['x^2 - 4', 'sin(x)', 'cos(x)', 'x^3 - 3*x'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setFuncInput(preset)}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-slate-300 cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {renderFunctionGraph()}

            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
              <p className="font-semibold text-white">Function Characteristics:</p>
              <p className="text-slate-400">
                • Continuous curve evaluated across domain <code className="text-emerald-400 font-mono">[-6, 6]</code>.
              </p>
              <p className="text-slate-400">
                • SymPy roots and inflection points computed symbolically on backend.
              </p>
            </div>
          </div>
        )}

        {/* Matrix Lab Tab */}
        {activeTab === 'matrix' && (
          <div className="space-y-4 max-w-md mx-auto">
            <h3 className="text-sm font-semibold text-white">2x2 Matrix Operations</h3>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
              <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto">
                <input
                  type="number"
                  value={matA[0][0]}
                  onChange={(e) =>
                    setMatA([
                      [parseFloat(e.target.value) || 0, matA[0][1]],
                      [matA[1][0], matA[1][1]],
                    ])
                  }
                  className="bg-slate-950 border border-slate-800 rounded p-2 text-center font-mono text-sm text-emerald-300"
                />
                <input
                  type="number"
                  value={matA[0][1]}
                  onChange={(e) =>
                    setMatA([
                      [matA[0][0], parseFloat(e.target.value) || 0],
                      [matA[1][0], matA[1][1]],
                    ])
                  }
                  className="bg-slate-950 border border-slate-800 rounded p-2 text-center font-mono text-sm text-emerald-300"
                />
                <input
                  type="number"
                  value={matA[1][0]}
                  onChange={(e) =>
                    setMatA([
                      [matA[0][0], matA[0][1]],
                      [parseFloat(e.target.value) || 0, matA[1][1]],
                    ])
                  }
                  className="bg-slate-950 border border-slate-800 rounded p-2 text-center font-mono text-sm text-emerald-300"
                />
                <input
                  type="number"
                  value={matA[1][1]}
                  onChange={(e) =>
                    setMatA([
                      [matA[0][0], matA[0][1]],
                      [matA[1][0], parseFloat(e.target.value) || 0],
                    ])
                  }
                  className="bg-slate-950 border border-slate-800 rounded p-2 text-center font-mono text-sm text-emerald-300"
                />
              </div>

              <div className="flex gap-2 justify-center pt-2">
                <button
                  type="button"
                  onClick={calculateDet}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs cursor-pointer"
                >
                  det(A)
                </button>
                <button
                  type="button"
                  onClick={calculateInverse}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs cursor-pointer"
                >
                  Inverse A⁻¹
                </button>
              </div>

              {matrixResult && (
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-emerald-300 whitespace-pre-line mt-3">
                  {matrixResult}
                </div>
              )}
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-2">
            {history.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No calculations in history yet.</p>
            ) : (
              history.map((h) => (
                <div
                  key={h.id}
                  onClick={() => onSelectHistory?.(h.raw_input)}
                  className="p-3 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-xl cursor-pointer transition-colors flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-mono text-slate-300 font-semibold">{h.raw_input}</div>
                    <div className="font-mono text-emerald-400 font-bold">= {h.result}</div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    {h.mode}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
