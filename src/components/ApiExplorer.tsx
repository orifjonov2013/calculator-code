import React, { useState } from 'react';
import { Send, Copy, CheckCircle2, Play, Code, Clock, Layers, Sparkles } from 'lucide-react';
import { StepBreakdownView } from './StepBreakdownView';

interface PresetItem {
  name: string;
  category: string;
  payload: any;
}

const PRESETS: PresetItem[] = [
  {
    name: 'Algebraic Equation with Steps',
    category: 'Algebra',
    payload: {
      expression: 'solve 5*x + 10 = 25',
      angle_mode: 'RAD',
      include_steps: true,
      mode: 'algebra',
    },
  },
  {
    name: 'Calculus Derivative Chain Rule',
    category: 'Calculus',
    payload: {
      expression: 'derivative of sin(x^2 + 3*x)',
      angle_mode: 'RAD',
      include_steps: true,
      mode: 'calculus',
    },
  },
  {
    name: 'Definite Integral',
    category: 'Calculus',
    payload: {
      expression: 'integrate 3*x^2 + 2*x from 0 to 1',
      angle_mode: 'RAD',
      include_steps: true,
      mode: 'calculus',
    },
  },
  {
    name: 'Irreducible Fractions',
    category: 'Arithmetic',
    payload: {
      expression: '3/8 + 5/12',
      angle_mode: 'RAD',
      include_steps: true,
      mode: 'scientific',
    },
  },
  {
    name: 'Matrix Determinant',
    category: 'Linear Algebra',
    payload: {
      expression: 'det([[4, 7], [2, 6]])',
      angle_mode: 'RAD',
      include_steps: true,
      mode: 'matrix',
    },
  },
  {
    name: 'Natural Language Math Word Problem',
    category: 'NLP',
    payload: {
      expression: 'what is 35 percent of 1200',
      angle_mode: 'RAD',
      include_steps: true,
      mode: 'nlp',
    },
  },
];

export const ApiExplorer: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('/api/v1/calculate/');
  const [requestBody, setRequestBody] = useState<string>(
    JSON.stringify(PRESETS[0].payload, null, 2)
  );
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseData, setResponseData] = useState<any | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const handleSend = async () => {
    setIsLoading(true);
    setResponseData(null);
    setResponseStatus(null);
    const start = Date.now();

    try {
      const endpoint = selectedEndpoint.endsWith('/')
        ? selectedEndpoint.slice(0, -1)
        : selectedEndpoint;
      const parsedBody = JSON.parse(requestBody);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedBody),
      });

      const elapsed = Date.now() - start;
      setLatencyMs(elapsed);
      setResponseStatus(res.status);

      const data = await res.json();
      setResponseData(data);
    } catch (err: any) {
      setResponseStatus(500);
      setResponseData({ error: err.message });
      setLatencyMs(Date.now() - start);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurlSnippet = () => {
    return `curl -X POST "http://localhost:8000${selectedEndpoint}" \\
  -H "Content-Type: application/json" \\
  -d '${requestBody.replace(/\n/g, '')}'`;
  };

  const copyCurl = () => {
    navigator.clipboard.writeText(getCurlSnippet());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-100 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Code className="w-5 h-5 text-emerald-400" />
            Django REST Framework API Explorer
          </h2>
          <p className="text-xs text-slate-400">
            Interactive Swagger-style sandbox for testing <code className="text-emerald-400 font-mono">POST /api/v1/calculate/</code> and JSON step responses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyCurl}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 cursor-pointer transition-colors"
          >
            {copied ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>Copy cURL</span>
          </button>

          <button
            type="button"
            onClick={handleSend}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs cursor-pointer shadow-md transition-all"
          >
            {isLoading ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>Send Request</span>
          </button>
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs shrink-0">
        <span className="text-[11px] font-mono text-slate-400 shrink-0">Presets:</span>
        {PRESETS.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setRequestBody(JSON.stringify(p.payload, null, 2))}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0 text-xs cursor-pointer border border-slate-700/60 transition-colors"
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Body Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 overflow-y-auto">
        {/* Request Column */}
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold border border-emerald-500/30">
                POST
              </span>
              <input
                type="text"
                value={selectedEndpoint}
                onChange={(e) => setSelectedEndpoint(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs font-mono text-slate-200 outline-none w-56"
              />
            </div>
            <span className="text-slate-400 text-xs font-mono">application/json</span>
          </div>

          <div className="flex-1 flex flex-col min-h-[300px]">
            <label className="text-xs font-semibold text-slate-400 mb-1">Request Payload (JSON):</label>
            <textarea
              value={requestBody}
              onChange={(e) => setRequestBody(e.target.value)}
              className="flex-1 w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl p-3 font-mono text-xs text-emerald-300 outline-none resize-none leading-relaxed"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Response Column */}
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Response Inspector:</span>
            {responseStatus !== null && (
              <div className="flex items-center gap-2 text-xs font-mono">
                <span
                  className={`px-2 py-0.5 rounded font-bold ${
                    responseStatus === 200
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {responseStatus} {responseStatus === 200 ? 'OK' : 'ERROR'}
                </span>
                {latencyMs !== null && (
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {latencyMs} ms
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col min-h-[300px] bg-slate-900 border border-slate-800 rounded-xl p-3 overflow-y-auto">
            {!responseData ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs space-y-2">
                <Send className="w-8 h-8 text-slate-500 animate-pulse" />
                <p>Click "Send Request" to test the DRF calculation endpoint.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {responseData.steps && responseData.steps.length > 0 && (
                  <div className="pb-3 border-b border-slate-800">
                    <StepBreakdownView
                      steps={responseData.steps}
                      latex={responseData.latex}
                      result={responseData.result}
                    />
                  </div>
                )}

                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                    Raw JSON Output:
                  </span>
                  <pre className="font-mono text-xs text-cyan-300 bg-slate-950 p-3 rounded-lg overflow-x-auto border border-slate-800">
                    {JSON.stringify(responseData, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
