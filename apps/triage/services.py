import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)


class TriageService:
    """
    Clinical Triage Decision Support Service.
    Evaluates patient biomarkers against clinical critical alert thresholds.
    """

    PRIORITY_LEVELS = {
        "IMMEDIATE": 1,
        "URGENT": 2,
        "PRIORITY": 3,
        "ROUTINE": 4,
    }

    @classmethod
    def evaluate_heart(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        flags: List[Dict[str, Any]] = []

        trestbps = float(data.get("trestbps", 0) or 0)
        oldpeak = float(data.get("oldpeak", 0) or 0)
        thalach = float(data.get("thalach", 0) or 0)
        cp = int(data.get("cp", 0) or 0)
        ca = int(data.get("ca", 0) or 0)

        # 1. Hypertensive Crisis
        if trestbps >= 180:
            flags.append({
                "priority": "IMMEDIATE",
                "finding": f"Resting Blood Pressure critically elevated ({trestbps} mmHg)",
                "risk": "Acute hypertensive emergency with risk of encephalopathy, aortic dissection, or acute MI",
                "action": "Immediate emergency department transfer for parenteral antihypertensive therapy",
                "specialist": "Emergency Physician / Cardiologist",
            })
        elif trestbps >= 160 or (0 < trestbps <= 85):
            flags.append({
                "priority": "URGENT",
                "finding": f"Severe blood pressure abnormality ({trestbps} mmHg)",
                "risk": "Accelerated hypertension or hemodynamic compromise",
                "action": "Urgent medical evaluation within 24 hours",
                "specialist": "Cardiologist",
            })

        # 2. ST segment depression
        if oldpeak >= 4.0:
            flags.append({
                "priority": "IMMEDIATE",
                "finding": f"Severe exercise-induced ST depression ({oldpeak} mm)",
                "risk": "Critical transmural myocardial ischemia / severe coronary artery disease",
                "action": "Immediate coronary evaluation and urgent angiographic consultation",
                "specialist": "Interventional Cardiologist",
            })
        elif oldpeak >= 2.5:
            flags.append({
                "priority": "URGENT",
                "finding": f"Significant ST depression ({oldpeak} mm)",
                "risk": "Myocardial ischemia under stress",
                "action": "Cardiology referral within 48-72 hours for stress echocardiography",
                "specialist": "Cardiologist",
            })

        # 3. Critical Heart Rate
        if thalach > 210 or (0 < thalach < 45):
            flags.append({
                "priority": "IMMEDIATE",
                "finding": f"Critical heart rate ({thalach} bpm)",
                "risk": "Severe tachyarrhythmia or dangerous bradyarrhythmia / heart block",
                "action": "Immediate 12-lead ECG and emergency cardiac monitoring",
                "specialist": "Cardiologist / Electrophysiologist",
            })

        # 4. Multi-vessel involvement with angina
        if ca >= 3 and cp in [3, 4]:
            flags.append({
                "priority": "URGENT",
                "finding": "Three or more major fluoroscopy vessels with symptomatic chest pain",
                "risk": "Triple-vessel coronary artery disease with high revascularization need",
                "action": "Urgent cardiothoracic and coronary catheterization evaluation",
                "specialist": "Cardiothoracic Surgeon / Cardiologist",
            })

        return cls._aggregate_flags(flags, disease_type="heart")

    @classmethod
    def evaluate_diabetes(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        flags: List[Dict[str, Any]] = []

        glucose = float(data.get("glucose", data.get("Glucose", 0)) or 0)
        bp = float(data.get("blood_pressure", data.get("BloodPressure", 0)) or 0)
        bmi = float(data.get("bmi", data.get("BMI", 0)) or 0)

        # 1. Glycemic Emergencies
        if glucose >= 280:
            flags.append({
                "priority": "IMMEDIATE",
                "finding": f"Critically high glucose ({glucose} mg/dL)",
                "risk": "Imminent risk of Diabetic Ketoacidosis (DKA) or Hyperosmolar Hyperglycemic State (HHS)",
                "action": "Emergency medical stabilization, ketone evaluation, and IV hydration/insulin",
                "specialist": "Emergency Medicine / Endocrinologist",
            })
        elif 0 < glucose < 60:
            flags.append({
                "priority": "IMMEDIATE",
                "finding": f"Dangerous hypoglycemia ({glucose} mg/dL)",
                "risk": "Neuroglycopenic crisis, loss of consciousness, or seizure",
                "action": "Immediate oral fast-acting carbohydrates or IV dextrose / glucagon rescue",
                "specialist": "Emergency Physician / Endocrinologist",
            })
        elif glucose >= 200:
            flags.append({
                "priority": "URGENT",
                "finding": f"Severe hyperglycemia ({glucose} mg/dL)",
                "risk": "Uncontrolled glycemic state leading to progressive microvascular damage",
                "action": "Endocrine evaluation within 48 hours for immediate medication adjustment",
                "specialist": "Endocrinologist",
            })

        # 2. Blood pressure co-morbidity
        if bp >= 180:
            flags.append({
                "priority": "IMMEDIATE",
                "finding": f"Critically elevated blood pressure in diabetic profile ({bp} mmHg)",
                "risk": "Hypertensive crisis exacerbating acute diabetic kidney or retinal injury",
                "action": "Immediate emergency department evaluation",
                "specialist": "Emergency Physician / Nephrologist",
            })
        elif bp >= 150:
            flags.append({
                "priority": "URGENT",
                "finding": f"Stage 2 hypertension ({bp} mmHg)",
                "risk": "Accelerated diabetic nephropathy and cardiovascular risk",
                "action": "Prompt nephrology/cardiology consultation within 1 week",
                "specialist": "Endocrinologist / Cardiologist",
            })

        if bmi >= 45:
            flags.append({
                "priority": "PRIORITY",
                "finding": f"Severe Class III Morbid Obesity (BMI: {bmi})",
                "risk": "Severe insulin resistance, obstructive sleep apnea, cardiovascular strain",
                "action": "Comprehensive metabolic and bariatric lifestyle intervention plan",
                "specialist": "Bariatric Specialist / Endocrinologist",
            })

        return cls._aggregate_flags(flags, disease_type="diabetes")

    @classmethod
    def evaluate_liver(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        flags: List[Dict[str, Any]] = []

        total_b = float(data.get("total_bilirubin", data.get("Total_Bilirubin", 0)) or 0)
        direct_b = float(data.get("direct_bilirubin", data.get("Direct_Bilirubin", 0)) or 0)
        alt = float(data.get("alamine_aminotransferase", data.get("Alamine_Aminotransferase", 0)) or 0)
        ast = float(data.get("aspartate_aminotransferase", data.get("Aspartate_Aminotransferase", 0)) or 0)
        albumin = float(data.get("albumin", data.get("Albumin", 0)) or 0)

        # 1. Bilirubin crisis
        if total_b >= 10.0:
            flags.append({
                "priority": "IMMEDIATE",
                "finding": f"Severe hyperbilirubinemia ({total_b} mg/dL)",
                "risk": "Acute hepatic decompensation or high-grade biliary obstruction with cholangitis",
                "action": "Immediate emergency hospital admission, liver ultrasound, and hepatology consult",
                "specialist": "Hepatologist / Gastroenterologist",
            })
        elif total_b >= 3.0:
            flags.append({
                "priority": "URGENT",
                "finding": f"Overt clinical jaundice (Bilirubin: {total_b} mg/dL)",
                "risk": "Progressive hepatic impairment or cholestatic injury",
                "action": "Hepatology workup and liver imaging within 48 hours",
                "specialist": "Gastroenterologist / Hepatologist",
            })

        # 2. Transaminase storm
        max_transaminase = max(alt, ast)
        if max_transaminase >= 500:
            flags.append({
                "priority": "IMMEDIATE",
                "finding": f"Massive transaminitis (ALT/AST: {max_transaminase} U/L)",
                "risk": "Acute toxic/ischemic hepatitis or fulminant hepatic necrosis",
                "action": "Immediate emergency evaluation for acute liver failure etiology",
                "specialist": "Transplant Hepatologist / Intensive Care",
            })
        elif max_transaminase >= 200:
            flags.append({
                "priority": "URGENT",
                "finding": f"Marked acute hepatocellular injury (ALT/AST: {max_transaminase} U/L)",
                "risk": "Active hepatitis flare or progressive steatohepatitis",
                "action": "Comprehensive viral, metabolic, and autoimmune serology within 72 hours",
                "specialist": "Hepatologist",
            })

        # 3. Synthetic dysfunction
        if 0 < albumin <= 2.2:
            flags.append({
                "priority": "URGENT",
                "finding": f"Severe hypoalbuminemia ({albumin} g/dL)",
                "risk": "Advanced hepatic synthetic failure, ascites, spontaneous bacterial peritonitis",
                "action": "Urgent evaluation for chronic end-stage liver disease / portal hypertension",
                "specialist": "Hepatologist",
            })

        return cls._aggregate_flags(flags, disease_type="liver")

    @classmethod
    def evaluate_parkinsons(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        flags: List[Dict[str, Any]] = []

        ppe = float(data.get("ppe", data.get("PPE", 0)) or 0)
        spread1 = float(data.get("spread1", 0) or 0)
        jitter = float(data.get("mdvp_jitter_percent", data.get("MDVP:Jitter(%)", 0)) or 0)

        if ppe >= 0.45 or (spread1 != 0 and spread1 >= -3.0):
            flags.append({
                "priority": "URGENT",
                "finding": f"High acoustic entropy & vocal tremor dysregulation (PPE: {ppe:.3f})",
                "risk": "Advanced phonatory impairment correlating with progressive extrapyramidal motor dysfunction",
                "action": "Expedited Movement Disorder Specialist consultation and neurological motor exam",
                "specialist": "Neurologist / Movement Disorder Specialist",
            })
        elif ppe >= 0.30 or jitter >= 0.02:
            flags.append({
                "priority": "PRIORITY",
                "finding": "Moderate acoustic perturbation indicative of Parkinsonian dysphonia",
                "risk": "Early or moderate neurodegenerative vocal cord hypokinesia",
                "action": "Neurology outpatient referral and Lee Silverman Voice Treatment evaluation",
                "specialist": "Neurologist / Speech-Language Pathologist",
            })

        return cls._aggregate_flags(flags, disease_type="parkinsons")

    @classmethod
    def evaluate(cls, disease_type: str, data: Dict[str, Any]) -> Dict[str, Any]:
        disease = str(disease_type).lower().strip()
        if disease == "heart":
            return cls.evaluate_heart(data)
        elif disease == "diabetes":
            return cls.evaluate_diabetes(data)
        elif disease == "liver":
            return cls.evaluate_liver(data)
        elif disease in ("parkinsons", "parkinson"):
            return cls.evaluate_parkinsons(data)
        else:
            return cls._aggregate_flags([], disease_type=disease)

    @classmethod
    def _aggregate_flags(cls, flags: List[Dict[str, Any]], disease_type: str) -> Dict[str, Any]:
        if not flags:
            return {
                "disease_type": disease_type,
                "has_red_flags": False,
                "priority": "ROUTINE",
                "priority_code": 4,
                "finding": "No acute physiological red flags detected from current parameters.",
                "risk": "Low immediate acute hazard based on entered biometric readings.",
                "action": "Continue regular preventative medical follow-up as scheduled.",
                "specialist": "General Physician / Primary Care",
                "all_flags": [],
            }

        # Sort flags by priority level ascending (IMMEDIATE=1 is highest)
        sorted_flags = sorted(flags, key=lambda f: cls.PRIORITY_LEVELS.get(f["priority"], 99))
        primary = sorted_flags[0]

        return {
            "disease_type": disease_type,
            "has_red_flags": True,
            "priority": primary["priority"],
            "priority_code": cls.PRIORITY_LEVELS.get(primary["priority"], 4),
            "finding": primary["finding"],
            "risk": primary["risk"],
            "action": primary["action"],
            "specialist": primary["specialist"],
            "all_flags": sorted_flags,
        }
