import React, { useState } from 'react';
import {
  User,
  Activity,
  FileCheck2,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import DataQualityMeter from './DataQualityMeter';
import AnomalyStrip from './AnomalyStrip';
import PredictionCard from './PredictionCard';
import FeatureImportanceChart from './FeatureImportanceChart';
import LoadingSpinner from './LoadingSpinner';
import { validateDiseaseForm, validatePatientInfo } from '../utils/validators';
import { calculateQualityMetrics } from '../utils/helpers';
import toast from 'react-hot-toast';

const STEPS = [
  { id: 1, title: 'Patient Info', icon: User, desc: 'Demographics & ID' },
  { id: 2, title: 'Clinical Inputs', icon: Activity, desc: 'Biomarkers & Vitals' },
  { id: 3, title: 'Data Quality', icon: FileCheck2, desc: 'Pre-flight integrity' },
  { id: 4, title: 'Review & Predict', icon: Sparkles, desc: 'Inference verification' },
];

export default function StepperForm({
  diseaseConfig,
  initialValues = {},
  onSubmitPrediction,
  isLoading = false,
  predictionResult = null,
  onReset,
  onOpenWhatIf,
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [patientInfo, setPatientInfo] = useState({
    patientId: 'PT-' + Math.floor(100000 + Math.random() * 900000),
    fullName: '',
    age: diseaseConfig.fields.find((f) => f.name.toLowerCase() === 'age')?.defaultValue || 45,
    gender: 'Male',
    clinicalNotes: '',
  });

  const [formData, setFormData] = useState(() => {
    const defaults = {};
    diseaseConfig.fields.forEach((f) => {
      defaults[f.name] = initialValues[f.name] !== undefined ? initialValues[f.name] : f.defaultValue;
    });
    return defaults;
  });

  const [errors, setErrors] = useState({});
  const [activeTooltip, setActiveTooltip] = useState(null);

  // Group fields by category
  const categories = Array.from(new Set(diseaseConfig.fields.map((f) => f.category || 'General')));

  const handlePatientChange = (field, val) => {
    setPatientInfo((prev) => ({ ...prev, [field]: val }));
    // If demographic age/gender changes, sync with form if field exists
    if (field === 'age' && formData.age !== undefined) {
      setFormData((prev) => ({ ...prev, age: Number(val) }));
    }
    if (field === 'age' && formData.Age !== undefined) {
      setFormData((prev) => ({ ...prev, Age: Number(val) }));
    }
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleFieldChange = (name, val) => {
    setFormData((prev) => ({
      ...prev,
      [name]: val === '' ? '' : Number(val),
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleLoadSampleData = () => {
    const sample = {};
    diseaseConfig.fields.forEach((f) => {
      sample[f.name] = f.defaultValue;
    });
    setFormData(sample);
    setPatientInfo((prev) => ({
      ...prev,
      fullName: 'Johnathan Doe',
      clinicalNotes: 'Routine clinical baseline screening follow-up.',
    }));
    toast.success('Sample clinical baseline values populated.');
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      const v = validatePatientInfo(patientInfo);
      if (!v.isValid) {
        setErrors(v.errors);
        toast.error('Please complete mandatory patient identifiers.');
        return;
      }
    } else if (currentStep === 2) {
      const v = validateDiseaseForm(diseaseConfig.id, formData);
      if (!v.isValid) {
        setErrors(v.errors);
        toast.error('Please address invalid clinical input fields.');
        return;
      }
    }
    setCurrentStep((prev) => Math.min(4, prev + 1));
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async () => {
    if (onSubmitPrediction) {
      await onSubmitPrediction(formData, patientInfo);
    }
  };

  const quality = calculateQualityMetrics(formData, diseaseConfig.fields);

  // If prediction result is present, display full Results View
  if (predictionResult) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="w-4 h-4" />
            <span>Prediction Inference Complete</span>
          </div>
          <button
            onClick={() => {
              if (onReset) onReset();
              setCurrentStep(1);
            }}
            className="inline-flex items-center px-3.5 py-1.5 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-650 transition"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            New Assessment
          </button>
        </div>

        <PredictionCard prediction={predictionResult} onOpenWhatIf={onOpenWhatIf} />

        {predictionResult.topFeatures && (
          <FeatureImportanceChart features={predictionResult.topFeatures} />
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-soft p-6 lg:p-8 space-y-6">
      {/* Stepper Header Navigation */}
      <div className="pb-6 border-b border-slate-100 dark:border-slate-700">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STEPS.map((s) => {
            const isCompleted = currentStep > s.id;
            const isCurrent = currentStep === s.id;
            const Icon = s.icon;

            return (
              <div
                key={s.id}
                onClick={() => {
                  if (s.id < currentStep) setCurrentStep(s.id);
                }}
                className={`flex items-center space-x-3 p-3 rounded-xl border transition ${
                  isCurrent
                    ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300'
                    : isCompleted
                    ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 cursor-pointer'
                    : 'border-slate-200 dark:border-slate-700 text-slate-400'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isCurrent
                      ? 'bg-primary-600 text-white'
                      : isCompleted
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                  }`}
                >
                  {isCompleted ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">Step {s.id}: {s.title}</div>
                  <div className="text-[10px] text-slate-400 truncate">{s.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="py-2">
        {/* STEP 1: PATIENT INFO */}
        {currentStep === 1 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-850 dark:text-slate-100">
                  Patient Intake & Encounter Information
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enter patient medical record identification and demographic data
                </p>
              </div>
              <button
                type="button"
                onClick={handleLoadSampleData}
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 hover:underline inline-flex items-center"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                Fill Sample Data
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Medical Record Number (MRN) *
                </label>
                <input
                  type="text"
                  value={patientInfo.patientId}
                  onChange={(e) => handlePatientChange('patientId', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-650 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary-500 dark:text-slate-100 font-mono"
                  placeholder="e.g. MRN-59201"
                />
                {errors.patientId && (
                  <p className="mt-1 text-xs text-red-500 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" /> {errors.patientId}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Patient Full Name *
                </label>
                <input
                  type="text"
                  value={patientInfo.fullName}
                  onChange={(e) => handlePatientChange('fullName', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-650 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary-500 dark:text-slate-100"
                  placeholder="e.g. Eleanor Vance"
                />
                {errors.fullName && (
                  <p className="mt-1 text-xs text-red-500 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" /> {errors.fullName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Patient Age (years)
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={patientInfo.age}
                  onChange={(e) => handlePatientChange('age', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-650 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary-500 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Biological Sex
                </label>
                <select
                  value={patientInfo.gender}
                  onChange={(e) => handlePatientChange('gender', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-650 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary-500 dark:text-slate-100"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other / Intersex</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Clinical Encounter Notes / Triage Observations
                </label>
                <textarea
                  rows={2}
                  value={patientInfo.clinicalNotes}
                  onChange={(e) => handlePatientChange('clinicalNotes', e.target.value)}
                  placeholder="Optional clinician encounter notes, pre-existing comorbidities, medication allergies..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-650 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary-500 dark:text-slate-100"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: CLINICAL INPUTS */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-850 dark:text-slate-100">
                  {diseaseConfig.name} Biomarkers
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enter laboratory and clinical findings. Hover over the info icon for reference ranges.
                </p>
              </div>
            </div>

            {categories.map((category) => {
              const catFields = diseaseConfig.fields.filter((f) => (f.category || 'General') === category);

              return (
                <div key={category} className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 border-b border-slate-100 dark:border-slate-750 pb-1">
                    {category}
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {catFields.map((field) => {
                      const value = formData[field.name];
                      const error = errors[field.name];

                      return (
                        <div key={field.name} className="relative space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center truncate">
                              <span className="truncate">{field.label}</span>
                              {field.unit && (
                                <span className="ml-1 text-[11px] font-normal text-slate-400">
                                  ({field.unit})
                                </span>
                              )}
                            </label>

                            {field.tooltip && (
                              <button
                                type="button"
                                onMouseEnter={() => setActiveTooltip(field.name)}
                                onMouseLeave={() => setActiveTooltip(null)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 ml-1 p-0.5"
                              >
                                <HelpCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Tooltip Popup */}
                          {activeTooltip === field.name && (
                            <div className="absolute z-20 bottom-full left-0 mb-1 w-60 p-2.5 rounded-xl bg-slate-900 text-white text-[11px] shadow-lg">
                              <p className="font-medium">{field.tooltip}</p>
                              {field.normalRange && (
                                <div className="mt-1 pt-1 border-t border-slate-700 text-emerald-400 font-mono text-[10px]">
                                  Normal: {field.normalRange.min} - {field.normalRange.max} {field.unit || ''}
                                </div>
                              )}
                            </div>
                          )}

                          {field.type === 'select' ? (
                            <select
                              value={value}
                              onChange={(e) => handleFieldChange(field.name, e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-650 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary-500 dark:text-slate-100"
                            >
                              {(field.options || []).map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="number"
                              min={field.min}
                              max={field.max}
                              step={field.step || 1}
                              value={value ?? ''}
                              onChange={(e) => handleFieldChange(field.name, e.target.value)}
                              className={`w-full px-3.5 py-2.5 rounded-xl border ${
                                error ? 'border-red-400 bg-red-50/20' : 'border-slate-300 dark:border-slate-650'
                              } bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary-500 dark:text-slate-100 font-mono`}
                            />
                          )}

                          {error && (
                            <p className="text-[11px] text-red-500 flex items-center">
                              <AlertCircle className="w-3 h-3 mr-1 shrink-0" /> {error}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* STEP 3: DATA QUALITY AUDIT */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h3 className="text-base font-bold text-slate-850 dark:text-slate-100">
                Data Quality Pre-flight Audit
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Algorithmic validation check to ensure model safety constraints and biological validity
              </p>
            </div>

            <DataQualityMeter
              completeness={quality.completeness}
              validity={quality.validity}
              overallScore={quality.score}
              isReady={quality.completeness === 100 && quality.validity >= 80}
            />

            <AnomalyStrip fields={diseaseConfig.fields} values={formData} />
          </div>
        )}

        {/* STEP 4: REVIEW & PREDICT */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h3 className="text-base font-bold text-slate-850 dark:text-slate-100">
                Review & Confirm Clinical Inference
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Confirm all patient parameters before triggering the multi-model machine learning ensemble
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-750 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Target Assessment & Model
                </span>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {diseaseConfig.name}
                </div>
                <div className="text-xs text-slate-500">
                  Ensemble: {diseaseConfig.models?.join(', ')}
                </div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  Cohort Validation AUC: {diseaseConfig.aucRoc || '0.92'}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-750 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Patient Summary
                </span>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {patientInfo.fullName || 'Anonymous Patient'} ({patientInfo.patientId})
                </div>
                <div className="text-xs text-slate-500">
                  Age: {patientInfo.age} | Sex: {patientInfo.gender}
                </div>
                <div className="text-xs text-slate-500 italic truncate">
                  Notes: {patientInfo.clinicalNotes || 'None'}
                </div>
              </div>
            </div>

            {/* Key Inputs Grid */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Input Parameter Summary ({diseaseConfig.fields.length} biomarkers)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs">
                {diseaseConfig.fields.map((f) => (
                  <div key={f.name} className="p-2.5 rounded-lg bg-slate-100/70 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                    <span className="text-slate-500 dark:text-slate-400 block truncate text-[11px]">{f.label}</span>
                    <span className="font-mono font-bold text-slate-850 dark:text-slate-100">
                      {formData[f.name] !== undefined ? formData[f.name] : '-'} {f.unit || ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {isLoading && (
              <LoadingSpinner
                size="lg"
                text="Running Stacking Ensemble & Uncertainty Quantification..."
              />
            )}
          </div>
        )}
      </div>

      {/* Stepper Footer Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
        <button
          type="button"
          onClick={handlePrevStep}
          disabled={currentStep === 1 || isLoading}
          className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-650 disabled:opacity-40 transition"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Previous Step
        </button>

        {currentStep < 4 ? (
          <button
            type="button"
            onClick={handleNextStep}
            className="inline-flex items-center px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 transition shadow-sm"
          >
            Continue to {STEPS[currentStep]?.title || 'Next'}
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="inline-flex items-center px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 transition shadow-sm"
          >
            {isLoading ? 'Computing Prediction...' : 'Execute Machine Learning Inference'}
            <Sparkles className="w-4 h-4 ml-2" />
          </button>
        )}
      </div>
    </div>
  );
}
