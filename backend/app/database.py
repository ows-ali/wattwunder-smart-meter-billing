import sqlite3
from contextlib import contextmanager
from typing import Generator
from backend.app import config


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(config.DB_PATH)
    conn.row_factory = sqlite3.Row
    # Enable WAL mode for better concurrency and foreign keys
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    return conn


@contextmanager
def get_db() -> Generator[sqlite3.Connection, None, None]:
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db(conn: sqlite3.Connection | None = None) -> None:
    """Initialize database tables and indexes."""
    close_after = False
    if conn is None:
        conn = get_connection()
        close_after = True

    try:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS meter_readings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                energy_wh INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_readings_timestamp ON meter_readings(timestamp);

            CREATE TABLE IF NOT EXISTS tariffs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                day_from TEXT NOT NULL,
                day_to TEXT NOT NULL,
                day_ct_per_kwh REAL NOT NULL,
                night_ct_per_kwh REAL NOT NULL,
                monthly_fee_eur REAL NOT NULL,
                is_active INTEGER DEFAULT 1
            );

            CREATE TABLE IF NOT EXISTS data_sync_meta (
                file_key TEXT PRIMARY KEY,
                last_modified REAL NOT NULL
            );
            """
        )
        conn.commit()
    finally:
        if close_after:
            conn.close()
