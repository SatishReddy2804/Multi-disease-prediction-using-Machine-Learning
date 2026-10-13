import React, { useState } from 'react';
import { ShieldAlert, Activity, AlertTriangle, RefreshCw } from 'lucide-react';
import PredictionCard from '../components/PredictionCard';
import WhatIfPanel from '../components/WhatIfPanel';
import { predictionService } from '../services/predictionService';
import { reportService } from '../services/reportService';
import toast from 'react-hot-toast';

const initialInputs = {
  Age: 48,
  Gender: "Male",
  Total_Bilirubin: 1.2,
  Direct_Bilirubin: 0.4,
  Alkaline_Phosphotase: 210,
  Alamine_Aminotransferase: 45,
  Aspartate_Aminotransferase: 55,
  Total_Protiens: 6.8,
  Albumin: 3.2,
  Albumin_and_Globulin_Ratio: 0.9
};

export default function LiverPredictionPage() {
  const [inputs, setInputs] = useState(initialInputs);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('predict');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs(prev => ({
      ...prev,
      [name]: name === "Gender" ? value : (parseFloat(value) || 0)
    }));
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await predictionService.predictLiver(inputs);
      if (res.data && res.data.success) {
        setResult(res.data.data);
        toast.success("Liver functional risk assessed successfully");
      } else {
        toast.error(res.data?.error || "Inference failed");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Network error contacting prediction backend");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!result) return;
    try {
      toast.loading("Generating hepatology summary...", { id: "pdf" });
      const payload = {
        disease_type: "liver",
        patient_id: "PT-" + Math.floor(100000 + Math.random() * 900000),
        input_data: inputs,
        prediction_result: result.prediction,
        probability: result.probability,
        risk_level: result.risk_level,
        uncertainty_level: result.uncertainty?.uncertainty_level || "Low",
        trust_status: result.uncertainty?.trust_status || "RELIABLE",
        top_features: result.explainability?.top_features || [],
        red_flags: result.red_flags || [],
        cross_risk_findings: "Hepatic functional profile assessed.",
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
      <div className="bg-gradient-to-r from-emerald-600 to-teal-800 text-white rounded-2xl p-6 shadow-md flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <ShieldAlert className="w-8 h-8 text-emerald-200" />
            <h1 className="text-2xl font-bold tracking-tight">Liver Disease Diagnostic Engine</h1>
          </div>
          <p className="text-emerald-100 text-sm max-w-2xl">
            Indian Liver Patient Dataset evaluation analyzing transaminases (ALT/AST), alkaline phosphatase, bilirubin fractions, and albumin/globulin ratios.
          </p>
        </div>
        <div className="hidden sm:flex space-x-2">
          <button 
            onClick={() => setActiveTab('predict')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${activeTab === 'predict' ? 'bg-white text-emerald-800 shadow' : 'bg-emerald-900 text-white hover:bg-emerald-950'}`}
          >
            Diagnostics
          </button>
          <button 
            onClick={() => setActiveTab('whatif')}
            disabled={!result}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${activeTab === 'whatif' ? 'bg-white text-emerald-800 shadow' : 'bg-emerald-900 text-white hover:bg-emerald-950'} disabled:opacity-50`}
          >
            What-If Simulator
          </button>
        </div>
      </div>

      {activeTab === 'whatif' && result ? (
        <WhatIfPanel 
          disease="liver" 
          baselineInputs={inputs} 
          currentProbability={result.probability} 
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-500" />
                Hepatic Biomarkers & Enzymes
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
                  name="Age"
                  min="4"
                  max="90"
                  value={inputs.Age}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Gender
                </label>
                <select
                  name="Gender"
                  value={inputs.Gender}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Total Bilirubin (mg/dL)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="Total_Bilirubin"
                  min="0.1"
                  max="75.0"
                  value={inputs.Total_Bilirubin}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Direct Bilirubin (mg/dL)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="Direct_Bilirubin"
                  min="0.0"
                  max="25.0"
                  value={inputs.Direct_Bilirubin}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Alkaline Phosphatase - ALP (U/L)
                </label>
                <input
                  type="number"
                  name="Alkaline_Phosphotase"
                  min="40"
                  max="2200"
                  value={inputs.Alkaline_Phosphotase}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ALT / SGPT (U/L)
                </label>
                <input
                  type="number"
                  name="Alamine_Aminotransferase"
                  min="5"
                  max="2000"
                  value={inputs.Alamine_Aminotransferase}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  AST / SGOT (U/L)
                </label>
                <input
                  type="number"
                  name="Aspartate_Aminotransferase"
                  min="5"
                  max="4900"
                  value={inputs.Aspartate_Aminotransferase}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Total Proteins (g/dL)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="Total_Protiens"
                  min="2.0"
                  max="10.0"
                  value={inputs.Total_Protiens}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Serum Albumin (g/dL)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="Albumin"
                  min="0.9"
                  max="5.5"
                  value={inputs.Albumin}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Albumin/Globulin (A/G) Ratio
                </label>
                <input
                  type="number"
                  step="0.05"
                  name="Albumin_and_Globulin_Ratio"
                  min="0.3"
                  max="2.8"
                  value={inputs.Albumin_and_Globulin_Ratio}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="sm:col-span-2 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Evaluating Hepatic Enzymes...
                    </>
                  ) : (
                    <>
                      <Activity className="w-5 h-5" />
                      Execute Liver Functional Assessment
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-5 space-y-6">
            {result ? (
              <PredictionCard 
                disease="liver" 
                result={result} 
                onDownloadPdf={handleDownloadPdf}
                onOpenWhatIf={() => setActiveTab('whatif')}
              />
            ) : (
              <div className="bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                  Awaiting Hepatic Serum Panel
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Submit transaminases, bilirubin levels, and total protein concentrations to evaluate acute/chronic liver dysfunction.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
