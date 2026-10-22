import React, { useState } from 'react';
import { Mic, Activity, AlertTriangle, RefreshCw } from 'lucide-react';
import PredictionCard from '../components/PredictionCard';
import WhatIfPanel from '../components/WhatIfPanel';
import { predictionService } from '../services/predictionService';
import { reportService } from '../services/reportService';
import { formatApiError } from '../utils/helpers';
import toast from 'react-hot-toast';

const initialInputs = {
  "MDVP:Fo(Hz)": 154.2,
  "MDVP:Fhi(Hz)": 197.1,
  "MDVP:Flo(Hz)": 116.3,
  "MDVP:Jitter(%)": 0.0062,
  "MDVP:Jitter(Abs)": 0.00004,
  "MDVP:RAP": 0.0031,
  "MDVP:PPQ": 0.0034,
  "Jitter:DDP": 0.0093,
  "MDVP:Shimmer": 0.029,
  "MDVP:Shimmer(dB)": 0.28,
  "Shimmer:APQ3": 0.015,
  "Shimmer:APQ5": 0.017,
  "MDVP:APQ": 0.024,
  "Shimmer:DDA": 0.046,
  "NHR": 0.024,
  "HNR": 21.8,
  "RPDE": 0.49,
  "DFA": 0.71,
  "spread1": -5.68,
  "spread2": 0.22,
  "D2": 2.38,
  "PPE": 0.20
};

export default function ParkinsonsPredictionPage() {
  const [inputs, setInputs] = useState(initialInputs);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('predict');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await predictionService.predictParkinsons(inputs);
      if (res.data && res.data.success) {
        setResult(res.data.data);
        toast.success("Vocal acoustic dysphonia profile analyzed");
      } else {
        const msg = res.data?.error || "Inference failed";
        toast.error(typeof msg === 'object' ? JSON.stringify(msg) : String(msg));
      }
    } catch (err) {
      toast.error(formatApiError(err, "Failed to analyze Parkinson's biomarkers"));
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!result) return;
    try {
      toast.loading("Compiling clinical summary...", { id: "pdf" });
      const payload = {
        disease_type: "parkinsons",
        patient_id: "PT-" + Math.floor(100000 + Math.random() * 900000),
        input_data: inputs,
        prediction_result: result.prediction,
        probability: result.probability,
        risk_level: result.risk_level,
        uncertainty_level: result.uncertainty?.uncertainty_level || "Low",
        trust_status: result.uncertainty?.trust_status || "RELIABLE",
        top_features: result.explainability?.top_features || [],
        red_flags: result.red_flags || [],
        cross_risk_findings: "Vocal dysphonia screening completed.",
        prevention_tips: result.prevention_guidance || []
      };
      const res = await reportService.generateReport(payload);
      if (res.data?.success) {
        await reportService.downloadPdf(res.data.data.report_id);
        toast.success("Clinical PDF downloaded", { id: "pdf" });
      }
    } catch (err) {
      toast.error("Failed to generate PDF", { id: "pdf" });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white rounded-2xl p-6 shadow-md flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <Mic className="w-8 h-8 text-purple-200" />
            <h1 className="text-2xl font-bold tracking-tight">Parkinson's Disease Voice Biomarkers</h1>
          </div>
          <p className="text-purple-100 text-sm max-w-2xl">
            Oxford biomedical vocal acoustic measurements assessing jitter, shimmer, harmonics-to-noise ratio, and pitch period entropy.
          </p>
        </div>
        <div className="hidden sm:flex space-x-2">
          <button 
            onClick={() => setActiveTab('predict')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${activeTab === 'predict' ? 'bg-white text-purple-800 shadow' : 'bg-purple-900 text-white hover:bg-purple-950'}`}
          >
            Diagnostics
          </button>
          <button 
            onClick={() => setActiveTab('whatif')}
            disabled={!result}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${activeTab === 'whatif' ? 'bg-white text-purple-800 shadow' : 'bg-purple-900 text-white hover:bg-purple-950'} disabled:opacity-50`}
          >
            What-If Simulator
          </button>
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl p-4 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <span>
          <strong>Clinical Note:</strong> Inputs represent biomedical speech acoustic features. Simulated changes in voice measurements reflect educational exploration only and do not constitute actual neurological treatments or therapeutic outcomes.
        </span>
      </div>

      {activeTab === 'whatif' && result ? (
        <WhatIfPanel 
          disease="parkinsons" 
          baselineInputs={inputs} 
          currentProbability={result.probability} 
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-500" />
                Vocal Measurements (22 Diagnostic Signals)
              </h2>
              <button
                type="button"
                onClick={() => setInputs(initialInputs)}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reset
              </button>
            </div>

            <form onSubmit={handlePredict} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.keys(inputs).map((key) => (
                <div key={key}>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5 truncate" title={key}>
                    {key}
                  </label>
                  <input
                    type="number"
                    step="any"
                    name={key}
                    value={inputs[key]}
                    onChange={handleChange}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              ))}

              <div className="sm:col-span-3 pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-purple-700 hover:bg-purple-800 text-white font-semibold rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Evaluating Speech Acoustics...
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5" />
                      Execute Parkinson's Dysphonia Risk Analysis
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-5 space-y-6">
            {result ? (
              <PredictionCard 
                disease="parkinsons" 
                result={result} 
                onDownloadPdf={handleDownloadPdf}
                onOpenWhatIf={() => setActiveTab('whatif')}
              />
            ) : (
              <div className="bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-purple-50 dark:bg-purple-950/40 text-purple-600 rounded-full flex items-center justify-center mx-auto">
                  <Mic className="w-8 h-8" />
                </div>
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                  Awaiting Voice Acoustic Signals
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Submit biomedical phonation recordings to inspect voice pitch entropy, jitter perturbation, and multi-model agreement.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
