"""
Clinical PDF Report Generator for Multi-Disease Prediction System.

Constructs elegant, single-page medical prediction reports using ReportLab.
Includes patient vitals, predicted probability, uncertainty metrics,
trust badges, explainability drivers, physician red flags, and clinical disclaimers.
"""

import os
import uuid
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional, List

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, HRFlowable
)

from ml.src.data_ingestion import load_config

logger = logging.getLogger(__name__)


class ClinicalReportGenerator:
    """
    Renders structured clinical decision reports into PDF format.
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config if config is not None else load_config()
        self.output_dir = Path(
            self.config.get("paths", {}).get(
                "pdf_dir",
                "d:/AI based disease prediction using ml/multi_disease_prediction_system/ml/reports/generated_pdfs"
            )
        )
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.styles = getSampleStyleSheet()
        self._create_custom_styles()

    def _create_custom_styles(self) -> None:
        """Register custom typography styles."""
        self.styles.add(ParagraphStyle(
            name="ReportHeaderTitle",
            fontName="Helvetica-Bold",
            fontSize=16,
            leading=19,
            textColor=colors.HexColor("#0f172a")
        ))
        self.styles.add(ParagraphStyle(
            name="ReportSubTitle",
            fontName="Helvetica",
            fontSize=8.5,
            leading=11,
            textColor=colors.HexColor("#475569")
        ))
        self.styles.add(ParagraphStyle(
            name="SectionHeading",
            fontName="Helvetica-Bold",
            fontSize=10,
            leading=12,
            textColor=colors.HexColor("#1e293b"),
            spaceBefore=3,
            spaceAfter=2
        ))
        self.styles.add(ParagraphStyle(
            name="CellText",
            fontName="Helvetica",
            fontSize=7.5,
            leading=9.5,
            textColor=colors.HexColor("#334155")
        ))
        self.styles.add(ParagraphStyle(
            name="CellBold",
            fontName="Helvetica-Bold",
            fontSize=7.5,
            leading=9.5,
            textColor=colors.HexColor("#0f172a")
        ))
        self.styles.add(ParagraphStyle(
            name="DisclaimerText",
            fontName="Helvetica-Oblique",
            fontSize=6.5,
            leading=8.5,
            textColor=colors.HexColor("#64748b")
        ))

    def generate_report(
        self,
        prediction_result: Dict[str, Any],
        uncertainty_result: Optional[Dict[str, Any]] = None,
        explainability_result: Optional[Dict[str, Any]] = None,
        cross_risk_result: Optional[Dict[str, Any]] = None,
        patient_id: Optional[str] = None,
        output_filename: Optional[str] = None
    ) -> str:
        """
        Build a PDF report summarizing prediction and clinical audit findings.

        Args:
            prediction_result: Dict returned by InferenceEngine.predict().
            uncertainty_result: Dict returned by UncertaintyEstimator.
            explainability_result: Dict returned by DiseaseExplainer.
            cross_risk_result: Optional Dict returned by CrossRiskEngine.
            patient_id: Optional patient MRN/ID.
            output_filename: Optional custom output file path.

        Returns:
            Absolute file path to the generated PDF.
        """
        disease_name = prediction_result.get("disease", "generic").upper()
        report_id = f"REP-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        patient_mrn = patient_id or f"PT-{uuid.uuid4().hex[:6].upper()}"
        timestamp_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")

        if output_filename:
            pdf_path = Path(output_filename)
        else:
            pdf_path = self.output_dir / f"{disease_name.lower()}_{report_id}.pdf"

        doc = SimpleDocTemplate(
            str(pdf_path),
            pagesize=letter,
            leftMargin=36,
            rightMargin=36,
            topMargin=28,
            bottomMargin=28
        )

        elements: List[Any] = []

        # --- 1. HEADER BANNER ---
        header_data = [
            [
                Paragraph("<b>MULTI-DISEASE CLINICAL DECISION SUPPORT SYSTEM</b>", self.styles["ReportHeaderTitle"]),
                Paragraph(f"<b>Report ID:</b> {report_id}<br/><b>Date:</b> {timestamp_str}<br/><b>Patient MRN:</b> {patient_mrn}", self.styles["ReportSubTitle"])
            ]
        ]
        header_table = Table(header_data, colWidths=[5.2 * inch, 2.3 * inch])
        header_table.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ]))
        elements.append(header_table)
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#2563eb"), spaceAfter=5, spaceBefore=4))

        # --- 2. EXECUTIVE DIAGNOSTIC SUMMARY ---
        prob_pct = prediction_result.get("risk_percentage", round(prediction_result.get("probability", 0.0) * 100, 1))
        risk_level = prediction_result.get("risk_level", "Unknown").upper()
        pred_label = "POSITIVE FOR DISEASE" if prediction_result.get("prediction", 0) == 1 else "NEGATIVE (LOW RISK)"

        risk_color_map = {
            "CRITICAL": colors.HexColor("#dc2626"),
            "HIGH": colors.HexColor("#ea580c"),
            "MODERATE": colors.HexColor("#d97706"),
            "LOW": colors.HexColor("#16a34a")
        }
        accent_color = risk_color_map.get(risk_level, colors.HexColor("#2563eb"))

        trust_label = "RELIABLE"
        trust_score = 90.0
        if uncertainty_result:
            trust_label = uncertainty_result.get("classification", "RELIABLE")
            trust_score = uncertainty_result.get("trust_score", 90.0)

        summary_data = [
            [
                Paragraph("<b>EVALUATED MODULE:</b>", self.styles["CellBold"]),
                Paragraph(f"<b>{disease_name} PREDICTION</b>", self.styles["CellBold"]),
                Paragraph("<b>PREDICTION OUTCOME:</b>", self.styles["CellBold"]),
                Paragraph(f"<b>{pred_label}</b>", self.styles["CellBold"]),
            ],
            [
                Paragraph("<b>ESTIMATED RISK:</b>", self.styles["CellBold"]),
                Paragraph(f"<b>{prob_pct}%</b> ({risk_level} RISK)", self.styles["CellBold"]),
                Paragraph("<b>TRUST BADGE:</b>", self.styles["CellBold"]),
                Paragraph(f"<b>{trust_label}</b> (Score: {trust_score}/100)", self.styles["CellBold"]),
            ]
        ]
        summary_table = Table(summary_data, colWidths=[1.8 * inch, 2.0 * inch, 1.8 * inch, 1.9 * inch])
        summary_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f1f5f9")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ("LEFTPADDING", (0, 0), (-1, -1), 5),
            ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ]))
        elements.append(summary_table)
        elements.append(Spacer(1, 4))

        # --- 3. PATIENT BIOMARKERS / INPUT TABLE ---
        elements.append(Paragraph("<b>1. PATIENT BIOMARKERS & CLINICAL INPUTS</b>", self.styles["SectionHeading"]))
        raw_inputs = prediction_result.get("raw_inputs", {})
        input_items = list(raw_inputs.items())

        # Split inputs into 2 side-by-side columns of key-values
        mid = (len(input_items) + 1) // 2
        col1 = input_items[:mid]
        col2 = input_items[mid:]

        input_rows = []
        for i in range(max(len(col1), len(col2))):
            k1, v1 = col1[i] if i < len(col1) else ("", "")
            k2, v2 = col2[i] if i < len(col2) else ("", "")
            v1_str = f"{v1:.2f}" if isinstance(v1, float) else str(v1)
            v2_str = f"{v2:.2f}" if isinstance(v2, float) else str(v2)
            input_rows.append([
                Paragraph(f"{k1}:", self.styles["CellBold"]) if k1 else "",
                Paragraph(v1_str, self.styles["CellText"]) if k1 else "",
                Paragraph(f"{k2}:", self.styles["CellBold"]) if k2 else "",
                Paragraph(v2_str, self.styles["CellText"]) if k2 else ""
            ])

        if input_rows:
            vitals_table = Table(input_rows, colWidths=[2.2 * inch, 1.5 * inch, 2.2 * inch, 1.6 * inch])
            vitals_table.setStyle(TableStyle([
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
            ]))
            elements.append(vitals_table)
        elements.append(Spacer(1, 4))

        # --- 4. CLINICAL RED FLAGS ---
        red_flags = uncertainty_result.get("red_flags", []) if uncertainty_result else []
        if red_flags:
            elements.append(Paragraph("<b>2. URGENT CLINICAL RED FLAGS DETECTED</b>", self.styles["SectionHeading"]))
            rf_rows = [[
                Paragraph("<b>Rule</b>", self.styles["CellBold"]),
                Paragraph("<b>Measured</b>", self.styles["CellBold"]),
                Paragraph("<b>Physician Guidance</b>", self.styles["CellBold"])
            ]]
            for rf in red_flags:
                rf_rows.append([
                    Paragraph(rf.get("rule", ""), self.styles["CellText"]),
                    Paragraph(str(rf.get("patient_value", "")), self.styles["CellText"]),
                    Paragraph(f"<font color='#b91c1c'><b>{rf.get('message', '')}</b></font>", self.styles["CellText"])
                ])
            rf_table = Table(rf_rows, colWidths=[1.8 * inch, 1.1 * inch, 4.6 * inch])
            rf_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#fee2e2")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#fca5a5")),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ]))
            elements.append(rf_table)
            elements.append(Spacer(1, 4))

        # --- 5. EXPLAINABILITY: TOP RISK CONTRIBUTORS ---
        if explainability_result:
            elements.append(Paragraph("<b>3. KEY RISK CONTRIBUTORS (SHAP ATTRIBUTION)</b>", self.styles["SectionHeading"]))
            drivers = explainability_result.get("top_risk_drivers", [])[:3]
            protects = explainability_result.get("top_protective_factors", [])[:2]

            expl_rows = [[
                Paragraph("<b>Biomarker</b>", self.styles["CellBold"]),
                Paragraph("<b>Patient Value</b>", self.styles["CellBold"]),
                Paragraph("<b>Impact Direction</b>", self.styles["CellBold"]),
                Paragraph("<b>Attribution Weight</b>", self.styles["CellBold"])
            ]]
            for item in drivers:
                expl_rows.append([
                    Paragraph(item.get("feature", ""), self.styles["CellBold"]),
                    Paragraph(str(item.get("patient_value", "-")), self.styles["CellText"]),
                    Paragraph("<font color='#b91c1c'>Elevating Risk (+)</font>", self.styles["CellBold"]),
                    Paragraph(f"+{item.get('impact', 0.0):.3f}", self.styles["CellText"])
                ])
            for item in protects:
                expl_rows.append([
                    Paragraph(item.get("feature", ""), self.styles["CellBold"]),
                    Paragraph(str(item.get("patient_value", "-")), self.styles["CellText"]),
                    Paragraph("<font color='#15803d'>Protective (-)</font>", self.styles["CellBold"]),
                    Paragraph(f"{item.get('impact', 0.0):.3f}", self.styles["CellText"])
                ])

            expl_table = Table(expl_rows, colWidths=[2.2 * inch, 1.6 * inch, 2.2 * inch, 1.5 * inch])
            expl_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e2e8f0")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ]))
            elements.append(expl_table)
            elements.append(Spacer(1, 4))

        # --- 6. MULTI-DISEASE CROSS-RISK (IF PRESENT) ---
        if cross_risk_result and cross_risk_result.get("detected_clusters"):
            elements.append(Paragraph("<b>4. MULTI-ORGAN CROSS-RISK SYNDROMIC ANALYSIS</b>", self.styles["SectionHeading"]))
            clusters = cross_risk_result.get("detected_clusters", [])
            cluster_rows = [[
                Paragraph("<b>Syndromic Cluster</b>", self.styles["CellBold"]),
                Paragraph("<b>Priority</b>", self.styles["CellBold"]),
                Paragraph("<b>Recommended Specialist</b>", self.styles["CellBold"])
            ]]
            for c in clusters:
                cluster_rows.append([
                    Paragraph(c.get("cluster_name", ""), self.styles["CellBold"]),
                    Paragraph(f"<b>{c.get('priority', '')}</b>", self.styles["CellText"]),
                    Paragraph(c.get("specialist", ""), self.styles["CellText"])
                ])
            cross_table = Table(cluster_rows, colWidths=[3.0 * inch, 1.5 * inch, 3.0 * inch])
            cross_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#fef3c7")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#fde68a")),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ]))
            elements.append(cross_table)
            elements.append(Spacer(1, 4))

        # --- 7. CLINICAL GUIDELINES & PREVENTIVE RECOMMENDATIONS ---
        elements.append(Paragraph("<b>5. EVIDENCE-BASED PREVENTIVE & CLINICAL ACTIONS</b>", self.styles["SectionHeading"]))
        guidelines = [
            "• Immediate clinical review with primary care physician or appropriate specialist.",
            "• Targeted lifestyle interventions: Sodium restriction (<2g/day), aerobic conditioning, Mediterranean diet.",
            "• Serial biomarker re-evaluation within 30 to 90 days depending on initial risk classification.",
            "• Pharmacological therapy should only be initiated following confirmatory laboratory investigations."
        ]
        guide_p = Paragraph("<br/>".join(guidelines), self.styles["CellText"])
        elements.append(guide_p)
        elements.append(Spacer(1, 6))

        # --- 8. MANDATORY CLINICAL DISCLAIMER ---
        elements.append(HRFlowable(width="100%", thickness=0.75, color=colors.HexColor("#94a3b8"), spaceAfter=3, spaceBefore=2))
        disclaimer = (
            "<b>REGULATORY & MEDICAL DISCLAIMER:</b> This report is generated by an artificial intelligence decision "
            "support system designed exclusively to assist accredited healthcare professionals. It does not provide "
            "independent medical diagnosis, prognosis, or prescription. All interpretations, test orders, and therapeutic "
            "regimens must be authorized by a licensed attending physician following patient examination."
        )
        elements.append(Paragraph(disclaimer, self.styles["DisclaimerText"]))

        # Build document
        doc.build(elements)
        logger.info("Successfully generated clinical report PDF: %s", pdf_path)
        return str(pdf_path)


def generate_pdf_report(
    prediction_result: Dict[str, Any],
    uncertainty_result: Optional[Dict[str, Any]] = None,
    explainability_result: Optional[Dict[str, Any]] = None,
    cross_risk_result: Optional[Dict[str, Any]] = None,
    output_filename: Optional[str] = None
) -> str:
    """Convenience functional wrapper for PDF generation."""
    generator = ClinicalReportGenerator()
    return generator.generate_report(
        prediction_result=prediction_result,
        uncertainty_result=uncertainty_result,
        explainability_result=explainability_result,
        cross_risk_result=cross_risk_result,
        output_filename=output_filename
    )


if __name__ == "__main__":
    print("Testing report generator module...")
    mock_pred = {
        "disease": "heart",
        "prediction": 1,
        "probability": 0.84,
        "risk_percentage": 84.0,
        "risk_level": "Critical",
        "raw_inputs": {
            "age": 62, "sex": 1, "cp": 4, "trestbps": 160, "chol": 286,
            "fbs": 0, "restecg": 2, "thalach": 108, "exang": 1, "oldpeak": 2.6,
            "slope": 2, "ca": 2, "thal": 7
        }
    }
    mock_unc = {
        "classification": "CRITICAL_RED_FLAG",
        "trust_score": 55.0,
        "red_flags": [{
            "rule": "trestbps >= 160", "feature": "trestbps", "patient_value": 160,
            "message": "Hypertensive Stage 2: Elevated resting blood pressure."
        }]
    }
    try:
        path = generate_pdf_report(mock_pred, mock_unc)
        print("Report successfully generated at:", path)
    except Exception as err:
        print("Report generation error:", err)
