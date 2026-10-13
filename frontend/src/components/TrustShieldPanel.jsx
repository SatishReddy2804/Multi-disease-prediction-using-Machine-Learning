import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, Cpu, CheckCircle2, HelpCircle } from 'lucide-react';
import { TRUST_STATUS } from '../utils/constants';

export default function TrustShieldPanel({ trustShield = {}, className = '' }) {
  const {
    dataQualityScore = 94,
    modelConfidence = 89,
    uncertaintyLevel = 11,
    modelAgreement = 95,
    oodStatus = 'IN_DISTRIBUTION',
    finalStatus = 'RELIABLE',
  } = trustShield;

  const currentStatusConfig = TRUST_STATUS[finalStatus] || TRUST_STATUS.RELIABLE;

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-soft ${className}`}>
      {/* Header with Final Decision Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-750">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-850 dark:text-slate-100">
              AI Trust Shield & Model Governance
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Real-time uncertainty quantification and distribution audit
            </p>
          </div>
        </div>

        {/* Final Status Badge */}
        <div className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 ${currentStatusConfig.badge}`}>
          {finalStatus === 'RELIABLE' && <CheckCircle2 className="w-3.5 h-3.5" />}
          {finalStatus === 'UNCERTAIN' && <AlertTriangle className="w-3.5 h-3.5" />}
          {finalStatus === 'OOD' && <ShieldAlert className="w-3.5 h-3.5" />}
          <span>{currentStatusConfig.label}</span>
        </div>
      </div>

      {/* Grid of Audit Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
        {/* Metric 1: Data Quality Gauge */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Data Quality</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">{dataQualityScore}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                dataQualityScore >= 80 ? 'bg-emerald-500' : dataQualityScore >= 60 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${dataQualityScore}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Completeness & Range</span>
        </div>

        {/* Metric 2: Model Confidence */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Model Confidence</span>
          <div className="flex items-baseline space-x-1">
            <span className="text-lg font-bold text-primary-600 dark:text-primary-400">{modelConfidence}%</span>
            <span className="text-xs text-slate-500 font-medium">calibrated</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">Ensemble posterior probability</span>
        </div>

        {/* Metric 3: Uncertainty Level */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Epistemic Uncertainty</span>
          <div className="flex items-baseline space-x-1">
            <span className={`text-lg font-bold ${uncertaintyLevel <= 15 ? 'text-emerald-600' : uncertaintyLevel <= 30 ? 'text-amber-600' : 'text-red-600'}`}>
              ±{uncertaintyLevel}%
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">Variance across estimators</span>
        </div>

        {/* Metric 4: OOD & Agreement */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">OOD Status</span>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {oodStatus === 'IN_DISTRIBUTION' ? 'Cohort Match' : 'Out-of-Bounds'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">Agreement: {modelAgreement}%</span>
        </div>
      </div>
    </div>
  );
}
