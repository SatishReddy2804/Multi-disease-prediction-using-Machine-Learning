import React, { useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, Shield } from 'lucide-react';

export default function MedicalDisclaimer({ compact = false, className = '' }) {
  const [expanded, setExpanded] = useState(false);

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 py-2 ${className}`}>
        <Shield className="w-3.5 h-3.5 text-primary-500 shrink-0" />
        <span>For clinical investigational & triage decision-support only. Not a diagnostic substitute.</span>
      </div>
    );
  }

  return (
    <aside
      aria-label="Clinical Decision Support Disclaimer"
      className={`rounded-2xl border border-amber-200/80 bg-amber-50/70 dark:bg-amber-950/20 dark:border-amber-900/50 p-4 transition-all duration-200 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
              Clinical Decision Support Advisory
            </h4>
            <p className="mt-0.5 text-xs text-amber-800/90 dark:text-amber-300/80">
              This system uses statistical machine learning models trained on benchmark medical cohorts. Outputs are strictly intended for adjunctive clinician workflow triage and do not constitute an autonomous clinical diagnosis.
            </p>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 text-xs font-medium flex items-center shrink-0 p-1 rounded-lg hover:bg-amber-100/50"
        >
          {expanded ? 'Less info' : 'Regulatory info'}
          {expanded ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300/90 space-y-1.5">
          <p>
            • <strong>Physician Discretion:</strong> All therapeutic, prescriptive, and diagnostic decisions must be rendered by a licensed medical practitioner.
          </p>
          <p>
            • <strong>Emergency Protocols:</strong> If a patient exhibits acute unstable symptoms (e.g. crushing chest pain, dyspnea, acute neurological deficit), immediately initiate hospital emergency protocol.
          </p>
          <p>
            • <strong>Data Privacy:</strong> No protected health information (PHI) is shared with external third-party model providers.
          </p>
        </div>
      )}
    </aside>
  );
}
