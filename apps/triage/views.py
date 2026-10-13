from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .services import TriageService


class TriagePriorityView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        """
        Evaluates one or multiple patient disease records and returns
        the clinical triage table sorted by urgency priority.
        """
        cases = request.data.get("cases")
        disease_type = request.data.get("disease_type")
        patient_data = request.data.get("data", {})

        results = []

        if cases and isinstance(cases, list):
            for item in cases:
                d_type = item.get("disease_type", "unknown")
                d_data = item.get("data", {})
                triage_eval = TriageService.evaluate(d_type, d_data)
                results.append(triage_eval)
        elif disease_type:
            triage_eval = TriageService.evaluate(disease_type, patient_data)
            results.append(triage_eval)
        else:
            return Response(
                {"error": "Please provide 'disease_type' with 'data' or a 'cases' list."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Sort by priority_code (1 = IMMEDIATE, 2 = URGENT, 3 = PRIORITY, 4 = ROUTINE)
        sorted_results = sorted(results, key=lambda x: x.get("priority_code", 4))

        return Response(
            {
                "status": "success",
                "count": len(sorted_results),
                "highest_priority": sorted_results[0]["priority"] if sorted_results else "ROUTINE",
                "triage_table": sorted_results,
            },
            status=status.HTTP_200_OK,
        )

    def get(self, request):
        """
        Returns clinical triage rules and reference priority levels.
        """
        reference_data = {
            "priority_levels": [
                {"level": "IMMEDIATE", "sla": "< 15 minutes", "action": "Resuscitation / Emergency transfer"},
                {"level": "URGENT", "sla": "< 24 hours", "action": "Inpatient or expedited specialist workup"},
                {"level": "PRIORITY", "sla": "< 1-2 weeks", "action": "Outpatient specialist consultation"},
                {"level": "ROUTINE", "sla": "< 30 days", "action": "Standard outpatient preventive follow-up"},
            ],
            "red_flag_categories": {
                "heart": ["Hypertensive crisis (>=180 mmHg)", "Severe ST depression (>=4.0 mm)", "Critical heart rate (>210 or <45 bpm)"],
                "diabetes": ["Extreme hyperglycemia (>=280 mg/dL)", "Severe hypoglycemia (<60 mg/dL)", "Severe hypertension (>=180 mmHg)"],
                "liver": ["Severe hyperbilirubinemia (>=10 mg/dL)", "Transaminitis ALT/AST (>=500 U/L)", "Severe hypoalbuminemia (<=2.0 g/dL)"],
                "parkinsons": ["Severe acoustic entropy / dysregulation (PPE >= 0.45)"],
            },
        }
        return Response(reference_data, status=status.HTTP_200_OK)
