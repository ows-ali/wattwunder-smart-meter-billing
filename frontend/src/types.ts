export interface TariffSummary {
  day_from: string;
  day_to: string;
  day_ct_per_kwh: number;
  night_ct_per_kwh: number;
  monthly_fee_eur: number;
}

export interface BillSummary {
  total_kwh: number;
  day_kwh: number;
  night_kwh: number;
  day_cost_eur: number;
  night_cost_eur: number;
  energy_cost_eur: number;
  monthly_fee_eur: number;
  total_bill_eur: number;
  night_share_pct: number;
  night_savings_eur: number;
  intervals_count: number;
}

export interface DailyUsageItem {
  date: string;
  day_kwh: number;
  night_kwh: number;
  total_kwh: number;
  cost_eur: number;
  intervals: number;
}

export interface HourlyUsageItem {
  hour: number;
  label: string;
  total_kwh: number;
  is_day_tariff: boolean;
}

export interface BillResponse {
  month: string;
  customer_name: string;
  account_number: string;
  meter_id: string;
  summary: BillSummary;
  tariff: TariffSummary;
  daily_breakdown: DailyUsageItem[];
  hourly_breakdown: HourlyUsageItem[];
}

export interface AvailableMonthsResponse {
  months: string[];
  selected_month?: string;
}

