"""
Data Ingestion Module for Multi-Disease Prediction System.

This module handles loading raw datasets with disease-specific column headers,
interpreting missing value markers (such as '?'), and performing schema
validation against the master configuration.
"""

import os
import logging
from typing import Dict, Optional, Any
from pathlib import Path
import pandas as pd
import yaml

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - [%(levelname)s] - %(name)s - %(message)s"
)
logger = logging.getLogger(__name__)

DEFAULT_CONFIG_PATH = Path(__file__).resolve().parent.parent / "config" / "model_config.yaml"


def get_project_root() -> Path:
    """Return the absolute path to the project root directory."""
    return Path(__file__).resolve().parent.parent.parent


def load_config(config_path: Optional[str] = None) -> Dict[str, Any]:
    """
    Load the master YAML configuration file.

    Args:
        config_path: Optional path to model_config.yaml.

    Returns:
        Dictionary containing configuration parameters.

    Raises:
        FileNotFoundError: If the configuration file cannot be found.
        yaml.YAMLError: If parsing the configuration fails.
    """
    target_path = Path(config_path) if config_path else DEFAULT_CONFIG_PATH
    if not target_path.exists():
        raise FileNotFoundError(f"Configuration file not found at: {target_path}")

    with open(target_path, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)

    # Normalize relative paths to absolute using project root
    root = get_project_root()
    if "paths" in config and isinstance(config["paths"], dict):
        for key, val in config["paths"].items():
            if val:
                p = Path(val)
                if not p.is_absolute():
                    config["paths"][key] = str((root / p).resolve())
                else:
                    config["paths"][key] = str(p)

    logger.debug("Successfully loaded configuration from %s", target_path)
    return config


def validate_schema(df: pd.DataFrame, expected_columns: list, disease_name: str) -> bool:
    """
    Validate that the DataFrame contains all expected columns.

    Args:
        df: Input pandas DataFrame.
        expected_columns: List of column names expected according to schema.
        disease_name: Name of disease for contextual logging.

    Returns:
        True if schema is valid.

    Raises:
        ValueError: If any expected columns are missing.
    """
    missing_cols = [col for col in expected_columns if col not in df.columns]
    if missing_cols:
        msg = f"Schema validation failed for '{disease_name}'. Missing columns: {missing_cols}"
        logger.error(msg)
        raise ValueError(msg)

    logger.info("Schema validation PASSED for '%s' (%d columns present).", disease_name, len(df.columns))
    return True


def load_raw_dataset(disease_name: str, config: Optional[Dict[str, Any]] = None) -> pd.DataFrame:
    """
    Load raw CSV data for a specific disease with proper headers and missing value indicators.

    Args:
        disease_name: One of 'heart', 'diabetes', 'parkinsons', 'liver'.
        config: Optional loaded configuration dictionary.

    Returns:
        pd.DataFrame containing the raw ingested dataset.

    Raises:
        KeyError: If disease_name is not configured.
        FileNotFoundError: If the dataset file does not exist.
    """
    if config is None:
        config = load_config()

    disease_name = disease_name.lower().strip()
    diseases_cfg = config.get("diseases", {})
    if disease_name not in diseases_cfg:
        raise KeyError(
            f"Unknown disease: '{disease_name}'. Available diseases: {list(diseases_cfg.keys())}"
        )

    disease_info = diseases_cfg[disease_name]
    file_name = disease_info["file_name"]
    raw_dir = Path(config.get("paths", {}).get("data_raw_dir", get_project_root() / "data" / "raw"))
    file_path = raw_dir / file_name

    if not file_path.exists():
        raise FileNotFoundError(f"Dataset for '{disease_name}' not found at: {file_path}")

    missing_markers = disease_info.get("missing_markers", ["?", "NA", "null", ""])
    expected_cols = disease_info["columns"]
    has_header = disease_info.get("has_header", True)

    logger.info("Ingesting raw dataset for '%s' from %s", disease_name, file_path)

    if has_header:
        df = pd.read_csv(
            file_path,
            na_values=missing_markers,
            keep_default_na=True,
            skipinitialspace=True
        )
    else:
        df = pd.read_csv(
            file_path,
            header=None,
            names=expected_cols,
            na_values=missing_markers,
            keep_default_na=True,
            skipinitialspace=True
        )

    # Validate ingested schema
    validate_schema(df, expected_cols, disease_name)

    logger.info(
        "Successfully ingested '%s': %d rows, %d columns, %d missing entries.",
        disease_name, len(df), len(df.columns), df.isna().sum().sum()
    )
    return df


def load_all_raw_datasets(config: Optional[Dict[str, Any]] = None) -> Dict[str, pd.DataFrame]:
    """
    Load all configured disease datasets.

    Args:
        config: Optional configuration dictionary.

    Returns:
        Dictionary mapping disease names to their raw DataFrames.
    """
    if config is None:
        config = load_config()

    datasets = {}
    for disease_name in config.get("diseases", {}).keys():
        datasets[disease_name] = load_raw_dataset(disease_name, config=config)

    logger.info("All %d raw datasets successfully ingested.", len(datasets))
    return datasets


if __name__ == "__main__":
    print("Testing data ingestion module...")
    all_data = load_all_raw_datasets()
    for disease, df in all_data.items():
        print(f"\n--- {disease.upper()} ---")
        print(f"Shape: {df.shape}")
        print(f"Columns: {list(df.columns[:6])} ...")
        print(f"Null counts:\n{df.isna().sum()[df.isna().sum() > 0]}")
