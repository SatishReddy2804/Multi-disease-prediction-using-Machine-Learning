import React, { useState } from 'react';

export default function ConfusionMatrix({
  tp = 142,
  tn = 138,
  fp = 18,
  fn = 12,
  modelName = 'Best Ensemble (RandomForest + XGBoost)',
  className = '',
}) {
  const [hoveredCell, setHoveredCell] = useState(null);

  const total = tp + tn + fp + fn;
  const accuracy = total > 0 ? (((tp + tn) / total) * 100).toFixed(1) : '0.0';
  const sensitivity = tp + fn > 0 ? ((tp / (tp + fn)) * 100).toFixed(1) : '0.0'; // Recall
  const specificity = tn + fp > 0 ? ((tn / (tn + fp)) * 100).toFixed(1) : '0.0';
  const precision = tp + fp > 0 ? ((tp / (tp + fp)) * 100).toFixed(1) : '0.0';
  const f1 = (2 * (Number(precision) * Number(sensitivity)) / (Number(precision) + Number(sensitivity))).toFixed(1);

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-soft ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-slate-850 dark:text-slate-100">
            Interactive Confusion Matrix
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Validation cohort performance ({modelName})
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
          N = {total} samples
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Matrix Grid */}
        <div className="relative">
          <div className="text-[11px] font-bold text-center uppercase tracking-wider text-slate-400 mb-2">
            Predicted Class
          </div>

          <div className="flex">
            {/* Left Vertical Label */}
            <div className="flex items-center justify-center -rotate-90 text-[11px] font-bold uppercase tracking-wider text-slate-400 w-6">
              Actual
            </div>

            {/* Matrix 2x2 cells */}
            <div className="grid grid-cols-2 gap-2 flex-1">
              {/* True Positive */}
              <div
                onMouseEnter={() => setHoveredCell('tp')}
                onMouseLeave={() => setHoveredCell(null)}
                className={`p-4 rounded-xl border transition cursor-pointer text-center ${
                  hoveredCell === 'tp' ? 'ring-2 ring-emerald-500 shadow-md' : ''
                } bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800`}
              >
                <span className="text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-300 block">
                  True Positive (TP)
                </span>
                <span className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 block my-0.5">
                  {tp}
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-500">
                  {(((tp) / total) * 100).toFixed(1)}% of total
                </span>
              </div>

              {/* False Negative */}
              <div
                onMouseEnter={() => setHoveredCell('fn')}
                onMouseLeave={() => setHoveredCell(null)}
                className={`p-4 rounded-xl border transition cursor-pointer text-center ${
                  hoveredCell === 'fn' ? 'ring-2 ring-red-500 shadow-md' : ''
                } bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800`}
              >
                <span className="text-[10px] font-bold uppercase text-rose-800 dark:text-rose-300 block">
                  False Negative (FN)
                </span>
                <span className="text-2xl font-extrabold text-rose-700 dark:text-rose-400 block my-0.5">
                  {fn}
                </span>
                <span className="text-[11px] text-rose-600 dark:text-rose-500">
                  {(((fn) / total) * 100).toFixed(1)}% (Missed)
                </span>
              </div>

              {/* False Positive */}
              <div
                onMouseEnter={() => setHoveredCell('fp')}
                onMouseLeave={() => setHoveredCell(null)}
                className={`p-4 rounded-xl border transition cursor-pointer text-center ${
                  hoveredCell === 'fp' ? 'ring-2 ring-amber-500 shadow-md' : ''
                } bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800`}
              >
                <span className="text-[10px] font-bold uppercase text-amber-800 dark:text-amber-300 block">
                  False Positive (FP)
                </span>
                <span className="text-2xl font-extrabold text-amber-700 dark:text-amber-400 block my-0.5">
                  {fp}
                </span>
                <span className="text-[11px] text-amber-600 dark:text-amber-500">
                  {(((fp) / total) * 100).toFixed(1)}% (False Alarm)
                </span>
              </div>

              {/* True Negative */}
              <div
                onMouseEnter={() => setHoveredCell('tn')}
                onMouseLeave={() => setHoveredCell(null)}
                className={`p-4 rounded-xl border transition cursor-pointer text-center ${
                  hoveredCell === 'tn' ? 'ring-2 ring-emerald-500 shadow-md' : ''
                } bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800`}
              >
                <span className="text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-300 block">
                  True Negative (TN)
                </span>
                <span className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 block my-0.5">
                  {tn}
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-500">
                  {(((tn) / total) * 100).toFixed(1)}% of total
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Diagnostic Metrics Derived */}
        <div className="space-y-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium text-slate-600 dark:text-slate-400">Diagnostic Accuracy</span>
            <span className="font-bold text-slate-850 dark:text-slate-100">{accuracy}%</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium text-slate-600 dark:text-slate-400">Clinical Sensitivity (Recall)</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{sensitivity}%</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium text-slate-600 dark:text-slate-400">Specificity (True Negative Rate)</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">{specificity}%</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium text-slate-600 dark:text-slate-400">Positive Predictive Value (Precision)</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">{precision}%</span>
          </div>
          <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200 dark:border-slate-700">
            <span className="font-bold text-slate-700 dark:text-slate-300">F1 Harmonic Score</span>
            <span className="font-extrabold text-primary-600 dark:text-primary-400">{f1}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
