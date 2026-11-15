import React from 'react';
import { BillSummary, TariffSummary } from '../types';
import { Zap, Moon, PiggyBank, ArrowDownRight } from 'lucide-react';
import { formatGermanMonth } from './Header';

interface BillHeroProps {
  summary: BillSummary;
  tariff: TariffSummary;
  month: string;
}

export const formatCurrency = (val: number): string => {
  return val.toLocaleString('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' €';
};

export const formatNumber = (val: number, decimals: number = 1): string => {
  return val.toLocaleString('de-DE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const BillHero: React.FC<BillHeroProps> = ({ summary, tariff, month }) => {
  return (
    <div className="bg-brand-card rounded-2xl border border-brand-border p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-6 border-b border-brand-border">
        <div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-brand-amber-light text-brand-navy border border-brand-amber/30 mb-2">
            Zeit-Tarif Abrechnung · {formatGermanMonth(month)}
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-navy tracking-tight">
            Ihre Stromrechnung
          </h2>
          <p className="text-sm text-brand-muted mt-1">
            Automatisch berechnet aus {summary.intervals_count.toLocaleString('de-DE')} viertelstündlichen Smart-Meter-Messungen.
          </p>
        </div>

        {/* Total Bill Hero Card */}
        <div className="bg-brand-navy text-white rounded-xl p-5 sm:px-8 sm:py-6 shadow-md flex flex-col items-start sm:items-end justify-center">
          <span className="text-xs font-semibold text-brand-amber uppercase tracking-wider">
            Gesamtbetrag (inkl. Grundpreis)
          </span>
          <div className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1">
            {formatCurrency(summary.total_bill_eur)}
          </div>
          <span className="text-xs text-slate-300 mt-1">
            Tarif: {formatNumber(tariff.day_ct_per_kwh, 2)} ct Tag / {formatNumber(tariff.night_ct_per_kwh, 2)} ct Nacht
          </span>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        
        {/* Total Consumption */}
        <div className="bg-brand-bg rounded-xl p-4 border border-brand-border">
          <div className="flex items-center justify-between text-brand-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Gesamtverbrauch</span>
            <Zap className="w-4 h-4 text-brand-navy" />
          </div>
          <div className="text-2xl font-bold text-brand-navy">
            {formatNumber(summary.total_kwh)} <span className="text-base font-normal text-brand-muted">kWh</span>
          </div>
          <p className="text-xs text-brand-muted mt-1.5">
            Ø {formatNumber(summary.total_kwh / 31, 1)} kWh pro Kalendertag
          </p>
        </div>

        {/* Night Share */}
        <div className="bg-brand-bg rounded-xl p-4 border border-brand-border">
          <div className="flex items-center justify-between text-brand-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Günstiger Nachtstrom</span>
            <Moon className="w-4 h-4 text-brand-amber" />
          </div>
          <div className="text-2xl font-bold text-brand-navy flex items-baseline">
            {formatNumber(summary.night_share_pct, 1)} <span className="text-base font-normal text-brand-muted ml-1">%</span>
          </div>
          <p className="text-xs text-brand-muted mt-1.5 flex items-center">
            <span className="font-semibold text-brand-navy mr-1">{formatNumber(summary.night_kwh, 1)} kWh</span> zwischen 22:00 und 06:00
          </p>
        </div>

        {/* Night Savings */}
        <div className="bg-brand-amber-light rounded-xl p-4 border border-brand-amber/40">
          <div className="flex items-center justify-between text-brand-navy mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Ihre Ersparnis</span>
            <PiggyBank className="w-4 h-4 text-brand-amber" />
          </div>
          <div className="text-2xl font-bold text-brand-navy flex items-baseline">
            {formatCurrency(summary.night_savings_eur)}
          </div>
          <p className="text-xs text-brand-navy/80 mt-1.5 flex items-center font-medium">
            <ArrowDownRight className="w-3.5 h-3.5 text-brand-navy mr-0.5 shrink-0" />
            durch Nutzung des günstigeren Nachttarifs
          </p>
        </div>

      </div>

    </div>
  );
};
