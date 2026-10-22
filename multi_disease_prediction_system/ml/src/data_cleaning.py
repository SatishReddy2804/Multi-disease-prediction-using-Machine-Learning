"""
Data Cleaning Module for Multi-Disease Prediction System.

Handles missing values (median for numeric, mode for categorical),
zero-as-missing transformations, duplicate removal, binary target conversions,
categorical encoding, and physiological range validations.
"""

import logging
from typing import Dict, Any, Optional, Tuple, List
import numpy as np
import pandas as pd

from ml.src.data_ingestion import load_config

logger = logging.getLogger(__name__)


class DataCleaner:
    """
    Stateful data cleaner that learns imputation values (medians, modes)
    from training data to avoid data leakage during inference and testing.
    """

    def __init__(self, disease_name: str, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the cleaner for a specific disease.

        Args:
            disease_name: One of 'heart', 'diabetes', 'parkinsons', 'liver'.
            config: Optional configuration dictionary.
        """
        self.disease_name = disease_name.lower().strip()
        self.config = config if config is not None else load_config()
        self.disease_cfg = self.config["diseases"][self.disease_name]

        self.numeric_imputations: Dict[str, float] = {}
        self.categorical_imputations: Dict[str, Any] = {}
        self.is_fitted: bool = False

    def fit(self, df: pd.DataFrame) -> "DataCleaner":
        """
        Learn imputation statistics (median for numeric, mode for categorical) from training data.

        Args:
            df: Training DataFrame.

        Returns:
            self
        """
        df_copy = df.copy()

        # Handle drop columns if any
        drop_cols = self.disease_cfg.get("drop_columns", [])
        cols_to_drop = [c for c in drop_cols if c in df_copy.columns]
        if cols_to_drop:
            df_copy = df_copy.drop(columns=cols_to_drop)

        # Handle zero-as-missing for specified features (e.g. insulin, glucose in diabetes)
        zero_as_missing = self.disease_cfg.get("zero_as_missing", [])
        for col in zero_as_missing:
            if col in df_copy.columns:
                df_copy[col] = df_copy[col].replace(0, np.nan)

        # Compute numeric medians
        num_cols = self.disease_cfg.get("numeric_features", [])
        for col in num_cols:
            if col in df_copy.columns:
                col_series = pd.to_numeric(df_copy[col], errors="coerce")
                median_val = col_series.median()
                if pd.isna(median_val):
                    median_val = 0.0
                self.numeric_imputations[col] = float(median_val)

        # Compute categorical modes
        cat_cols = self.disease_cfg.get("categorical_features", [])
        for col in cat_cols:
            if col in df_copy.columns:
                mode_vals = df_copy[col].dropna().mode()
                mode_val = mode_vals.iloc[0] if not mode_vals.empty else 0
                self.categorical_imputations[col] = mode_val

        self.is_fitted = True
        logger.info("Fitted DataCleaner for '%s'. Learned %d numeric, %d categorical imputations.",
                    self.disease_name, len(self.numeric_imputations), len(self.categorical_imputations))
        return self

    def transform(self, df: pd.DataFrame, drop_duplicates: bool = True) -> pd.DataFrame:
        """
        Apply learned cleaning transformations to the DataFrame.

        Args:
            df: Input DataFrame.
            drop_duplicates: Whether to drop duplicate rows (typically True for train, False for inference).

        Returns:
            Cleaned pd.DataFrame.
        """
        if not self.is_fitted:
            raise RuntimeError("DataCleaner must be fitted before calling transform().")

        cleaned = df.copy()

        # 1. Drop configured non-informative columns (e.g., 'name' in parkinsons)
        drop_cols = self.disease_cfg.get("drop_columns", [])
        cols_to_drop = [c for c in drop_cols if c in cleaned.columns]
        if cols_to_drop:
            cleaned = cleaned.drop(columns=cols_to_drop)

        # 2. Drop duplicates
        if drop_duplicates:
            before_len = len(cleaned)
            cleaned = cleaned.drop_duplicates()
            dropped_dups = before_len - len(cleaned)
            if dropped_dups > 0:
                logger.info("Removed %d duplicate rows for '%s'.", dropped_dups, self.disease_name)

        # 3. Handle zero-as-missing
        zero_as_missing = self.disease_cfg.get("zero_as_missing", [])
        for col in zero_as_missing:
            if col in cleaned.columns:
                cleaned[col] = cleaned[col].replace(0, np.nan)

        # 4. Impute numeric columns
        for col, median_val in self.numeric_imputations.items():
            if col in cleaned.columns:
                cleaned[col] = pd.to_numeric(cleaned[col], errors="coerce").fillna(median_val)

        # 5. Impute and encode categorical columns
        category_encodings = self.disease_cfg.get("category_encodings", {})
        for col, mode_val in self.categorical_imputations.items():
            if col in cleaned.columns:
                if col in category_encodings:
                    mapping = category_encodings[col]
                    norm_mapping = {1: 1, 0: 0, 1.0: 1, 0.0: 0, "1": 1, "0": 0}
                    for k, v in mapping.items():
                        norm_mapping[str(k).lower().strip()] = v
                        norm_mapping[k] = v

                    numeric_mode = norm_mapping.get(str(mode_val).lower().strip(), 0)

                    def encode_val(x):
                        if pd.isna(x):
                            return numeric_mode
                        if isinstance(x, str):
                            return norm_mapping.get(x.lower().strip(), norm_mapping.get(x, numeric_mode))
                        return norm_mapping.get(x, numeric_mode)

                    cleaned[col] = cleaned[col].map(encode_val)
                else:
                    cleaned[col] = cleaned[col].fillna(mode_val)
                cleaned[col] = pd.to_numeric(cleaned[col], errors="coerce").fillna(0)

        # 6. Convert target column to binary if target is present
        raw_target = self.disease_cfg.get("raw_target_column")
        target_mapping = self.disease_cfg.get("target_mapping")
        target_name = self.disease_cfg.get("target", "target")

        if raw_target in cleaned.columns and target_mapping:
            # Map target values (e.g. heart num 0-4 -> 0/1; liver 1/2 -> 1/0)
            cleaned[raw_target] = pd.to_numeric(cleaned[raw_target], errors="coerce")
            cleaned[target_name] = cleaned[raw_target].map(
                lambda x: target_mapping.get(int(x), 1 if x > 0 else 0) if pd.notna(x) else 0
            ).astype(int)

            if raw_target != target_name and raw_target in cleaned.columns:
                cleaned = cleaned.drop(columns=[raw_target])
        elif target_name in cleaned.columns and target_mapping:
            cleaned[target_name] = cleaned[target_name].map(
                lambda x: target_mapping.get(int(x), 1 if x > 0 else 0) if pd.notna(x) else 0
            ).astype(int)

        logger.info("Completed data cleaning for '%s'. Final shape: %s", self.disease_name, cleaned.shape)
        return cleaned

    def fit_transform(self, df: pd.DataFrame, drop_duplicates: bool = True) -> pd.DataFrame:
        """Fit cleaner and transform DataFrame in one step."""
        return self.fit(df).transform(df, drop_duplicates=drop_duplicates)


def clean_dataset(
    df: pd.DataFrame,
    disease_name: str,
    config: Optional[Dict[str, Any]] = None,
    is_train: bool = True,
    cleaner: Optional[DataCleaner] = None
) -> Tuple[pd.DataFrame, DataCleaner]:
    """
    Convenience function to clean a disease dataset.

    Args:
        df: Raw DataFrame.
        disease_name: Name of disease.
        config: Master configuration.
        is_train: Whether this is training data.
        cleaner: Existing fitted DataCleaner instance if is_train=False.

    Returns:
        Tuple of (Cleaned DataFrame, DataCleaner instance).
    """
    if cleaner is None:
        cleaner = DataCleaner(disease_name=disease_name, config=config)

    if is_train:
        cleaned_df = cleaner.fit_transform(df, drop_duplicates=True)
    else:
        cleaned_df = cleaner.transform(df, drop_duplicates=False)

    return cleaned_df, cleaner


def validate_ranges(df: pd.DataFrame, disease_name: str, config: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Validate features against configured physiological reference ranges.

    Args:
        df: Cleaned DataFrame.
        disease_name: Name of disease.
        config: Master configuration.

    Returns:
        Report dictionary summarizing any out-of-range anomalies found.
    """
    if config is None:
        config = load_config()

    disease_name = disease_name.lower().strip()
    ranges = config.get("reference_ranges", {}).get(disease_name, {})
    anomalies: List[Dict[str, Any]] = []

    for col, spec in ranges.items():
        if col not in df.columns:
            continue

        series = pd.to_numeric(df[col], errors="coerce")
        if "min" in spec and "max" in spec:
            low_count = int((series < spec["min"]).sum())
            high_count = int((series > spec["max"]).sum())
            if low_count > 0 or high_count > 0:
                anomalies.append({
                    "feature": col,
                    "expected_min": spec["min"],
                    "expected_max": spec["max"],
                    "below_min_count": low_count,
                    "above_max_count": high_count,
                    "unit": spec.get("unit", "")
                })

        if "allowed" in spec:
            allowed_set = set(spec["allowed"])
            invalid_count = int((~series.isin(allowed_set)).sum())
            if invalid_count > 0:
                anomalies.append({
                    "feature": col,
                    "allowed_values": spec["allowed"],
                    "invalid_count": invalid_count,
                    "unit": spec.get("unit", "")
                })

    report = {
        "disease": disease_name,
        "total_rows_checked": len(df),
        "anomalies_detected": anomalies,
        "is_valid": len(anomalies) == 0
    }
    return report


if __name__ == "__main__":
    from ml.src.data_ingestion import load_raw_dataset

    print("Testing data cleaning module...")
    cfg = load_config()
    for disease in ["heart", "diabetes", "parkinsons", "liver"]:
        raw_df = load_raw_dataset(disease, cfg)
        cleaned_df, cln = clean_dataset(raw_df, disease, cfg)
        range_rep = validate_ranges(cleaned_df, disease, cfg)
        target_col = cfg["diseases"][disease]["target"]
        target_dist = cleaned_df[target_col].value_counts().to_dict()
        print(f"\n[{disease.upper()}] Cleaned shape: {cleaned_df.shape}, Target dist: {target_dist}")
        print(f"Missing values remaining: {cleaned_df.isna().sum().sum()}")
