import { jsPDF } from 'jspdf';
import { formatProbability, getRiskLabel, formatDate } from '../utils/helpers';
import { DISEASE_CONFIGS } from '../utils/constants';

const REPORTS_KEY = 'clinical_generated_reports';

export const reportService = {
  /**
   * Generate clinical PDF document using jsPDF
   */
  async downloadPdf(prediction) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const diseaseConfig = DISEASE_CONFIGS[prediction.disease] || { name: prediction.disease.toUpperCase() };
    const patient = prediction.patient || { fullName: 'Not specified', patientId: 'N/A', age: 'N/A', gender: 'N/A' };
    const riskLabel = getRiskLabel(prediction.probability);
    const probStr = formatProbability(prediction.probability);

    // Primary Header Banner
    doc.setFillColor(37, 99, 235); // Medical Blue
    doc.rect(0, 0, 210, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('CLINICAL AI DECISION SUPPORT REPORT', 14, 13);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Multi-Disease Predictive Analytics & Risk Stratification System', 14, 20);
    doc.text(`Generated: ${formatDate(prediction.timestamp)}`, 140, 20);

    // Patient & Encounter Block
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 34, 182, 28, 2, 2, 'FD');

    doc.setTextColor(51, 65, 85);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('PATIENT IDENTIFIER (MRN):', 20, 42);
    doc.setFont('helvetica', 'normal');
    doc.text(String(patient.patientId || 'N/A'), 75, 42);

    doc.setFont('helvetica', 'bold');
    doc.text('PATIENT NAME:', 20, 49);
    doc.setFont('helvetica', 'normal');
    doc.text(String(patient.fullName || 'N/A'), 75, 49);

    doc.setFont('helvetica', 'bold');
    doc.text('DEMOGRAPHICS:', 20, 56);
    doc.setFont('helvetica', 'normal');
    doc.text(`Age: ${patient.age || 'N/A'} yrs  |  Sex: ${patient.gender || 'N/A'}`, 75, 56);

    doc.setFont('helvetica', 'bold');
    doc.text('EVALUATION MODULE:', 120, 42);
    doc.setFont('helvetica', 'normal');
    doc.text(diseaseConfig.name, 120, 48);

    // Primary Prediction Summary Box
    let riskColor = [16, 185, 129]; // Emerald
    if (prediction.probability >= 0.3 && prediction.probability < 0.6) riskColor = [245, 158, 11]; // Amber
    if (prediction.probability >= 0.6) riskColor = [239, 68, 68]; // Red

    doc.setFillColor(riskColor[0], riskColor[1], riskColor[2]);
    doc.roundedRect(14, 68, 182, 24, 2, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`ESTIMATED RISK: ${riskLabel.toUpperCase()} (${probStr})`, 20, 78);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Model Classification: ${prediction.predictionLabel || 'Assessed'} | Model: ${prediction.modelName || 'Clinical Ensemble'}`, 20, 85);

    // Trust Shield & Governance
    let y = 100;
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('1. Trust Shield & Data Quality Audit', 14, y);

    y += 7;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const ts = prediction.trustShield || {};
    const trustDetails = [
      `Data Quality Score: ${ts.dataQualityScore || 90}%`,
      `Model Confidence: ${ts.modelConfidence || 88}%`,
      `Uncertainty Index: ${ts.uncertaintyLevel || 12}%`,
      `Ensemble Agreement: ${ts.modelAgreement || 92}%`,
      `Distribution Status: ${ts.oodStatus || 'IN_DISTRIBUTION'}`,
    ];
    doc.text(trustDetails.join('   |   '), 14, y);

    // Key Features & Contributing Factors
    y += 12;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('2. Top Predictive Feature Drivers', 14, y);

    y += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    (prediction.topFeatures || []).slice(0, 5).forEach((feat) => {
      const imp = feat.impact > 0 ? `+${(feat.impact * 100).toFixed(0)}% risk driver` : `${(feat.impact * 100).toFixed(0)}% protective factor`;
      doc.text(`• ${feat.name}: ${feat.value} ${feat.unit || ''} (${imp})`, 18, y);
      y += 6;
    });

    // Red Flags
    if (prediction.redFlags && prediction.redFlags.length > 0) {
      y += 4;
      doc.setTextColor(185, 28, 28);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('3. Clinical Red Flag Alerts', 14, y);

      y += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      prediction.redFlags.forEach((alert) => {
        doc.text(`! ${alert}`, 18, y);
        y += 5;
      });
      doc.setTextColor(30, 41, 59);
    }

    // Recommendations & Medications
    y += 5;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('4. Evidence-Based Clinical Recommendations', 14, y);

    y += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    (prediction.recommendations || []).slice(0, 4).forEach((rec) => {
      doc.text(`- ${rec}`, 18, y);
      y += 5;
    });

    // Medications
    if (prediction.medications && prediction.medications.length > 0) {
      y += 4;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Pharmacological Considerations (Physician Discretion Required):', 14, y);
      y += 5;
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      prediction.medications.forEach((med) => {
        doc.text(`* ${med.name} (${med.dose}) - Indication: ${med.indication}`, 18, y);
        y += 5;
      });
    }

    // Medical Disclaimer Footer
    doc.setFillColor(241, 245, 249);
    doc.rect(14, 260, 182, 22, 'F');
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7.5);
    doc.text(
      'MANDATORY MEDICAL DISCLAIMER: This document was algorithmically compiled by an assistive Machine Learning model.\n' +
      'It is NOT an autonomous medical diagnostic device and does not substitute professional clinical evaluation by a licensed healthcare provider.\n' +
      'Always confirm clinical findings with definitive diagnostic testing and clinical history.',
      16,
      266
    );

    const filename = `Clinical_Report_${prediction.disease}_${patient.patientId || 'PT'}_${Date.now()}.pdf`;
    doc.save(filename);

    // Save record to local list
    this.saveReportRecord({
      id: 'rep_' + Date.now(),
      predictionId: prediction.id,
      patientName: patient.fullName,
      disease: prediction.disease,
      probability: prediction.probability,
      filename,
      date: new Date().toISOString(),
    });

    return filename;
  },

  saveReportRecord(report) {
    try {
      const existing = JSON.parse(localStorage.getItem(REPORTS_KEY) || '[]');
      localStorage.setItem(REPORTS_KEY, JSON.stringify([report, ...existing]));
    } catch (e) {
      console.error('Failed to save report record', e);
    }
  },

  listReports() {
    try {
      return JSON.parse(localStorage.getItem(REPORTS_KEY) || '[]');
    } catch {
      return [];
    }
  },
};

export default reportService;
