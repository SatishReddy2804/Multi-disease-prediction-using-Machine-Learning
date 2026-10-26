import api from './api';

/**
 * Counterfactual What-If Simulation API Service
 *
 * Interacts with the backend ML inference engine at POST /api/what-if/simulate/
 * to evaluate genuine counterfactual risk adjustments without fabricated fallbacks.
 */
export const whatIfService = {
  /**
   * Execute counterfactual simulation.
   *
   * @param {string} disease - Disease identifier ('heart', 'diabetes', 'parkinsons', 'liver')
   * @param {Object} originalInputs - Complete baseline patient clinical parameters
   * @param {Object} modifiedInputs - Modified actionable parameters to evaluate
   * @returns {Promise<Object>} Genuine ML simulation comparison result
   * @throws {Error} Propagated backend or network error
   */
  async simulate(disease, originalInputs, modifiedInputs) {
    const payload = {
      disease_type: disease.toLowerCase().trim(),
      disease: disease.toLowerCase().trim(),
      original_input: originalInputs,
      original: originalInputs,
      modified_values: modifiedInputs,
      modified: modifiedInputs,
    };

    // Post to genuine backend ML simulation endpoint
    const response = await api.post('/api/what-if/simulate/', payload);
    const data = response.data;

    // Normalize response from { success: true, data: {...} } or direct object
    const result = data?.data || data;

    if (!result || result.success === false) {
      throw new Error(result?.error || 'Counterfactual simulation failed.');
    }

    // Return normalized comparison structure
    return {
      ...result,
      disease: result.disease_type || disease,
      baselineProbability: result.baseline_probability ?? result.original_risk?.probability ?? 0,
      modifiedProbability: result.counterfactual_probability ?? result.modified_risk?.probability ?? 0,
      delta: result.delta ?? result.what_if_result?.absolute_change ?? 0,
      deltaPercent: result.deltaPercent ?? result.what_if_result?.percentage_points_change ?? 0,
      riskReduced: (result.delta ?? result.what_if_result?.absolute_change ?? 0) < 0,
      impactRanking: result.impactRanking ?? result.ranked_interventions ?? [],
      summary: result.summary ?? result.what_if_result?.message ?? '',
      disclaimer: result.disclaimer ?? result.medical_disclaimer ?? '',
    };
  },
};

export default whatIfService;
