import React, { useState } from 'react';
import {
  FileText,
  Sliders,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Pill,
  Lightbulb,
  AlertOctagon,
  Activity,
  HeartPulse,
  Brain,
  Stethoscope,
  Share2,
} from 'lucide-react';
import RadialConfidenceRing from './RadialConfidenceRing';
import TrustShieldPanel from './TrustShieldPanel';
import MedicalDisclaimer from './MedicalDisclaimer';
import { DISEASE_CONFIGS } from '../utils/constants';
import { formatProbability, getRiskLevel } from '../utils/helpers';
import reportService from '../services/reportService';
import toast from 'react-hot-toast';

export default function PredictionCard({
  prediction,
  result,
  onOpenWhatIf,
  className = '',
}) {
  const [showPrevention, setShowPrevention] = useState(true);
  const [showMedicines, setShowMedicines] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const pred = prediction || result;
  if (!pred) return null;
  prediction = pred;

  const diseaseConfig = DISEASE_CONFIGS[prediction.disease] || {
    name: prediction.disease || 'Clinical Assessment',
    shortName: prediction.disease || 'Assessment',
    icon: 'Activity',
  };

  const risk = getRiskLevel(prediction.probability);

  const renderIcon = () => {
    switch (prediction.disease) {
      case 'heart':
        return <HeartPulse className="w-6 h-6 text-rose-500 animate-heartbeat" />;
      case 'diabetes':
        return <Activity className="w-6 h-6 text-blue-500" />;
      case 'parkinsons':
        return <Brain className="w-6 h-6 text-purple-500" />;
      case 'liver':
        return <Stethoscope className="w-6 h-6 text-emerald-500" />;
      default:
        return <Activity className="w-6 h-6 text-primary-500" />;
    }
  };

  const handleDownloadPdf = async () => {
    setIsExporting(true);
    try {
      const filename = await reportService.downloadPdf(prediction);
      toast.success(`Clinical PDF generated: ${filename}`);
    } catch (err) {
      toast.error('Failed to create PDF report.');
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-soft-lg p-6 lg:p-8 space-y-6 ${className}`}>
      {/* Card Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-750">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            {renderIcon()}
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Inference Outcome
            </span>
            <h2 className="text-xl font-bold text-slate-850 dark:text-slate-100">
              {diseaseConfig.name}
            </h2>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2.5">
          {onOpenWhatIf && (
            <button
              onClick={() => onOpenWhatIf(prediction)}
              className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900 transition border border-indigo-200 dark:border-indigo-800"
            >
              <Sliders className="w-4 h-4 mr-1.5" />
              Open What-If Simulator
            </button>
          )}

          <button
            onClick={handleDownloadPdf}
            disabled={isExporting}
            className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 transition shadow-sm disabled:opacity-50"
          >
            <FileText className="w-4 h-4 mr-1.5" />
            {isExporting ? 'Generating PDF...' : 'Download Clinical PDF'}
          </button>
        </div>
      </div>

      {/* Main Prediction Score Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Radial Gauge */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
          <RadialConfidenceRing
            probability={prediction.probability}
            size={170}
            strokeWidth={14}
            label="Calculated Risk"
          />
          <div className="mt-3 flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${risk.badgeClass}`}>
              {risk.label}
            </span>
          </div>
        </div>

        {/* Prediction Summary & Patient Details */}
        <div className="lg:col-span-8 space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex flex-wrap justify-between gap-3 text-xs">
            <div>
              <span className="text-slate-400 block">Patient / MRN</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {prediction.patient?.fullName || 'Not specified'} ({prediction.patient?.patientId || 'PT-ID'})
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Evaluated Model</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {prediction.modelName || 'Multi-model Stacking Ensemble'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Result Classification</span>
              <span className="font-bold text-slate-850 dark:text-slate-100">
                {prediction.predictionLabel}
              </span>
            </div>
          </div>

          {/* Red Flag Alerts (If Any) */}
          {prediction.redFlags && prediction.redFlags.length > 0 && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 space-y-1.5">
              <div className="flex items-center space-x-2 text-rose-700 dark:text-rose-300 font-bold text-xs uppercase tracking-wider">
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                <span>Clinical Red Flag Alerts Detected</span>
              </div>
              <ul className="text-xs text-rose-800 dark:text-rose-200 space-y-1 pl-5 list-disc">
                {prediction.redFlags.map((flag, idx) => (
                  <li key={idx}>{flag}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Cross Risk Alert (If Any) */}
          {prediction.crossRiskAlert && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-start space-x-2.5 text-xs text-amber-800 dark:text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Cross-System Comorbidity Warning</span>
                <span>{prediction.crossRiskAlert}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Trust Shield Panel */}
      <TrustShieldPanel trustShield={prediction.trustShield} />

      {/* Accordions: Prevention Tips & Medicine Info */}
      <div className="space-y-3">
        {/* Accordion 1: Prevention & Interventions */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <button
            onClick={() => setShowPrevention(!showPrevention)}
            className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-750 transition text-left"
          >
            <div className="flex items-center space-x-2.5">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Evidence-Based Preventive Protocols & Lifestyle Plan
              </span>
            </div>
            {showPrevention ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>
          {showPrevention && (
            <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                {(prediction.recommendations || []).map((tip, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Accordion 2: Pharmacological Reference */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <button
            onClick={() => setShowMedicines(!showMedicines)}
            className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-750 transition text-left"
          >
            <div className="flex items-center space-x-2.5">
              <Pill className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Pharmacological Considerations & Medical Class Reference
              </span>
            </div>
            {showMedicines ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>
          {showMedicines && (
            <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 space-y-3">
              <p className="text-[11px] text-slate-400 italic">
                * Informational reference for prescribing physicians only. Never initiate or alter dosages without direct patient examination.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(prediction.medications || []).map((med, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs">
                    <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200">
                      <span>{med.name}</span>
                      <span className="text-primary-600 dark:text-primary-400 font-mono text-[11px]">{med.dose}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{med.indication}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mandatory Regulatory Medical Disclaimer */}
      <MedicalDisclaimer compact={false} />
    </div>
  );
}
