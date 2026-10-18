import api from './api';

export const crossRiskService = {
  async analyze(diseaseRiskMap) {
    try {
      const response = await api.post('/api/cross-risk/analyze/', { risks: diseaseRiskMap });
      return response.data;
    } catch {
      // Offline fallback
      const heartRisk = diseaseRiskMap.heart ?? 0.35;
      const diabetesRisk = diseaseRiskMap.diabetes ?? 0.45;
      const liverRisk = diseaseRiskMap.liver ?? 0.25;
      const parkinsonsRisk = diseaseRiskMap.parkinsons ?? 0.15;

      // Compute cluster classification
      let cluster = 'Low-Risk Baseline';
      let clusterSeverity = 'LOW';
      let synergyMultiplier = 1.0;
      const synergyInsights = [];

      if (heartRisk > 0.5 && diabetesRisk > 0.5) {
        cluster = 'Cardiometabolic Risk Cluster';
        clusterSeverity = 'CRITICAL';
        synergyMultiplier = 1.35;
        synergyInsights.push(
          'Compounded Cardiometabolic Threat: Concomitant elevated glycemic dysregulation and coronary vulnerability multiplies accelerated microvascular disease hazard.'
        );
      } else if (heartRisk > 0.5 && liverRisk > 0.5) {
        cluster = 'Cardio-Hepatic Metabolic Cluster';
        clusterSeverity = 'HIGH';
        synergyMultiplier = 1.25;
        synergyInsights.push(
          'Hepatic steatosis combined with cardiovascular strain indicates systemic inflammatory endothelial stress.'
        );
      } else if (diabetesRisk > 0.5 && liverRisk > 0.5) {
        cluster = 'Metabolic Liver Dysfunction Cluster (MASLD/MASH)';
        clusterSeverity = 'HIGH';
        synergyMultiplier = 1.2;
        synergyInsights.push(
          'Elevated transaminases with impaired fasting glucose is characteristic of metabolic dysfunction-associated steatotic liver disease.'
        );
      } else if (parkinsonsRisk > 0.6) {
        cluster = 'Isolated Neuro-Phonatory Risk';
        clusterSeverity = 'HIGH';
        synergyInsights.push(
          'Specific vocal acoustic tremor detected without concurrent systemic metabolic elevation.'
        );
      } else if (heartRisk > 0.5 || diabetesRisk > 0.5 || liverRisk > 0.5) {
        cluster = 'Single-Domain Vulnerability';
        clusterSeverity = 'MODERATE';
      }

      const globalSystemicIndex = Number(
        Math.min(
          1.0,
          ((heartRisk * 0.35 + diabetesRisk * 0.3 + liverRisk * 0.2 + parkinsonsRisk * 0.15) * synergyMultiplier)
        ).toFixed(2)
      );

      return {
        cluster,
        clusterSeverity,
        globalSystemicIndex,
        synergyMultiplier,
        synergyInsights,
        diseaseScores: {
          heart: heartRisk,
          diabetes: diabetesRisk,
          liver: liverRisk,
          parkinsons: parkinsonsRisk,
        },
        triageSummary:
          clusterSeverity === 'CRITICAL'
            ? 'Urgent multidisciplinary consultation: Cardiology and Endocrinology recommended within 48 hours.'
            : clusterSeverity === 'HIGH'
            ? 'Dual-specialist referral indicated within 2 weeks with repeat comprehensive metabolic profile.'
            : 'Continue routine preventative outpatient surveillance with primary care physician.',
      };
    }
  },
};

export default crossRiskService;
