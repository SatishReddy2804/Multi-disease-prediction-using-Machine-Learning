import api from './api';

// Local storage key for persistent history
const HISTORY_KEY = 'clinical_prediction_history';

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
    if (!raw || (raw.success === false && raw.error)) {
      throw new Error(raw.error || `Prediction inference failed for ${diseaseKey}.`);
    }

    const inner = raw.data || raw;

    // Normalize result structure for PredictionCard, TrustShieldPanel, and ReportService
    const prob = typeof inner.probability === 'number' ? inner.probability : parseFloat(inner.probability) || 0;
    const predResult = inner.prediction !== undefined ? inner.prediction : (inner.prediction_result !== undefined ? inner.prediction_result : (prob >= 0.5 ? 1 : 0));

    // Normalize recommendations: ensure every item is safely stringified
    const recommendations = (inner.prevention_guidance || []).map((tip) => {
      if (typeof tip === 'object' && tip !== null) {
        return tip.title ? `${tip.title}: ${tip.detail || tip.description || ''}` : (tip.detail || JSON.stringify(tip));
      }
      return String(tip);
    });

    // Normalize medications: ensure consistent object shape
    const medications = (inner.medicine_information || inner.medicines || []).map((med) => {
      if (typeof med === 'object' && med !== null) {
        return {
          name: med.name || med.class || 'Clinical Pharmacotherapy',
          dose: med.dose || med.class || med.purpose || 'Prescribed dose',
          indication: med.indication || med.purpose || med.note || med.usage_notes || '',
        };
      }
      return { name: String(med), dose: '', indication: '' };
    });

    // Normalize red flags: ensure strings
    const redFlags = (inner.red_flags || []).map((f) => {
      if (typeof f === 'object' && f !== null) {
        return f.alert || f.action || f.finding || JSON.stringify(f);
      }
      return String(f);
    });

    // Cross risk alert string
    const crossRiskAlert = typeof inner.cross_risk_findings === 'object' && inner.cross_risk_findings !== null
      ? (inner.cross_risk_findings.warning || inner.cross_risk_findings.message || JSON.stringify(inner.cross_risk_findings))
      : (inner.cross_risk_findings || null);

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
        patientId: patientInfo.patientId || 'PT-RECORD',
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
      redFlags,
      crossRiskAlert,
      recommendations,
      prevention_guidance: recommendations,
      medications,
      medicine_information: medications,
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
