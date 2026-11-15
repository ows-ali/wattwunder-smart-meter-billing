from contextlib import asynccontextmanager
from typing import Optional, Union
from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from backend.app.database import get_db, init_db
from backend.app.loader import load_initial_data
from backend.app.billing import get_bill_for_month, get_available_months
from backend.app.models import (
    AvailableMonthsResponse,
    BillResponse,
    ReadingBatchCreate,
    ReadingCreate,
    ReadingCreatedResponse,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schema & seed data
    with get_db() as conn:
        init_db(conn)
        load_initial_data(conn)
    yield


app = FastAPI(
    title="WattWunder Smart Meter Billing API",
    description="Backend service computing time-of-use electricity bills from smart meter readings.",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", tags=["System"])
def health_check():
    return {"status": "ok", "service": "WattWunder Billing Service"}


@app.get("/api/months", response_model=AvailableMonthsResponse, tags=["Billing"])
def list_available_months():
    """List all billing months available in the smart meter records."""
    with get_db() as conn:
        months = get_available_months(conn)
    selected = months[0] if months else None
    return AvailableMonthsResponse(months=months, selected_month=selected)


@app.get("/api/bill", response_model=BillResponse, tags=["Billing"])
def get_customer_bill(
    month: Optional[str] = Query(
        None,
        pattern=r"^\d{4}-\d{2}$",
        description="Month in 'YYYY-MM' format (e.g. '2026-10'). Defaults to latest.",
    )
):
    """
    Compute and return customer's monthly bill, tariff breakdown, and usage metrics.
    """
    with get_db() as conn:
        bill_data = get_bill_for_month(conn, month)
    return bill_data


@app.post(
    "/api/readings",
    response_model=ReadingCreatedResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Meter Ingestion"],
)
def report_meter_readings(payload: Union[ReadingBatchCreate, ReadingCreate]):
    """
    Endpoint for smart meters to report 15-minute energy readings (single reading or batch).
    """
    if isinstance(payload, ReadingCreate):
        readings = [payload]
    else:
        readings = payload.readings

    records = [(r.timestamp, r.energy_wh) for r in readings]

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.executemany(
            "INSERT INTO meter_readings (timestamp, energy_wh) VALUES (?, ?);",
            records,
        )

    return ReadingCreatedResponse(
        message=f"Successfully ingested {len(records)} reading(s).",
        inserted_count=len(records),
    )


# Optional static mounting for production build if frontend/dist exists
frontend_dist = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="frontend")
