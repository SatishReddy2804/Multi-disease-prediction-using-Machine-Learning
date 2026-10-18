import api from './api';

// Local storage key for persistent history
const HISTORY_KEY = 'clinical_prediction_history';

/**
 * Generate medical clinical response structure
 */
function generateSimulatedResult(disease, inputData, patientInfo = {}) {
  let riskScore = 0.25;
  let features = [];
  let redFlags = [];
  let recommendations = [];
  let medications = [];

  const values = { ...inputData };

  if (disease === 'heart') {
    let score = 0;
    if (Number(values.age) > 55) score += 0.2;
    if (Number(values.trestbps) > 140) score += 0.25;
    if (Number(values.chol) > 240) score += 0.2;
    if (Number(values.cp) > 0) score += 0.2;
    if (Number(values.exang) === 1) score += 0.15;
    if (Number(values.oldpeak) > 1.5) score += 0.2;
    riskScore = Math.min(0.96, Math.max(0.08, score));

    features = [
      { name: 'ST Depression (Oldpeak)', value: values.oldpeak, impact: 0.28, unit: 'mm' },
      { name: 'Chest Pain Type', value: values.cp, impact: 0.22, unit: 'type' },
      { name: 'Resting Blood Pressure', value: values.trestbps, impact: 0.18, unit: 'mm Hg' },
      { name: 'Serum Cholesterol', value: values.chol, impact: 0.15, unit: 'mg/dl' },
      { name: 'Max Heart Rate (thalach)', value: values.thalach, impact: -0.17, unit: 'bpm' },
    ];

    if (riskScore > 0.6) {
      redFlags.push('High ST depression with exertional angina indicative of acute coronary stenosis.');
      if (Number(values.trestbps) > 160) {
        redFlags.push('Stage 2 systolic hypertension requires immediate anti-hypertensive titration.');
      }
    }

    recommendations = [
      'Comprehensive 12-lead Electrocardiography and echocardiogram consultation.',
      'Initiate cardiac dietary restriction (Mediterranean, <2g sodium daily).',
      'Supervised cardiac exercise rehab after cardiology clearance.',
      'Regular ambulatory BP monitoring log.',
    ];

    medications = [
      { name: 'Atorvastatin', dose: '20-40mg daily', indication: 'HMG-CoA reductase inhibitor for plaque stabilization' },
      { name: 'Metoprolol Succinate', dose: '25-50mg daily', indication: 'Beta-blocker for myocardial rate and oxygen reduction' },
      { name: 'Aspirin (Enteric Coated)', dose: '81mg daily', indication: 'Antiplatelet prophylaxis' },
    ];
  } else if (disease === 'diabetes') {
    let score = 0;
    if (Number(values.Glucose) > 140) score += 0.4;
    if (Number(values.BMI) > 30) score += 0.25;
    if (Number(values.Age) > 45) score += 0.15;
    if (Number(values.DiabetesPedigreeFunction) > 0.5) score += 0.15;
    riskScore = Math.min(0.95, Math.max(0.05, score));

    features = [
      { name: '2-hr Plasma Glucose', value: values.Glucose, impact: 0.38, unit: 'mg/dL' },
      { name: 'Body Mass Index (BMI)', value: values.BMI, impact: 0.26, unit: 'kg/m²' },
      { name: 'Age', value: values.Age, impact: 0.16, unit: 'yrs' },
      { name: 'Pedigree Function', value: values.DiabetesPedigreeFunction, impact: 0.12, unit: 'score' },
      { name: 'Serum Insulin', value: values.Insulin, impact: 0.08, unit: 'μU/mL' },
    ];

    if (riskScore > 0.6) {
      redFlags.push('Postprandial glucose markedly above diabetic threshold (140-200 mg/dL).');
      if (Number(values.BMI) >= 35) redFlags.push('Severe obesity exacerbating peripheral insulin resistance.');
    }

    recommendations = [
      'Obtain laboratory HbA1c test within 7 days for chronic glycemic assessment.',
      'Nutritional counseling focusing on low glycemic index foods.',
      'Minimum 150 minutes of moderate aerobic activity weekly.',
      'Annual diabetic retinal screen and microalbuminuria urine test.',
    ];

    medications = [
      { name: 'Metformin HCl', dose: '500-1000mg BID with meals', indication: 'First-line biguanide insulin sensitizer' },
      { name: 'Empagliflozin', dose: '10mg once daily', indication: 'SGLT2 inhibitor for cardiorenal protection' },
    ];
  } else if (disease === 'parkinsons') {
    let score = 0.2;
    if (Number(values['MDVP:Jitter(%)']) > 0.008) score += 0.25;
    if (Number(values['MDVP:Shimmer']) > 0.035) score += 0.25;
    if (Number(values['HNR']) < 18) score += 0.2;
    if (Number(values['spread1']) > -5.0) score += 0.2;
    riskScore = Math.min(0.94, Math.max(0.06, score));

    features = [
      { name: 'MDVP:Shimmer', value: values['MDVP:Shimmer'], impact: 0.31, unit: 'ratio' },
      { name: 'MDVP:Jitter(%)', value: values['MDVP:Jitter(%)'], impact: 0.27, unit: '%' },
      { name: 'Harmonics-to-Noise Ratio (HNR)', value: values['HNR'], impact: -0.21, unit: 'dB' },
      { name: 'Spread 1 Nonlinear Metric', value: values['spread1'], impact: 0.15, unit: 'log' },
      { name: 'Pitch Period Entropy (PPE)', value: values['PPE'], impact: 0.12, unit: 'entropy' },
    ];

    if (riskScore > 0.6) {
      redFlags.push('Elevated vocal cycle shimmer & frequency jitter indicates laryngeal tremor.');
      redFlags.push('Low harmonics-to-noise ratio reflects acoustic dysphonia.');
    }

    recommendations = [
      'Referral to Movement Disorder Neurologist for UPDRS motor evaluation.',
      'Evaluate for cardinal signs: resting tremor, rigidity, bradykinesia, postural instability.',
      'Speech and language therapy assessment (Lee Silverman Voice Treatment).',
      'High-resolution brain MRI to rule out secondary parkinsonism.',
    ];

    medications = [
      { name: 'Levodopa / Carbidopa (Sinemet)', dose: '25/100mg TID', indication: 'Dopamine precursor substitution therapy' },
      { name: 'Rasagiline', dose: '1mg daily', indication: 'MAO-B inhibitor neuroprotection' },
    ];
  } else if (disease === 'liver') {
    let score = 0.15;
    if (Number(values.Total_Bilirubin) > 1.3) score += 0.3;
    if (Number(values.Alamine_Aminotransferase) > 50) score += 0.25;
    if (Number(values.Alkaline_Phosphotase) > 200) score += 0.2;
    if (Number(values.Albumin) < 3.4) score += 0.2;
    riskScore = Math.min(0.93, Math.max(0.07, score));

    features = [
      { name: 'Total Bilirubin', value: values.Total_Bilirubin, impact: 0.34, unit: 'mg/dL' },
      { name: 'ALT / SGPT Transaminase', value: values.Alamine_Aminotransferase, impact: 0.29, unit: 'IU/L' },
      { name: 'Alkaline Phosphatase', value: values.Alkaline_Phosphotase, impact: 0.19, unit: 'IU/L' },
      { name: 'Serum Albumin', value: values.Albumin, impact: -0.18, unit: 'g/dL' },
      { name: 'AST / SGOT Transaminase', value: values.Aspartate_Aminotransferase, impact: 0.14, unit: 'IU/L' },
    ];

    if (riskScore > 0.6) {
      redFlags.push('Marked transaminitis and hyperbilirubinemia suggest active hepatic parenchymal injury.');
      if (Number(values.Albumin) < 3.0) redFlags.push('Hypoalbuminemia suggests chronic synthetic liver compromise.');
    }

    recommendations = [
      'Comprehensive viral hepatitis serologies (HBsAg, Anti-HCV, Anti-HAV IgM).',
      'Abdominal hepatic Doppler ultrasound to examine liver parenchymal texture.',
      'Immediate cessation of all hepatotoxic medications, alcohol, and herbal supplements.',
      'Repeat liver panel in 2-4 weeks to monitor trend.',
    ];

    medications = [
      { name: 'Ursodeoxycholic Acid (UDCA)', dose: '300mg BID', indication: 'Hepatoprotective bile acid modifier' },
      { name: 'Silymarin Complex', dose: '140mg TID', indication: 'Antioxidant adjuvant liver support' },
    ];
  }

  // Cross-risk estimation
  const crossRiskAlert =
    riskScore > 0.65
      ? disease === 'diabetes'
        ? 'High diabetes risk correlates with elevated cardiovascular and metabolic liver steatosis vulnerability.'
        : disease === 'heart'
        ? 'Cardiovascular stress frequently interacts with systemic microvascular and renal strain.'
        : null
      : null;

  const dataQualityScore = 92;
  const confidence = Math.round(85 + Math.random() * 10);
  const uncertainty = Math.round((1 - Math.abs(riskScore - 0.5) * 1.6) * 35);
  const agreement = Math.round(88 + Math.random() * 10);
  const oodStatus = 'IN_DISTRIBUTION';
  const trustStatus = riskScore > 0.45 && riskScore < 0.55 ? 'UNCERTAIN' : 'RELIABLE';

  return {
    id: 'pred_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    disease,
    timestamp: new Date().toISOString(),
    patient: {
      patientId: patientInfo.patientId || 'PT-' + Math.floor(100000 + Math.random() * 900000),
      fullName: patientInfo.fullName || 'Anonymous Patient',
      age: patientInfo.age || values.age || values.Age || 48,
      gender: patientInfo.gender || (values.sex === 1 || values.Gender === 1 ? 'Male' : 'Female'),
    },
    inputs: values,
    probability: Number(riskScore.toFixed(3)),
    predictionLabel: riskScore >= 0.5 ? 'Positive Risk Detected' : 'Low Risk / Negative',
    riskLevel: riskScore < 0.3 ? 'LOW' : riskScore < 0.6 ? 'MODERATE' : riskScore < 0.85 ? 'HIGH' : 'CRITICAL',
    trustShield: {
      dataQualityScore,
      modelConfidence: confidence,
      uncertaintyLevel: uncertainty,
      modelAgreement: agreement,
      oodStatus,
      finalStatus: trustStatus,
    },
    topFeatures: features,
    redFlags,
    crossRiskAlert,
    recommendations,
    medications,
    modelName: 'Ensemble Blending (XGBoost + RF + CatBoost)',
  };
}

/**
 * Save prediction to local storage history
 */
function saveToHistory(record) {
  try {
    const existing = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const updated = [record, ...existing.slice(0, 99)]; // keep latest 100
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save prediction to history', err);
  }
}

export const predictionService = {
  async predict(disease, data, patientInfo = {}) {
    const diseaseKey = disease.toLowerCase().trim();
    const response = await api.post(`/api/predict/${diseaseKey}/`, {
      inputs: data,
      patient: patientInfo,
      ...data,
    });

    const raw = response.data;
    const inner = raw.data || raw;

    // Normalize result structure for PredictionCard, TrustShieldPanel, and ReportService
    const prob = typeof inner.probability === 'number' ? inner.probability : parseFloat(inner.probability) || 0;
    const predResult = inner.prediction !== undefined ? inner.prediction : (inner.prediction_result !== undefined ? inner.prediction_result : (prob >= 0.5 ? 1 : 0));

    const normalizedData = {
      ...inner,
      id: inner.prediction_id || 'pred_' + Date.now(),
      disease: diseaseKey,
      probability: prob,
      prediction: predResult,
      prediction_result: predResult,
      predictionLabel: inner.prediction_label || (predResult === 1 ? 'High Risk Detected' : 'Low Risk / Normal Profile'),
      risk_level: inner.risk_level || (prob >= 0.75 ? 'Critical' : prob >= 0.5 ? 'High' : prob >= 0.25 ? 'Moderate' : 'Low'),
      riskLevel: inner.risk_level || (prob >= 0.75 ? 'CRITICAL' : prob >= 0.5 ? 'HIGH' : prob >= 0.25 ? 'MODERATE' : 'LOW'),
      modelName: inner.model_used || inner.model_name || 'Machine Learning Estimator',
      model_used: inner.model_used || inner.model_name || 'Machine Learning Estimator',
      patient: {
        patientId: patientInfo.patientId || 'PT-' + Math.floor(100000 + Math.random() * 900000),
        fullName: patientInfo.fullName || 'Anonymous Patient',
        age: patientInfo.age || data.age || data.Age || 48,
        gender: patientInfo.gender || (data.sex === 1 || data.Gender === 'Male' || data.Gender === 1 ? 'Male' : 'Female'),
        ...patientInfo,
      },
      inputs: data,
      trustShield: {
        dataQualityScore: inner.data_quality?.quality_score || inner.data_quality?.score || 95,
        modelConfidence: Math.round((1 - Math.abs(prob - 0.5) * 0.4) * 95),
        uncertaintyLevel: inner.uncertainty?.uncertainty_level === 'High' ? 45 : 12,
        modelAgreement: inner.uncertainty?.model_agreement || 94,
        oodStatus: inner.uncertainty?.ood_status ? 'OUT_OF_DISTRIBUTION' : 'IN_DISTRIBUTION',
        finalStatus: inner.uncertainty?.trust_status || (prob >= 0.4 && prob <= 0.6 ? 'UNCERTAIN' : 'RELIABLE'),
      },
      topFeatures: inner.explainability?.top_features || [],
      redFlags: (inner.red_flags || []).map((f) => (typeof f === 'object' ? f.alert || f.action || JSON.stringify(f) : String(f))),
      crossRiskAlert: inner.cross_risk_findings || null,
      recommendations: inner.prevention_guidance || [],
      prevention_guidance: inner.prevention_guidance || [],
      medications: inner.medicine_information || inner.medicines || [],
      medicine_information: inner.medicine_information || inner.medicines || [],
      disclaimer: inner.disclaimer || '',
      timestamp: inner.timestamp || new Date().toISOString(),
    };

    saveToHistory(normalizedData);

    // Return object compatible with both res.data.data and direct res.probability
    return {
      success: true,
      data: {
        success: true,
        data: normalizedData,
        ...normalizedData,
      },
      ...normalizedData,
    };
  },

  async predictHeart(data, patientInfo) {
    return this.predict('heart', data, patientInfo);
  },

  async predictDiabetes(data, patientInfo) {
    return this.predict('diabetes', data, patientInfo);
  },

  async predictParkinsons(data, patientInfo) {
    return this.predict('parkinsons', data, patientInfo);
  },

  async predictLiver(data, patientInfo) {
    return this.predict('liver', data, patientInfo);
  },

  async batchPredict(batchData) {
    const response = await api.post('/api/predict/batch/', batchData);
    return response.data;
  },

  getHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  getPredictionById(id) {
    const list = this.getHistory();
    return list.find((item) => item.id === id) || null;
  },

  clearHistory() {
    localStorage.removeItem(HISTORY_KEY);
  },
};

export default predictionService;
