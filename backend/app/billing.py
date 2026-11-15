from collections import defaultdict
from datetime import datetime, time
import sqlite3
from typing import Any, Dict, List, Optional, Tuple


def parse_time_str(t_str: str) -> time:
    """Parse 'HH:MM' or 'HH:MM:SS' string into a datetime.time object."""
    parts = [int(p) for p in t_str.split(":")]
    if len(parts) == 2:
        return time(parts[0], parts[1], 0)
    return time(parts[0], parts[1], parts[2])


def is_daytime_reading(
    reading_time: time,
    day_from: time = time(6, 0),
    day_to: time = time(22, 0),
) -> bool:
    """
    Check if a 15-minute interval starting at reading_time falls in the day tariff.
    Standard smart metering convention: timestamp marks the START of the interval [t, t + 15m).
    Therefore, intervals starting at 06:00:00 up to 21:45:00 are DAY rate.
    Intervals starting at 22:00:00 up to 05:45:00 are NIGHT rate.
    """
    if day_from < day_to:
        return day_from <= reading_time < day_to
    # In case day window wraps midnight (not standard, but handled defensively)
    return reading_time >= day_from or reading_time < day_to


def calculate_bill_for_readings(
    readings: List[Tuple[str, int]],
    tariff: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Calculate the electricity bill from a list of (timestamp_iso, energy_wh) tuples.
    Applies the provided time-of-use tariff and monthly base fee.
    """
    day_from = parse_time_str(tariff["day"].get("from", "06:00"))
    day_to = parse_time_str(tariff["day"].get("to", "22:00"))
    day_rate_eur = tariff["day"]["ct_per_kwh"] / 100.0
    night_rate_eur = tariff["night"]["ct_per_kwh"] / 100.0
    monthly_fee_eur = tariff["monthly_fee_eur"]

    total_wh = 0
    day_wh = 0
    night_wh = 0
    day_readings_count = 0
    night_readings_count = 0

    daily_map = defaultdict(lambda: {"day_wh": 0, "night_wh": 0, "intervals": 0})
    hourly_map = defaultdict(lambda: {"day_wh": 0, "night_wh": 0, "intervals": 0})

    for ts_str, energy_wh in readings:
        total_wh += energy_wh

        # Parse timestamp: e.g. "2026-10-01T00:00:00"
        # Extract date and time parts efficiently without expensive strptime overhead
        date_part, time_part = ts_str.split("T")
        t_parts = time_part.split(":")
        h = int(t_parts[0])
        m = int(t_parts[1])
        s = int(t_parts[2]) if len(t_parts) > 2 else 0
        r_time = time(h, m, s)

        is_day = is_daytime_reading(r_time, day_from, day_to)

        if is_day:
            day_wh += energy_wh
            day_readings_count += 1
            daily_map[date_part]["day_wh"] += energy_wh
            hourly_map[h]["day_wh"] += energy_wh
        else:
            night_wh += energy_wh
            night_readings_count += 1
            daily_map[date_part]["night_wh"] += energy_wh
            hourly_map[h]["night_wh"] += energy_wh

        daily_map[date_part]["intervals"] += 1
        hourly_map[h]["intervals"] += 1

    total_kwh = total_wh / 1000.0
    day_kwh = day_wh / 1000.0
    night_kwh = night_wh / 1000.0

    day_cost_eur = day_kwh * day_rate_eur
    night_cost_eur = night_kwh * night_rate_eur
    energy_cost_eur = day_cost_eur + night_cost_eur
    total_bill_eur = energy_cost_eur + monthly_fee_eur

    # Customer value analysis (bakery insight)
    # What would it cost if all power was billed at the standard day rate?
    flat_day_cost_eur = (total_kwh * day_rate_eur) + monthly_fee_eur
    night_savings_eur = max(0.0, flat_day_cost_eur - total_bill_eur)
    night_share_pct = (night_kwh / total_kwh * 100.0) if total_kwh > 0 else 0.0

    # Build sorted daily aggregates for frontend chart
    daily_breakdown = []
    for date_key in sorted(daily_map.keys()):
        d_val = daily_map[date_key]
        d_day_kwh = d_val["day_wh"] / 1000.0
        d_night_kwh = d_val["night_wh"] / 1000.0
        d_total_kwh = d_day_kwh + d_night_kwh
        d_cost = (d_day_kwh * day_rate_eur) + (d_night_kwh * night_rate_eur)
        daily_breakdown.append(
            {
                "date": date_key,
                "day_kwh": round(d_day_kwh, 3),
                "night_kwh": round(d_night_kwh, 3),
                "total_kwh": round(d_total_kwh, 3),
                "cost_eur": round(d_cost, 2),
                "intervals": d_val["intervals"],
            }
        )

    # Build 24-hour profile (hourly pattern)
    hourly_breakdown = []
    for hour in range(24):
        h_val = hourly_map[hour]
        intervals = h_val["intervals"]
        avg_kwh = ((h_val["day_wh"] + h_val["night_wh"]) / 1000.0) / max(1, intervals // 4) if intervals > 0 else 0.0
        is_day_hour = is_daytime_reading(time(hour, 0), day_from, day_to)
        hourly_breakdown.append(
            {
                "hour": hour,
                "label": f"{hour:02d}:00",
                "total_kwh": round((h_val["day_wh"] + h_val["night_wh"]) / 1000.0, 2),
                "is_day_tariff": is_day_hour,
            }
        )

    return {
        "summary": {
            "total_kwh": round(total_kwh, 3),
            "day_kwh": round(day_kwh, 3),
            "night_kwh": round(night_kwh, 3),
            "day_cost_eur": round(day_cost_eur, 2),
            "night_cost_eur": round(night_cost_eur, 2),
            "energy_cost_eur": round(energy_cost_eur, 2),
            "monthly_fee_eur": round(monthly_fee_eur, 2),
            "total_bill_eur": round(total_bill_eur, 2),
            "night_share_pct": round(night_share_pct, 1),
            "night_savings_eur": round(night_savings_eur, 2),
            "intervals_count": len(readings),
        },
        "tariff": {
            "day_from": tariff["day"].get("from", "06:00"),
            "day_to": tariff["day"].get("to", "22:00"),
            "day_ct_per_kwh": tariff["day"]["ct_per_kwh"],
            "night_ct_per_kwh": tariff["night"]["ct_per_kwh"],
            "monthly_fee_eur": tariff["monthly_fee_eur"],
        },
        "daily_breakdown": daily_breakdown,
        "hourly_breakdown": hourly_breakdown,
    }


def get_bill_for_month(
    conn: sqlite3.Connection,
    month: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Fetch readings from SQLite for a given month (e.g. '2026-10') and compute the bill.
    If month is None, defaults to the most recent month with readings.
    """
    from backend.app.loader import get_active_tariff

    cursor = conn.cursor()

    # Determine month if not specified
    if not month:
        cursor.execute("SELECT strftime('%Y-%m', timestamp) as m FROM meter_readings ORDER BY timestamp DESC LIMIT 1;")
        row = cursor.fetchone()
        if not row or not row["m"]:
            # Empty database
            month = datetime.now().strftime("%Y-%m")
        else:
            month = row["m"]

    # Query readings for this month
    query = """
        SELECT timestamp, energy_wh
        FROM meter_readings
        WHERE timestamp LIKE ?
        ORDER BY timestamp ASC;
    """
    cursor.execute(query, (f"{month}%",))
    rows = cursor.fetchall()

    readings = [(r["timestamp"], r["energy_wh"]) for r in rows]
    tariff = get_active_tariff(conn)

    bill_result = calculate_bill_for_readings(readings, tariff)
    bill_result["month"] = month
    return bill_result


def get_available_months(conn: sqlite3.Connection) -> List[str]:
    """Return all distinct YYYY-MM months present in the readings table, ordered descending."""
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT DISTINCT substr(timestamp, 1, 7) as month
        FROM meter_readings
        WHERE timestamp IS NOT NULL AND length(timestamp) >= 7
        ORDER BY month DESC;
        """
    )
    return [row["month"] for row in cursor.fetchall()]

