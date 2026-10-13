# UI / UX Design & Clinical Usability Documentation

This document describes the design system, typography, clinical color semantics, accessibility standards, and component architecture implemented in the React 18 + Vite frontend for the **Multi-Disease Prediction System**.

---

## 1. Visual Hierarchy & Design System

The application employs a clean, clinical aesthetic engineered to minimize cognitive load during diagnostic reviews.

### 1.1 Color Palette & Semantics

| Token | Hex Value | Semantic Usage |
| :--- | :--- | :--- |
| **Primary Clinical Blue** | `#2563EB` | Core actions, active navigation tabs, diagnostic execution buttons |
| **Cardiac Crimson** | `#DC2626` | Heart disease banners, high cardiovascular risk indicators |
| **Metabolic Azure** | `#2563EB` | Diabetes screening, insulin/glucose telemetry cards |
| **Hepato Emerald** | `#059669` | Liver functional status, low risk / healthy outcome indicators |
| **Neurological Amethyst** | `#7E22CE` | Parkinson's voice biomarkers, speech acoustic telemetry |
| **Caution Amber** | `#D97706` | Boundary uncertainty warnings, moderate risk indicators |
| **Critical Danger Red** | `#EF4444` | Emergency triage red flags, hypertensive/glycemic crisis overrides |

---

## 2. Key Interactive UI Components

### 2.1 Radial Confidence Ring
- **Implementation:** Pure SVG circular progress gauge with animated dash offset transitions (`stroke-dasharray`, `stroke-dashoffset`).
- **Dynamic Color Ramping:**
  - $p < 0.30$: Emerald green (`#10B981`)
  - $0.30 \le p < 0.60$: Amber (`#F59E0B`)
  - $p \ge 0.60$: Crimson (`#EF4444`)
- **Center Telemetry:** Displays percentage confidence, numerical risk ratio, and qualitative risk status.

### 2.2 Trust Shield Badge
- Sits alongside every diagnostic card, displaying 5 clinical verification badges:
  1. **Data Completeness:** 100% (audited for zero null fields).
  2. **Model Agreement:** Multi-model consensus score across the 7 evaluated model families.
  3. **Uncertainty Level:** Low / Moderate / High.
  4. **Trust Classification:** `RELIABLE` (Green), `UNCERTAIN` (Amber), `OUT-OF-DISTRIBUTION` (Purple), or `CRITICAL RED FLAG` (Red).
  5. **Recommended Action:** Direct next-step clinical guidance (routine follow-up, confirmatory laboratory panel, or emergency specialist review).

### 2.3 Counterfactual What-If Sliders
- Provides direct interactive exploration of modifiable variables (e.g. cholesterol, blood pressure, glucose, BMI) while locking immutable demographics (age, sex, pregnancies).
- Real-time delta chips compute percentage-point risk reduction.

### 2.4 Multi-Organ Polar Radar Chart
- Visualizes systemic organ balance across Cardiovascular, Metabolic, Hepatic, and Neurological axes.
- Automatically highlights syndromic comorbidity clusters (e.g. Cardio-Metabolic Syndrome).

### 2.5 Data Quality Pre-Flight Meter
- Real-time progress bars check completeness, physiological range validity, and hidden zeroes before unlocking the primary diagnostic button.
