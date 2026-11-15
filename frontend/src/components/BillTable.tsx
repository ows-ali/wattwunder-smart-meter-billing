import React from 'react';
import { BillSummary, TariffSummary } from '../types';
import { formatCurrency, formatNumber } from './BillHero';
import { Sun, Moon, Home, HelpCircle } from 'lucide-react';

interface BillTableProps {
  summary: BillSummary;
  tariff: TariffSummary;
}

export const BillTable: React.FC<BillTableProps> = ({ summary, tariff }) => {
  return (
    <div className="bg-brand-card rounded-2xl border border-brand-border p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
        <div>
          <h3 className="text-xl font-bold text-brand-navy">
            Rechnungspositionen im Detail
          </h3>
          <p className="text-sm text-brand-muted">
            Transparente Aufschlüsselung nach Arbeits- und Grundpreis.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-brand-border text-xs font-semibold text-brand-muted uppercase tracking-wider">
              <th className="py-3 px-3">Position</th>
              <th className="py-3 px-3">Zeitfenster</th>
              <th className="py-3 px-3 text-right">Verbrauch</th>
              <th className="py-3 px-3 text-right">Arbeitspreis</th>
              <th className="py-3 px-3 text-right">Betrag</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border text-sm">
            
            {/* Grundpreis */}
            <tr className="hover:bg-brand-bg/50 transition-colors">
              <td className="py-4 px-3 font-semibold text-brand-navy flex items-center space-x-2">
                <Home className="w-4 h-4 text-brand-muted shrink-0" />
                <span>Monatlicher Grundpreis</span>
              </td>
              <td className="py-4 px-3 text-brand-muted">Pauschal</td>
              <td className="py-4 px-3 text-right text-brand-muted">1 Monat</td>
              <td className="py-4 px-3 text-right text-brand-muted">
                {formatCurrency(tariff.monthly_fee_eur)} / Mon.
              </td>
              <td className="py-4 px-3 text-right font-semibold text-brand-navy">
                {formatCurrency(summary.monthly_fee_eur)}
              </td>
            </tr>

            {/* Tagstrom */}
            <tr className="hover:bg-brand-bg/50 transition-colors">
              <td className="py-4 px-3 font-semibold text-brand-navy flex items-center space-x-2">
                <Sun className="w-4 h-4 text-brand-amber shrink-0" />
                <span>Tagstrom</span>
              </td>
              <td className="py-4 px-3 text-brand-muted">
                {tariff.day_from} – {tariff.day_to} Uhr
              </td>
              <td className="py-4 px-3 text-right font-medium text-brand-navy">
                {formatNumber(summary.day_kwh)} kWh
              </td>
              <td className="py-4 px-3 text-right text-brand-muted font-mono">
                {formatNumber(tariff.day_ct_per_kwh, 3)} ct/kWh
              </td>
              <td className="py-4 px-3 text-right font-semibold text-brand-navy">
                {formatCurrency(summary.day_cost_eur)}
              </td>
            </tr>

            {/* Nachtstrom */}
            <tr className="hover:bg-brand-bg/50 transition-colors">
              <td className="py-4 px-3 font-semibold text-brand-navy flex items-center space-x-2">
                <Moon className="w-4 h-4 text-brand-navy shrink-0" />
                <span>Nachtstrom</span>
              </td>
              <td className="py-4 px-3 text-brand-muted">
                {tariff.day_to} – {tariff.day_from} Uhr
              </td>
              <td className="py-4 px-3 text-right font-medium text-brand-navy">
                {formatNumber(summary.night_kwh)} kWh
              </td>
              <td className="py-4 px-3 text-right text-brand-muted font-mono">
                {formatNumber(tariff.night_ct_per_kwh, 3)} ct/kWh
              </td>
              <td className="py-4 px-3 text-right font-semibold text-brand-navy">
                {formatCurrency(summary.night_cost_eur)}
              </td>
            </tr>

          </tbody>

          {/* Summe */}
          <tfoot>
            <tr className="border-t-2 border-brand-navy bg-brand-bg/40 font-bold text-brand-navy">
              <td className="py-4 px-3 text-base">Gesamtsumme</td>
              <td className="py-4 px-3 text-xs text-brand-muted font-normal">Alle Positionen</td>
              <td className="py-4 px-3 text-right font-bold text-base">
                {formatNumber(summary.total_kwh)} kWh
              </td>
              <td className="py-4 px-3 text-right text-xs text-brand-muted font-normal">
                Ø {formatNumber((summary.energy_cost_eur / (summary.total_kwh || 1)) * 100, 2)} ct/kWh
              </td>
              <td className="py-4 px-3 text-right text-lg text-brand-navy">
                {formatCurrency(summary.total_bill_eur)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Explainer footer */}
      <div className="mt-5 p-4 rounded-xl bg-brand-bg border border-brand-border flex items-start space-x-3 text-xs text-brand-muted">
        <HelpCircle className="w-4 h-4 text-brand-navy mt-0.5 shrink-0" />
        <p className="leading-relaxed">
          <strong className="text-brand-navy font-semibold">Wie wird gerechnet?</strong> Ihr digitaler Zähler erfasst alle 15 Minuten Ihren exakten Verbrauch. Jede Viertelstunde wird punktgenau mit dem Tarif berechnet, der in dieser Minute galt. Die Monatsgrundgebühr sichert den Netzzugang und die Zählerwartung.
        </p>
      </div>

    </div>
  );
};

