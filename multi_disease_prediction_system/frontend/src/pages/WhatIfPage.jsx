import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Sliders,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  UserCheck,
  Heart,
  Droplet,
  Shield,
  Zap,
  Clock,
  FileQuestion,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import WhatIfPanel from '../components/WhatIfPanel';

const DISEASE_CONFIGS = [
  {
    key: 'heart',
    label: 'Cardiovascular (Heart)',
    shortLabel: 'Heart',
    path: '/predict/heart',
    icon: Heart,
    color: 'red',
  },
  {
    key: 'diabetes',
    label: 'Type 2 Diabetes',
    shortLabel: 'Diabetes',
    path: '/predict/diabetes',
    icon: Droplet,
    color: 'blue',
  },
  {
    key: 'liver',
    label: 'Hepatic (Liver)',
    shortLabel: 'Liver',
    path: '/predict/liver',
    icon: Shield,
    color: 'amber',
  },
  {
    key: 'parkinsons',
    label: "Parkinson's Disease",
    shortLabel: "Parkinson's",
    path: '/predict/parkinsons',
    icon: Zap,
    color: 'purple',
  },
];

export default function WhatIfPage() {
  const location = useLocation();

  // Selected disease tab ('heart', 'diabetes', 'liver', 'parkinsons')
  const [selectedDisease, setSelectedDisease] = useState(() => {
    // Check if disease was passed in location state (e.g. from prediction page)
    if (location.state?.disease) {
      return location.state.disease.toLowerCase().trim();
    }
    return 'heart';
  });

  // Latest genuine predictions loaded from clinical prediction history
  const [patientRecords, setPatientRecords] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Load genuine patient prediction history from localStorage
  const loadClinicalHistory = useCallback(() => {
    try {
      const historyStr = localStorage.getItem('clinical_prediction_history');
      if (historyStr) {
        const historyList = JSON.parse(historyStr);
        if (Array.isArray(historyList)) {
          const map = {};
          // Find the most recent record for each disease
          historyList.forEach((item) => {
            const rawKey = (item.disease || item.disease_type || '').toLowerCase().trim();
            let key = rawKey;
            if (rawKey.includes('heart')) key = 'heart';
            else if (rawKey.includes('diabet')) key = 'diabetes';
            else if (rawKey.includes('liver')) key = 'liver';
            else if (rawKey.includes('parkinson')) key = 'parkinsons';

            if (DISEASE_CONFIGS.some((d) => d.key === key) && !map[key] && item.inputs) {
              const prob = typeof item.probability === 'number' ? item.probability : parseFloat(item.probability) || 0;
              map[key] = {
                disease: key,
                probability: prob,
                risk_level: item.risk_level || (prob >= 0.6 ? 'High' : prob >= 0.3 ? 'Moderate' : 'Low'),
                prediction: item.prediction !== undefined ? item.prediction : (prob >= 0.5 ? 1 : 0),
                inputs: item.inputs,
                patient: item.patient || {},
                model_used: item.model_used || item.modelName || 'Validated Clinical ML',
                timestamp: item.timestamp || null,
              };
            }
          });
          setPatientRecords(map);

          // If location state provided a disease with inputs, use that directly
          if (location.state?.inputs && location.state?.disease) {
            const locKey = location.state.disease.toLowerCase().trim();
            map[locKey] = {
              disease: locKey,
              probability: location.state.probability ?? 0.5,
              risk_level: location.state.risk_level || 'Evaluated',
              inputs: location.state.inputs,
              patient: location.state.patient || {},
              model_used: location.state.model_used || 'Current In-Memory Session',
              timestamp: new Date().toISOString(),
            };
            setPatientRecords({ ...map });
          }
        }
      }
    } catch (err) {
      console.warn('Could not read clinical prediction history:', err);
    } finally {
      setIsLoaded(true);
    }
  }, [location.state]);

  useEffect(() => {
    loadClinicalHistory();
  }, [loadClinicalHistory]);

  const activeRecord = patientRecords[selectedDisease];
  const activeConfig = DISEASE_CONFIGS.find((d) => d.key === selectedDisease) || DISEASE_CONFIGS[0];

  // List of diseases that currently have a valid baseline prediction
  const availableDiseases = useMemo(() => {
    return DISEASE_CONFIGS.filter((d) => Boolean(patientRecords[d.key]));
  }, [patientRecords]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner & Disease Navigation */}
      <div className="bg-gradient-to-r from-indigo-800 via-indigo-900 to-purple-950 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <Sliders className="w-8 h-8 text-indigo-300" />
            <h1 className="text-2xl font-bold tracking-tight">Counterfactual What-If Risk Simulator</h1>
          </div>
          <p className="text-indigo-100 text-sm max-w-2xl">
            Simulate how targeted clinical lifestyle interventions, medication adjustments, or biomarker improvements alter estimated patient risk.
          </p>
        </div>

        {/* Disease Selection Tabs */}
        <div className="flex flex-wrap gap-1.5 bg-indigo-950/70 p-1.5 rounded-xl border border-indigo-700/50">
          {DISEASE_CONFIGS.map((d) => {
            const hasBaseline = Boolean(patientRecords[d.key]);
            const isSelected = selectedDisease === d.key;

            return (
              <button
                key={d.key}
                onClick={() => setSelectedDisease(d.key)}
                className={`relative px-3.5 py-2 rounded-lg text-xs font-semibold capitalize transition flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-white text-indigo-900 shadow-sm'
                    : 'text-indigo-200 hover:text-white hover:bg-indigo-900/60'
                }`}
              >
                <span>{d.shortLabel}</span>
                {hasBaseline && (
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isSelected ? 'bg-emerald-600' : 'bg-emerald-400'
                    }`}
                    title="Patient baseline available"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      {activeRecord ? (
        /* ── CASE 1: VALID PATIENT BASELINE AVAILABLE ────────────────────────── */
        <div className="space-y-4">
          {/* Patient Context Ribbon */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-xl border border-indigo-200/60 dark:border-indigo-800/40 text-xs">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Patient Baseline: {activeRecord.patient?.fullName || activeRecord.patient?.patientId || 'Clinical Patient Record'}
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600 dark:text-slate-400">
                Initial Risk: <strong className="text-indigo-700 dark:text-indigo-300">{(activeRecord.probability * 100).toFixed(1)}% ({activeRecord.risk_level})</strong>
              </span>
            </div>

            <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
              {activeRecord.timestamp && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(activeRecord.timestamp).toLocaleDateString()}
                </span>
              )}
              <button
                onClick={loadClinicalHistory}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                title="Reload latest patient record"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Genuine Counterfactual What-If Panel */}
          <WhatIfPanel
            disease={selectedDisease}
            originalInputs={activeRecord.inputs}
            baselineInputs={activeRecord.inputs}
            baselineProbability={activeRecord.probability}
            currentProbability={activeRecord.probability}
            patientInfo={activeRecord.patient}
          />
        </div>
      ) : (
        /* ── CASE 2: MISSING PATIENT BASELINE (ACTIONABLE EMPTY STATE) ──────── */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-10 text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
            <FileQuestion className="w-8 h-8" />
          </div>

          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Baseline {activeConfig.label} Prediction Required
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              The What-If Simulator runs counterfactual inference on genuine patient parameters.
              No baseline prediction for <strong>{activeConfig.label}</strong> is currently recorded in your session.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to={activeConfig.path}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-sm"
            >
              <span>Execute {activeConfig.shortLabel} Risk Prediction</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            {availableDiseases.length > 0 && (
              <span className="text-xs text-slate-400">or switch to an evaluated disease below</span>
            )}
          </div>

          {/* Show other available diseases with completed baselines */}
          {availableDiseases.length > 0 && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 max-w-lg mx-auto">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Available Evaluated Modules in Current Session
              </span>
              <div className="flex flex-wrap justify-center gap-2">
                {availableDiseases.map((d) => (
                  <button
                    key={d.key}
                    onClick={() => setSelectedDisease(d.key)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition border border-slate-200 dark:border-slate-700"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{d.label}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ({(patientRecords[d.key].probability * 100).toFixed(0)}%)
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
