import React, { useState } from 'react';
import { Heart, Activity, AlertTriangle, ShieldCheck, Download, RefreshCw, FileText } from 'lucide-react';
import PredictionCard from '../components/PredictionCard';
import DataQualityMeter from '../components/DataQualityMeter';
import WhatIfPanel from '../components/WhatIfPanel';
import { predictionService } from '../services/predictionService';
import { reportService } from '../services/reportService';
import toast from 'react-hot-toast';

const initialInputs = {
  age: 55,
  sex: 1,
  cp: 3,
  trestbps: 130,
  chol: 240,
  fbs: 0,
  restecg: 1,
  thalach: 150,
  exang: 0,
  oldpeak: 1.2,
  slope: 2,
  ca: 0,
  thal: 3
};

export default function HeartPredictionPage() {
  const [inputs, setInputs] = useState(initialInputs);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('predict'); // 'predict' or 'whatif'

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
      const res = await predictionService.predictHeart(inputs);
      if (res.data && res.data.success) {
        setResult(res.data.data);
        toast.success("Heart disease risk evaluated successfully");
      } else {
        toast.error(res.data?.error || "Inference failed");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Network error communicating with prediction backend");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!result) return;
    try {
      toast.loading("Generating clinical PDF...", { id: "pdf" });
      const payload = {
        disease_type: "heart",
        patient_id: "PT-" + Math.floor(100000 + Math.random() * 900000),
        input_data: inputs,
        prediction_result: result.prediction,
        probability: result.probability,
        risk_level: result.risk_level,
        uncertainty_level: result.uncertainty?.uncertainty_level || "Low",
        trust_status: result.uncertainty?.trust_status || "RELIABLE",
        top_features: result.explainability?.top_features || [],
        red_flags: result.red_flags || [],
        cross_risk_findings: "Cardiovascular evaluation completed.",
        prevention_tips: result.prevention_guidance || []
      };
      const res = await reportService.generateReport(payload);
      if (res.data?.success) {
        await reportService.downloadPdf(res.data.data.report_id);
        toast.success("Clinician-ready PDF downloaded", { id: "pdf" });
      }
    } catch (err) {
      toast.error("Failed to generate PDF", { id: "pdf" });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Module Title Banner */}
      <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white rounded-2xl p-6 shadow-md flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <Heart className="w-8 h-8 text-rose-200 animate-pulse" />
            <h1 className="text-2xl font-bold tracking-tight">Heart Disease Diagnostic Engine</h1>
          </div>
          <p className="text-rose-100 text-sm max-w-2xl">
            Cleveland Clinic cardiovascular risk evaluation leveraging hyper-tuned ensemble learning, 
            uncertainty boundaries, and explainable feature importances.
          </p>
        </div>
        <div className="hidden sm:flex space-x-2">
          <button 
            onClick={() => setActiveTab('predict')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${activeTab === 'predict' ? 'bg-white text-red-700 shadow' : 'bg-red-800 text-white hover:bg-red-900'}`}
          >
            Diagnostics
          </button>
          <button 
            onClick={() => setActiveTab('whatif')}
            disabled={!result}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${activeTab === 'whatif' ? 'bg-white text-red-700 shadow' : 'bg-red-800 text-white hover:bg-red-900'} disabled:opacity-50`}
          >
            What-If Simulator
          </button>
        </div>
      </div>

      {activeTab === 'whatif' && result ? (
        <WhatIfPanel 
          disease="heart" 
          baselineInputs={inputs} 
          currentProbability={result.probability} 
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form Column */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-red-500" />
                Clinical Biomarkers
              </h2>
              <button
                type="button"
                onClick={() => setInputs(initialInputs)}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reset
              </button>
            </div>

            <form onSubmit={handlePredict} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Age (years)
                </label>
                <input
                  type="number"
                  name="age"
                  min="20"
                  max="100"
                  value={inputs.age}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Biological Sex
                </label>
                <select
                  name="sex"
                  value={inputs.sex}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-red-500"
                >
                  <option value={1}>Male (1)</option>
                  <option value={0}>Female (0)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Chest Pain Type (cp)
                </label>
                <select
                  name="cp"
                  value={inputs.cp}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-red-500"
                >
                  <option value={1}>Typical Angina (1)</option>
                  <option value={2}>Atypical Angina (2)</option>
                  <option value={3}>Non-anginal Pain (3)</option>
                  <option value={4}>Asymptomatic (4)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Resting Blood Pressure (mm Hg)
                </label>
                <input
                  type="number"
                  name="trestbps"
                  min="80"
                  max="220"
                  value={inputs.trestbps}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Serum Cholesterol (mg/dL)
                </label>
                <input
                  type="number"
                  name="chol"
                  min="100"
                  max="600"
                  value={inputs.chol}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Fasting Blood Sugar &gt; 120 mg/dl
                </label>
                <select
                  name="fbs"
                  value={inputs.fbs}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-red-500"
                >
                  <option value={0}>False / Normal (0)</option>
                  <option value={1}>True / Elevated (1)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Resting ECG (restecg)
                </label>
                <select
                  name="restecg"
                  value={inputs.restecg}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-red-500"
                >
                  <option value={0}>Normal (0)</option>
                  <option value={1}>ST-T Wave Abnormality (1)</option>
                  <option value={2}>Left Ventricular Hypertrophy (2)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Max Heart Rate Achieved (thalach)
                </label>
                <input
                  type="number"
                  name="thalach"
                  min="60"
                  max="220"
                  value={inputs.thalach}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Exercise Induced Angina (exang)
                </label>
                <select
                  name="exang"
                  value={inputs.exang}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-red-500"
                >
                  <option value={0}>No (0)</option>
                  <option value={1}>Yes (1)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ST Depression (oldpeak)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="oldpeak"
                  min="0"
                  max="6.5"
                  value={inputs.oldpeak}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Slope of Peak ST (slope)
                </label>
                <select
                  name="slope"
                  value={inputs.slope}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-red-500"
                >
                  <option value={1}>Upsloping (1)</option>
                  <option value={2}>Flat (2)</option>
                  <option value={3}>Downsloping (3)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Major Vessels Colored (ca)
                </label>
                <select
                  name="ca"
                  value={inputs.ca}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-red-500"
                >
                  <option value={0}>0 Vessels</option>
                  <option value={1}>1 Vessel</option>
                  <option value={2}>2 Vessels</option>
                  <option value={3}>3 Vessels</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Thallium Scintigraphy (thal)
                </label>
                <select
                  name="thal"
                  value={inputs.thal}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-red-500"
                >
                  <option value={3}>Normal (3)</option>
                  <option value={6}>Fixed Defect (6)</option>
                  <option value={7}>Reversible Defect (7)</option>
                </select>
              </div>

              <div className="sm:col-span-2 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Analyzing Clinical Data...
                    </>
                  ) : (
                    <>
                      <Activity className="w-5 h-5" />
                      Execute Cardiac Risk Prediction
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Results / Audit Column */}
          <div className="lg:col-span-5 space-y-6">
            {result ? (
              <PredictionCard 
                disease="heart" 
                result={result} 
                onDownloadPdf={handleDownloadPdf}
                onOpenWhatIf={() => setActiveTab('whatif')}
              />
            ) : (
              <div className="bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-red-50 dark:bg-red-950/40 text-red-600 rounded-full flex items-center justify-center mx-auto">
                  <Heart className="w-8 h-8" />
                </div>
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                  Awaiting Cardiac Input Vitals
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Adjust patient biomarkers on the left and click "Execute Cardiac Risk Prediction" to view calibrated probability scores, trust shielding, and feature explanations.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
