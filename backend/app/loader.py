import csv
import json
import logging
from pathlib import Path
import sqlite3
from backend.app.config import READINGS_CSV_PATH, TARIFF_JSON_PATH
from backend.app.database import get_db

logger = logging.getLogger("wattwunder.loader")


def load_tariff_from_json(json_path: Path = TARIFF_JSON_PATH) -> dict:
    if not json_path.exists():
        raise FileNotFoundError(f"Tariff configuration file not found at {json_path}")
    with open(json_path, "r", encoding="utf-8") as f:
        return json.load(f)


def load_initial_data(conn: sqlite3.Connection) -> None:
    """Idempotently seed the SQLite database with readings.csv and tariff.json."""
    cursor = conn.cursor()

    # Seed tariff if not present
    cursor.execute("SELECT COUNT(*) FROM tariffs WHERE is_active = 1;")
    (tariff_count,) = cursor.fetchone()
    if tariff_count == 0 and TARIFF_JSON_PATH.exists():
        tariff_data = load_tariff_from_json(TARIFF_JSON_PATH)
        cursor.execute(
            """
            INSERT INTO tariffs (name, day_from, day_to, day_ct_per_kwh, night_ct_per_kwh, monthly_fee_eur, is_active)
            VALUES (?, ?, ?, ?, ?, ?, 1);
            """,
            (
                "Standard Gewerbe Zeit-Tarif",
                tariff_data["day"].get("from", "06:00"),
                tariff_data["day"].get("to", "22:00"),
                tariff_data["day"]["ct_per_kwh"],
                tariff_data["night"]["ct_per_kwh"],
                tariff_data["monthly_fee_eur"],
            ),
        )
        logger.info("Tariff configuration seeded successfully.")

    # Seed readings if empty
    cursor.execute("SELECT COUNT(*) FROM meter_readings;")
    (readings_count,) = cursor.fetchone()
    if readings_count == 0 and READINGS_CSV_PATH.exists():
        logger.info(f"Seeding meter readings from {READINGS_CSV_PATH}...")
        records = []
        with open(READINGS_CSV_PATH, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                ts = row["timestamp"].strip()
                wh = int(row["energy_wh"].strip())
                records.append((ts, wh))

        cursor.executemany(
            "INSERT INTO meter_readings (timestamp, energy_wh) VALUES (?, ?);",
            records,
        )
        logger.info(f"Seeded {len(records)} meter readings.")


def get_active_tariff(conn: sqlite3.Connection) -> dict:
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT day_from, day_to, day_ct_per_kwh, night_ct_per_kwh, monthly_fee_eur
        FROM tariffs
        WHERE is_active = 1
        ORDER BY id DESC LIMIT 1;
        """
    )
    row = cursor.fetchone()
    if row:
        return {
            "day": {
                "from": row["day_from"],
                "to": row["day_to"],
                "ct_per_kwh": row["day_ct_per_kwh"],
            },
            "night": {"ct_per_kwh": row["night_ct_per_kwh"]},
            "monthly_fee_eur": row["monthly_fee_eur"],
        }

    # Fallback to file directly if DB is somehow unseeded
    return load_tariff_from_json(TARIFF_JSON_PATH)

