import csv
import json
from pathlib import Path
import sys

# ==============================================================================
# CONFIGURATION:
# Specify the filename of your copied CSV file here.
# You can also run the script from the terminal with:
#   python fill_tariffs_in_csv.py your_filename.csv
# ==============================================================================
TARGET_CSV = "my_readings_copy.csv"

ROOT_DIR = Path(__file__).resolve().parent
TARIFF_JSON = ROOT_DIR / "tariff.json"


def fill_tariffs_for_file(filename: str):
    target_path = ROOT_DIR / filename if not Path(filename).is_absolute() else Path(filename)

    if not target_path.exists():
        print(f"\n❌ Error: File '{target_path.name}' was not found in {target_path.parent}!")
        print("Please create your CSV copy, place it in the project folder, and ensure the filename matches:")
        print(f"  TARGET_CSV = \"{target_path.name}\"")
        print("\nOr run with:")
        print(f"  python fill_tariffs_in_csv.py {target_path.name}")
        return

    # Load tariff rules
    with open(TARIFF_JSON, "r", encoding="utf-8") as f:
        tariff = json.load(f)

    day_from_str = tariff["day"].get("from", "06:00")
    day_to_str = tariff["day"].get("to", "22:00")
    day_rate_ct = float(tariff["day"]["ct_per_kwh"])
    night_rate_ct = float(tariff["night"]["ct_per_kwh"])
    monthly_fee = float(tariff["monthly_fee_eur"])

    day_from_h, day_from_m = map(int, day_from_str.split(":"))
    day_to_h, day_to_m = map(int, day_to_str.split(":"))

    # Read original rows
    with open(target_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames or []
        rows = list(reader)

    if not rows:
        print(f"❌ Error: '{target_path.name}' is empty.")
        return

    # Check for expected columns
    if "timestamp" not in fieldnames or "energy_wh" not in fieldnames:
        print(f"❌ Error: '{target_path.name}' must have 'timestamp' and 'energy_wh' columns.")
        print(f"Found columns: {fieldnames}")
        return

    # Process and populate tariff columns
    total_wh = 0
    day_wh = 0
    night_wh = 0
    processed_rows = []

    for row in rows:
        ts = row["timestamp"].strip()
        wh = int(float(row["energy_wh"].strip()))
        total_wh += wh

        # Parse interval time
        _, time_part = ts.split("T")
        h, m, *_ = map(int, time_part.split(":"))

        # Interval start: 06:00 to 22:00 is Day rate
        is_day = (h > day_from_h or (h == day_from_h and m >= day_from_m)) and \
                 (h < day_to_h or (h == day_to_h and m < day_to_m))

        if is_day:
            rate_ct = day_rate_ct
            t_type = "day"
            day_wh += wh
        else:
            rate_ct = night_rate_ct
            t_type = "night"
            night_wh += wh

        cost_eur = (wh / 1000.0) * (rate_ct / 100.0)

        # Update row with the filled tariff columns
        row["tariff_ct_per_kwh"] = rate_ct
        row["tariff_type"] = t_type
        row["cost_eur"] = round(cost_eur, 6)
        processed_rows.append(row)

    # Write back in-place to the target CSV
    new_fieldnames = ["timestamp", "energy_wh", "tariff_ct_per_kwh", "tariff_type", "cost_eur"]
    # Preserve any other custom columns if they existed
    for fn in fieldnames:
        if fn not in new_fieldnames:
            new_fieldnames.append(fn)

    with open(target_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=new_fieldnames)
        writer.writeheader()
        writer.writerows(processed_rows)

    # Calculate totals for Excel cross-checking
    day_kwh = day_wh / 1000.0
    night_kwh = night_wh / 1000.0
    day_cost = day_kwh * (day_rate_ct / 100.0)
    night_cost = night_kwh * (night_rate_ct / 100.0)
    total_bill = day_cost + night_cost + monthly_fee

    print(f"\n✅ Successfully updated: {target_path.name}")
    print(f"Total intervals processed: {len(processed_rows)}")
    print("\n--- Excel Verification Summary ---")
    print(f"Total Energy:     {total_wh / 1000.0:,.3f} kWh".replace(",", "X").replace(".", ",").replace("X", "."))
    print(f"Day Energy:       {day_kwh:,.3f} kWh @ {day_rate_ct} ct  = {day_cost:,.2f} €".replace(",", "X").replace(".", ",").replace("X", "."))
    print(f"Night Energy:     {night_kwh:,.3f} kWh @ {night_rate_ct} ct = {night_cost:,.2f} €".replace(",", "X").replace(".", ",").replace("X", "."))
    print(f"Monthly Base Fee:                         = {monthly_fee:,.2f} €".replace(",", "X").replace(".", ",").replace("X", "."))
    print(f"Total Bill:                               = {total_bill:,.2f} €".replace(",", "X").replace(".", ",").replace("X", "."))


if __name__ == "__main__":
    # If a filename argument was passed in CLI (e.g. python fill_tariffs_in_csv.py copy.csv), use it
    filename_to_use = sys.argv[1] if len(sys.argv) > 1 else TARGET_CSV
    fill_tariffs_for_file(filename_to_use)

