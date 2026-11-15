import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app import config


@pytest.fixture(scope="module")
def client(tmp_path_factory):
    # Use isolated test database for API tests
    test_db = tmp_path_factory.mktemp("data") / "test_wattwunder.db"
    orig_db = config.DB_PATH
    config.DB_PATH = test_db
    with TestClient(app) as c:
        yield c
    config.DB_PATH = orig_db


def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_get_available_months(client):
    response = client.get("/api/months")
    assert response.status_code == 200
    data = response.json()
    assert "months" in data
    assert "2026-10" in data["months"]


def test_get_customer_bill(client):
    response = client.get("/api/bill?month=2026-10")
    assert response.status_code == 200
    data = response.json()

    assert data["month"] == "2026-10"
    assert data["customer_name"] == "Bäckerei Sonnenschein"
    assert data["summary"]["total_bill_eur"] == 2296.03
    assert data["summary"]["total_kwh"] == 8842.915
    assert data["summary"]["day_cost_eur"] == 1453.16
    assert data["summary"]["night_cost_eur"] == 829.98
    assert data["summary"]["monthly_fee_eur"] == 12.90

    # Ensure daily breakdown has 31 days
    assert len(data["daily_breakdown"]) == 31
    # Ensure hourly breakdown has 24 hours
    assert len(data["hourly_breakdown"]) == 24


def test_report_new_readings_endpoint(client):
    # Submit a reading for November 2026
    new_reading = {
        "timestamp": "2026-11-01T00:00:00",
        "energy_wh": 500,
    }
    response = client.post("/api/readings", json=new_reading)
    assert response.status_code == 201
    assert response.json()["inserted_count"] == 1

    # Check that November now appears in available months
    months_resp = client.get("/api/months")
    assert "2026-11" in months_resp.json()["months"]

    # Check bill for November
    bill_resp = client.get("/api/bill?month=2026-11")
    assert bill_resp.status_code == 200
    nov_bill = bill_resp.json()
    assert nov_bill["month"] == "2026-11"
    assert nov_bill["summary"]["total_kwh"] == 0.5
    assert nov_bill["summary"]["night_kwh"] == 0.5
    assert nov_bill["summary"]["monthly_fee_eur"] == 12.90
