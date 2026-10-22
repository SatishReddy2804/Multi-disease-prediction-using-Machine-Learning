import React, { useState } from 'react';
import { GitMerge, Activity, ShieldAlert, CheckCircle, ArrowRight } from 'lucide-react';
import CrossRiskRadarChart from '../components/CrossRiskRadarChart';
import { crossRiskService } from '../services/crossRiskService';
import toast from 'react-hot-toast';

export default function CrossRiskPage() {
  const [predictions, setPredictions] = useState({
    heart: 0.72,
    diabetes: 0.68,
    liver: 0.61,
    parkinsons: 0.22
  });
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const handleSliderChange = (disease, val) => {
    setPredictions(prev => ({
      ...prev,
      [disease]: parseFloat(val)
    }));
  };

  const handleRunAnalysis = async () => {
    setLoading(true);
    try {
      const payload = {
        predictions: [
          { disease: "heart", probability: predictions.heart, risk_level: predictions.heart > 0.6 ? "High" : "Low", predicted_class: predictions.heart > 0.5 ? 1 : 0 },
          { disease: "diabetes", probability: predictions.diabetes, risk_level: predictions.diabetes > 0.6 ? "High" : "Low", predicted_class: predictions.diabetes > 0.5 ? 1 : 0 },
          { disease: "liver", probability: predictions.liver, risk_level: predictions.liver > 0.6 ? "High" : "Low", predicted_class: predictions.liver > 0.5 ? 1 : 0 },
          { disease: "parkinsons", probability: predictions.parkinsons, risk_level: predictions.parkinsons > 0.6 ? "High" : "Low", predicted_class: predictions.parkinsons > 0.5 ? 1 : 0 }
        ]
      };

      const res = await crossRiskService.analyze(payload);
      if (res.data || res.success) {
        const dataObj = res.data?.data || res.data || res;
        setAnalysis(dataObj);
        toast.success("Multi-organ cross-risk syndromic analysis complete");
      }
    } catch (err) {
      toast.error("Failed to run cross-risk analysis");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-teal-700 to-cyan-900 text-white rounded-2xl p-6 shadow-md flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <GitMerge className="w-8 h-8 text-teal-200" />
            <h1 className="text-2xl font-bold tracking-tight">Multi-Disease Cross-Risk Engine</h1>
          </div>
          <p className="text-teal-100 text-sm max-w-2xl">
            Synthesizes cardiometabolic, hepato-metabolic, and neurodegenerative comorbidities to triage multi-system syndrome patterns.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-600" />
            Simulate Organ Risk Probabilities
          </h2>
          <p className="text-xs text-slate-500">
            Adjust probabilities from each clinical module to evaluate cross-organ syndromic interactions.
          </p>

          <div className="space-y-4">
            {Object.entries(predictions).map(([d, val]) => (
              <div key={d} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="capitalize">{d} Disease Risk</span>
                  <span className="font-mono text-teal-600">{(val * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.02"
                  value={val}
                  onChange={(e) => handleSliderChange(d, e.target.value)}
                  className="w-full accent-teal-600"
                />
              </div>
            ))}
          </div>

          <button
            onClick={handleRunAnalysis}
            disabled={loading}
            className="w-full py-3 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
          >
            {loading ? "Analyzing Cross-Organ Synergies..." : "Run Multi-Disease Cross-Risk Analysis"}
          </button>
        </div>

        <div className="lg:col-span-6 space-y-6">
          {analysis ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Syndromic Cluster Diagnostic
                </h3>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  analysis.overall_priority === 'HIGH' || analysis.overall_priority === 'EMERGENCY'
                    ? 'bg-red-100 text-red-700 dark:bg-red-950/60'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60'
                }`}>
                  {analysis.overall_priority} PRIORITY
                </span>
              </div>

              <div className="p-4 bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/40 rounded-xl space-y-1">
                <span className="text-[11px] font-bold text-teal-800 dark:text-teal-300 uppercase tracking-wide">
                  Identified Syndrome Pattern
                </span>
                <p className="text-base font-bold text-teal-950 dark:text-teal-100">
                  {analysis.primary_cluster}
                </p>
                <p className="text-xs text-teal-800 dark:text-teal-200 pt-1">
                  <strong>Referral Specialist:</strong> {analysis.recommended_specialist}
                </p>
              </div>

              <div className="h-64 flex items-center justify-center">
                <CrossRiskRadarChart data={analysis.radar_chart_data} />
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center space-y-3">
              <ShieldAlert className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Awaiting Cross-Risk Execution
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Click "Run Multi-Disease Cross-Risk Analysis" to evaluate syndromic clustering, triage priorities, and multi-organ radar representations.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
