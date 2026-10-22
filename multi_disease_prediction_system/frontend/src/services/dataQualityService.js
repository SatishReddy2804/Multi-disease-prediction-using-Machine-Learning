import api from './api';
import { DISEASE_CONFIGS } from '../utils/constants';
import { calculateQualityMetrics, evaluateFeatureAnomaly } from '../utils/helpers';

export const dataQualityService = {
  async checkQuality(disease, inputs) {
    try {
      const response = await api.post(`/api/data-quality/check/`, { disease, inputs });
      return response.data;
    } catch {
      // Local calculation fallback
      const config = DISEASE_CONFIGS[disease] || { fields: [] };
      const baseMetrics = calculateQualityMetrics(inputs, config.fields);

      const fieldAudits = config.fields.map((field) => {
        const val = inputs[field.name];
        const anomaly = evaluateFeatureAnomaly(field, val);
        return {
          fieldName: field.name,
          label: field.label,
          value: val,
          unit: field.unit || '',
          status: anomaly.status,
          statusLabel: anomaly.label,
          alertText: field.normalRange?.alertText || null,
        };
      });

      const anomalousCount = fieldAudits.filter((f) => f.status === 'high' || f.status === 'critical').length;
      const readiness = baseMetrics.completeness >= 90 && baseMetrics.validity >= 90;

      return {
        disease,
        completeness: baseMetrics.completeness,
        validity: baseMetrics.validity,
        overallScore: baseMetrics.score,
        isReadyForPrediction: readiness,
        oodStatus: baseMetrics.score < 60 ? 'OUT_OF_BOUNDS' : 'IN_BOUNDS',
        anomalousCount,
        fieldAudits,
        notes: readiness
          ? 'Clinical parameters meet high-confidence ingestion criteria.'
          : 'Multiple required fields missing or out of standard physiological ranges.',
      };
    }
  },
};

export default dataQualityService;
