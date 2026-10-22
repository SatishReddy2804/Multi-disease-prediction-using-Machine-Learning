from rest_framework import serializers


class ParkinsonsPredictionSerializer(serializers.Serializer):
    # Fundamental frequency variations
    mdvp_fo = serializers.FloatField(
        required=False,
        help_text="Average vocal fundamental frequency (MDVP:Fo(Hz))",
    )
    mdvp_fhi = serializers.FloatField(
        required=False,
        help_text="Maximum vocal fundamental frequency (MDVP:Fhi(Hz))",
    )
    mdvp_flo = serializers.FloatField(
        required=False,
        help_text="Minimum vocal fundamental frequency (MDVP:Flo(Hz))",
    )

    # Jitter measures (frequency variation)
    mdvp_jitter_percent = serializers.FloatField(
        required=False,
        help_text="Percentage variation in fundamental frequency (MDVP:Jitter(%))",
    )
    mdvp_jitter_abs = serializers.FloatField(
        required=False,
        help_text="Absolute jitter in microseconds (MDVP:Jitter(Abs))",
    )
    mdvp_rap = serializers.FloatField(
        required=False,
        help_text="Relative amplitude perturbation (MDVP:RAP)",
    )
    mdvp_ppq = serializers.FloatField(
        required=False,
        help_text="Five-point period perturbation quotient (MDVP:PPQ)",
    )
    jitter_ddp = serializers.FloatField(
        required=False,
        help_text="Average absolute difference of differences between jitter cycles (Jitter:DDP)",
    )

    # Shimmer measures (amplitude variation)
    mdvp_shimmer = serializers.FloatField(
        required=False,
        help_text="Local shimmer amplitude variation (MDVP:Shimmer)",
    )
    mdvp_shimmer_db = serializers.FloatField(
        required=False,
        help_text="Local shimmer in decibels (MDVP:Shimmer(dB))",
    )
    shimmer_apq3 = serializers.FloatField(
        required=False,
        help_text="Three-point amplitude perturbation quotient (Shimmer:APQ3)",
    )
    shimmer_apq5 = serializers.FloatField(
        required=False,
        help_text="Five-point amplitude perturbation quotient (Shimmer:APQ5)",
    )
    mdvp_apq = serializers.FloatField(
        required=False,
        help_text="11-point amplitude perturbation quotient (MDVP:APQ)",
    )
    shimmer_dda = serializers.FloatField(
        required=False,
        help_text="Average absolute differences between consecutive shimmer amplitudes (Shimmer:DDA)",
    )

    # Harmonicity & Noise
    nhr = serializers.FloatField(
        required=False,
        help_text="Noise-to-harmonics ratio (NHR)",
    )
    hnr = serializers.FloatField(
        required=False,
        help_text="Harmonics-to-noise ratio (HNR)",
    )

    # Non-linear dynamical complexity
    rpde = serializers.FloatField(
        required=False,
        help_text="Recurrence period density entropy (RPDE)",
    )
    dfa = serializers.FloatField(
        required=False,
        help_text="Detrended fluctuation analysis (DFA)",
    )
    spread1 = serializers.FloatField(
        required=False,
        help_text="Nonlinear fundamental frequency variation measure (spread1)",
    )
    spread2 = serializers.FloatField(
        required=False,
        help_text="Nonlinear fundamental frequency variation measure (spread2)",
    )
    d2 = serializers.FloatField(
        required=False,
        help_text="Correlation dimension non-linear complexity (D2)",
    )
    ppe = serializers.FloatField(
        required=False,
        help_text="Pitch period entropy (PPE)",
    )

    RAW_KEY_MAPPING = {
        "MDVP:Fo(Hz)": "mdvp_fo",
        "MDVP:Fhi(Hz)": "mdvp_fhi",
        "MDVP:Flo(Hz)": "mdvp_flo",
        "MDVP:Jitter(%)": "mdvp_jitter_percent",
        "MDVP:Jitter(Abs)": "mdvp_jitter_abs",
        "MDVP:RAP": "mdvp_rap",
        "MDVP:PPQ": "mdvp_ppq",
        "Jitter:DDP": "jitter_ddp",
        "MDVP:Shimmer": "mdvp_shimmer",
        "MDVP:Shimmer(dB)": "mdvp_shimmer_db",
        "Shimmer:APQ3": "shimmer_apq3",
        "Shimmer:APQ5": "shimmer_apq5",
        "MDVP:APQ": "mdvp_apq",
        "Shimmer:DDA": "shimmer_dda",
        "NHR": "nhr",
        "HNR": "hnr",
        "RPDE": "rpde",
        "DFA": "dfa",
        "spread1": "spread1",
        "spread2": "spread2",
        "D2": "d2",
        "PPE": "ppe",
    }

    def to_internal_value(self, data):
        # Normalize incoming keys: accept raw dataset keys like "MDVP:Fo(Hz)" or clean keys
        normalized = {}
        for k, v in data.items():
            if k in self.RAW_KEY_MAPPING:
                normalized[self.RAW_KEY_MAPPING[k]] = v
            else:
                normalized[k] = v
        return super().to_internal_value(normalized)

    def validate(self, attrs):
        # Ensure all 22 model features are present and finite numbers
        all_expected = list(self.RAW_KEY_MAPPING.values())
        missing = [k for k in all_expected if attrs.get(k) is None]
        if missing:
            raise serializers.ValidationError(
                f"Missing required voice biomarker inputs: {', '.join(missing)}."
            )
        import math
        for k in all_expected:
            v = attrs.get(k)
            if v is not None and (math.isnan(v) or math.isinf(v)):
                raise serializers.ValidationError(
                    {k: f"Feature '{k}' must be a finite numeric value."}
                )
        return attrs
