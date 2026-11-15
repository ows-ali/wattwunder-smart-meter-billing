from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


class ReadingCreate(BaseModel):
    timestamp: str = Field(..., json_schema_extra={"example": "2026-11-01T00:00:00"}, description="ISO 8601 timestamp")
    energy_wh: int = Field(..., ge=0, json_schema_extra={"example": 520}, description="Energy consumed in Watt-hours")

    @field_validator("timestamp")
    @classmethod
    def validate_timestamp_format(cls, v: str) -> str:
        v = v.strip()
        try:
            # Validate ISO format parsing
            datetime.fromisoformat(v)
        except Exception:
            raise ValueError(f"Invalid timestamp format '{v}'. Expected ISO format like 'YYYY-MM-DDTHH:MM:SS'.")
        return v


class ReadingBatchCreate(BaseModel):
    readings: List[ReadingCreate] = Field(..., min_length=1, description="List of 15-minute readings to ingest")


class ReadingCreatedResponse(BaseModel):
    message: str
    inserted_count: int


class TariffSummary(BaseModel):
    day_from: str
    day_to: str
    day_ct_per_kwh: float
    night_ct_per_kwh: float
    monthly_fee_eur: float


class BillSummary(BaseModel):
    total_kwh: float
    day_kwh: float
    night_kwh: float
    day_cost_eur: float
    night_cost_eur: float
    energy_cost_eur: float
    monthly_fee_eur: float
    total_bill_eur: float
    night_share_pct: float
    night_savings_eur: float
    intervals_count: int


class DailyUsageItem(BaseModel):
    date: str
    day_kwh: float
    night_kwh: float
    total_kwh: float
    cost_eur: float
    intervals: int


class HourlyUsageItem(BaseModel):
    hour: int
    label: str
    total_kwh: float
    is_day_tariff: bool


class BillResponse(BaseModel):
    month: str
    customer_name: str = "Bäckerei Sonnenschein"
    account_number: str = "WW-78492-DE"
    meter_id: str = "1EMH0004928172"
    summary: BillSummary
    tariff: TariffSummary
    daily_breakdown: List[DailyUsageItem]
    hourly_breakdown: List[HourlyUsageItem]


class AvailableMonthsResponse(BaseModel):
    months: List[str]
    selected_month: Optional[str] = None
