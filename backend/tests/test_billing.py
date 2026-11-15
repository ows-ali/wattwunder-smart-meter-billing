from datetime import time
import pytest
from backend.app.billing import (
    is_daytime_reading,
    calculate_bill_for_readings,
)
from backend.app.loader import load_tariff_from_json
from backend.app.config import TARIFF_JSON_PATH, READINGS_CSV_PATH
import csv


SAMPLE_TARIFF = {
    "day": {"from": "06:00", "to": "22:00", "ct_per_kwh": 31.847},
    "night": {"ct_per_kwh": 19.392},
    "monthly_fee_eur": 12.90,
}


def test_is_daytime_reading_boundaries():
    """Verify exact 15-minute start interval boundary semantics."""
    day_from = time(6, 0)
    day_to = time(22, 0)

    # Night intervals before 06:00
    assert is_daytime_reading(time(0, 0), day_from, day_to) is False
    assert is_daytime_reading(time(5, 45), day_from, day_to) is False

    # Day intervals starting at 06:00:00
    assert is_daytime_reading(time(6, 0), day_from, day_to) is True
    assert is_daytime_reading(time(6, 15), day_from, day_to) is True
    assert is_daytime_reading(time(12, 0), day_from, day_to) is True
    assert is_daytime_reading(time(21, 45), day_from, day_to) is True

    # Night intervals starting at 22:00:00
    assert is_daytime_reading(time(22, 0), day_from, day_to) is False
    assert is_daytime_reading(time(22, 15), day_from, day_to) is False
    assert is_daytime_reading(time(23, 45), day_from, day_to) is False


def test_single_reading_day_calculation():
    """Test 1 kWh at day rate."""
    readings = [("2026-10-01T12:00:00", 1000)]
    result = calculate_bill_for_readings(readings, SAMPLE_TARIFF)
    summary = result["summary"]

    assert summary["total_kwh"] == 1.0
    assert summary["day_kwh"] == 1.0
    assert summary["night_kwh"] == 0.0
    assert summary["day_cost_eur"] == 0.32  # 1.0 * 0.31847 rounded to 2 decimals
    assert summary["night_cost_eur"] == 0.0
    assert summary["monthly_fee_eur"] == 12.90
    assert summary["total_bill_eur"] == 13.22  # 12.90 + 0.31847 = 13.21847 -> 13.22


def test_single_reading_night_calculation():
    """Test 1 kWh at night rate."""
    readings = [("2026-10-01T03:00:00", 1000)]
    result = calculate_bill_for_readings(readings, SAMPLE_TARIFF)
    summary = result["summary"]

    assert summary["total_kwh"] == 1.0
    assert summary["day_kwh"] == 0.0
    assert summary["night_kwh"] == 1.0
    assert summary["day_cost_eur"] == 0.0
    assert summary["night_cost_eur"] == 0.19  # 1.0 * 0.19392 rounded to 2 decimals
    assert summary["monthly_fee_eur"] == 12.90
    assert summary["total_bill_eur"] == 13.09  # 12.90 + 0.19392 = 13.09392 -> 13.09


def test_dst_transition_intervals():
    """Ensure duplicate 02:00-02:45 readings during European clock change are accounted for."""
    # 4 readings in first 02:00 hour + 4 readings in second 02:00 hour
    readings = [
        ("2026-10-25T02:00:00", 500),
        ("2026-10-25T02:15:00", 500),
        ("2026-10-25T02:30:00", 500),
        ("2026-10-25T02:45:00", 500),
        ("2026-10-25T02:00:00", 500),
        ("2026-10-25T02:15:00", 500),
        ("2026-10-25T02:30:00", 500),
        ("2026-10-25T02:45:00", 500),
    ]
    result = calculate_bill_for_readings(readings, SAMPLE_TARIFF)
    summary = result["summary"]

    assert summary["intervals_count"] == 8
    assert summary["total_kwh"] == 4.0
    assert summary["night_kwh"] == 4.0
    assert summary["day_kwh"] == 0.0


def test_full_dataset_october_exact_bill():
    """Verify that the full dataset produces the mathematically exact bill for October 2026."""
    tariff = load_tariff_from_json(TARIFF_JSON_PATH)
    readings = []
    with open(READINGS_CSV_PATH, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            readings.append((row["timestamp"].strip(), int(row["energy_wh"].strip())))

    assert len(readings) == 2980, "Expected 2,980 intervals (accounting for 4 extra DST intervals)"

    result = calculate_bill_for_readings(readings, tariff)
    summary = result["summary"]

    assert summary["intervals_count"] == 2980
    assert summary["total_kwh"] == 8842.915
    assert summary["day_kwh"] == 4562.927
    assert summary["night_kwh"] == 4279.988
    assert summary["day_cost_eur"] == 1453.16
    assert summary["night_cost_eur"] == 829.98
    assert summary["monthly_fee_eur"] == 12.90
    assert summary["total_bill_eur"] == 2296.03

    # Bakery savings: ~48.4% of electricity consumed at night rate
    assert summary["night_share_pct"] == 48.4
    assert summary["night_savings_eur"] == 533.07

