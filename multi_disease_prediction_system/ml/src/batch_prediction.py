"""
Batch Prediction Module for Multi-Disease Prediction System.

Processes batch patient CSV files, validates schemas, executes vectorized
or row-wise inference, calculates risk scores and categories, and exports
augmented result files. Includes CLI interface:
python -m ml.src.batch_prediction --disease diabetes --file path/to/csv
"""

import os
import sys
import argparse
import logging
from pathlib import Path
from typing import Dict, Any, Optional
import pandas as pd

from ml.src.data_ingestion import load_config
from ml.src.inference import get_inference_engine, map_risk_level
from ml.src.data_quality import score_data_quality

logger = logging.getLogger(__name__)


def run_batch_prediction(
    disease_name: str,
    file_path: str,
    output_path: Optional[str] = None,
    include_quality_score: bool = True,
    config: Optional[Dict[str, Any]] = None
) -> pd.DataFrame:
    """
    Execute batch prediction on a CSV file of patient records.

    Args:
        disease_name: Target disease ('heart', 'diabetes', 'parkinsons', 'liver').
        file_path: Path to input CSV file.
        output_path: Path where augmented predictions CSV will be written.
        include_quality_score: Whether to append a data quality score column.
        config: Master configuration.

    Returns:
        Augmented pandas DataFrame with predictions, probabilities, and risk tiers.

    Raises:
        FileNotFoundError: If input CSV cannot be located.
        ValueError: If CSV lacks required features.
    """
    if config is None:
        config = load_config()

    disease_name = disease_name.lower().strip()
    input_path = Path(file_path)
    if not input_path.exists():
        raise FileNotFoundError(f"Input batch CSV file not found at: {input_path}")

    logger.info("Reading batch file for '%s' from: %s", disease_name, input_path)
    df_raw = pd.read_csv(input_path)

    engine = get_inference_engine(config=config)
    bundle = engine.registry.get_bundle(disease_name)
    feature_names = bundle["feature_names"]

    # Validate that at least most required features are in the CSV
    missing_critical = [f for f in feature_names if f not in df_raw.columns]
    if missing_critical:
        msg = f"Batch CSV lacks critical features required for '{disease_name}': {missing_critical}"
        logger.error(msg)
        raise ValueError(msg)

    logger.info("Processing %d records for '%s'...", len(df_raw), disease_name)

    pred_classes = []
    probabilities = []
    risk_levels = []
    quality_scores = []
    quality_actions = []

    for idx, row in df_raw.iterrows():
        row_dict = row.to_dict()
        try:
            # Audit data quality if enabled
            if include_quality_score:
                q_res = score_data_quality(disease_name, row_dict)
                quality_scores.append(q_res["quality_score"])
                quality_actions.append(q_res["action"])

            # Run inference
            pred_res = engine.predict(disease_name, row_dict)
            pred_classes.append(pred_res["prediction"])
            probabilities.append(pred_res["probability"])
            risk_levels.append(pred_res["risk_level"])
        except Exception as e:
            logger.warning("Error processing row %d: %s. Imputing error fallback.", idx, e)
            pred_classes.append(-1)
            probabilities.append(0.0)
            risk_levels.append("ERROR")
            if include_quality_score:
                quality_scores.append(0.0)
                quality_actions.append("ERROR")

    # Augment DataFrame
    result_df = df_raw.copy()
    result_df["predicted_class"] = pred_classes
    result_df["predicted_probability"] = probabilities
    result_df["risk_level"] = risk_levels

    if include_quality_score:
        result_df["data_quality_score"] = quality_scores
        result_df["quality_gate_action"] = quality_actions

    # Export to disk
    if output_path:
        out_file = Path(output_path)
    else:
        out_file = input_path.parent / f"{input_path.stem}_{disease_name}_predictions.csv"

    out_file.parent.mkdir(parents=True, exist_ok=True)
    result_df.to_csv(out_file, index=False)
    logger.info("Batch predictions successfully saved to: %s", out_file)

    return result_df


def parse_args():
    parser = argparse.ArgumentParser(description="Multi-Disease Batch Prediction CLI")
    parser.add_argument(
        "--disease",
        type=str,
        required=True,
        choices=["heart", "diabetes", "parkinsons", "liver"],
        help="Disease model to execute"
    )
    parser.add_argument(
        "--file",
        type=str,
        required=True,
        help="Path to input CSV file containing patient records"
    )
    parser.add_argument(
        "--output",
        type=str,
        default=None,
        help="Optional destination path for generated output CSV"
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    try:
        res = run_batch_prediction(
            disease_name=args.disease,
            file_path=args.file,
            output_path=args.output
        )
        print(f"\n--- Batch Prediction Summary ({args.disease.upper()}) ---")
        print(f"Total processed rows: {len(res)}")
        print(f"Risk level counts:\n{res['risk_level'].value_counts()}")
        print(f"Output saved.")
    except Exception as err:
        logger.error("Batch prediction failure: %s", err)
        sys.exit(1)
