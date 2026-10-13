# Model Evaluation & Benchmark Report

This document reports the empirical validation results across all seven tuned machine learning architectures evaluated on untouched 20% stratified test sets for each disease module.

---

## 1. Measured Performance Matrix

### 1.1 Heart Disease (UCI Cleveland — 303 samples, 20% test split: 61 samples)
| Model Family | Accuracy | Precision | Recall (Sensitivity) | F1-Score | ROC-AUC | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **XGBoost Classifier** | **90.16%** | **84.38%** | **96.43%** | **0.9000** | **0.9416** | **CHAMPION MODEL** |
| Random Forest | 90.16% | 86.67% | 92.86% | 0.8966 | 0.9416 | Benchmark Candidate |
| K-Nearest Neighbors | 88.52% | 80.00% | 100.00% | 0.8889 | 0.9177 | High Sensitivity |
| Logistic Regression | 86.89% | 81.25% | 92.86% | 0.8667 | 0.9437 | Strong Linear Baseline |
| Gaussian Naive Bayes | 86.89% | 79.41% | 96.43% | 0.8710 | 0.9491 | High Probabilistic AUC |
| Support Vector Machine (RBF) | 83.61% | 80.00% | 85.71% | 0.8276 | 0.9426 | Regularized |
| Decision Tree (CART) | 80.33% | 76.67% | 82.14% | 0.7931 | 0.8339 | Interpretable Single Tree |

*Selected Champion: **XGBoost Classifier** (90.16% Acc, 0.9416 AUC, 96.43% clinical sensitivity).*

---

### 1.2 Parkinson's Disease (Oxford Voice — 195 samples, 20% test split: 39 samples)
| Model Family | Accuracy | Precision | Recall (Sensitivity) | F1-Score | ROC-AUC | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **K-Nearest Neighbors (KNN)** | **92.31%** | **100.00%** | **89.66%** | **0.9455** | **0.9966** | **CHAMPION MODEL** |
| XGBoost Classifier | 92.31% | 96.43% | 93.10% | 0.9474 | 0.9828 | Strong Alternative |
| Random Forest | 89.74% | 96.30% | 89.66% | 0.9286 | 0.9638 | High Ensemble Precision |
| Support Vector Machine (RBF) | 87.18% | 92.86% | 89.66% | 0.9123 | 0.9621 | Margin Classifier |
| Logistic Regression | 84.62% | 96.00% | 82.76% | 0.8889 | 0.9241 | Linear Separator |
| Decision Tree | 71.79% | 84.62% | 75.86% | 0.8000 | 0.7207 | Pruned Tree |
| Gaussian Naive Bayes | 64.10% | 94.12% | 55.17% | 0.6957 | 0.8586 | Low Acoustic Recall |

*Selected Champion: **K-Nearest Neighbors** (92.31% Acc, 0.9966 ROC-AUC, 100% Precision).*

---

### 1.3 Diabetes (Pima Indians — 768 samples, 20% test split: 154 samples)
| Model Family | Accuracy | Precision | Recall (Sensitivity) | F1-Score | ROC-AUC | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Random Forest** | **75.32%** | **62.90%** | **72.22%** | **0.6724** | **0.8142** | **CHAMPION MODEL** |
| XGBoost Classifier | 74.03% | 61.67% | 68.52% | 0.6491 | 0.8131 | Robust Gradient Trees |
| Logistic Regression | 71.43% | 58.33% | 64.81% | 0.6140 | 0.8081 | Calibrated Odds Ratios |
| Support Vector Machine (RBF) | 70.78% | 57.38% | 64.81% | 0.6087 | 0.7993 | Regularized Margin |
| K-Nearest Neighbors | 70.78% | 56.16% | 75.93% | 0.6457 | 0.7831 | Distance Weighted |
| Gaussian Naive Bayes | 69.48% | 55.38% | 66.67% | 0.6050 | 0.7741 | Normal Distribution Prior |
| Decision Tree | 68.18% | 52.87% | 85.19% | 0.6525 | 0.7721 | High Variance |

*Scientific Note on Diabetes Accuracy: Unlike synthetic papers claiming 98%+ on Pima Indians via test-set contamination or training on un-imputed zero markers, genuine clinical validation on Pima Indians caps realistically between 74% and 78%. Random Forest achieved 75.32% accuracy with an AUC of 0.8142.*

---

### 1.4 Liver Disease (ILPD — 570 deduplicated samples, 20% test split: 114 samples)
| Model Family | Accuracy | Precision | Recall (Sensitivity) | F1-Score | ROC-AUC | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Logistic Regression** | **72.81%** | **93.10%** | **66.67%** | **0.7770** | **0.8114** | **CHAMPION MODEL** |
| Decision Tree | 74.56% | 84.21% | 79.01% | 0.8153 | 0.7688 | High Rule Interpretability |
| Support Vector Machine (RBF) | 73.68% | 85.92% | 75.31% | 0.8026 | 0.7632 | Kernel Baseline |
| XGBoost Classifier | 71.93% | 76.34% | 87.65% | 0.8161 | 0.7411 | High Enzyme Sensitivity |
| Random Forest | 69.30% | 76.74% | 81.48% | 0.7904 | 0.7529 | Bagged Ensembles |
| Gaussian Naive Bayes | 64.91% | 100.00% | 50.62% | 0.6721 | 0.8096 | High Specificity |
| K-Nearest Neighbors | 63.16% | 80.00% | 64.20% | 0.7123 | 0.6783 | Sensitive to Skewness |

*Selected Champion: **Logistic Regression** (72.81% Acc, 0.8114 AUC, 93.10% Precision).*

---

## 2. Cross-Validation and Hyperparameter Strategy
- **Stratified 5-Fold Cross Validation:** Preserves the target minority ratio across all 5 training/validation folds.
- **SMOTE Sampling Policy:** Oversampling of minority classes was applied exclusively to training folds inside the CV loop. No synthetic samples were ever allowed to enter validation or holdout test splits, eliminating synthetic data leakage.
- **Figures Generated:**
  - `ml/reports/figures/{disease}_roc_curves.png`
  - `ml/reports/figures/{disease}_confusion_matrix.png`
  - `ml/reports/figures/{disease}_feature_importance.png`
