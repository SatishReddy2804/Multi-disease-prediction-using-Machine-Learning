import React, { useState } from 'react';
import { Sliders, RefreshCw, ArrowRight, TrendingDown, TrendingUp, CheckCircle, Info } from 'lucide-react';
import RadialConfidenceRing from './RadialConfidenceRing';
import { formatProbability, getRiskColor } from '../utils/helpers';
import whatIfService from '../services/whatIfService';
import toast from 'react-hot-toast';

export default function WhatIfPanel({
  disease = 'heart',
  originalInputs,
  baselineInputs,
  baselineProbability,
  currentProbability: currentProbProp,
  fields = [],
  className = '',
}) {
  const actualOriginalInputs = originalInputs || baselineInputs || {};
  const actualBaselineProb = baselineProbability ?? currentProbProp ?? 0.65;

  const [modifiedInputs, setModifiedInputs] = useState({ ...actualOriginalInputs });
  const [simulationResult, setSimulationResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Sync if baseline inputs change (e.g. switching diseases or new prediction)
  React.useEffect(() => {
    setModifiedInputs({ ...(originalInputs || baselineInputs || {}) });
    setSimulationResult(null);
  }, [disease, originalInputs, baselineInputs]);

  // If fields are not provided externally, generate modifiable fields automatically from inputs
  const resolvedFields = (fields && fields.length > 0)
    ? fields
    : Object.keys(actualOriginalInputs)
        .filter((k) => !['age', 'sex', 'gender', 'patientid', 'fullname', 'name'].includes(k.toLowerCase()))
        .map((k) => {
          const val = Number(actualOriginalInputs[k]) || 0;
          return {
            name: k,
            label: k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            defaultValue: val,
            min: val > 10 ? Math.floor(val * 0.4) : 0,
            max: val > 10 ? Math.ceil(val * 1.8) : (val > 1 ? Math.ceil(val * 2.5) : 5),
            step: val > 10 ? 1 : 0.05,
          };
        });

  const modifiableFields = resolvedFields.filter((f) => {
    const name = f.name.toLowerCase();
    return !['age', 'sex', 'gender'].includes(name);
  });

  const handleSliderChange = (name, value) => {
    setModifiedInputs((prev) => ({
      ...prev,
      [name]: Number(value),
    }));
  };

  const handleReset = () => {
    setModifiedInputs({ ...actualOriginalInputs });
    setSimulationResult(null);
    toast.success('Simulation parameters reset to baseline.');
  };

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    try {
      const res = await whatIfService.simulate(disease, actualOriginalInputs, modifiedInputs);
      setSimulationResult(res);
      toast.success('Counterfactual scenario simulated!');
    } catch {
      toast.error('Simulation failed. Please try again.');
    } finally {
      setIsSimulating(false);
    }
  };

  const currentProbability = simulationResult ? (simulationResult.modifiedProbability ?? simulationResult.counterfactual_probability ?? actualBaselineProb) : actualBaselineProb;
  const delta = simulationResult ? simulationResult.delta : 0;
  const deltaPercent = simulationResult ? simulationResult.deltaPercent : 0;

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-soft space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-850 dark:text-slate-100">
              Interactive What-If Scenario Simulator
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Explore how targeted clinical interventions and lifestyle modifications reduce estimated disease probability
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleReset}
            className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 transition"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Reset Baseline
          </button>
          <button
            onClick={handleRunSimulation}
            disabled={isSimulating}
            className="inline-flex items-center px-4 py-1.5 text-xs font-semibold rounded-xl text-white bg-primary-600 hover:bg-primary-700 transition disabled:opacity-50 shadow-sm"
          >
            {isSimulating ? 'Simulating...' : 'Run Simulation'}
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </button>
        </div>
      </div>

      {/* Comparison Scoreboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-750">
        <div className="flex flex-col items-center text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Baseline Risk
          </span>
          <RadialConfidenceRing
            probability={baselineProbability}
            size={120}
            strokeWidth={10}
            showSubtext={false}
          />
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-2">
            Initial Intake Profile
          </span>
        </div>

        <div className="flex flex-col items-center justify-center text-center space-y-2 border-y md:border-y-0 md:border-x border-slate-200 dark:border-slate-700 py-4 md:py-0">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Intervention Delta
          </span>
          <div className="flex items-center space-x-2">
            {delta < 0 ? (
              <TrendingDown className="w-7 h-7 text-emerald-500" />
            ) : delta > 0 ? (
              <TrendingUp className="w-7 h-7 text-rose-500" />
            ) : (
              <span className="text-xl font-bold text-slate-400">0%</span>
            )}
            <span
              className={`text-2xl font-extrabold ${
                delta < 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : delta > 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {deltaPercent > 0 ? `+${deltaPercent}%` : `${deltaPercent}%`}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
            {simulationResult ? simulationResult.summary : 'Adjust the biometric sliders below to test risk mitigation strategies.'}
          </p>
        </div>

        <div className="flex flex-col items-center text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Simulated Risk
          </span>
          <RadialConfidenceRing
            probability={currentProbability}
            size={120}
            strokeWidth={10}
            showSubtext={false}
          />
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-2">
            Post-Intervention Projection
          </span>
        </div>
      </div>

      {/* Sliders Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Modifiable Clinical Biomarkers
          </h4>
          <span className="text-xs text-slate-400">Drag sliders to test targeted treatment</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modifiableFields.slice(0, 8).map((field) => {
            const val = modifiedInputs[field.name] ?? field.defaultValue;
            const orig = originalInputs[field.name] ?? field.defaultValue;
            const hasChanged = val !== orig;

            return (
              <div
                key={field.name}
                className={`p-3.5 rounded-xl border transition ${
                  hasChanged
                    ? 'border-primary-300 dark:border-primary-800 bg-primary-50/40 dark:bg-primary-950/30'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                }`}
              >
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate pr-2">
                    {field.label}
                  </span>
                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {val} {field.unit || ''}
                    </span>
                    {hasChanged && (
                      <span className="text-[10px] text-primary-600 dark:text-primary-400">
                        (was {orig})
                      </span>
                    )}
                  </div>
                </div>

                <input
                  type="range"
                  min={field.min ?? 0}
                  max={field.max ?? 200}
                  step={field.step ?? 1}
                  value={val}
                  onChange={(e) => handleSliderChange(field.name, e.target.value)}
                  className="w-full accent-primary-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                />

                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>Min: {field.min ?? 0} {field.unit || ''}</span>
                  <span>Max: {field.max ?? 200} {field.unit || ''}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Impact Ranking Bar Chart if simulation completed */}
      {simulationResult?.impactRanking && simulationResult.impactRanking.length > 0 && (
        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Top Intervention Leverage (Risk Reduction Drivers)
          </h4>
          <div className="space-y-2">
            {simulationResult.impactRanking.map((rank, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700 dark:text-slate-300 w-1/3 truncate">
                  {rank.feature}
                </span>
                <div className="flex-1 mx-3 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${rank.impactScore < 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                    style={{ width: `${Math.min(100, Math.abs(rank.impactScore) * 4)}%` }}
                  />
                </div>
                <span className={`font-mono font-bold w-16 text-right ${rank.impactScore < 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {rank.impactScore > 0 ? `+${rank.impactScore}%` : `${rank.impactScore}%`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notice */}
      <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-200/50 dark:border-amber-900/30">
        <Info className="w-4 h-4 text-amber-600 shrink-0" />
        <span>What-If simulations reflect statistical model perturbations and should not be used as an unconditional pharmacological prognosis.</span>
      </div>
    </div>
  );
}
