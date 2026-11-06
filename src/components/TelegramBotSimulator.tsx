import React, { useState, useRef, useEffect } from 'react';
import { CitizenKeypad } from './CitizenKeypad';
import { StepBreakdownView } from './StepBreakdownView';
import { SampleProblemsModal, SAMPLE_PROBLEMS } from './SampleProblemsModal';
import { ChatMessage, CalculationResponse } from '../types/calculator';
import {
  Send,
  Camera,
  Bot,
  RotateCcw,
  Sparkles,
  BookOpen,
  EyeOff,
  Calculator,
  Cpu,
  Layers,
  HelpCircle,
  CheckCircle2,
  Image as ImageIcon,
} from 'lucide-react';

interface TelegramBotSimulatorProps {
  onCalculationLogged?: (res: CalculationResponse) => void;
}

export const TelegramBotSimulator: React.FC<TelegramBotSimulatorProps> = ({
  onCalculationLogged,
}) => {
  // Keypad LCD display state
  const [keypadBuffer, setKeypadBuffer] = useState<string>('0');
  const [lastAnswer, setLastAnswer] = useState<string>('0');
  const [memory, setMemory] = useState<string>('0');
  const [isShift, setIsShift] = useState<boolean>(false);
  const [angleMode, setAngleMode] = useState<'RAD' | 'DEG'>('RAD');
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [textInput, setTextInput] = useState<string>('');
  const [isSampleModalOpen, setIsSampleModalOpen] = useState<boolean>(false);

  // File input ref for photo OCR
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial messages list
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-start',
      sender: 'bot',
      timestamp: '00:01',
      type: 'text',
      text:
        '🔬 **Welcome to OmniMath AI — Next-Gen Scientific Calculator**\n\n' +
        'Powered by **Django REST Framework (DRF)**, **SymPy Symbolic Engine**, and **Aiogram 3**.\n\n' +
        '✨ **Features:**\n' +
        '• **Citizen Scientific Keypad:** Tap buttons below with real-time LCD updates.\n' +
        '• **Smart Text Mode:** Enter equations like `solve 5x + 10 = 25` or `derivative of x^2 + 3x`.\n' +
        '• **Step-by-Step Solver:** Tap **"Show Steps"** to unfold intermediate algebraic steps.\n' +
        '• **Photo / OCR Solver:** Upload or click 📷 to solve homework from photos.',
    },
    {
      id: 'msg-keypad-widget',
      sender: 'bot',
      timestamp: '00:01',
      type: 'keypad',
      keypadBuffer: '0',
      angleMode: 'RAD',
      isShift: false,
      memory: '0',
    },
  ]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, keypadBuffer]);

  // Handle Keypad Button Press with real-time LCD update
  const handleKeypadPress = async (action: string) => {
    if (isCalculating) return;

    if (action === 'shift') {
      setIsShift((prev) => !prev);
      return;
    }

    if (action === 'angle_mode') {
      setAngleMode((prev) => (prev === 'RAD' ? 'DEG' : 'RAD'));
      return;
    }

    if (action === 'ac') {
      setKeypadBuffer('0');
      return;
    }

    if (action === 'del') {
      setKeypadBuffer((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
      return;
    }

    if (action === 'mc') {
      setMemory('0');
      return;
    }

    if (action === 'mr') {
      setKeypadBuffer((prev) => (prev === '0' ? memory : prev + memory));
      return;
    }

    if (action === 'm_plus' || action === 'm_minus') {
      try {
        const res = await fetch('/api/v1/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ expression: keypadBuffer, angle_mode: angleMode }),
        });
        const data = await res.json();
        const numVal = parseFloat(data.numeric_result ?? data.result ?? 0);
        const curMem = parseFloat(memory);
        const newMem = action === 'm_plus' ? curMem + numVal : curMem - numVal;
        setMemory(newMem.toFixed(4).replace(/\.?0+$/, ''));
      } catch {
        // ignore
      }
      return;
    }

    // Evaluation "=" button
    if (action === '=') {
      await executeCalculation(keypadBuffer, 'scientific');
      return;
    }

    // Append to buffer
    let toAppend = action;
    if (action === 'frac') toAppend = '/';
    else if (action === 'ans') toAppend = lastAnswer;

    setKeypadBuffer((prev) => {
      if (prev === '0' && !['+', '-', '*', '/', '^', '.', ')'].includes(toAppend)) {
        return toAppend;
      }
      return prev + toAppend;
    });
  };

  // Execute Calculation API Call
  const executeCalculation = async (expression: string, mode = 'scientific') => {
    if (!expression.trim()) return;
    setIsCalculating(true);

    // If text mode, add user message
    if (mode !== 'scientific') {
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        sender: 'user',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'text',
        text: expression,
      };
      setMessages((prev) => [...prev, userMsg]);
    }

    try {
      const res = await fetch('/api/v1/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expression: expression,
          angle_mode: angleMode,
          include_steps: true,
          mode: mode,
        }),
      });

      const data: CalculationResponse = await res.json();
      if (data.success) {
        setLastAnswer(data.result);
        setKeypadBuffer(data.result);
        onCalculationLogged?.(data);

        // Append bot calculation result card
        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'result',
          calcResult: data,
          showSteps: false,
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        const errMsg: ChatMessage = {
          id: `err-${Date.now()}`,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'text',
          text: `❌ **Math Error:**\n${data.error || 'Unable to parse expression.'}`,
        };
        setMessages((prev) => [...prev, errMsg]);
      }
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'text',
        text: `❌ **Connection Error:** ${err.message}`,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsCalculating(false);
      setTextInput('');
    }
  };

  // Toggle Steps View for a specific message
  const toggleSteps = (msgId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, showSteps: !m.showSteps } : m))
    );
  };

  // Handle Photo Upload OCR
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Str = reader.result as string;

      // Add user photo message
      const photoMsg: ChatMessage = {
        id: `photo-user-${Date.now()}`,
        sender: 'user',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'photo',
        photoUrl: base64Str,
        text: '📷 Math Homework Photo',
      };
      setMessages((prev) => [...prev, photoMsg]);

      setIsCalculating(true);
      try {
        const res = await fetch('/api/v1/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_base64: base64Str }),
        });
        const ocrData = await res.json();

        if (ocrData.success) {
          const calcRes: CalculationResponse = {
            success: true,
            input: ocrData.transcription || 'Photo OCR',
            result: ocrData.result || '',
            latex: ocrData.latex || '',
            steps: ocrData.steps || [],
            execution_time_ms: ocrData.execution_time_ms || 0,
            type: 'ocr',
          };
          setLastAnswer(ocrData.result);
          setKeypadBuffer(ocrData.result);
          onCalculationLogged?.(calcRes);

          const botMsg: ChatMessage = {
            id: `ocr-res-${Date.now()}`,
            sender: 'bot',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'result',
            calcResult: calcRes,
            showSteps: true, // auto-expand steps for photo OCR
          };
          setMessages((prev) => [...prev, botMsg]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: `ocr-err-${Date.now()}`,
              sender: 'bot',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              type: 'text',
              text: `❌ **OCR Error:** ${ocrData.error || 'Failed to detect equation.'}`,
            },
          ]);
        }
      } catch (err: any) {
        setMessages((prev) => [
          ...prev,
          {
            id: `ocr-conn-err-${Date.now()}`,
            sender: 'bot',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'text',
            text: `❌ **OCR Connection Error:** ${err.message}`,
          },
        ]);
      } finally {
        setIsCalculating(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Telegram Chat Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-600 via-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md">
              <Calculator className="w-5 h-5" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold text-white tracking-wide">OmniMath AI Bot</h2>
              <span className="text-[10px] bg-sky-500/20 text-sky-300 font-mono font-semibold px-1.5 py-0.5 rounded border border-sky-500/30">
                bot
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
              Aiogram 3.15 • DRF Engine Online
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsSampleModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-semibold cursor-pointer transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sample Problems</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setKeypadBuffer('0');
              setMessages([
                {
                  id: 'msg-start-reset',
                  sender: 'bot',
                  timestamp: '00:01',
                  type: 'text',
                  text: '🔄 Session reset! Ready for calculations.',
                },
                {
                  id: `keypad-${Date.now()}`,
                  sender: 'bot',
                  timestamp: '00:01',
                  type: 'keypad',
                },
              ]);
            }}
            title="Reset Chat & Keypad"
            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Telegram Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-radial from-slate-900/40 via-slate-950 to-slate-950">
        {messages.map((msg) => {
          if (msg.type === 'keypad') {
            return (
              <div key={msg.id} className="max-w-xl mx-auto space-y-2">
                {/* LCD Screen Display Card */}
                <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-slate-800 rounded-2xl p-4 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-cyan-500 via-emerald-500 to-amber-500" />
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2">
                    <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                      <Cpu className="w-3.5 h-3.5" />
                      CITIZEN SCIENTIFIC ENGINE
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-bold">
                        {angleMode}
                      </span>
                      {isShift && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                          2nd
                        </span>
                      )}
                      {memory !== '0' && (
                        <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                          M={memory}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* LCD Display */}
                  <div className="bg-slate-950/90 border border-slate-800/80 rounded-xl p-3 text-right font-mono">
                    <div className="text-xs text-slate-400 tracking-wider truncate mb-1">
                      {keypadBuffer.includes('+') ||
                      keypadBuffer.includes('-') ||
                      keypadBuffer.includes('*') ||
                      keypadBuffer.includes('/') ||
                      keypadBuffer.includes('(')
                        ? keypadBuffer
                        : 'READY'}
                    </div>
                    <div className="text-2xl md:text-3xl font-bold text-emerald-400 tracking-tight overflow-x-auto select-all">
                      {keypadBuffer}
                    </div>
                  </div>
                </div>

                {/* Citizen 7-Row Inline Keyboard */}
                <CitizenKeypad
                  isShift={isShift}
                  angleMode={angleMode}
                  hasMemory={memory !== '0'}
                  onButtonPress={handleKeypadPress}
                  disabled={isCalculating}
                />
              </div>
            );
          }

          if (msg.type === 'result' && msg.calcResult) {
            const r = msg.calcResult;
            return (
              <div key={msg.id} className="max-w-xl mx-auto animate-fade-in">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block animate-ping" />
                      <span className="text-xs font-bold text-white tracking-wide">
                        Calculation Result
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/40">
                      {r.execution_time_ms} ms
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80">
                      <span className="text-slate-400 block text-[10px] uppercase font-mono">
                        Input Expression
                      </span>
                      <code className="text-slate-200 font-semibold">{r.input}</code>
                    </div>

                    <div className="p-2.5 bg-slate-950 rounded-lg border border-emerald-900/40">
                      <span className="text-emerald-400 block text-[10px] uppercase font-mono font-semibold">
                        Final Answer
                      </span>
                      <code className="text-emerald-300 text-sm font-bold">{r.result}</code>
                    </div>
                  </div>

                  {r.fraction && (
                    <div className="px-3 py-1.5 bg-sky-950/30 border border-sky-900/40 rounded-lg text-xs flex items-center justify-between font-mono">
                      <span className="text-sky-300">Irreducible Fraction:</span>
                      <span className="font-bold text-sky-200">{r.fraction}</span>
                    </div>
                  )}

                  {/* Toggle Steps Inline Button */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => toggleSteps(msg.id)}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                        msg.showSteps
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                          : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/30'
                      }`}
                    >
                      {msg.showSteps ? (
                        <>
                          <EyeOff className="w-4 h-4" />
                          <span>Hide Intermediate Steps</span>
                        </>
                      ) : (
                        <>
                          <BookOpen className="w-4 h-4" />
                          <span>Show Step-by-Step Breakdown ({r.steps?.length || 0} Steps)</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Unfolded Steps */}
                  {msg.showSteps && (
                    <StepBreakdownView steps={r.steps} latex={r.latex} result={r.result} />
                  )}
                </div>
              </div>
            );
          }

          if (msg.type === 'photo') {
            return (
              <div key={msg.id} className="flex justify-end max-w-xl mx-auto">
                <div className="bg-emerald-950/60 border border-emerald-800/60 rounded-2xl p-2.5 max-w-xs shadow-lg space-y-1.5 text-right">
                  {msg.photoUrl && (
                    <img
                      src={msg.photoUrl}
                      alt="Uploaded Problem"
                      className="rounded-lg object-cover max-h-48 w-full border border-slate-800"
                    />
                  )}
                  <p className="text-xs text-emerald-300 font-medium">{msg.text}</p>
                  <span className="text-[10px] text-slate-400 block">{msg.timestamp}</span>
                </div>
              </div>
            );
          }

          // Standard user message
          if (msg.sender === 'user') {
            return (
              <div key={msg.id} className="flex justify-end max-w-xl mx-auto">
                <div className="bg-emerald-600 text-white rounded-2xl rounded-tr-xs px-4 py-2.5 max-w-md shadow-md text-sm">
                  <p className="font-mono">{msg.text}</p>
                  <span className="text-[10px] text-emerald-200 block text-right mt-1">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          }

          // Standard bot message
          return (
            <div key={msg.id} className="flex justify-start max-w-xl mx-auto">
              <div className="bg-slate-900 border border-slate-800 text-slate-200 rounded-2xl rounded-tl-xs px-4 py-3 max-w-lg shadow-md text-xs leading-relaxed space-y-2">
                <div className="whitespace-pre-line font-sans">{msg.text}</div>
                <span className="text-[10px] text-slate-400 block text-right">
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {isCalculating && (
          <div className="flex justify-start max-w-xl mx-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-emerald-400 flex items-center gap-2 shadow-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>OmniMath AI Solving & Generating Steps...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Chips */}
      <div className="px-4 py-2 bg-slate-900/90 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs shrink-0">
        <span className="text-[11px] font-mono text-slate-400 shrink-0">Try NLP:</span>
        <button
          type="button"
          onClick={() => executeCalculation('solve 5x + 10 = 25', 'nlp')}
          className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0 cursor-pointer text-[11px] transition-colors"
        >
          solve 5x + 10 = 25
        </button>
        <button
          type="button"
          onClick={() => executeCalculation('derivative of x^2 + 3x', 'nlp')}
          className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0 cursor-pointer text-[11px] transition-colors"
        >
          derivative of x^2 + 3x
        </button>
        <button
          type="button"
          onClick={() => executeCalculation('integral of sin(x)*cos(x) dx', 'nlp')}
          className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0 cursor-pointer text-[11px] transition-colors"
        >
          integral of sin(x)*cos(x)
        </button>
        <button
          type="button"
          onClick={() => executeCalculation('det([[1, 2], [3, 4]])', 'nlp')}
          className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0 cursor-pointer text-[11px] transition-colors"
        >
          det([[1, 2], [3, 4]])
        </button>
        <button
          type="button"
          onClick={() => executeCalculation('3/8 + 5/12', 'nlp')}
          className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0 cursor-pointer text-[11px] transition-colors"
        >
          3/8 + 5/12
        </button>
      </div>

      {/* Telegram Input Bar */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (textInput.trim()) {
              executeCalculation(textInput, 'nlp');
            }
          }}
          className="flex items-center gap-2 max-w-xl mx-auto"
        >
          {/* Photo OCR Button */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
          />
          <button
            type="button"
            title="Upload Math Homework Photo (OCR)"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl bg-slate-800 text-emerald-400 hover:text-emerald-300 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer shrink-0"
          >
            <Camera className="w-5 h-5" />
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type equation, math question, or 'solve 2x + 6 = 18'..."
            disabled={isCalculating}
            className="flex-1 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-xs md:text-sm text-slate-100 placeholder-slate-400 outline-none transition-colors"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={isCalculating || !textInput.trim()}
            className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shrink-0 shadow-md"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>

      {/* Sample Problems Modal */}
      <SampleProblemsModal
        isOpen={isSampleModalOpen}
        onClose={() => setIsSampleModalOpen(false)}
        onSelect={(prob) => {
          setTextInput(prob.expression);
          executeCalculation(prob.expression, 'nlp');
        }}
      />
    </div>
  );
};
