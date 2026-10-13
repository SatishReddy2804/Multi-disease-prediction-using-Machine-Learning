import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, FileCheck } from 'lucide-react';

export default function DataQualityMeter({
  completeness = 100,
  validity = 100,
  overallScore = 100,
  isReady = true,
  className = '',
}) {
  const getStatus = (score) => {
    if (score >= 85) return { color: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', label: 'Optimal Quality' };
    if (score >= 65) return { color: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', label: 'Acceptable' };
    return { color: 'bg-red-500', text: 'text-red-600 dark:text-red-400', label: 'Insufficient' };
  };

  const completenessStatus = getStatus(completeness);
  const validityStatus = getStatus(validity);
  const overallStatus = getStatus(overallScore);

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-soft ${className}`}>
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-primary-600">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-850 dark:text-slate-100">Clinical Data Quality Pre-Check</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">Parameter completeness & range integrity</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isReady ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              Inference Ready
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
              <AlertTriangle className="w-3.5 h-3.5 mr-1" />
              Incomplete Data
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        {/* Metric 1 */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-300">
            <span>Completeness</span>
            <span className={completenessStatus.text}>{completeness}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${completenessStatus.color}`}
              style={{ width: `${completeness}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400">All mandatory clinical biomarkers provided</p>
        </div>

        {/* Metric 2 */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-300">
            <span>Range Validity</span>
            <span className={validityStatus.text}>{validity}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${validityStatus.color}`}
              style={{ width: `${validity}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400">Parameters within biological boundary</p>
        </div>

        {/* Metric 3 */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-300">
            <span>Overall Integrity</span>
            <span className={overallStatus.text}>{overallScore}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${overallStatus.color}`}
              style={{ width: `${overallScore}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400">{overallStatus.label}</p>
        </div>
      </div>
    </div>
  );
}
