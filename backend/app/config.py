import os
import tempfile
from pathlib import Path

# Base paths
APP_DIR = Path(__file__).resolve().parent
BACKEND_DIR = APP_DIR.parent
ROOT_DIR = BACKEND_DIR.parent

# Data files search
def find_data_file(filename: str) -> Path:
    candidates = [
        APP_DIR / filename,
        ROOT_DIR / filename,
        Path.cwd() / filename,
        Path("/var/task") / filename,
        Path("/var/task/backend/app") / filename,
    ]
    for c in candidates:
        if c.exists():
            return c
    return ROOT_DIR / filename

DATA_DIR = Path(os.getenv("DATA_DIR", ROOT_DIR))
READINGS_CSV_PATH = Path(os.getenv("READINGS_CSV_PATH", find_data_file("readings.csv")))
TARIFF_JSON_PATH = Path(os.getenv("TARIFF_JSON_PATH", find_data_file("tariff.json")))

# SQLite database
if os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"):
    default_db = Path(tempfile.gettempdir()) / "wattwunder.db"
else:
    default_db = BACKEND_DIR / "wattwunder.db"

DB_PATH = Path(os.getenv("DATABASE_PATH", default_db))
DATABASE_URL = f"sqlite:///{DB_PATH}"

