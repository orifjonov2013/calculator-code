import React, { useState, useEffect } from 'react';
import { TelegramBotSimulator } from './components/TelegramBotSimulator';
import { ApiExplorer } from './components/ApiExplorer';
import { CodebaseExplorer } from './components/CodebaseExplorer';
import { GraphAndMatrixLab } from './components/GraphAndMatrixLab';
import { CalculationResponse } from './types/calculator';
import {
  Calculator,
  Terminal,
  Code2,
  Activity,
  Layers,
  Sparkles,
  CheckCircle2,
  Download,
  BookOpen,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'bot' | 'api' | 'code' | 'lab'>('bot');
  const [backendHealth, setBackendHealth] = useState<any>({ status: 'healthy', version: '1.0.0' });
  const [history, setHistory] = useState<any[]>([]);

  // Fetch health and history on load
  useEffect(() => {
    fetch('/api/v1/health')
      .then((res) => res.json())
      .then((data) => setBackendHealth(data))
      .catch(() => {});

    fetch('/api/v1/history')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setHistory(data);
      })
      .catch(() => {});
  }, []);

  const handleCalculationLogged = (calc: CalculationResponse) => {
    setHistory((prev) => [
      {
        id: Math.random().toString(36).substring(2, 9),
        raw_input: calc.input,
        result: calc.result,
        mode: calc.type || 'scientific',
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
              <Calculator className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base md:text-lg font-extrabold tracking-tight text-white">
                  OmniMath <span className="text-emerald-400">AI</span>
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                  DRF + Aiogram 3
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Next-Gen Scientific Calculator • SymPy Engine • Step-by-Step Solver
              </p>
            </div>
          </div>

          {/* Navigation Mode Tabs */}
          <nav className="flex items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('bot')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                activeTab === 'bot'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>Telegram Bot Simulator</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('api')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                activeTab === 'api'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>DRF API Explorer</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                activeTab === 'code'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>Python Codebase (.ZIP)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('lab')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                activeTab === 'lab'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Graph & Matrices</span>
            </button>
          </nav>

          {/* Engine Status Badge */}
          <div className="hidden lg:flex items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800/40">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>SymPy Engine Online</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col">
        {activeTab === 'bot' && (
          <div className="flex-1 min-h-[680px]">
            <TelegramBotSimulator onCalculationLogged={handleCalculationLogged} />
          </div>
        )}

        {activeTab === 'api' && (
          <div className="flex-1 min-h-[680px]">
            <ApiExplorer />
          </div>
        )}

        {activeTab === 'code' && (
          <div className="flex-1 min-h-[680px]">
            <CodebaseExplorer />
          </div>
        )}

        {activeTab === 'lab' && (
          <div className="flex-1 min-h-[680px]">
            <GraphAndMatrixLab
              history={history}
              onSelectHistory={(expr) => {
                setActiveTab('bot');
              }}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-3 px-6 text-center text-xs text-slate-400 font-mono">
        OmniMath AI • Django REST Framework 3.15 + SymPy 1.13 + Aiogram 3.15 + Gemini Vision OCR
      </footer>
    </div>
  );
}
