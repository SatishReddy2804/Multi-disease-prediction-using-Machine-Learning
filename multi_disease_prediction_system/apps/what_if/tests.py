from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.what_if.serializers import WhatIfSimulationSerializer
from apps.what_if.services import WhatIfService
from ml.src.what_if_simulator import WhatIfSimulator, run_what_if_simulation


class WhatIfSerializerTestCase(TestCase):
    """Test validation and contract normalization in WhatIfSimulationSerializer."""

    def test_valid_heart_payload(self):
        payload = {
            "disease_type": "heart",
            "original_input": {
                "age": 55, "sex": 1, "cp": 3, "trestbps": 160, "chol": 280,
                "fbs": 0, "restecg": 1, "thalach": 150, "exang": 0, "oldpeak": 1.2,
                "slope": 2, "ca": 0, "thal": 3
            },
            "modified_values": {
                "trestbps": 120,
                "chol": 190
            }
        }
        serializer = WhatIfSimulationSerializer(data=payload)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data["disease_type"], "heart")

    def test_reject_invalid_disease(self):
        payload = {
            "disease_type": "unknown_disease",
            "original_input": {"a": 1},
            "modified_values": {"a": 2}
        }
        serializer = WhatIfSimulationSerializer(data=payload)
        self.assertFalse(serializer.is_valid())
        self.assertIn("disease", serializer.errors)

    def test_reject_empty_original_or_modified(self):
        serializer1 = WhatIfSimulationSerializer(data={"disease_type": "heart", "original_input": {}, "modified_values": {"chol": 200}})
        self.assertFalse(serializer1.is_valid())

        serializer2 = WhatIfSimulationSerializer(data={"disease_type": "heart", "original_input": {"age": 50}, "modified_values": {}})
        self.assertFalse(serializer2.is_valid())

    def test_reject_immutable_field_modification(self):
        payload = {
            "disease_type": "heart",
            "original_input": {
                "age": 55, "sex": 1, "cp": 3, "trestbps": 160, "chol": 280,
                "fbs": 0, "restecg": 1, "thalach": 150, "exang": 0, "oldpeak": 1.2,
                "slope": 2, "ca": 0, "thal": 3
            },
            "modified_values": {
                "age": 35,  # Immutable
                "chol": 190
            }
        }
        serializer = WhatIfSimulationSerializer(data=payload)
        self.assertFalse(serializer.is_valid())
        self.assertIn("modified", serializer.errors)


class WhatIfSimulatorInferenceTestCase(TestCase):
    """Test genuine ML inference using trained disease model bundles."""

    def test_heart_simulation_genuine_inference(self):
        orig = {
            "age": 58, "sex": 1, "cp": 4, "trestbps": 160, "chol": 280,
            "fbs": 1, "restecg": 2, "thalach": 125, "exang": 1, "oldpeak": 2.8,
            "slope": 2, "ca": 2, "thal": 7
        }
        mods = {"trestbps": 120, "chol": 180}
        res = run_what_if_simulation("heart", orig, mods)

        self.assertIn("original_risk", res)
        self.assertIn("modified_risk", res)
        self.assertIn("what_if_result", res)

        base_p = res["original_risk"]["probability"]
        mod_p = res["modified_risk"]["probability"]
        delta = res["what_if_result"]["absolute_change"]

        self.assertIsInstance(base_p, float)
        self.assertIsInstance(mod_p, float)
        self.assertAlmostEqual(delta, round(mod_p - base_p, 4), places=3)
        self.assertEqual(res["what_if_result"]["risk_direction"], "decreased" if mod_p < base_p else ("increased" if mod_p > base_p else "no_change"))

    def test_diabetes_simulation_genuine_inference(self):
        orig = {
            "Pregnancies": 3, "Glucose": 165, "BloodPressure": 85,
            "SkinThickness": 33, "Insulin": 180, "BMI": 34.2,
            "DiabetesPedigreeFunction": 0.65, "Age": 46
        }
        mods = {"Glucose": 95, "BMI": 22.5}
        res = run_what_if_simulation("diabetes", orig, mods)

        self.assertIn("original_risk", res)
        self.assertIn("modified_risk", res)
        self.assertGreater(len(res["what_if_result"]["changed_features"]), 0)

    def test_liver_simulation_genuine_inference(self):
        orig = {
            "Age": 52, "Gender": "Male", "Total_Bilirubin": 2.4, "Direct_Bilirubin": 1.1,
            "Alkaline_Phosphotase": 340, "Alamine_Aminotransferase": 78,
            "Aspartate_Aminotransferase": 95, "Total_Protiens": 6.4, "Albumin": 2.8,
            "Albumin_and_Globulin_Ratio": 0.75
        }
        mods = {"Total_Bilirubin": 0.8, "Alamine_Aminotransferase": 25}
        res = run_what_if_simulation("liver", orig, mods)
        self.assertIn("original_risk", res)
        self.assertIn("modified_risk", res)

    def test_parkinsons_simulation_and_warning(self):
        orig = {
            "MDVP:Fo(Hz)": 120.2, "MDVP:Fhi(Hz)": 145.1, "MDVP:Flo(Hz)": 98.3,
            "MDVP:Jitter(%)": 0.012, "MDVP:Jitter(Abs)": 0.00009, "MDVP:RAP": 0.0055,
            "MDVP:PPQ": 0.0068, "Jitter:DDP": 0.0165, "MDVP:Shimmer": 0.058,
            "MDVP:Shimmer(dB)": 0.52, "Shimmer:APQ3": 0.029, "Shimmer:APQ5": 0.038,
            "MDVP:APQ": 0.045, "Shimmer:DDA": 0.088, "NHR": 0.035, "HNR": 18.2,
            "RPDE": 0.58, "DFA": 0.78, "spread1": -4.2, "spread2": 0.31,
            "D2": 2.65, "PPE": 0.32
        }
        mods = {"MDVP:Jitter(%)": 0.003, "HNR": 26.0}
        res = run_what_if_simulation("parkinsons", orig, mods)
        self.assertIn("specific_note", res["what_if_result"])
        self.assertIn("biomedical acoustic", res["what_if_result"]["specific_note"].lower())

    def test_out_of_bounds_modification_rejected(self):
        orig = {
            "age": 55, "sex": 1, "cp": 3, "trestbps": 160, "chol": 280,
            "fbs": 0, "restecg": 1, "thalach": 150, "exang": 0, "oldpeak": 1.2,
            "slope": 2, "ca": 0, "thal": 3
        }
        # trestbps max is 200 mm Hg; 999 is clinically implausible and must be rejected
        mods = {"trestbps": 999}
        with self.assertRaises(ValueError):
            run_what_if_simulation("heart", orig, mods)


class WhatIfApiEndpointTestCase(TestCase):
    """Test POST /api/what-if/simulate/ endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.url = "/api/what-if/simulate/"

    def test_api_valid_simulation(self):
        payload = {
            "disease_type": "heart",
            "original_input": {
                "age": 55, "sex": 1, "cp": 3, "trestbps": 160, "chol": 280,
                "fbs": 0, "restecg": 1, "thalach": 150, "exang": 0, "oldpeak": 1.2,
                "slope": 2, "ca": 0, "thal": 3
            },
            "modified_values": {
                "trestbps": 120,
                "chol": 190
            }
        }
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("original_risk", data["data"])
        self.assertIn("modified_risk", data["data"])
        self.assertIn("what_if_result", data["data"])
        self.assertIn("disclaimer", data["data"])

    def test_api_invalid_payload_returns_400(self):
        response = self.client.post(self.url, {"bad_key": 123}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        data = response.json()
        self.assertFalse(data["success"])
