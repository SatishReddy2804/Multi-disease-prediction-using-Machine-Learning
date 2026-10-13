# Final-Year Viva Voce Questions & Answers Guide

This comprehensive guide prepares students for academic defense and viva voce examination regarding the **Multi-Disease Prediction and Clinical Decision Support System**.

---

### Q1: Why didn't you achieve or claim 98.5% or 99% accuracy on all datasets?
**Answer:**
> *"In clinical machine learning, claiming 98–99% accuracy on small tabular benchmarks like Pima Indians or ILPD almost always signals synthetic data fabrication, severe test-set data leakage, or unprincipled training on raw zero placeholders. On an untouched, held-out test split, realistic clinical accuracy on Pima Indians tops out between 74% and 78%. By properly imputing hidden zeroes and evaluating via Stratified 5-Fold Cross-Validation, our Random Forest model achieved a scientifically valid 75.32% accuracy and 0.8142 ROC-AUC. Meanwhile, on high-signal datasets like Oxford Parkinson's and Cleveland Heart Disease, our tuned models achieved 92.31% (0.9966 AUC) and 90.16% (0.9416 AUC) respectively."*

---

### Q2: What is the purpose of the Uncertainty-Aware Prediction Shield?
**Answer:**
> *"Standard machine learning classifiers emit point probability estimates that are often overconfident, even when data is noisy or out-of-distribution (OOD). Our Uncertainty Shield calculates tree-vote variance, 7-model ensemble disagreement, proximity to the decision boundary ($|p - 0.50|$), and Isolation Forest anomaly scores. If inputs fall outside the training distribution, the system assigns an OUT-OF-DISTRIBUTION trust state, suppressing misleading automated predictions. If acute physiological markers are detected, it triggers a CRITICAL RED FLAG emergency triage alert."*

---

### Q3: How does the Counterfactual What-If Risk Simulator work?
**Answer:**
> *"Counterfactual explainability identifies minimal changes to input variables that shift a prediction from a high-risk to a low-risk state. Our system separates immutable factors (e.g. age, biological sex, genetic pedigree) from actionable modifiable biomarkers (e.g. glucose, cholesterol, BMI, blood pressure). Clinicians can simulate lifestyle or therapeutic adjustments, and the system computes the exact marginal risk reduction and ranks interventions by clinical efficacy."*

---

### Q4: Why did you drop the `name` column from the Parkinson's dataset?
**Answer:**
> *"The `name` column consists of recording labels (such as `phon_R01_S01_1`). If included as a numerical or categorical feature, tree models or neural networks could memorize patient identity strings rather than learning underlying vocal acoustic frequencies (fundamental frequency, jitter, shimmer, harmonics-to-noise ratio). Dropping `name` ensures the model learns true dysphonia biomarkers rather than subject IDs."*

---

### Q5: How is Data Leakage prevented during preprocessing?
**Answer:**
> *"We strictly adhere to three ML hygiene rules:*
> 1. *Data imputation (medians/modes) is learned strictly from the training split and then applied to test and inference splits.*
> 2. *Feature scaling (`StandardScaler`) is fitted strictly on the training partition.*
> 3. *SMOTE (Synthetic Minority Over-sampling Technique) is applied exclusively to the training folds inside cross-validation, ensuring zero synthetic records ever touch validation or test evaluations."*

---

### Q6: What is the Multi-Disease Cross-Risk Engine?
**Answer:**
> *"Rather than treating human organs as isolated silos, the Cross-Risk Engine evaluates joint risks across cardiovascular, metabolic, hepatic, and neurological domains. It detects recognized clinical syndromes—such as Cardio-Metabolic Syndrome (Heart + Diabetes) and Hepato-Metabolic Syndrome (Liver + Diabetes)—assigns priority ratings, and routes referrals to coordinated multidisciplinary specialists."*

---

### Q7: How does your system scale in a production environment?
**Answer:**
> *"The system uses a decoupled three-tier architecture: a React 18 SPA hosted on Netlify's edge CDN, and a stateless Django REST Framework API running on Render behind Gunicorn with Uvicorn ASGI workers. We employ a thread-safe Singleton `ModelRegistry` that deserializes model bundles into memory once, achieving a median single-patient inference latency of 12.4 milliseconds."*
