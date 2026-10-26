import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  GitMerge,
  Activity,
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Sliders,
  UserCheck,
  RefreshCw,
  Heart,
  Droplet,
  Shield,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import CrossRiskRadarChart from '../components/CrossRiskRadarChart';
import { crossRiskService } from '../services/crossRiskService';
import toast from 'react-hot-toast';

const CLINICAL_DISEASES = [
  {
    key: 'heart',
    label: 'Cardiovascular Disease',
    shortLabel: 'Heart',
    path: '/predict/heart',
    icon: Heart,
    color: 'red',
  },
  {
    key: 'diabetes',
    label: 'Type 2 Diabetes Mellitus',
    shortLabel: 'Diabetes',
    path: '/predict/diabetes',
    icon: Droplet,
    color: 'blue',
  },
  {
    key: 'liver',
    label: 'Hepatic / Liver Disease',
    shortLabel: 'Liver',
    path: '/predict/liver',
    icon: Shield,
    color: 'amber',
  },
  {
    key: 'parkinsons',
    label: "Parkinson's Disease (Voice Acoustic)",
    shortLabel: "Parkinson's",
    path: '/predict/parkinsons',
    icon: Zap,
    color: 'purple',
  },
];

export default function CrossRiskPage() {
  // Mode: 'patient' (Real patient ML predictions) or 'simulation' (Interactive demo sliders)
  const [activeMode, setActiveMode] = useState('patient');

  // Real patient predictions loaded from diagnostic history
  const [patientPredictions, setPatientPredictions] = useState({});
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Simulation slider values (Demo controls)
  const [simValues, setSimValues] = useState({
    heart: 0.72,
    diabetes: 0.68,
    liver: 0.61,
    parkinsons: 0.22,
  });

  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  // Load real patient predictions from localStorage history
  const loadPatientPredictions = useCallback(() => {
    try {
      const historyStr = localStorage.getItem('clinical_prediction_history');
      if (historyStr) {
        const historyList = JSON.parse(historyStr);
        if (Array.isArray(historyList)) {
          const latestMap = {};
          // History is stored most-recent first
          historyList.forEach((item) => {
            const rawKey = (item.disease || item.disease_type || '').toLowerCase().trim();
            let key = rawKey;
            if (rawKey.includes('heart')) key = 'heart';
            else if (rawKey.includes('diabet')) key = 'diabetes';
            else if (rawKey.includes('liver')) key = 'liver';
            else if (rawKey.includes('parkinson')) key = 'parkinsons';

            if (CLINICAL_DISEASES.some((d) => d.key === key) && !latestMap[key]) {
              latestMap[key] = {
                disease: key,
                probability: typeof item.probability === 'number' ? item.probability : parseFloat(item.probability) || 0,
                risk_level: item.risk_level || (item.probability >= 0.6 ? 'High' : item.probability >= 0.3 ? 'Moderate' : 'Low'),
                predicted_class: item.prediction !== undefined ? item.prediction : (item.probability >= 0.5 ? 1 : 0),
                modelName: item.model_used || item.modelName || 'Validated Clinical ML',
                timestamp: item.timestamp || null,
              };
            }
          });
          setPatientPredictions(latestMap);
        }
      }
    } catch (e) {
      console.warn('Failed to parse clinical prediction history', e);
    } finally {
      setHistoryLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadPatientPredictions();
  }, [loadPatientPredictions]);

  // Count available real patient predictions
  const availablePatientCount = useMemo(() => {
    return Object.keys(patientPredictions).length;
  }, [patientPredictions]);

  // Handle simulation slider changes
  const handleSliderChange = (disease, val) => {
    setSimValues((prev) => ({
      ...prev,
      [disease]: parseFloat(val),
    }));
    setAnalysis(null);
    setError(null);
  };

  // Run analysis for either Real Patient mode or Simulation mode
  const handleRunAnalysis = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      let predictionsList = [];

      if (activeMode === 'patient') {
        // Collect ONLY valid available patient predictions — do NOT fabricate missing ones
        predictionsList = Object.values(patientPredictions).map((p) => ({
          disease: p.disease,
          probability: p.probability,
          risk_level: p.risk_level,
          predicted_class: p.predicted_class,
        }));

        if (predictionsList.length === 0) {
          throw new Error(
            'No genuine patient predictions found. Please complete at least one disease evaluation or switch to Simulation Mode.'
          );
        }
      } else {
        // Simulation mode: build predictions from sliders
        predictionsList = Object.entries(simValues).map(([disease, prob]) => ({
          disease,
          probability: prob,
          risk_level: prob >= 0.6 ? 'High' : prob >= 0.3 ? 'Moderate' : 'Low',
          predicted_class: prob >= 0.5 ? 1 : 0,
        }));
      }

      const payload = { predictions: predictionsList };
      const result = await crossRiskService.analyze(payload);
      setAnalysis(result);
      toast.success(
        activeMode === 'patient'
          ? 'Real patient cross-risk analysis complete'
          : 'Multi-organ simulation complete'
      );
    } catch (err) {
      const msg = err?.message || 'Failed to complete cross-risk analysis.';
      setError(msg);
      toast.error(msg);
      console.error('[CrossRiskPage] Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const priorityLabel = analysis?.overall_priority || 'LOW';
  const isEmergency = priorityLabel === 'EMERGENCY';
  const isHigh = priorityLabel === 'HIGH';

  const primaryCluster =
    analysis?.primary_cluster ||
    analysis?.detected_clusters?.[0]?.cluster_name ||
    'Isolated / Sub-Threshold Profile';

  const specialist =
    analysis?.recommended_specialist ||
    analysis?.recommended_specialists?.join(', ') ||
    'Primary Care Physician';

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-900 to-cyan-950 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <GitMerge className="w-8 h-8 text-teal-300" />
            <h1 className="text-2xl font-bold tracking-tight">Multi-Disease Cross-Risk Engine</h1>
          </div>
          <p className="text-teal-100 text-sm max-w-2xl">
            Synthesizes cardiometabolic, hepato-metabolic, and neurodegenerative comorbidities to evaluate multi-organ clinical syndromic interactions.
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center bg-teal-950/70 p-1.5 rounded-xl border border-teal-700/50">
          <button
            onClick={() => {
              setActiveMode('patient');
              setAnalysis(null);
              setError(null);
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
              activeMode === 'patient'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-teal-200 hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Patient Clinical Profile
            {availablePatientCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-teal-800 text-teal-200">
                {availablePatientCount}/4
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveMode('simulation');
              setAnalysis(null);
              setError(null);
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
              activeMode === 'simulation'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-teal-200 hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Simulation Mode (Demo)
          </button>
        </div>
      </div>

      {/* Main Grid: Controls vs Analysis Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Data Input (Patient Mode vs Simulation Mode) */}
        <div className="lg:col-span-6 space-y-6">
          {activeMode === 'patient' ? (
            /* ── REAL PATIENT CLINICAL PROFILE ────────────────────────────────── */
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-teal-600" />
                    Genuine Patient Predictions
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Sourced from completed diagnostic modules. Uncompleted diseases remain unavailable.
                  </p>
                </div>
                <button
                  onClick={loadPatientPredictions}
                  className="p-1.5 text-slate-400 hover:text-teal-600 transition"
                  title="Reload patient history"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {/* Disease Cards List */}
              <div className="space-y-3">
                {CLINICAL_DISEASES.map((d) => {
                  const pred = patientPredictions[d.key];
                  const Icon = d.icon;
                  const isAvailable = Boolean(pred);

                  return (
                    <div
                      key={d.key}
                      className={`p-3.5 rounded-xl border flex items-center justify-between transition ${
                        isAvailable
                          ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                          : 'bg-slate-50/50 dark:bg-slate-900/40 border-dashed border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                            isAvailable
                              ? 'bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {d.label}
                          </div>
                          {isAvailable ? (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              Risk Level: <strong className="text-slate-700 dark:text-slate-300">{pred.risk_level}</strong>
                              {pred.modelName && ` • ${pred.modelName}`}
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-400">
                              No inference completed for this patient
                            </div>
                          )}
                        </div>
                      </div>

                      {isAvailable ? (
                        <div className="text-right">
                          <span
                            className={`font-mono font-bold text-sm px-2.5 py-1 rounded-lg ${
                              pred.probability >= 0.6
                                ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                                : pred.probability >= 0.3
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            }`}
                          >
                            {(pred.probability * 100).toFixed(1)}%
                          </span>
                        </div>
                      ) : (
                        <Link
                          to={d.path}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900 transition"
                        >
                          Evaluate <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>

              {availablePatientCount === 0 ? (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    No Patient Predictions Found
                  </div>
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    To run cross-risk analysis on genuine patient data, execute risk predictions in the
                    individual disease modules, or switch to <strong>Simulation Mode</strong> above to experiment with hypothetical risk levels.
                  </p>
                </div>
              ) : availablePatientCount < 2 ? (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 rounded-xl text-xs text-blue-800 dark:text-blue-300">
                  <strong>Notice:</strong> Only 1 disease prediction is currently recorded. Cross-risk syndromic analysis produces richer interaction findings when at least 2 organ modules are evaluated.
                </div>
              ) : null}

              <button
                onClick={handleRunAnalysis}
                disabled={loading || availablePatientCount === 0}
                className="w-full py-3 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {loading ? 'Evaluating Syndromic Patterns...' : `Analyze Patient Cross-Risk (${availablePatientCount} Available)`}
              </button>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl text-xs text-red-700 dark:text-red-300">
                  <strong>Error:</strong> {error}
                </div>
              )}
            </div>
          ) : (
            /* ── INTERACTIVE SIMULATION MODE ──────────────────────────────────── */
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-amber-200 dark:border-amber-900/40 shadow-sm space-y-6">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 mb-2">
                  <Sliders className="w-3.5 h-3.5" />
                  Demonstration & Sensitivity Simulation
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Simulate Organ Risk Probabilities
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Adjust simulated risk probabilities manually to observe cross-organ syndromic interactions and referral logic.
                  <strong className="text-amber-700 dark:text-amber-400"> These are manual demonstration values, not patient ML inferences.</strong>
                </p>
              </div>

              {/* Sliders */}
              <div className="space-y-4">
                {CLINICAL_DISEASES.map((d) => {
                  const val = simValues[d.key];
                  return (
                    <div key={d.key} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-700 dark:text-slate-300">{d.label}</span>
                        <span className="font-mono text-amber-600 dark:text-amber-400">
                          {(val * 100).toFixed(0)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.0"
                        max="1.0"
                        step="0.02"
                        value={val}
                        onChange={(e) => handleSliderChange(d.key, e.target.value)}
                        className="w-full accent-amber-600"
                      />
                    </div>
                  );
                })}
              </div>

              <button
                onClick={handleRunAnalysis}
                disabled={loading}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {loading ? 'Evaluating Syndromic Synergies...' : 'Run Multi-Disease Cross-Risk Analysis (Simulation)'}
              </button>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl text-xs text-red-700 dark:text-red-300">
                  <strong>Error:</strong> {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Syndromic Diagnostic Output & Radar Chart */}
        <div className="lg:col-span-6 space-y-6">
          {analysis ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              {/* Header with Priority Badge */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Syndromic Cluster Diagnostic
                  </h3>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {activeMode === 'patient' ? 'Patient Clinical Assessment' : 'Simulated Profile Assessment'}
                  </div>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    isEmergency
                      ? 'bg-red-600 text-white'
                      : isHigh
                      ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                      : priorityLabel === 'MEDIUM'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                  }`}
                >
                  {priorityLabel} PRIORITY
                </span>
              </div>

              {/* Primary Syndrome Cluster Banner */}
              <div className="p-4 bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/40 rounded-xl space-y-1.5">
                <span className="text-[10px] font-bold text-teal-800 dark:text-teal-300 uppercase tracking-wider">
                  Identified Syndrome Pattern
                </span>
                <p className="text-base font-bold text-teal-950 dark:text-teal-100">
                  {primaryCluster}
                </p>
                <div className="text-xs text-teal-900 dark:text-teal-200 pt-0.5">
                  <strong>Referral Specialist:</strong> {specialist}
                </div>
              </div>

              {/* Radar Chart Component */}
              <CrossRiskRadarChart
                data={analysis.radar_chart_data}
                scores={analysis.scores}
                missingDiseases={analysis.missing_diseases}
                cluster={primaryCluster}
              />

              {/* Detected Comorbid Clusters */}
              {analysis.detected_clusters && analysis.detected_clusters.length > 0 && (
                <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Detected Syndromic Clusters ({analysis.detected_clusters.length})
                  </h4>
                  {analysis.detected_clusters.map((cl, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {cl.cluster_name}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            cl.priority === 'EMERGENCY' || cl.severity === 'HIGH' || cl.priority === 'HIGH'
                              ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {cl.priority || cl.severity}
                        </span>
                      </div>
                      {cl.description && (
                        <p className="text-slate-600 dark:text-slate-400 text-[11px]">{cl.description}</p>
                      )}
                      {cl.specialist && (
                        <p className="text-slate-700 dark:text-slate-300 text-[11px]">
                          <strong>Recommended Specialist:</strong> {cl.specialist}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Coordinated Recommendations */}
              {analysis.coordinated_recommendations && analysis.coordinated_recommendations.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Coordinated Clinical Recommendations
                  </h4>
                  <ul className="space-y-1.5">
                    {analysis.coordinated_recommendations.map((rec, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 mt-0.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Missing Diseases Guidance */}
              {analysis.missing_diseases && analysis.missing_diseases.length > 0 && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl space-y-1 text-xs">
                  <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    Unevaluated Clinical Modules ({analysis.missing_diseases.length})
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    The following organ domains have not been evaluated for this profile. Values remain unavailable rather than assumed to be zero:
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {analysis.missing_diseases.map((m) => (
                      <Link
                        key={m.disease}
                        to={`/predict/${m.disease}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-teal-700 dark:text-teal-300 hover:bg-slate-50"
                      >
                        Run {m.display_name} <ExternalLink className="w-2.5 h-2.5" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Medical Disclaimer */}
              <p className="text-[10px] text-slate-400 dark:text-slate-500 italic border-t border-slate-100 dark:border-slate-800 pt-3">
                {analysis.disclaimer || analysis.medical_disclaimer}
              </p>
            </div>
          ) : (
            /* Awaiting Execution Placeholder */
            <div className="bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center space-y-3">
              <ShieldAlert className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Awaiting Cross-Risk Execution
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {activeMode === 'patient'
                  ? 'Click "Analyze Patient Cross-Risk" to evaluate syndromic clustering and triage priorities from available patient diagnostic results.'
                  : 'Click "Run Multi-Disease Cross-Risk Analysis (Simulation)" to simulate multi-organ syndromic interactions using the sliders.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
