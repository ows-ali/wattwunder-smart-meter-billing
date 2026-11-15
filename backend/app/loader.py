import csv
import json
import logging
from pathlib import Path
import sqlite3
from typing import Dict, Any, Optional

from backend.app.config import READINGS_CSV_PATH, TARIFF_JSON_PATH

logger = logging.getLogger("wattwunder.loader")


def load_tariff_from_json(json_path: Path = TARIFF_JSON_PATH) -> Dict[str, Any]:
    if not json_path.exists():
        raise FileNotFoundError(f"Tariff configuration file not found at {json_path}")
    with open(json_path, "r", encoding="utf-8") as f:
        return json.load(f)


def get_recorded_mtime(cursor: sqlite3.Cursor, file_key: str) -> Optional[float]:
    cursor.execute("SELECT last_modified FROM data_sync_meta WHERE file_key = ?;", (file_key,))
    row = cursor.fetchone()
    return row[0] if row else None


def set_recorded_mtime(cursor: sqlite3.Cursor, file_key: str, mtime: float) -> None:
    cursor.execute(
        """
        INSERT INTO data_sync_meta (file_key, last_modified)
        VALUES (?, ?)
        ON CONFLICT(file_key) DO UPDATE SET last_modified = excluded.last_modified;
        """,
        (file_key, mtime),
    )


def sync_data_files(conn: sqlite3.Connection, force: bool = False) -> Dict[str, bool]:
    """
    Checks if tariff.json or readings.csv have changed on disk (via mtime).
    If modified or force=True, updates the SQLite database automatically.
    """
    cursor = conn.cursor()
    synced = {"tariff": False, "readings": False}

    # 1. Sync tariff.json
    if TARIFF_JSON_PATH.exists():
        current_mtime = TARIFF_JSON_PATH.stat().st_mtime
        recorded_mtime = get_recorded_mtime(cursor, "tariff.json")

        cursor.execute("SELECT COUNT(*) FROM tariffs WHERE is_active = 1;")
        (tariff_count,) = cursor.fetchone()

        if force or tariff_count == 0 or recorded_mtime is None or recorded_mtime != current_mtime:
            logger.info("Syncing updated tariff.json to database...")
            tariff_data = load_tariff_from_json(TARIFF_JSON_PATH)

            # Deactivate older tariffs
            cursor.execute("UPDATE tariffs SET is_active = 0;")
            cursor.execute(
                """
                INSERT INTO tariffs (name, day_from, day_to, day_ct_per_kwh, night_ct_per_kwh, monthly_fee_eur, is_active)
                VALUES (?, ?, ?, ?, ?, ?, 1);
                """,
                (
                    "Standard Gewerbe Zeit-Tarif",
                    tariff_data["day"].get("from", "06:00"),
                    tariff_data["day"].get("to", "22:00"),
                    float(tariff_data["day"]["ct_per_kwh"]),
                    float(tariff_data["night"]["ct_per_kwh"]),
                    float(tariff_data["monthly_fee_eur"]),
                ),
            )
            set_recorded_mtime(cursor, "tariff.json", current_mtime)
            synced["tariff"] = True

    # 2. Sync readings.csv
    if READINGS_CSV_PATH.exists():
        current_mtime = READINGS_CSV_PATH.stat().st_mtime
        recorded_mtime = get_recorded_mtime(cursor, "readings.csv")

        cursor.execute("SELECT COUNT(*) FROM meter_readings;")
        (readings_count,) = cursor.fetchone()

        if force or readings_count == 0 or recorded_mtime is None or recorded_mtime != current_mtime:
            logger.info(f"Syncing updated readings from {READINGS_CSV_PATH}...")
            records = []
            with open(READINGS_CSV_PATH, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    ts = row["timestamp"].strip()
                    wh = int(row["energy_wh"].strip())
                    records.append((ts, wh))

            # Replace readings with the fresh CSV content
            cursor.execute("DELETE FROM meter_readings;")
            cursor.executemany(
                "INSERT INTO meter_readings (timestamp, energy_wh) VALUES (?, ?);",
                records,
            )
            set_recorded_mtime(cursor, "readings.csv", current_mtime)
            synced["readings"] = True
            logger.info(f"Successfully loaded {len(records)} readings from CSV.")

    conn.commit()
    return synced


def load_initial_data(conn: sqlite3.Connection) -> None:
    sync_data_files(conn, force=False)


def get_active_tariff(conn: sqlite3.Connection) -> dict:
    # Auto-sync if tariff.json was changed on disk
    sync_data_files(conn, force=False)

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

    return load_tariff_from_json(TARIFF_JSON_PATH)
