import { DISEASE_CONFIGS } from './constants';

/**
 * Validate an individual field against its definition
 */
export function validateFieldValue(fieldDef, value) {
  if (value === undefined || value === null || value === '') {
    return 'This clinical field is required';
  }

  const num = Number(value);
  if (isNaN(num)) {
    return 'Value must be a valid number';
  }

  if (fieldDef.min !== undefined && num < fieldDef.min) {
    return `Value must be at least ${fieldDef.min} ${fieldDef.unit || ''}`;
  }

  if (fieldDef.max !== undefined && num > fieldDef.max) {
    return `Value must not exceed ${fieldDef.max} ${fieldDef.unit || ''}`;
  }

  return null;
}

/**
 * Validate complete form data for a specific disease
 */
export function validateDiseaseForm(diseaseKey, formData) {
  const config = DISEASE_CONFIGS[diseaseKey];
  if (!config) {
    return { isValid: false, errors: { form: 'Unknown disease module' } };
  }

  const errors = {};

  config.fields.forEach((field) => {
    const error = validateFieldValue(field, formData[field.name]);
    if (error) {
      errors[field.name] = error;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate patient metadata
 */
export function validatePatientInfo(patient) {
  const errors = {};
  if (!patient.patientId || !patient.patientId.trim()) {
    errors.patientId = 'Patient ID / MRN is required';
  }
  if (!patient.fullName || !patient.fullName.trim()) {
    errors.fullName = 'Patient name is required';
  }
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
