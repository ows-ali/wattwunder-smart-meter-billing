import os
import sys
import tempfile
from pathlib import Path

# Add project root directory to sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

# In Vercel serverless, SQLite must write to tempdir
os.environ.setdefault("DATABASE_PATH", str(Path(tempfile.gettempdir()) / "wattwunder.db"))

from fastapi import Request
from backend.app.main import app as fastapi_app
from backend.app.database import get_db, init_db
from backend.app.loader import load_initial_data

# Ensure DB is initialized on cold-start
try:
    with get_db() as conn:
        init_db(conn)
        load_initial_data(conn)
except Exception as e:
    print(f"Serverless initialization note: {e}", file=sys.stderr)


# Official FastAPI HTTP middleware to handle Vercel proxy rewrite paths
@fastapi_app.middleware("http")
async def vercel_path_rewrite(request: Request, call_next):
    # Check headers sent by Vercel's proxy/router
    matched_path = (
        request.headers.get("x-matched-path")
        or request.headers.get("x-vercel-matched-path")
        or request.headers.get("x-forwarded-uri")
        or request.headers.get("x-invoke-path")
    )
    if matched_path:
        clean_path = matched_path.split("?")[0]
        if clean_path and not clean_path.endswith("index.py") and not clean_path.endswith("/api/index"):
            request.scope["path"] = clean_path

    # Clean up if path has /api/index.py prefix
    curr = request.scope.get("path", "")
    if curr.startswith("/api/index.py"):
        rem = curr[len("/api/index.py"):]
        request.scope["path"] = rem if rem else "/"
    elif curr.startswith("/index.py"):
        rem = curr[len("/index.py"):]
        request.scope["path"] = rem if rem else "/"

    response = await call_next(request)
    return response


# Vercel ASGI expects the FastAPI instance named 'app'
app = fastapi_app
