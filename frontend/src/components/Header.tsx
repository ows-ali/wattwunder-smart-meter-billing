import React from 'react';
import { PlusCircle } from 'lucide-react';

interface HeaderProps {
  customerName: string;
  accountNumber: string;
  meterId: string;
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

        {/* Action: Add reading trigger */}
        <div className="flex items-center self-end md:self-auto">
          <button
            onClick={onOpenAddReading}
            title="Neuen Zählerstand für Messstelle simulieren"
            className="flex items-center space-x-1.5 bg-brand-navy text-white text-xs font-semibold px-3.5 py-2 rounded-lg hover:bg-opacity-90 transition-all shadow-sm"
          >
            <PlusCircle className="w-4 h-4 text-brand-amber" />
            <span>Messwert melden</span>
          </button>
        </div>

      </div>
    </header>
  );
};
