# WattWunder Smart Meter Billing

A production-quality full-stack application that computes time-of-use electricity bills from raw smart meter readings and presents an intuitive, transparent billing dashboard for commercial customers (e.g., a bakery).

Built with **Python (FastAPI)**, **React + TypeScript (Vite)**, and **SQLite**.

---

## Quick Start (Running in under 5 minutes)

### Prerequisites
* **Python 3.10+**
* **Node.js 18+** & **npm** (for frontend development)

---

### Option 1: One-Step All-in-One Runner (Fastest)

The frontend is already built into `frontend/dist/`. The FastAPI backend serves both the API and the full interactive UI from a single process:

1. **Install backend dependencies:**
   ```bash
   pip install -r backend/requirements.txt
   ```

2. **Start the server:**
   ```bash
   python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

3. **Open the browser:**
   * **Customer Dashboard:** [http://localhost:8000](http://localhost:8000)
   * **Interactive API Documentation (Swagger):** [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Option 2: Full Development Mode (with Hot Reload)

If you wish to modify frontend code with live Vite HMR:

1. **Start the backend:**
   ```bash
   pip install -r backend/requirements.txt
   python -m uvicorn backend.app.main:app --port 8000 --reload
   ```

2. **In a second terminal, start the frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Open:** [http://localhost:5173](http://localhost:5173) (Vite proxies API calls to port 8000).

---

## Running the Automated Test Suite

Run the full automated test suite (unit calculations, boundary conditions, DST handling, API contract):

```bash
pytest backend/tests -v
```

All 9 test cases pass in under 1 second.

---

## Billing Calculation Summary (October 2026)

* **Total Bill:** **€ 2.296,03**
* **Total Energy:** 8.842,915 kWh (2.980 quarter-hour intervals)
* **Tagstrom (06:00 – 22:00):** 4.562,927 kWh @ 31,847 ct/kWh = **€ 1.453,16**
* **Nachtstrom (22:00 – 06:00):** 4.279,988 kWh @ 19,392 ct/kWh = **€ 829,98**
* **Monatlicher Grundpreis:** **€ 12,90**
* **Customer Value:** **48,4 %** of consumption occurred in the night tariff, saving **€ 533,07** compared to a flat day rate.

*(See [NOTES.md](file:///d:/ows/proj/smart%20meter%20billing/smart-meter-billing/smart-meter-billing/NOTES.md) for full engineering rationale, DST analysis, and architecture decisions).*

---

## Architecture & Features

### Backend (`backend/`)
* **`app/billing.py`**: Pure domain calculations with standard 15-minute interval-start semantics ($[t, t + 15\text{min})$) and European DST handling.
* **`app/database.py`**: SQLite database with Write-Ahead Logging (WAL) and foreign keys enabled.
* **`app/loader.py`**: Idempotent ingestion of `readings.csv` and `tariff.json` on startup.
* **`app/main.py`**: FastAPI REST API with endpoints:
  * `GET /api/bill?month=YYYY-MM`: Calculates bill, summary metrics, 31-day breakdown, and 24h hourly profile.
  * `GET /api/months`: Returns all billing months present in the database.
  * `POST /api/readings`: Allows smart meters to report single or batch 15-minute readings into storage.
  * `GET /api/health`: Health status.

### Frontend (`frontend/`)
* **Customer-Centric German UI**: Written in friendly, transparent language for a bakery owner.
* **WattWunder Brand Compliance**: Exact brand colors (`#0F2A3F` navy, `#F5A623` amber, `#F7F5F0` background), Google font **Figtree**, and official `logo.svg`.
* **Understand in 30 Seconds**:
  * Hero banner with total invoice amount, consumption KPIs, and night tariff savings badge.
  * Transparent 3-row line-item table (Grundpreis, Tagstrom, Nachtstrom).
  * Interactive charts: 31-day stacked daily bar chart + 24-hour typical profile highlighting early morning oven baking hours (03:00–07:00).
  * Month selector dropdown with dynamic month switching.
  * Interactive **"Messwert melden"** modal to simulate live meter ingestion and watch the bill recalculate.
