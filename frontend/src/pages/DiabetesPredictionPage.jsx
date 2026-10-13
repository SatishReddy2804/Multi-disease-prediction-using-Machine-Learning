import React, { useState } from 'react';
import { Droplet, Activity, AlertCircle, RefreshCw } from 'lucide-react';
import PredictionCard from '../components/PredictionCard';
import WhatIfPanel from '../components/WhatIfPanel';
import { predictionService } from '../services/predictionService';
import { reportService } from '../services/reportService';
import toast from 'react-hot-toast';

const initialInputs = {
  Pregnancies: 2,
  Glucose: 130,
  BloodPressure: 75,
  SkinThickness: 25,
  Insulin: 100,
  BMI: 29.5,
  DiabetesPedigreeFunction: 0.45,
  Age: 38
};

export default function DiabetesPredictionPage() {
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
      const res = await predictionService.predictDiabetes(inputs);
      if (res.data && res.data.success) {
        setResult(res.data.data);
        toast.success("Diabetes risk evaluated successfully");
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
        disease_type: "diabetes",
        patient_id: "PT-" + Math.floor(100000 + Math.random() * 900000),
        input_data: inputs,
        prediction_result: result.prediction,
        probability: result.probability,
        risk_level: result.risk_level,
        uncertainty_level: result.uncertainty?.uncertainty_level || "Low",
        trust_status: result.uncertainty?.trust_status || "RELIABLE",
        top_features: result.explainability?.top_features || [],
        red_flags: result.red_flags || [],
        cross_risk_findings: "Metabolic risk profile analyzed.",
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
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-6 shadow-md flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <Droplet className="w-8 h-8 text-blue-200" />
            <h1 className="text-2xl font-bold tracking-tight">Diabetes Diagnostic Module</h1>
          </div>
          <p className="text-blue-100 text-sm max-w-2xl">
            Pima Indians clinical metabolic model with hidden-zero imputation, insulin/glucose ratio checks, and counterfactual simulation.
          </p>
        </div>
        <div className="hidden sm:flex space-x-2">
          <button 
            onClick={() => setActiveTab('predict')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${activeTab === 'predict' ? 'bg-white text-blue-700 shadow' : 'bg-blue-800 text-white hover:bg-blue-900'}`}
          >
            Diagnostics
          </button>
          <button 
            onClick={() => setActiveTab('whatif')}
            disabled={!result}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${activeTab === 'whatif' ? 'bg-white text-blue-700 shadow' : 'bg-blue-800 text-white hover:bg-blue-900'} disabled:opacity-50`}
          >
            What-If Simulator
          </button>
        </div>
      </div>

      {activeTab === 'whatif' && result ? (
        <WhatIfPanel 
          disease="diabetes" 
          baselineInputs={inputs} 
          currentProbability={result.probability} 
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" />
                Metabolic Indicators
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
                  Pregnancies
                </label>
                <input
                  type="number"
                  name="Pregnancies"
                  min="0"
                  max="20"
                  value={inputs.Pregnancies}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Glucose (mg/dL)
                </label>
                <input
                  type="number"
                  name="Glucose"
                  min="40"
                  max="300"
                  value={inputs.Glucose}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Diastolic Blood Pressure (mm Hg)
                </label>
                <input
                  type="number"
                  name="BloodPressure"
                  min="30"
                  max="140"
                  value={inputs.BloodPressure}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Triceps Skin Thickness (mm)
                </label>
                <input
                  type="number"
                  name="SkinThickness"
                  min="0"
                  max="99"
                  value={inputs.SkinThickness}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  2-Hour Serum Insulin (μU/mL)
                </label>
                <input
                  type="number"
                  name="Insulin"
                  min="0"
                  max="900"
                  value={inputs.Insulin}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Body Mass Index (BMI)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="BMI"
                  min="15.0"
                  max="65.0"
                  value={inputs.BMI}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Diabetes Pedigree Function
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="DiabetesPedigreeFunction"
                  min="0.05"
                  max="2.5"
                  value={inputs.DiabetesPedigreeFunction}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Age (years)
                </label>
                <input
                  type="number"
                  name="Age"
                  min="18"
                  max="100"
                  value={inputs.Age}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-2 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Evaluating Glycemic Risk...
                    </>
                  ) : (
                    <>
                      <Activity className="w-5 h-5" />
                      Execute Diabetes Prediction
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-5 space-y-6">
            {result ? (
              <PredictionCard 
                disease="diabetes" 
                result={result} 
                onDownloadPdf={handleDownloadPdf}
                onOpenWhatIf={() => setActiveTab('whatif')}
              />
            ) : (
              <div className="bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                  <Droplet className="w-8 h-8" />
                </div>
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                  Awaiting Metabolic Vitals
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Enter patient lab measurements including glucose, BMI, and family pedigree on the left to evaluate calibrated diabetes risk.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
