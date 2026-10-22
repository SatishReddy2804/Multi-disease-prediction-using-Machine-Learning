# Feature 2: Counterfactual What-If Risk Simulator

## 1. Concept & Mathematical Formulation

Counterfactual reasoning answers the fundamental clinical question: 
> *"What minimal lifestyle or therapeutic changes to modifiable biomarkers would shift this patient from High/Critical risk into a Low or Moderate risk tier?"*

Formally, given a trained probabilistic classifier $f(\mathbf{x}) = \hat{p} \in [0, 1]$ and an input vector $\mathbf{x} = [\mathbf{x}_{\text{immutable}}, \mathbf{x}_{\text{modifiable}}]$, the simulator identifies interventions $\Delta \mathbf{x}_{\text{modifiable}}$ such that:

$$\mathbf{x}' = [\mathbf{x}_{\text{immutable}}, \mathbf{x}_{\text{modifiable}} + \Delta \mathbf{x}_{\text{modifiable}}] \quad \text{and} \quad f(\mathbf{x}') < \tau_{\text{safe}}$$

---

## 2. Immutable vs Modifiable Clinical Biomarkers

The engine strictly partitions clinical features to prevent unscientific simulations:

| Disease Module | Immutable Demographic Factors (LOCKED) | Actionable Modifiable Biomarkers (ADJUSTABLE) |
| :--- | :--- | :--- |
| **Heart Disease** | `age`, `sex` | `chol` (Cholesterol), `trestbps` (Blood Pressure), `thalach` (Max Heart Rate), `oldpeak` (ST depression), `fbs` (Fasting Glucose) |
| **Diabetes** | `Age`, `Pregnancies`, `DiabetesPedigreeFunction` | `Glucose` (Plasma Sugar), `BMI` (Weight Control), `BloodPressure` (Hypertension), `Insulin` |
| **Liver Disease** | `Age`, `Gender` | `Total_Bilirubin`, `Direct_Bilirubin`, `Alkaline_Phosphotase`, `ALT/SGPT`, `AST/SGOT`, `Albumin`, `A/G Ratio` |
| **Parkinson's** | All 22 acoustic parameters are labeled **Diagnostic Biomarkers** | Voice parameters (`MDVP:Fo`, `Jitter`, `Shimmer`, `HNR`, `PPE`) are adjustable for **educational exploration only** with prominent clinical disclaimer. |

---

## 3. Intervention Impact Ranking Algorithm

To provide actionable guidance to clinicians and patients, the What-If Engine isolates the individual marginal risk reduction for every single modified parameter:

1. For each modified feature $j \in \mathcal{M}$:
   $$\mathbf{x}^{(j)} = [\dots, x_k, \dots, x_j', \dots] \quad (\text{only feature } j \text{ modified})$$
2. Marginal Risk Reduction:
   $$\Delta \hat{p}^{(j)} = f(\mathbf{x}) - f(\mathbf{x}^{(j)})$$
3. Relative Clinical Impact Contribution:
   $$\text{Impact Pct}^{(j)} = \frac{\Delta \hat{p}^{(j)}}{\sum_{k \in \mathcal{M}} |\Delta \hat{p}^{(k)}|} \times 100\%$$

Interventions are sorted descending by $\Delta \hat{p}^{(j)}$ and presented as an impact ranking bar chart.
