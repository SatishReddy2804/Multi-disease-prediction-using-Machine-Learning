import { RISK_LEVELS } from './constants';

/**
 * Format probability value (accepts 0-1 or 0-100) into formatted string
 */
export function formatProbability(val, decimals = 1) {
  if (val === null || val === undefined || isNaN(val)) return '0.0%';
  const num = Number(val);
  const percentage = num > 1 ? num : num * 100;
  return `${percentage.toFixed(decimals)}%`;
}

/**
 * Get normalized numeric probability 0.0 - 1.0
 */
export function normalizeProbability(val) {
  if (val === null || val === undefined || isNaN(val)) return 0;
  const num = Number(val);
  return num > 1 ? num / 100 : num;
}

/**
 * Get risk classification object based on probability
 */
export function getRiskLevel(probability) {
  const norm = normalizeProbability(probability);
  if (norm < 0.3) return RISK_LEVELS.LOW;
  if (norm < 0.6) return RISK_LEVELS.MODERATE;
  if (norm < 0.85) return RISK_LEVELS.HIGH;
  return RISK_LEVELS.CRITICAL;
}

/**
 * Get color code corresponding to risk level
 */
export function getRiskColor(probability) {
  const norm = normalizeProbability(probability);
  if (norm < 0.3) return '#10B981'; // Emerald/Green
  if (norm < 0.6) return '#F59E0B'; // Amber/Warning
  if (norm < 0.85) return '#EF4444'; // Red/Danger
  return '#E11D48'; // Rose/Critical
}

/**
 * Get textual risk label
 */
export function getRiskLabel(probability) {
  return getRiskLevel(probability).label;
}

/**
 * Format timestamp or ISO string into human readable format
 */
export function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return String(dateStr);
  }
}

/**
 * Check if a specific clinical feature is in normal, low, high, or critical range
 */
export function evaluateFeatureAnomaly(fieldDef, value) {
  if (!fieldDef || value === undefined || value === null || value === '') {
    return { status: 'unknown', label: 'Not Provided' };
  }

  const numVal = parseFloat(value);
  if (isNaN(numVal)) return { status: 'normal', label: 'Categorical' };

  if (fieldDef.normalRange) {
    const { min, max } = fieldDef.normalRange;
    if (min !== undefined && numVal < min) {
      return { status: 'low', label: 'Below Normal', badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' };
    }
    if (max !== undefined && numVal > max) {
      const isCritical = max > 0 && numVal > max * 1.4;
      return {
        status: isCritical ? 'critical' : 'high',
        label: isCritical ? 'Critical High' : 'Elevated',
        badge: isCritical
          ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300'
          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
      };
    }
    return { status: 'normal', label: 'Normal Reference', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' };
  }

  return { status: 'normal', label: 'Normal Range', badge: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' };
}

/**
 * Calculate dataset completeness & validity metrics
 */
export function calculateQualityMetrics(formData, fields) {
  if (!fields || fields.length === 0) return { completeness: 100, validity: 100, score: 100, status: 'RELIABLE' };

  let filledCount = 0;
  let validCount = 0;

  fields.forEach(field => {
    const val = formData[field.name];
    if (val !== undefined && val !== null && val !== '') {
      filledCount++;
      const num = Number(val);
      let isValid = true;
      if (field.min !== undefined && num < field.min) isValid = false;
      if (field.max !== undefined && num > field.max) isValid = false;
      if (isValid) validCount++;
    }
  });

  const completeness = Math.round((filledCount / fields.length) * 100);
  const validity = filledCount > 0 ? Math.round((validCount / filledCount) * 100) : 100;
  const score = Math.round((completeness * 0.6) + (validity * 0.4));

  let status = 'RELIABLE';
  if (score < 75) status = 'UNCERTAIN';
  if (score < 50) status = 'OOD';

  return {
    completeness,
    validity,
    score,
    status,
    totalFields: fields.length,
    filledFields: filledCount,
    validFields: validCount,
  };
}

/**
 * Export JSON file download
 */
export function downloadJsonFile(data, filename = 'medical_report.json') {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
