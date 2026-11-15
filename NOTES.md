# WattWunder Smart Meter Billing – Engineering Notes

## 1. Monthly Total Computed
For October 2026, the code computes a total bill of **€ 2.296,03**.

* **Total Consumption:** 8.842,915 kWh (across 2.980 quarter-hour intervals)
* **Tagstrom (06:00 – 22:00):** 4.562,927 kWh @ 31,847 ct/kWh = **€ 1.453,16**
* **Nachtstrom (22:00 – 06:00):** 4.279,988 kWh @ 19,392 ct/kWh = **€ 829,98**
* **Monatlicher Grundpreis:** **€ 12,90**
* **Gesamtbetrag:** **€ 2.296,03**

---

## 2. Decisions on Unanswered Questions
1. **Interval Timestamp Semantics:** The readings begin at `2026-10-01T00:00:00` and end at `2026-10-31T23:45:00`. In line with smart metering standards (e.g., German BNetzA / OBIS 15-minute interval rules), timestamps mark the **start** of the interval $[t, t + 15\text{min})$. Thus:
   * Interval `06:00:00` is billed as Day rate (`[06:00, 06:15)`).
   * Interval `21:45:00` is billed as Day rate (`[21:45, 22:00)`).
   * Interval `22:00:00` is billed as Night rate (`[22:00, 22:15)`).
2. **Daylight Saving Time (DST) Transition:** October 2026 includes the European fall-back clock change on October 25 (03:00 CEST $\rightarrow$ 02:00 CET), giving October 31 days + 1 extra hour = **2.980 intervals** instead of 2.976. The repeated `02:00` to `02:45` readings both occur in the night window ($02:00 < 06:00$) and are billed at the night rate.
3. **Rounding Rules:** Unrounded energy sums and tariff prices are preserved during calculation; line-item costs are rounded to two decimal places (half-up commercial rounding), ensuring line items sum consistently to the final invoice total.
4. **Storage Architecture:** SQLite with WAL mode. Running in-process guarantees a zero-configuration, under-5-minute evaluation without external database dependencies. The repository pattern allows swapping SQLite for PostgreSQL or TimescaleDB for multi-tenant production.

---

## 3. Customer Screen: What Went On & What Was Left Off
* **Put On:**
  * **30-Second Clarity:** Large, bold total (`2.296,03 €`) and a transparent 3-item breakdown (Grundpreis, Tagstrom, Nachtstrom).
  * **Customer Story & Value:** Highlighted that the bakery consumed **48,4 %** of its power during the night tariff, saving **€ 533,07** compared to a flat day rate (highlighting the benefit of their 03:00–06:00 baking shift).
  * **Visual Proof:** An interactive 31-day bar chart and a 24-hour typical day profile showing when ovens peaked.
  * **Month Selector & Meter Simulation:** A month dropdown and a modal to test `POST /api/readings` live.
* **Left Off:**
  * Raw ~3,000-row data tables (causes cognitive overload for a bakery owner).
  * Engineering metrics (reactive power, voltage harmonics, grid frequency).

---

## 4. AI Tools Used & Verification Strategy
* **Tools Used:** Gemini 3.8 Flash via Antigravity for domain analysis, boilerplate, and UI styling.
* **Verification Strategy:**
  1. Developed standalone Python cross-verification scripts to validate interval counts, DST duplicates, and mathematical formulas independently.
  2. Built an automated `pytest` suite testing interval boundary conditions (`05:45`, `06:00`, `21:45`, `22:00`), DST transition intervals, API contracts, and the exact October bill total.
  3. Implemented a frontend component test suite with **Vitest** and **React Testing Library** covering German number/currency formatting, 3-row line-item calculations, chart view toggling, and user interaction.
  4. Confirmed full TypeScript compilation with zero type errors.

---

## 5. What We'd Build Next
1. **Production Time-Series Store:** Replace local SQLite with TimescaleDB or ClickHouse with automated table partitioning by month.
2. **Smart Meter Security:** Implement mTLS and HMAC request signatures for the `/api/readings` endpoint.
3. **Anomaly & Waste Alerts:** Notify business owners if ovens or heavy machinery remain on during non-baking hours (e.g., Sunday afternoons).
4. **Dynamic Spot-Price Forecasting:** Integrate Day-Ahead spot market prices (EPEX Spot) to forecast optimal baking schedules.

