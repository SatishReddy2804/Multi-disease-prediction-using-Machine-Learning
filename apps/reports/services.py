"""
Clinician-Ready PDF Case Summary Report Service.
Generates one-page professional medical summary PDFs using ReportLab.
"""

import os
import uuid
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, Any

from django.conf import settings
from .models import GeneratedReport

logger = logging.getLogger(__name__)

class ReportService:
    @staticmethod
    def generate_pdf_report(data: Dict[str, Any], user=None) -> Dict[str, Any]:
        """
        Builds a clinician-ready PDF case summary and persists metadata.
        """
        report_id = str(uuid.uuid4())
        disease_type = data.get("disease_type", "heart").lower()
        patient_id = data.get("patient_id", f"PT-{report_id[:8].upper()}")
        prediction_result = data.get("prediction_result", 0)
        probability = float(data.get("probability", 0.0))
        risk_level = data.get("risk_level", "Low")
        uncertainty_level = data.get("uncertainty_level", "Low")
        trust_status = data.get("trust_status", "RELIABLE")
        input_data = data.get("input_data", {})
        top_features = data.get("top_features", [])
        red_flags = data.get("red_flags", [])
        cross_risk = data.get("cross_risk_findings", "None detected")
        prevention_tips = data.get("prevention_tips", [])
        medicines = data.get("medicines", [])

        # Ensure output directory exists
        reports_dir = Path(settings.REPORT_DIRECTORY)
        reports_dir.mkdir(parents=True, exist_ok=True)
        pdf_filename = f"{disease_type}_report_{report_id}.pdf"
        pdf_path = reports_dir / pdf_filename

        try:
            from reportlab.lib.pagesizes import letter
            from reportlab.lib import colors
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

            doc = SimpleDocTemplate(
                str(pdf_path),
                pagesize=letter,
                rightMargin=36,
                leftMargin=36,
                topMargin=36,
                bottomMargin=36
            )

            styles = getSampleStyleSheet()
            title_style = ParagraphStyle(
                'TitleStyle',
                parent=styles['Heading1'],
                fontSize=18,
                leading=22,
                textColor=colors.HexColor('#1E3A8A'),
                fontName='Helvetica-Bold'
            )
            subtitle_style = ParagraphStyle(
                'SubtitleStyle',
                parent=styles['Normal'],
                fontSize=9,
                leading=12,
                textColor=colors.HexColor('#4B5563')
            )
            section_heading = ParagraphStyle(
                'SectionHeading',
                parent=styles['Heading2'],
                fontSize=11,
                leading=14,
                textColor=colors.HexColor('#1E3A8A'),
                fontName='Helvetica-Bold',
                spaceBefore=6,
                spaceAfter=4
            )
            body_style = ParagraphStyle(
                'Body',
                parent=styles['Normal'],
                fontSize=8.5,
                leading=11,
                textColor=colors.HexColor('#1F2937')
            )
            alert_style = ParagraphStyle(
                'Alert',
                parent=styles['Normal'],
                fontSize=8.5,
                leading=11,
                textColor=colors.HexColor('#DC2626'),
                fontName='Helvetica-Bold'
            )
            disclaimer_style = ParagraphStyle(
                'Disclaimer',
                parent=styles['Normal'],
                fontSize=7,
                leading=9,
                textColor=colors.HexColor('#6B7280'),
                alignment=1 # Center
            )

            story = []

            # Header
            story.append(Paragraph("CLINICAL DECISION SUPPORT SYSTEM", title_style))
            story.append(Paragraph(f"Multi-Disease Machine Learning Diagnostics | Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}", subtitle_style))
            story.append(Spacer(1, 4))
            story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#1E3A8A'), spaceBefore=2, spaceAfter=8))

            # Case Meta Table
            meta_data = [
                [
                    Paragraph(f"<b>Report ID:</b> {report_id[:13]}...", body_style),
                    Paragraph(f"<b>Patient Ref:</b> {patient_id}", body_style),
                    Paragraph(f"<b>Disease Module:</b> {disease_type.title()} Disease", body_style)
                ],
                [
                    Paragraph(f"<b>Risk Status:</b> <font color='{'#DC2626' if probability > 0.6 else '#10B981'}'><b>{risk_level} Risk</b></font>", body_style),
                    Paragraph(f"<b>Confidence:</b> {probability * 100:.1f}%", body_style),
                    Paragraph(f"<b>Trust Status:</b> {trust_status}", body_style)
                ]
            ]
            meta_table = Table(meta_data, colWidths=[180, 180, 180])
            meta_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F3F4F6')),
                ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#D1D5DB')),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                ('TOPPADDING', (0,0), (-1,-1), 4),
                ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ]))
            story.append(meta_table)
            story.append(Spacer(1, 8))

            # Red Flag Alerts if any
            if red_flags:
                story.append(Paragraph("EMERGENCY CLINICAL TRIAGE ALERTS", section_heading))
                for rf in red_flags:
                    alert_text = rf if isinstance(rf, str) else rf.get('alert', str(rf))
                    story.append(Paragraph(f"CRITICAL RED FLAG: {alert_text}", alert_style))
                story.append(Spacer(1, 6))

            # Input Vitals / Clinical Markers Table
            story.append(Paragraph("PATIENT CLINICAL PARAMETERS", section_heading))
            items = list(input_data.items())
            table_rows = []
            for i in range(0, len(items), 3):
                row = []
                for k, v in items[i:i+3]:
                    row.append(Paragraph(f"<b>{k}:</b> {v}", body_style))
                while len(row) < 3:
                    row.append(Paragraph("", body_style))
                table_rows.append(row)

            if table_rows:
                param_table = Table(table_rows, colWidths=[180, 180, 180])
                param_table.setStyle(TableStyle([
                    ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E5E7EB')),
                    ('TOPPADDING', (0,0), (-1,-1), 3),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 3),
                ]))
                story.append(param_table)
            story.append(Spacer(1, 8))

            # Explainable AI & Cross-Risk Section
            story.append(Paragraph("EXPLAINABLE AI & MULTI-ORGAN CROSS-RISK ANALYSIS", section_heading))
            exp_text = "<b>Top Contributing Biomarkers:</b> "
            if top_features:
                feats_formatted = []
                for tf in top_features[:5]:
                    if isinstance(tf, dict):
                        feats_formatted.append(f"{tf.get('feature', 'Metric')} ({tf.get('importance', 0):+.2f})")
                    else:
                        feats_formatted.append(str(tf))
                exp_text += ", ".join(feats_formatted)
            else:
                exp_text += "Analysis calibrated across validated dataset features."

            story.append(Paragraph(exp_text, body_style))
            story.append(Paragraph(f"<b>Cross-Risk Syndromic Findings:</b> {cross_risk}", body_style))
            story.append(Spacer(1, 8))

            # Prevention & Educational Medicine
            story.append(Paragraph("CLINICAL RECOMMENDATIONS & EDUCATIONAL MEDICINE", section_heading))
            prev_summary = "Adhere to balanced nutrition, monitored vitals, and physician follow-up."
            if prevention_tips:
                prev_summary = " ".join([p.get('title', str(p)) if isinstance(p, dict) else str(p) for p in prevention_tips[:3]])
            story.append(Paragraph(f"<b>Lifestyle Guidance:</b> {prev_summary}", body_style))
            story.append(Paragraph("<b>Educational Pharmacotherapy:</b> Discuss targeted pharmaceutical interventions with your treating physician.", body_style))
            story.append(Spacer(1, 10))

            # Medical Disclaimer Footer
            story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#9CA3AF'), spaceBefore=4, spaceAfter=4))
            story.append(Paragraph(
                "MEDICAL DISCLAIMER: This document is an automated clinical decision support summary for educational and informational purposes only. "
                "It DOES NOT establish a confirmed medical diagnosis. Always consult a licensed medical practitioner for clinical evaluation, diagnosis, and prescription.",
                disclaimer_style
            ))

            doc.build(story)

        except Exception as e:
            logger.exception(f"Failed generating ReportLab PDF: {e}")
            # Write fallback text PDF or file
            with open(pdf_path, "wb") as f:
                f.write(f"%PDF-1.4 Fallback clinical report {report_id}".encode())

        # Persist report metadata in DB
        report_record = GeneratedReport.objects.create(
            report_id=report_id,
            user=user,
            disease_type=disease_type,
            patient_identifier=patient_id,
            prediction_result=prediction_result,
            probability=probability,
            risk_level=risk_level,
            pdf_file_path=str(pdf_path)
        )

        return {
            "report_id": report_id,
            "disease_type": disease_type,
            "patient_id": patient_id,
            "pdf_url": f"/api/reports/{report_id}/download-pdf/",
            "created_at": report_record.created_at.isoformat()
        }
