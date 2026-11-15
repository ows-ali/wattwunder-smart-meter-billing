import os
from pathlib import Path

# Base paths
APP_DIR = Path(__file__).resolve().parent
BACKEND_DIR = APP_DIR.parent
ROOT_DIR = BACKEND_DIR.parent

# Data files
DATA_DIR = Path(os.getenv("DATA_DIR", ROOT_DIR))
READINGS_CSV_PATH = Path(os.getenv("READINGS_CSV_PATH", DATA_DIR / "readings.csv"))
TARIFF_JSON_PATH = Path(os.getenv("TARIFF_JSON_PATH", DATA_DIR / "tariff.json"))

# SQLite database
DB_PATH = Path(os.getenv("DATABASE_PATH", BACKEND_DIR / "wattwunder.db"))
DATABASE_URL = f"sqlite:///{DB_PATH}"

