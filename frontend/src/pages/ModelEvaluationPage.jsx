import React, { useState, useEffect } from 'react';
import { BarChart3, Award, TrendingUp, Layers, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ModelEvaluationPage() {
  const [metrics, setMetrics] = useState(null);
  const [selectedDisease, setSelectedDisease] = useState('heart');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/model-evaluation/');
      if (res.data?.success && res.data?.data) {
        setMetrics(res.data.data);
      } else if (res.data) {
        setMetrics(res.data);
      }
    } catch (err) {
      toast.error("Could not load evaluation metrics from backend");
    } finally {
      setLoading(false);
    }
  };

  const diseaseData = metrics?.[selectedDisease];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-2xl p-6 shadow-md flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <Award className="w-8 h-8 text-amber-400" />
            <h1 className="text-2xl font-bold tracking-tight">Model Evaluation & Benchmark Dashboard</h1>
          </div>
          <p className="text-slate-300 text-sm max-w-2xl">
            Empirical validation metrics measured on held-out test sets across 7 tuned classifier families. Real, uninflated accuracy and ROC-AUC scores.
          </p>
        </div>

        <div className="flex gap-2">
          {['heart', 'diabetes', 'parkinsons', 'liver'].map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDisease(d)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition ${
                selectedDisease === d
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-500 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading empirical validation matrices...</span>
        </div>
      ) : diseaseData ? (
        <div className="space-y-6">
          {/* Top Banner KPI for Best Model */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">
                Selected Champion Architecture
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white capitalize flex items-center gap-2">
                {diseaseData.best_model} Classifier
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Determined via composite ROC-AUC and F1-score optimization over Stratified 5-Fold Cross Validation.
              </p>
            </div>

            <div className="flex gap-6">
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block font-medium">Test Accuracy</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  {((diseaseData.models[diseaseData.best_model]?.accuracy || 0) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block font-medium">Test ROC-AUC</span>
                <span className="text-2xl font-black text-blue-600 font-mono">
                  {(diseaseData.models[diseaseData.best_model]?.roc_auc || 0).toFixed(4)}
                </span>
              </div>
            </div>
          </div>

          {/* Comparative Model Benchmark Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-500" />
                Comprehensive 7-Algorithm Benchmark Matrix ({selectedDisease.toUpperCase()})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase">
                    <th className="py-3 px-4">Algorithm Architecture</th>
                    <th className="py-3 px-4">Accuracy</th>
                    <th className="py-3 px-4">Precision</th>
                    <th className="py-3 px-4">Recall (Sensitivity)</th>
                    <th className="py-3 px-4">F1-Score</th>
                    <th className="py-3 px-4">ROC-AUC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {Object.entries(diseaseData.models || {}).map(([modelName, m]) => {
                    const isBest = modelName === diseaseData.best_model;
                    return (
                      <tr key={modelName} className={`${isBest ? 'bg-blue-50/50 dark:bg-blue-950/20 font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}>
                        <td className="py-3 px-4 font-sans font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          {modelName}
                          {isBest && <span className="px-2 py-0.5 rounded text-[10px] bg-blue-600 text-white font-sans">Best</span>}
                        </td>
                        <td className="py-3 px-4 font-semibold">{(m.accuracy * 100).toFixed(2)}%</td>
                        <td className="py-3 px-4">{(m.precision * 100).toFixed(2)}%</td>
                        <td className="py-3 px-4">{(m.recall * 100).toFixed(2)}%</td>
                        <td className="py-3 px-4 font-semibold">{(m.f1).toFixed(4)}</td>
                        <td className="py-3 px-4 text-blue-600 font-bold">{(m.roc_auc).toFixed(4)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
