import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UsageChart } from '../components/UsageChart';
import { DailyUsageItem, HourlyUsageItem } from '../types';

const mockDaily: DailyUsageItem[] = [
  { date: '2026-10-01', day_kwh: 150, night_kwh: 120, total_kwh: 270, cost_eur: 71.04, intervals: 96 },
  { date: '2026-10-02', day_kwh: 160, night_kwh: 110, total_kwh: 270, cost_eur: 72.29, intervals: 96 },
];

const mockHourly: HourlyUsageItem[] = [
  { hour: 3, label: '03:00', total_kwh: 400, is_day_tariff: false },
  { hour: 12, label: '12:00', total_kwh: 50, is_day_tariff: true },
];

describe('UsageChart component', () => {
  it('allows toggling between daily breakdown and 24h baking profile', () => {
    render(<UsageChart dailyData={mockDaily} hourlyData={mockHourly} />);

    // Default is daily view
    expect(screen.getByText('Verbrauchsverlauf über den Monat')).toBeInTheDocument();

    // Click 24h profile button
    const profileBtn = screen.getByRole('button', { name: /24h-Backstubenprofil/i });
    fireEvent.click(profileBtn);

    // Hourly profile view is active
    expect(screen.getByText('Typisches 24-Stunden-Tagesprofil')).toBeInTheDocument();
    expect(screen.getByText(/Backstuben-Effekt/i)).toBeInTheDocument();
  });
});
