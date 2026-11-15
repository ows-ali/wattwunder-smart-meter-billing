import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BillTable } from '../components/BillTable';
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

describe('BillTable component', () => {
  it('renders all 3 invoice line items and the final sum', () => {
    render(<BillTable summary={mockSummary} tariff={mockTariff} />);

    // Line items
    expect(screen.getByText('Monatlicher Grundpreis')).toBeInTheDocument();
    expect(screen.getByText('Tagstrom')).toBeInTheDocument();
    expect(screen.getByText('Nachtstrom')).toBeInTheDocument();

    // Rates
    expect(screen.getByText('31,847 ct/kWh')).toBeInTheDocument();
    expect(screen.getByText('19,392 ct/kWh')).toBeInTheDocument();

    // Line item amounts
    expect(screen.getByText('1.453,16 €')).toBeInTheDocument();
    expect(screen.getByText('829,98 €')).toBeInTheDocument();
    expect(screen.getByText('12,90 €')).toBeInTheDocument();

    // Total row
    expect(screen.getByText('Gesamtsumme')).toBeInTheDocument();
    expect(screen.getByText('2.296,03 €')).toBeInTheDocument();
  });
});

