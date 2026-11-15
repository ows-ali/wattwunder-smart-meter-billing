import React from 'react';
import { Calendar, PlusCircle } from 'lucide-react';

interface HeaderProps {
  customerName: string;
  accountNumber: string;
  meterId: string;
  currentMonth: string;
  availableMonths: string[];
  onSelectMonth: (month: string) => void;
  onOpenAddReading: () => void;
}

export const formatGermanMonth = (isoMonth: string): string => {
  if (!isoMonth) return '';
  const [year, month] = isoMonth.split('-');
  const monthNames = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];
  const idx = parseInt(month, 10) - 1;
  return `${monthNames[idx] || month} ${year}`;
};

export const Header: React.FC<HeaderProps> = ({
  customerName,
  accountNumber,
  meterId,
  currentMonth,
  availableMonths,
  onSelectMonth,
  onOpenAddReading,
}) => {
  return (
    <header className="bg-brand-card border-b border-brand-border sticky top-0 z-20 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        {/* Brand & Customer identity */}
        <div className="flex items-center space-x-4">
          <img
            src="/logo.svg"
            alt="WattWunder Logo"
            className="h-9 w-auto"
          />
          <div className="border-l border-brand-border pl-4">
            <h1 className="text-lg font-bold text-brand-navy leading-tight">
              {customerName}
            </h1>
            <p className="text-xs text-brand-muted">
              Konto: <span className="font-medium text-brand-navy">{accountNumber}</span> · Zähler: <span className="font-mono text-brand-navy">{meterId}</span>
            </p>
          </div>
        </div>

        {/* Controls: Month selector & Add reading trigger */}
        <div className="flex items-center space-x-3 self-end md:self-auto">
          {/* Month selector */}
          <div className="flex items-center bg-brand-bg border border-brand-border rounded-lg px-3 py-1.5 focus-within:ring-2 focus-within:ring-brand-navy">
            <Calendar className="w-4 h-4 text-brand-navy mr-2 shrink-0" />
            <label htmlFor="month-select" className="sr-only">Abrechnungsmonat wählen</label>
            <select
              id="month-select"
              value={currentMonth}
              onChange={(e) => onSelectMonth(e.target.value)}
              className="bg-transparent text-sm font-semibold text-brand-navy border-none focus:outline-none cursor-pointer"
            >
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {formatGermanMonth(m)}
                </option>
              ))}
            </select>
          </div>

          {/* Test Endpoint Trigger */}
          <button
            onClick={onOpenAddReading}
            title="Neuen Zählerstand für Messstelle simulieren"
            className="flex items-center space-x-1.5 bg-brand-navy text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-opacity-90 transition-all shadow-sm"
          >
            <PlusCircle className="w-4 h-4 text-brand-amber" />
            <span>Messwert melden</span>
          </button>
        </div>

      </div>
    </header>
  );
};

