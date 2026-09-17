"""
Physiological bound checks for extracted vitals.
Hallucinated or impossible values are dropped, never trusted.
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field, ValidationError, field_validator


class VitalSigns(BaseModel):
    heart_rate: int | None = Field(default=None, ge=30, le=250)
    systolic_bp: int | None = Field(default=None, ge=50, le=260)
    diastolic_bp: int | None = Field(default=None, ge=30, le=160)
    oxygen_saturation: float | None = Field(default=None, ge=50.0, le=100.0)
    temperature_f: float | None = Field(default=None, ge=90.0, le=108.0)
    respiratory_rate: int | None = Field(default=None, ge=6, le=60)

    @field_validator("heart_rate", "systolic_bp", "diastolic_bp", "respiratory_rate", mode="before")
    @classmethod
    def _empty_int(cls, value: Any) -> Any:
        if value in ("", None, "null"):
            return None
        return value

    @field_validator("oxygen_saturation", "temperature_f", mode="before")
    @classmethod
    def _empty_float(cls, value: Any) -> Any:
        if value in ("", None, "null"):
            return None
        return value


CRITICAL_VITAL_REASONS = {
    "heart_rate": "Heart rate is outside a survivable resting range and was discarded.",
    "systolic_bp": "Systolic blood pressure is physiologically implausible and was discarded.",
    "diastolic_bp": "Diastolic blood pressure is physiologically implausible and was discarded.",
    "oxygen_saturation": "SpO2 must be between 50 and 100 percent.",
    "temperature_f": "Temperature is outside a viable human range and was discarded.",
    "respiratory_rate": "Respiratory rate is physiologically implausible and was discarded.",
}


def validate_vitals(raw: dict | None) -> tuple[dict, list[str]]:
    """
    Return (clean_vitals, warnings).
    Invalid fields are omitted rather than crashing the pipeline.
    """
    if not raw:
        return {}, []

    warnings: list[str] = []
    cleaned: dict[str, Any] = {}
    for field_name in VitalSigns.model_fields:
        if field_name not in raw or raw[field_name] in (None, "", "null"):
            continue
        try:
            partial = VitalSigns.model_validate({field_name: raw[field_name]})
            value = getattr(partial, field_name)
            if value is not None:
                cleaned[field_name] = value
        except ValidationError:
            warnings.append(CRITICAL_VITAL_REASONS.get(field_name, f"Invalid {field_name}"))

    # Cross-field: diastolic should not exceed systolic
    if (
        cleaned.get("systolic_bp") is not None
        and cleaned.get("diastolic_bp") is not None
        and cleaned["diastolic_bp"] >= cleaned["systolic_bp"]
    ):
        warnings.append("Diastolic BP was discarded because it was not lower than systolic BP.")
        cleaned.pop("diastolic_bp", None)

    return cleaned, warnings


def vitals_suggest_emergency(vitals: dict) -> str | None:
    """Hard clinical overrides even when language did not trip the sentinel."""
    hr = vitals.get("heart_rate")
    spo2 = vitals.get("oxygen_saturation")
    sbp = vitals.get("systolic_bp")
    rr = vitals.get("respiratory_rate")
    temp = vitals.get("temperature_f")

    if hr is not None and (hr < 40 or hr > 180):
        return f"Heart rate {hr} bpm is a critical vital-sign emergency."
    if spo2 is not None and spo2 < 88:
        return f"Oxygen saturation {spo2}% indicates severe hypoxemia."
    if sbp is not None and sbp < 80:
        return f"Systolic BP {sbp} mmHg is consistent with shock physiology."
    if rr is not None and (rr < 8 or rr > 40):
        return f"Respiratory rate {rr}/min is a critical finding."
    if temp is not None and temp >= 106:
        return f"Temperature {temp}°F indicates a heat emergency."
    return None
