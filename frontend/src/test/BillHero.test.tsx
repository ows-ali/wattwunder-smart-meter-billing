import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BillHero } from '../components/BillHero';
import { BillSummary, TariffSummary } from '../types';

const mockSummary: BillSummary = {
  total_kwh: 8842.915,
  day_kwh: 4562.927,
  night_kwh: 4279.988,
  day_cost_eur: 1453.16,
  night_cost_eur: 829.98,
  energy_cost_eur: 2283.14,
  monthly_fee_eur: 12.90,
  total_bill_eur: 2296.03,
  night_share_pct: 48.4,
  night_savings_eur: 533.07,
  intervals_count: 2980,
};

const mockTariff: TariffSummary = {
  day_from: '06:00',
  day_to: '22:00',
  day_ct_per_kwh: 31.847,
  night_ct_per_kwh: 19.392,
  monthly_fee_eur: 12.90,
};

describe('BillHero component', () => {
  it('renders the total bill amount and key savings KPIs correctly', () => {
    render(<BillHero summary={mockSummary} tariff={mockTariff} month="2026-10" />);

    // Total amount in German formatting
    expect(screen.getByText('2.296,03 €')).toBeInTheDocument();

    // Total consumption
    expect(screen.getByText('8.842,9')).toBeInTheDocument();

    // Night share percentage
    expect(screen.getByText('48,4')).toBeInTheDocument();

    // Night savings callout
    expect(screen.getByText('533,07 €')).toBeInTheDocument();

    // Subtitle indicating interval count
    expect(screen.getByText(/2.980 viertelstündlichen/i)).toBeInTheDocument();
  });
});

