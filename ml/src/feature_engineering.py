"""
Feature Engineering Module for Multi-Disease Prediction System.

Handles stratified train/test splitting, StandardScaler normalization,
and SMOTE (Synthetic Minority Over-sampling Technique) applied strictly to
the training split to eliminate data leakage.
"""

import logging
from typing import Dict, Any, Optional, Tuple, List
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from imblearn.over_sampling import SMOTE

from ml.src.data_ingestion import load_config

logger = logging.getLogger(__name__)


class FeaturePipeline:
    """
    Standardizes feature transformations and manages training/testing splits
    with class balance handling.
    """

    def __init__(self, disease_name: str, config: Optional[Dict[str, Any]] = None):
        """
        Initialize feature pipeline.

        Args:
            disease_name: Target disease name.
            config: Master configuration.
        """
        self.disease_name = disease_name.lower().strip()
        self.config = config if config is not None else load_config()
        self.disease_cfg = self.config["diseases"][self.disease_name]

        self.feature_names: List[str] = self.disease_cfg["features"]
        self.target_name: str = self.disease_cfg.get("target", "target")
        self.scaler = StandardScaler()
        self.is_fitted: bool = False

    def prepare_data(
        self,
        cleaned_df: pd.DataFrame,
        apply_smote: bool = True
    ) -> Dict[str, Any]:
        """
        Split cleaned dataframe into stratified train and test sets,
        scale features, and optionally apply SMOTE on the training set only.

        Args:
            cleaned_df: Cleaned dataframe containing features and target.
            apply_smote: Whether to apply SMOTE on training split.

        Returns:
            Dictionary containing:
                - X_train, X_test (pandas DataFrames before scaling)
                - X_train_scaled, X_test_scaled (numpy arrays)
                - y_train, y_test (numpy arrays)
                - X_train_resampled, y_train_resampled (scaled numpy arrays after SMOTE)
                - scaler (fitted StandardScaler)
                - feature_names (list of feature names)
        """
        # Ensure all required features are present
        missing_features = [f for f in self.feature_names if f not in cleaned_df.columns]
        if missing_features:
            raise ValueError(f"Features missing from cleaned data for '{self.disease_name}': {missing_features}")

        if self.target_name not in cleaned_df.columns:
            raise ValueError(f"Target column '{self.target_name}' missing from cleaned data for '{self.disease_name}'")

        X = cleaned_df[self.feature_names].copy()
        y = cleaned_df[self.target_name].astype(int).values

        # Stratified Train/Test Split
        test_size = float(self.config.get("project", {}).get("test_size", 0.20))
        random_state = int(self.config.get("project", {}).get("random_state", 42))

        X_train, X_test, y_train, y_test = train_test_split(
            X, y,
            test_size=test_size,
            stratify=y,
            random_state=random_state
        )

        logger.info(
            "Split '%s' into Train (%d samples) and Test (%d samples). Test ratio: %.2f",
            self.disease_name, len(X_train), len(X_test), test_size
        )

        # Fit Scaler strictly on training set
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        self.is_fitted = True

        # Apply SMOTE only to training set if requested
        X_train_final = X_train_scaled
        y_train_final = y_train

        if apply_smote and self.disease_cfg.get("handle_imbalance") == "smote":
            class_counts = pd.Series(y_train).value_counts()
            min_class_count = class_counts.min()

            if min_class_count > 1 and len(class_counts) > 1 and (class_counts.max() != class_counts.min()):
                # Ensure k_neighbors is strictly less than min_class_count
                k_neighbors = min(5, min_class_count - 1)
                if k_neighbors >= 1:
                    smote = SMOTE(k_neighbors=k_neighbors, random_state=random_state)
                    X_train_final, y_train_final = smote.fit_resample(X_train_scaled, y_train)
                    logger.info(
                        "Applied SMOTE to '%s' train set: class counts before %s, after %s (k_neighbors=%d)",
                        self.disease_name, dict(class_counts), dict(pd.Series(y_train_final).value_counts()), k_neighbors
                    )
            else:
                logger.info("SMOTE skipped for '%s': classes already balanced or insufficient minority samples.", self.disease_name)

        return {
            "X_train": X_train,
            "X_test": X_test,
            "X_train_scaled": X_train_scaled,
            "X_test_scaled": X_test_scaled,
            "y_train": y_train,
            "y_test": y_test,
            "X_train_resampled": X_train_final,
            "y_train_resampled": y_train_final,
            "scaler": self.scaler,
            "feature_names": self.feature_names
        }

    def transform_single_input(self, input_dict_or_df: Any) -> np.ndarray:
        """
        Scale an incoming inference record matching configured feature order.

        Args:
            input_dict_or_df: Dict of {feature_name: value} or single-row pd.DataFrame.

        Returns:
            2D numpy array of shape (1, num_features).
        """
        if not self.is_fitted:
            raise RuntimeError("Pipeline must be fitted before transforming inference inputs.")

        if isinstance(input_dict_or_df, dict):
            row_data = [float(input_dict_or_df.get(f, 0.0)) for f in self.feature_names]
            array_2d = np.array(row_data).reshape(1, -1)
        elif isinstance(input_dict_or_df, pd.DataFrame):
            ordered_df = input_dict_or_df[self.feature_names].astype(float)
            array_2d = ordered_df.values
        else:
            array_2d = np.asarray(input_dict_or_df, dtype=float)
            if array_2d.ndim == 1:
                array_2d = array_2d.reshape(1, -1)

        return self.scaler.transform(array_2d)


if __name__ == "__main__":
    from ml.src.data_ingestion import load_raw_dataset
    from ml.src.data_cleaning import clean_dataset

    print("Testing feature engineering pipeline...")
    cfg = load_config()
    for disease in ["heart", "diabetes", "parkinsons", "liver"]:
        raw_df = load_raw_dataset(disease, cfg)
        cleaned_df, _ = clean_dataset(raw_df, disease, cfg)
        pipe = FeaturePipeline(disease, cfg)
        data = pipe.prepare_data(cleaned_df)
        print(f"\n[{disease.upper()}] Feature Pipeline:")
        print(f"X_train shape: {data['X_train_scaled'].shape}, X_resampled shape: {data['X_train_resampled'].shape}")
        print(f"X_test shape: {data['X_test_scaled'].shape}, y_test mean: {data['y_test'].mean():.2f}")
