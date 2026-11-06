import React from 'react';

interface CitizenKeypadProps {
  isShift: boolean;
  angleMode: 'RAD' | 'DEG';
  hasMemory: boolean;
  onButtonPress: (action: string) => void;
  disabled?: boolean;
}

export const CitizenKeypad: React.FC<CitizenKeypadProps> = ({
  isShift,
  angleMode,
  hasMemory,
  onButtonPress,
  disabled = false,
}) => {
  const btnBase =
    'h-9 md:h-10 text-xs md:text-sm font-medium rounded-lg transition-all active:scale-95 flex items-center justify-center select-none shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <div className="w-full bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl p-2.5 shadow-xl space-y-1.5">
      {/* Row 1: Function toggles & Memory */}
      <div className="grid grid-cols-6 gap-1.5">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onButtonPress('shift')}
          className={`${btnBase} ${
            isShift
              ? 'bg-amber-500 text-slate-950 font-bold shadow-amber-500/20'
              : 'bg-amber-950/40 text-amber-300 border border-amber-800/60 hover:bg-amber-900/40'
          }`}
        >
          {isShift ? '⚪ 1st' : '🟡 2nd'}
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => onButtonPress('angle_mode')}
          className={`${btnBase} bg-slate-800 text-cyan-300 border border-cyan-900/50 hover:bg-slate-700`}
        >
          {angleMode}
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => onButtonPress('m_plus')}
          className={`${btnBase} bg-indigo-950/40 text-indigo-300 border border-indigo-900/50 hover:bg-indigo-900/40 font-mono`}
        >
          M+
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => onButtonPress('m_minus')}
          className={`${btnBase} bg-indigo-950/40 text-indigo-300 border border-indigo-900/50 hover:bg-indigo-900/40 font-mono`}
        >
          M-
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => onButtonPress('mr')}
          className={`${btnBase} ${
            hasMemory
              ? 'bg-indigo-600 text-white font-bold ring-1 ring-indigo-400'
              : 'bg-indigo-950/40 text-indigo-400/80 border border-indigo-900/50'
          } font-mono`}
        >
          {hasMemory ? 'MR•' : 'MR'}
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => onButtonPress('mc')}
          className={`${btnBase} bg-rose-950/40 text-rose-300 border border-rose-900/40 hover:bg-rose-900/40 font-mono`}
        >
          MC
        </button>
      </div>

      {/* Row 2: Powers, Roots, Fractions & Factorials */}
      <div className="grid grid-cols-6 gap-1.5">
        {!isShift ? (
          <>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onButtonPress('frac')}
              className={`${btnBase} bg-sky-950/50 text-sky-300 border border-sky-800/60 hover:bg-sky-900/50 font-mono font-semibold`}
            >
              a/b
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onButtonPress('^')}
              className={`${btnBase} bg-slate-800/80 text-slate-200 hover:bg-slate-700 font-mono`}
            >
              xʸ
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onButtonPress('sqrt(')}
              className={`${btnBase} bg-slate-800/80 text-slate-200 hover:bg-slate-700 font-mono`}
            >
              √x
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onButtonPress('!')}
              className={`${btnBase} bg-slate-800/80 text-slate-200 hover:bg-slate-700 font-mono`}
            >
              x!
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onButtonPress('inv')}
              className={`${btnBase} bg-slate-800/80 text-slate-200 hover:bg-slate-700 font-mono`}
            >
              1/x
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onButtonPress('abs(')}
              className={`${btnBase} bg-slate-800/80 text-slate-200 hover:bg-slate-700 font-mono`}
            >
              |x|
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onButtonPress('diff(')}
              className={`${btnBase} bg-amber-900/40 text-amber-300 border border-amber-700/50 hover:bg-amber-800/50 font-mono font-semibold`}
            >
              d/dx
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onButtonPress('integrate(')}
              className={`${btnBase} bg-amber-900/40 text-amber-300 border border-amber-700/50 hover:bg-amber-800/50 font-mono font-semibold`}
            >
              ∫ dx
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onButtonPress('cbrt(')}
              className={`${btnBase} bg-amber-900/40 text-amber-300 border border-amber-700/50 hover:bg-amber-800/50 font-mono`}
            >
              ³√x
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onButtonPress('^2')}
              className={`${btnBase} bg-amber-900/40 text-amber-300 border border-amber-700/50 hover:bg-amber-800/50 font-mono`}
            >
              x²
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onButtonPress('^3')}
              className={`${btnBase} bg-amber-900/40 text-amber-300 border border-amber-700/50 hover:bg-amber-800/50 font-mono`}
            >
              x³
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onButtonPress('10^(')}
              className={`${btnBase} bg-amber-900/40 text-amber-300 border border-amber-700/50 hover:bg-amber-800/50 font-mono`}
            >
              10ˣ
            </button>
          </>
        )}
      </div>

      {/* Row 3: Trigonometry & Logarithms */}
      <div className="grid grid-cols-6 gap-1.5">
        {!isShift ? (
          <>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onButtonPress('sin(')}
              className={`${btnBase} bg-slate-800/80 text-violet-300 hover:bg-slate-700 font-mono`}
            >
              sin
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onButtonPress('cos(')}
              className={`${btnBase} bg-slate-800/80 text-violet-300 hover:bg-slate-700 font-mono`}
            >
              cos
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onButtonPress('tan(')}
              className={`${btnBase} bg-slate-800/80 text-violet-300 hover:bg-slate-700 font-mono`}
            >
              tan
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onButtonPress('ln(')}
              className={`${btnBase} bg-slate-800/80 text-emerald-300 hover:bg-slate-700 font-mono`}
            >
              ln
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onButtonPress('log(')}
              className={`${btnBase} bg-slate-800/80 text-emerald-300 hover:bg-slate-700 font-mono`}
            >
              log
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onButtonPress('exp(')}
              className={`${btnBase} bg-slate-800/80 text-amber-300 hover:bg-slate-700 font-mono`}
            >
              eˣ
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onButtonPress('asin(')}
              className={`${btnBase} bg-amber-900/40 text-amber-300 border border-amber-700/50 hover:bg-amber-800/50 font-mono`}
            >
              sin⁻¹
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onButtonPress('acos(')}
              className={`${btnBase} bg-amber-900/40 text-amber-300 border border-amber-700/50 hover:bg-amber-800/50 font-mono`}
            >
              cos⁻¹
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onButtonPress('atan(')}
              className={`${btnBase} bg-amber-900/40 text-amber-300 border border-amber-700/50 hover:bg-amber-800/50 font-mono`}
            >
              tan⁻¹
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onButtonPress('sinh(')}
              className={`${btnBase} bg-amber-900/40 text-amber-300 border border-amber-700/50 hover:bg-amber-800/50 font-mono`}
            >
              sinh
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onButtonPress('cosh(')}
              className={`${btnBase} bg-amber-900/40 text-amber-300 border border-amber-700/50 hover:bg-amber-800/50 font-mono`}
            >
              cosh
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onButtonPress('tanh(')}
              className={`${btnBase} bg-amber-900/40 text-amber-300 border border-amber-700/50 hover:bg-amber-800/50 font-mono`}
            >
              tanh
            </button>
          </>
        )}
      </div>

      {/* Row 4: Digits (7 8 9), DEL, AC, ( */}
      <div className="grid grid-cols-6 gap-1.5">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onButtonPress('7')}
          className={`${btnBase} bg-slate-800 hover:bg-slate-700 text-white font-mono text-base font-semibold`}
        >
          7
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onButtonPress('8')}
          className={`${btnBase} bg-slate-800 hover:bg-slate-700 text-white font-mono text-base font-semibold`}
        >
          8
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onButtonPress('9')}
          className={`${btnBase} bg-slate-800 hover:bg-slate-700 text-white font-mono text-base font-semibold`}
        >
          9
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onButtonPress('del')}
          className={`${btnBase} bg-rose-950/60 text-rose-300 border border-rose-800/50 hover:bg-rose-900/60 font-semibold`}
        >
          ⌫ DEL
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onButtonPress('ac')}
          className={`${btnBase} bg-red-600 text-white hover:bg-red-500 font-bold shadow-red-600/30`}
        >
          AC
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onButtonPress('(')}
          className={`${btnBase} bg-slate-800/80 text-slate-300 hover:bg-slate-700 font-mono`}
        >
          (
        </button>
      </div>

      {/* Row 5: Digits (4 5 6), ×, ÷, ) */}
      <div className="grid grid-cols-6 gap-1.5">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onButtonPress('4')}
          className={`${btnBase} bg-slate-800 hover:bg-slate-700 text-white font-mono text-base font-semibold`}
        >
          4
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onButtonPress('5')}
          className={`${btnBase} bg-slate-800 hover:bg-slate-700 text-white font-mono text-base font-semibold`}
        >
          5
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onButtonPress('6')}
          className={`${btnBase} bg-slate-800 hover:bg-slate-700 text-white font-mono text-base font-semibold`}
        >
          6
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onButtonPress('*')}
          className={`${btnBase} bg-cyan-950/60 text-cyan-300 border border-cyan-800/50 hover:bg-cyan-900/60 font-mono text-lg font-bold`}
        >
          ×
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onButtonPress('/')}
          className={`${btnBase} bg-cyan-950/60 text-cyan-300 border border-cyan-800/50 hover:bg-cyan-900/60 font-mono text-lg font-bold`}
        >
          ÷
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onButtonPress(')')}
          className={`${btnBase} bg-slate-800/80 text-slate-300 hover:bg-slate-700 font-mono`}
        >
          )
        </button>
      </div>

      {/* Row 6: Digits (1 2 3), +, −, π */}
      <div className="grid grid-cols-6 gap-1.5">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onButtonPress('1')}
          className={`${btnBase} bg-slate-800 hover:bg-slate-700 text-white font-mono text-base font-semibold`}
        >
          1
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onButtonPress('2')}
          className={`${btnBase} bg-slate-800 hover:bg-slate-700 text-white font-mono text-base font-semibold`}
        >
          2
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onButtonPress('3')}
          className={`${btnBase} bg-slate-800 hover:bg-slate-700 text-white font-mono text-base font-semibold`}
        >
          3
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onButtonPress('+')}
          className={`${btnBase} bg-cyan-950/60 text-cyan-300 border border-cyan-800/50 hover:bg-cyan-900/60 font-mono text-lg font-bold`}
        >
          +
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onButtonPress('-')}
          className={`${btnBase} bg-cyan-950/60 text-cyan-300 border border-cyan-800/50 hover:bg-cyan-900/60 font-mono text-lg font-bold`}
        >
          −
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onButtonPress('pi')}
          className={`${btnBase} bg-slate-800/80 text-amber-300 hover:bg-slate-700 font-mono`}
        >
          π
        </button>
      </div>

      {/* Row 7: 0, ., e, Ans, = */}
      <div className="grid grid-cols-6 gap-1.5">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onButtonPress('0')}
          className={`${btnBase} bg-slate-800 hover:bg-slate-700 text-white font-mono text-base font-semibold`}
        >
          0
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onButtonPress('.')}
          className={`${btnBase} bg-slate-800 hover:bg-slate-700 text-white font-mono text-base font-bold`}
        >
          .
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onButtonPress('e')}
          className={`${btnBase} bg-slate-800/80 text-amber-300 hover:bg-slate-700 font-mono`}
        >
          e
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onButtonPress('ans')}
          className={`${btnBase} bg-slate-800 text-indigo-300 hover:bg-slate-700 font-mono text-xs font-semibold`}
        >
          Ans
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onButtonPress('=')}
          className={`${btnBase} col-span-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono text-xl font-bold shadow-lg shadow-emerald-700/30`}
        >
          =
        </button>
      </div>
    </div>
  );
};
