import React, { useState, useEffect, useMemo } from 'react';
import {
  Sliders,
  RefreshCw,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Minus,
  CheckCircle,
  AlertTriangle,
  Info,
  RotateCcw,
} from 'lucide-react';
import RadialConfidenceRing from './RadialConfidenceRing';
import { formatProbability, getRiskColor } from '../utils/helpers';
import whatIfService from '../services/whatIfService';
import toast from 'react-hot-toast';

// Disease-specific actionable feature definitions matching model_config.yaml
const ACTIONABLE_SPECS = {
  heart: [
    { name: 'trestbps', label: 'Resting Blood Pressure', unit: 'mm Hg', min: 90, max: 200, step: 1, healthyTarget: 115 },
    { name: 'chol', label: 'Serum Cholesterol', unit: 'mg/dL', min: 120, max: 400, step: 5, healthyTarget: 190 },
    { name: 'thalach', label: 'Maximum Heart Rate', unit: 'bpm', min: 70, max: 210, step: 1, healthyTarget: 165 },
    { name: 'oldpeak', label: 'ST Depression (Oldpeak)', unit: 'mm', min: 0.0, max: 6.0, step: 0.1, healthyTarget: 0.0 },
  ],
  diabetes: [
    { name: 'Glucose', label: 'Fasting Blood Glucose', unit: 'mg/dL', min: 60, max: 300, step: 1, healthyTarget: 95 },
    { name: 'BloodPressure', label: 'Diastolic Blood Pressure', unit: 'mm Hg', min: 50, max: 130, step: 1, healthyTarget: 72 },
    { name: 'BMI', label: 'Body Mass Index (BMI)', unit: 'kg/m²', min: 15.0, max: 55.0, step: 0.1, healthyTarget: 22.5 },
    { name: 'Insulin', label: '2-Hour Serum Insulin', unit: 'μU/mL', min: 15, max: 400, step: 5, healthyTarget: 75 },
    { name: 'SkinThickness', label: 'Triceps Skin Fold', unit: 'mm', min: 5, max: 60, step: 1, healthyTarget: 20 },
  ],
  liver: [
    { name: 'Total_Bilirubin', label: 'Total Bilirubin', unit: 'mg/dL', min: 0.2, max: 15.0, step: 0.1, healthyTarget: 0.8 },
    { name: 'Alamine_Aminotransferase', label: 'Alanine Aminotransferase (ALT)', unit: 'IU/L', min: 10, max: 400, step: 1, healthyTarget: 28 },
    { name: 'Aspartate_Aminotransferase', label: 'Aspartate Aminotransferase (AST)', unit: 'IU/L', min: 10, max: 400, step: 1, healthyTarget: 25 },
    { name: 'Total_Protiens', label: 'Total Proteins', unit: 'g/dL', min: 3.0, max: 10.0, step: 0.1, healthyTarget: 7.2 },
    { name: 'Albumin', label: 'Albumin', unit: 'g/dL', min: 1.5, max: 6.0, step: 0.1, healthyTarget: 4.2 },
  ],
  parkinsons: [
    { name: 'MDVP:Jitter(%)', label: 'Vocal Jitter (%)', unit: '%', min: 0.001, max: 0.04, step: 0.001, healthyTarget: 0.003 },
    { name: 'MDVP:Shimmer', label: 'Vocal Shimmer', unit: 'ratio', min: 0.005, max: 0.15, step: 0.005, healthyTarget: 0.02 },
    { name: 'HNR', label: 'Harmonics-to-Noise Ratio', unit: 'dB', min: 5.0, max: 35.0, step: 0.5, healthyTarget: 25.0 },
  ],
};

const IMMUTABLE_LABELS = {
  heart: 'Age, Sex, Chest Pain Type (cp), Resting ECG, Exercise Angina, ST Slope, Fluoroscopy (ca), Thalassemia',
  diabetes: 'Age, Pregnancies, Diabetes Pedigree Function',
  liver: 'Age, Biological Gender',
  parkinsons: 'Fundamental & Pitch Frequencies (Fo/Fhi/Flo), Vocal Dynamics (RPDE, DFA, PPE, D2, spread1/2)',
};

export default function WhatIfPanel({
  disease = 'heart',
  originalInputs,
  baselineInputs,
  baselineProbability,
  currentProbability: currentProbProp,
  patientInfo,
  fields = [],
  className = '',
}) {
  const diseaseKey = (disease || 'heart').toLowerCase().trim();

  // Safely normalize input props — avoid undefined property access
  const safeOriginalInputs = useMemo(() => {
    return originalInputs || baselineInputs || {};
  }, [originalInputs, baselineInputs]);

  const safeBaselineProb = useMemo(() => {
    const raw = baselineProbability ?? currentProbProp ?? 0;
    const num = typeof raw === 'number' ? raw : parseFloat(raw);
    return isNaN(num) ? 0 : Math.max(0, Math.min(1, num));
  }, [baselineProbability, currentProbProp]);

  // State: modified inputs, simulation result, loading, error
  const [modifiedInputs, setModifiedInputs] = useState({});
  const [simulationResult, setSimulationResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simError, setSimError] = useState(null);

  // Sync state whenever disease or original inputs change
  useEffect(() => {
    setModifiedInputs({ ...safeOriginalInputs });
    setSimulationResult(null);
    setSimError(null);
  }, [diseaseKey, safeOriginalInputs]);

  // Resolve actionable fields: prefer configured specs, fall back to dynamically detected fields
  const actionableFields = useMemo(() => {
    if (fields && fields.length > 0) return fields;

    const specs = ACTIONABLE_SPECS[diseaseKey];
    if (specs && specs.length > 0) {
      return specs.map((spec) => {
        const origVal = safeOriginalInputs[spec.name];
        const numVal = origVal !== undefined ? Number(origVal) : spec.healthyTarget;
        return {
          ...spec,
          defaultValue: numVal,
        };
      });
    }

    // Dynamic fallback for any unlisted fields
    return Object.keys(safeOriginalInputs)
      .filter((k) => !['age', 'sex', 'gender', 'patientid', 'fullname', 'name'].includes(k.toLowerCase()))
      .map((k) => {
        const val = Number(safeOriginalInputs[k]) || 0;
        return {
          name: k,
          label: k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          defaultValue: val,
          min: val > 10 ? Math.floor(val * 0.4) : 0,
          max: val > 10 ? Math.ceil(val * 1.8) : val > 1 ? Math.ceil(val * 2.5) : 5,
          step: val > 10 ? 1 : 0.05,
          unit: '',
        };
      });
  }, [diseaseKey, safeOriginalInputs, fields]);

  // Handle slider modifications
  const handleSliderChange = (name, value) => {
    const num = Number(value);
    setModifiedInputs((prev) => ({
      ...prev,
      [name]: num,
    }));
    // Clear previous simulation result to indicate dirty state
    setSimulationResult(null);
    setSimError(null);
  };

  // Reset to original patient baseline values
  const handleReset = () => {
    setModifiedInputs({ ...safeOriginalInputs });
    setSimulationResult(null);
    setSimError(null);
    toast.success('Biomarkers reset to original patient baseline.');
  };

  // Run genuine counterfactual ML simulation
  const handleRunSimulation = async () => {
    setIsSimulating(true);
    setSimError(null);
    try {
      const res = await whatIfService.simulate(diseaseKey, safeOriginalInputs, modifiedInputs);
      setSimulationResult(res);
      toast.success('Counterfactual scenario evaluated successfully!');
    } catch (err) {
      const errMsg = err?.message || 'Counterfactual simulation failed. Please review input ranges.';
      setSimError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsSimulating(false);
    }
  };

  // Computed display values from genuine inference
  const simulatedProb = simulationResult
    ? (simulationResult.modifiedProbability ?? simulationResult.counterfactual_probability ?? safeBaselineProb)
    : safeBaselineProb;

  const delta = simulationResult ? simulationResult.delta : 0;
  const deltaPct = simulationResult ? simulationResult.deltaPercent : 0;
  const isReduced = delta < 0;
  const isIncreased = delta > 0;

  // Track which fields have been modified from baseline
  const modifiedEntries = useMemo(() => {
    return actionableFields
      .map((f) => {
        const orig = safeOriginalInputs[f.name];
        const mod = modifiedInputs[f.name];
        const origNum = orig !== undefined ? Number(orig) : f.defaultValue;
        const modNum = mod !== undefined ? Number(mod) : f.defaultValue;
        const changed = Math.abs(origNum - modNum) > 0.0001;
        return {
          ...f,
          origNum,
          modNum,
          changed,
          diff: modNum - origNum,
        };
      })
      .filter((item) => item.changed);
  }, [actionableFields, safeOriginalInputs, modifiedInputs]);

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Counterfactual What-If Risk Simulator
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Evaluates how targeted clinical modifications alter patient probability using the validated {diseaseKey.toUpperCase()} model.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleReset}
            disabled={isSimulating}
            className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Reset Baseline
          </button>
          <button
            onClick={handleRunSimulation}
            disabled={isSimulating}
            className="inline-flex items-center px-4 py-1.5 text-xs font-semibold rounded-xl text-white bg-teal-600 hover:bg-teal-700 transition disabled:opacity-50 shadow-sm"
          >
            {isSimulating ? 'Evaluating ML Model...' : 'Run Simulation'}
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </button>
        </div>
      </div>

      {/* Comparison Scoreboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
        {/* Baseline Risk Ring */}
        <div className="flex flex-col items-center text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Patient Baseline Risk
          </span>
          <RadialConfidenceRing
            probability={safeBaselineProb}
            size={120}
            strokeWidth={10}
            showSubtext={false}
          />
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-2">
            Initial Clinical Intake
          </span>
        </div>

        {/* Delta Indicator */}
        <div className="flex flex-col items-center justify-center text-center space-y-2 border-y md:border-y-0 md:border-x border-slate-200 dark:border-slate-700 py-4 md:py-0">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Counterfactual Delta
          </span>
          <div className="flex items-center space-x-2">
            {isReduced ? (
              <TrendingDown className="w-7 h-7 text-emerald-500" />
            ) : isIncreased ? (
              <TrendingUp className="w-7 h-7 text-rose-500" />
            ) : (
              <Minus className="w-6 h-6 text-slate-400" />
            )}
            <span
              className={`text-2xl font-extrabold font-mono ${
                isReduced
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : isIncreased
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {deltaPct > 0 ? `+${deltaPct}%` : `${deltaPct}%`}
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
            {simulationResult?.summary || (
              modifiedEntries.length > 0
                ? `${modifiedEntries.length} parameter(s) modified. Click "Run Simulation" to evaluate model trajectory.`
                : 'Adjust actionable biometric sliders below to test targeted clinical interventions.'
            )}
          </p>
        </div>

        {/* Simulated Risk Ring */}
        <div className="flex flex-col items-center text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Post-Intervention Projection
          </span>
          <RadialConfidenceRing
            probability={simulatedProb}
            size={120}
            strokeWidth={10}
            showSubtext={false}
          />
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-2">
            {simulationResult ? 'Simulated Model Output' : 'Baseline (Unmodified)'}
          </span>
        </div>
      </div>

      {/* Error Message if Simulation Failed */}
      {simError && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3 text-xs text-red-700 dark:text-red-300">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
          <div className="space-y-1">
            <strong>Simulation Failed:</strong>
            <p>{simError}</p>
          </div>
        </div>
      )}

      {/* Parkinson's Voice Advisory Warning */}
      {diseaseKey === 'parkinsons' && (
        <div className="p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 rounded-xl flex items-start gap-2.5 text-xs text-purple-900 dark:text-purple-300">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-600 dark:text-purple-400" />
          <p>
            <strong>Biomedical Acoustic Parameter Notice:</strong> Parkinson's voice measurements
            are acoustic phonatory features and may not be directly modifiable through voluntary patient action.
            This simulation explores model sensitivity and feature behavior only.
          </p>
        </div>
      )}

      {/* Actionable Biomarker Sliders */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Actionable Clinical Biomarkers ({actionableFields.length})
          </h4>
          <span className="text-xs text-slate-400">Drag sliders to test treatment scenarios</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {actionableFields.map((field) => {
            const orig = safeOriginalInputs[field.name];
            const origVal = orig !== undefined ? Number(orig) : field.defaultValue;
            const currentVal = modifiedInputs[field.name] !== undefined ? modifiedInputs[field.name] : origVal;
            const hasChanged = Math.abs(currentVal - origVal) > 0.0001;

            return (
              <div
                key={field.name}
                className={`p-3.5 rounded-xl border transition ${
                  hasChanged
                    ? 'border-teal-400 dark:border-teal-700 bg-teal-50/50 dark:bg-teal-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800'
                }`}
              >
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="font-semibold text-slate-850 dark:text-slate-200 truncate pr-2">
                    {field.label}
                  </span>
                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {currentVal} {field.unit || ''}
                    </span>
                    {hasChanged && (
                      <span className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">
                        (baseline: {origVal})
                      </span>
                    )}
                  </div>
                </div>

                <input
                  type="range"
                  min={field.min ?? 0}
                  max={field.max ?? 200}
                  step={field.step ?? 1}
                  value={currentVal}
                  onChange={(e) => handleSliderChange(field.name, e.target.value)}
                  className="w-full accent-teal-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                />

                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>Min: {field.min} {field.unit}</span>
                  {field.healthyTarget !== undefined && field.healthyTarget !== null && (
                    <span className="text-teal-600 dark:text-teal-400 font-medium">
                      Target: {field.healthyTarget} {field.unit}
                    </span>
                  )}
                  <span>Max: {field.max} {field.unit}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Immutable Demographic & Biological Baseline Factors */}
      <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs space-y-1">
        <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
          Immutable Baseline Parameters (Locked)
        </span>
        <p className="text-slate-500 dark:text-slate-400">
          The following features cannot be modified in counterfactual scenarios because they represent fixed biological, demographic, or structural baselines:
        </p>
        <p className="font-medium text-slate-600 dark:text-slate-300 pt-0.5">
          {IMMUTABLE_LABELS[diseaseKey] || 'Age, Biological Sex'}
        </p>
      </div>

      {/* Impact Ranking Bar Chart if simulation completed */}
      {simulationResult?.impactRanking && simulationResult.impactRanking.length > 0 && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Marginal Intervention Impact (Individual Parameter Contribution)
          </h4>
          <div className="space-y-2">
            {simulationResult.impactRanking.map((rank, i) => {
              const score = rank.impactScore ?? rank.marginal_pct_change ?? 0;
              const isGood = score < 0;
              return (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700 dark:text-slate-300 w-1/3 truncate">
                    {rank.feature || rank.display_name}
                  </span>
                  <div className="flex-1 mx-3 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isGood ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      style={{ width: `${Math.min(100, Math.abs(score) * 4)}%` }}
                    />
                  </div>
                  <span className={`font-mono font-bold w-16 text-right ${isGood ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {score > 0 ? `+${score}%` : `${score}%`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Medical Disclaimer */}
      <div className="flex items-start space-x-2 text-xs text-slate-500 dark:text-slate-400 bg-amber-50/50 dark:bg-amber-950/20 p-3.5 rounded-xl border border-amber-200/50 dark:border-amber-900/30">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          {simulationResult?.disclaimer ||
            'What-If results are simulated educational estimates. They do not guarantee that changing a clinical value will change an actual medical outcome. Always consult a qualified doctor for diagnosis, treatment, or medication decisions.'}
        </span>
      </div>
    </div>
  );
}
