import api from './api';

/**
 * Cross-Risk Analysis Service
 *
 * Request format (sent to POST /api/cross-risk/analyze/):
 *   {
 *     "predictions": [
 *       { "disease": "heart",      "probability": 0.72, "risk_level": "High", "predicted_class": 1 },
 *       { "disease": "diabetes",   "probability": 0.68, "risk_level": "High", "predicted_class": 1 },
 *       { "disease": "liver",      "probability": 0.61, "risk_level": "High", "predicted_class": 1 },
 *       { "disease": "parkinsons", "probability": 0.22, "risk_level": "Low",  "predicted_class": 0 }
 *     ]
 *   }
 *
 * Response format (from Django backend):
 *   {
 *     "success": true,
 *     "data": {
 *       "radar_chart_data": [ { "disease": "Heart Disease", "score": 72.0 }, ... ],
 *       "scores": { "heart": 0.72, ... },
 *       "overall_priority": "HIGH",
 *       "primary_cluster": "Cardio-Metabolic Syndrome",
 *       "recommended_specialist": "Cardiologist & Endocrinologist",
 *       "detected_clusters": [...],
 *       "disclaimer": "...",
 *       ...
 *     }
 *   }
 */
export const crossRiskService = {
  /**
   * Sends cross-risk analysis request.
   *
   * @param {Object} payload - Must contain a `predictions` array.
   *   Each prediction: { disease, probability, risk_level, predicted_class }.
   *   Alternatively, a flat object { heart: 0.72, diabetes: 0.68, ... } is
   *   converted to predictions format automatically.
   * @returns {Object} Analysis result with radar_chart_data, scores, clusters, etc.
   * @throws {Error} Propagated API or validation error — never silenced.
   */
  async analyze(payload) {
    // Normalise: if caller passes a flat { heart: 0.72, ... } map or
    // { heart: { probability: 0.72 }, ... } map, convert to predictions list.
    let body = payload;

    if (payload && !payload.predictions && !payload.risks) {
      // Caller passed a flat or nested risk map — convert to predictions list
      const predictions = Object.entries(payload).map(([disease, val]) => {
        const prob = typeof val === 'number' ? val : (val?.probability ?? 0);
        return {
          disease,
          probability: prob,
          risk_level: prob >= 0.6 ? 'High' : prob >= 0.3 ? 'Moderate' : 'Low',
          predicted_class: prob >= 0.5 ? 1 : 0,
        };
      });
      body = { predictions };
    }

    // If payload already has { predictions: [...] }, send as-is.
    // Do NOT re-wrap — the payload is already in the correct format.
    const response = await api.post('/api/cross-risk/analyze/', body);

    // Backend wraps result in { success, data, ...result_fields }
    // Normalise: prefer response.data.data, fall back to response.data
    const result = response.data;
    if (result && result.success && result.data) {
      return result.data;
    }
    return result;
  },
};

export default crossRiskService;
