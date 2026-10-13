import api from './api';
import { predictionService } from './predictionService';

export const whatIfService = {
  async simulate(disease, originalInputs, modifiedInputs) {
    try {
      const response = await api.post('/what-if/simulate', {
        disease,
        original: originalInputs,
        modified: modifiedInputs,
      });
      return response.data;
    } catch {
      // Offline fallback: run baseline and modified through predictor
      const baseline = await predictionService.predict(disease, originalInputs);
      const modified = await predictionService.predict(disease, modifiedInputs);

      const delta = Number((modified.probability - baseline.probability).toFixed(3));
      const deltaPercent = Number((delta * 100).toFixed(1));

      // Calculate feature level impact ranking
      const impactRanking = Object.keys(modifiedInputs)
        .map((key) => {
          const origVal = Number(originalInputs[key]);
          const modVal = Number(modifiedInputs[key]);
          if (isNaN(origVal) || isNaN(modVal) || origVal === modVal) return null;

          const diffRatio = origVal !== 0 ? (modVal - origVal) / origVal : modVal - origVal;
          const estimatedImpact = Number((diffRatio * 15).toFixed(1));

          return {
            feature: key,
            originalValue: origVal,
            modifiedValue: modVal,
            changePercent: Number((diffRatio * 100).toFixed(1)),
            impactScore: Math.min(25, Math.max(-25, estimatedImpact)),
          };
        })
        .filter(Boolean)
        .sort((a, b) => Math.abs(b.impactScore) - Math.abs(a.impactScore));

      return {
        disease,
        baselineProbability: baseline.probability,
        modifiedProbability: modified.probability,
        delta,
        deltaPercent,
        riskReduced: delta < 0,
        impactRanking,
        summary:
          delta < 0
            ? `Target modifications achieve a ${Math.abs(deltaPercent)}% reduction in overall predicted risk.`
            : delta > 0
            ? `Modifications reflect an increase of ${deltaPercent}% in risk exposure.`
            : 'No significant risk variance detected with specified parameters.',
      };
    }
  },
};

export default whatIfService;
