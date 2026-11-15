import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header, formatGermanMonth } from '../components/Header';

describe('Header component', () => {
  it('formats ISO month strings into German full names', () => {
    expect(formatGermanMonth('2026-10')).toBe('Oktober 2026');
    expect(formatGermanMonth('2026-11')).toBe('November 2026');
    expect(formatGermanMonth('2026-01')).toBe('Januar 2026');
  });

  it('renders customer information and month selector', () => {
    const handleSelectMonth = vi.fn();
    const handleOpenAdd = vi.fn();

    render(
      <Header
        customerName="Bäckerei Sonnenschein"
        accountNumber="WW-78492-DE"
        meterId="1EMH0004928172"
        currentMonth="2026-10"
        availableMonths={['2026-10', '2026-11']}
        onSelectMonth={handleSelectMonth}
        onOpenAddReading={handleOpenAdd}
      />
    );

    expect(screen.getByText('Bäckerei Sonnenschein')).toBeInTheDocument();
    expect(screen.getByText('WW-78492-DE')).toBeInTheDocument();
    expect(screen.getByText('1EMH0004928172')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveValue('2026-10');

    // Trigger month change
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '2026-11' } });
    expect(handleSelectMonth).toHaveBeenCalledWith('2026-11');

    // Trigger Add Reading modal
    fireEvent.click(screen.getByRole('button', { name: /Messwert melden/i }));
    expect(handleOpenAdd).toHaveBeenCalled();
  });
});
