# Feature 1: Uncertainty-Aware Prediction Shield

## 1. Clinical Rationale

Standard machine learning classifiers emit uncalibrated probability scores that often exhibit overconfidence, even when presented with noisy, conflicting, or out-of-distribution (OOD) biomedical data. In life-critical clinical environments, an overconfident wrong prediction can delay necessary intervention. 

The **Uncertainty-Aware Prediction Shield** introduces an active safety barrier around every model inference, evaluating five orthogonal reliability dimensions:

```mermaid
flowchart TD
    INPUT[Patient Clinical Inputs] --> GATES[1. Physiological Range & Quality Gate]
    GATES --> PREDICT[2. Model Inference predict_proba]
    PREDICT --> UNC_ENGINE[3. Multi-Faceted Uncertainty Engine]
    
    UNC_ENGINE --> TREE_VAR[Tree-Vote Variance]
    UNC_ENGINE --> DISAGREE[7-Model Ensemble Disagreement]
    UNC_ENGINE --> BOUNDARY[Decision Boundary Distance |p - 0.5|]
    UNC_ENGINE --> OOD[Isolation Forest Anomaly Scoring]
    UNC_ENGINE --> RED_FLAG[Clinical Red Flag Rules]
    
    TREE_VAR --> CLASSIFY{Trust State Classification}
    DISAGREE --> CLASSIFY
    BOUNDARY --> CLASSIFY
    OOD --> CLASSIFY
    RED_FLAG --> CLASSIFY
    
    CLASSIFY -->|Normal, High Agreement| RELIABLE[RELIABLE: Normal Presentation]
    CLASSIFY -->|Boundary Zone, Low Margin| UNCERTAIN[UNCERTAIN: Additional Tests Advised]
    CLASSIFY -->|Negative Anomaly Score| OUT_OF_DIST[OUT-OF-DISTRIBUTION: Model Suppressed]
    CLASSIFY -->|Acute Clinical Vitals| CRITICAL[CRITICAL RED FLAG: Emergency Triage Override]
```

---

## 2. The Four Operational Trust States

### 1. `RELIABLE`
- **Criteria:** Inputs are complete; within medical plausible ranges; model probability is well clear of the boundary ($p < 0.35$ or $p > 0.65$); Isolation Forest score $> -0.05$; multi-model agreement $> 75\%$.
- **Action:** Full diagnostic card rendered; probability shown in primary radial gauge; trust badge displayed in green.

### 2. `UNCERTAIN`
- **Criteria:** Prediction probability falls within the decision boundary gray zone ($0.40 \le p \le 0.60$); ensemble model families show divergence (e.g. Random Forest predicts 0.58 while Logistic Regression predicts 0.44).
- **Action:** Amber warning banner displayed: *"Model confidence is moderate due to boundary proximity. Additional clinical laboratory testing advised before diagnostic conclusion."*

### 3. `OUT-OF-DISTRIBUTION (OOD)`
- **Criteria:** Patient biomarker combinations fall outside the multidimensional convex hull of the training population (Isolation Forest anomaly score $< -0.15$).
- **Action:** Prediction output is de-emphasized or gated: *"Patient biomarker configuration differs significantly from training distributions. Automated model inference may be uncalibrated. Immediate physician review required."*

### 4. `CRITICAL RED FLAG`
- **Criteria:** Pre-configured acute physiological boundaries are violated regardless of what the statistical classifier predicts (e.g. Diastolic BP $\ge 120$ mmHg, Systolic BP $\ge 180$ mmHg, Serum Glucose $\ge 300$ mg/dL, Total Bilirubin $\ge 5.0$ mg/dL, ALT/AST $\ge 500$ U/L).
- **Action:** Immediate crimson emergency triage banner rendered at the top of the interface and prominently in the clinician-ready PDF.
