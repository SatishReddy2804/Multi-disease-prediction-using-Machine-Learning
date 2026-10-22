import React from 'react';
import { AlertCircle, CheckCircle, ArrowDown, ArrowUp } from 'lucide-react';
import { evaluateFeatureAnomaly } from '../utils/helpers';

export default function AnomalyStrip({ fields = [], values = {}, className = '' }) {
  if (!fields.length) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Physiological Range Audits & Anomaly Detection
        </h4>
        <span className="text-xs text-slate-400">Reference standard comparison</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
        {fields.map((field) => {
          const val = values[field.name];
          const anomaly = evaluateFeatureAnomaly(field, val);

          let badgeColor = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
          let Icon = CheckCircle;

          if (anomaly.status === 'normal') {
            badgeColor = 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60';
            Icon = CheckCircle;
          } else if (anomaly.status === 'high') {
            badgeColor = 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800/60';
            Icon = ArrowUp;
          } else if (anomaly.status === 'critical') {
            badgeColor = 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800/60';
            Icon = AlertCircle;
          } else if (anomaly.status === 'low') {
            badgeColor = 'bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800/60';
            Icon = ArrowDown;
          }

          return (
            <div
              key={field.name}
              className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition ${badgeColor}`}
            >
              <div className="truncate mr-2">
                <span className="font-semibold block truncate">{field.label}</span>
                <span className="text-[11px] opacity-80">
                  {val !== undefined && val !== '' ? `${val} ${field.unit || ''}` : 'Not provided'}
                </span>
              </div>
              <div className="flex items-center space-x-1 shrink-0 font-medium">
                <Icon className="w-3.5 h-3.5" />
                <span className="capitalize">{anomaly.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
