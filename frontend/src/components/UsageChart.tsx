import React, { useState } from 'react';
import { DailyUsageItem, HourlyUsageItem } from '../types';
import { formatCurrency, formatNumber } from './BillHero';
import { formatGermanMonth } from './Header';
import { BarChart3, Clock, Info } from 'lucide-react';

interface UsageChartProps {
  dailyData: DailyUsageItem[];
  hourlyData: HourlyUsageItem[];
  month?: string;
}

export const UsageChart: React.FC<UsageChartProps> = ({ dailyData, hourlyData, month }) => {
  const [viewMode, setViewMode] = useState<'daily' | 'hourly'>('daily');
  const [hoveredDay, setHoveredDay] = useState<DailyUsageItem | null>(null);
  const [hoveredHour, setHoveredHour] = useState<HourlyUsageItem | null>(null);

  // Maximum value for scaling daily chart
  const maxDailyKwh = Math.max(...dailyData.map((d) => d.total_kwh), 1);
  // Maximum value for scaling hourly profile
  const maxHourlyKwh = Math.max(...hourlyData.map((h) => h.total_kwh), 1);

  return (
    <div className="bg-brand-card rounded-2xl border border-brand-border p-6 sm:p-8 shadow-sm">
      
      {/* Header and Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold text-brand-navy">
            {viewMode === 'daily' ? 'Verbrauchsverlauf über den Monat' : 'Typisches 24-Stunden-Tagesprofil'}
          </h3>
          <p className="text-sm text-brand-muted">
            {viewMode === 'daily'
              ? 'Täglicher Stromverbrauch aufgeteilt nach Tag- und Nachttarif.'
              : 'Durchschnittlicher Verbrauch je Stunde – macht Backzeiten und Tarifstufen sichtbar.'}
          </p>
        </div>

        {/* View Switcher */}
        <div className="inline-flex rounded-lg bg-brand-bg p-1 border border-brand-border self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('daily')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              viewMode === 'daily'
                ? 'bg-brand-navy text-white shadow-xs'
                : 'text-brand-muted hover:text-brand-navy'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Tagesübersicht (31 Tage)</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('hourly')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              viewMode === 'hourly'
                ? 'bg-brand-navy text-white shadow-xs'
                : 'text-brand-muted hover:text-brand-navy'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>24h-Backstubenprofil</span>
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center space-x-6 text-xs text-brand-muted mb-4 pb-2 border-b border-brand-border">
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-xs bg-brand-navy"></span>
          <span>Nachtstrom (19,39 ct/kWh)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-xs bg-brand-amber"></span>
          <span>Tagstrom (31,85 ct/kWh)</span>
        </div>
      </div>

      {/* DAILY VIEW CHART */}
      {viewMode === 'daily' && (
        <div className="relative">
          <div className="h-64 sm:h-72 w-full flex items-end space-x-1 sm:space-x-2 pt-6 pb-2 px-1 border-b border-brand-border">
            {dailyData.map((day) => {
              const dayHeightPct = (day.day_kwh / maxDailyKwh) * 100;
              const nightHeightPct = (day.night_kwh / maxDailyKwh) * 100;
              const dayNum = parseInt(day.date.split('-')[2], 10);

              return (
                <div
                  key={day.date}
                  className="flex-1 flex flex-col justify-end items-center h-full group relative cursor-pointer"
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                >
                  {/* Tooltip */}
                  {hoveredDay?.date === day.date && (
                    <div className="absolute bottom-full mb-2 z-30 bg-brand-navy text-white text-xs rounded-lg py-2 px-3 shadow-xl whitespace-nowrap pointer-events-none transform -translate-x-1/2 left-1/2">
                      <div className="font-bold border-b border-slate-600 pb-1 mb-1">
                        {day.date}
                      </div>
                      <div className="flex justify-between space-x-3">
                        <span className="text-brand-amber">Tagstrom:</span>
                        <span className="font-mono">{formatNumber(day.day_kwh)} kWh</span>
                      </div>
                      <div className="flex justify-between space-x-3">
                        <span className="text-slate-300">Nachtstrom:</span>
                        <span className="font-mono">{formatNumber(day.night_kwh)} kWh</span>
                      </div>
                      <div className="flex justify-between space-x-3 border-t border-slate-600 pt-1 mt-1 font-semibold">
                        <span>Tagessumme:</span>
                        <span className="font-mono text-brand-amber">{formatCurrency(day.cost_eur)}</span>
                      </div>
                    </div>
                  )}

                  {/* Stacked Bar */}
                  <div className="w-full flex flex-col justify-end rounded-t overflow-hidden transition-all group-hover:brightness-110">
                    {/* Day portion (top) */}
                    <div
                      style={{ height: `${dayHeightPct}%` }}
                      className="w-full bg-brand-amber transition-all duration-300"
                    />
                    {/* Night portion (bottom) */}
                    <div
                      style={{ height: `${nightHeightPct}%` }}
                      className="w-full bg-brand-navy transition-all duration-300"
                    />
                  </div>

                  {/* Day label */}
                  <span className="text-[10px] text-brand-muted mt-1.5 font-medium">
                    {dayNum % 2 === 1 ? dayNum : ''}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-brand-muted mt-2 text-center">
            Tage im Monat ({month ? formatGermanMonth(month) : 'Monatsübersicht'}) · Zeigen Sie mit der Maus auf einen Balken für Details
          </p>
        </div>
      )}

      {/* HOURLY VIEW PROFILE (Bakery Ovens 03:00 - 07:00) */}
      {viewMode === 'hourly' && (
        <div className="relative">
          <div className="h-64 sm:h-72 w-full flex items-end space-x-1 sm:space-x-2 pt-6 pb-2 px-1 border-b border-brand-border">
            {hourlyData.map((hour) => {
              const heightPct = (hour.total_kwh / maxHourlyKwh) * 100;
              const isPeakBakingHour = hour.hour >= 3 && hour.hour < 7;

              return (
                <div
                  key={hour.hour}
                  className="flex-1 flex flex-col justify-end items-center h-full group relative cursor-pointer"
                  onMouseEnter={() => setHoveredHour(hour)}
                  onMouseLeave={() => setHoveredHour(null)}
                >
                  {/* Tooltip */}
                  {hoveredHour?.hour === hour.hour && (
                    <div className="absolute bottom-full mb-2 z-30 bg-brand-navy text-white text-xs rounded-lg py-2 px-3 shadow-xl whitespace-nowrap pointer-events-none transform -translate-x-1/2 left-1/2">
                      <div className="font-bold border-b border-slate-600 pb-1 mb-1">
                        Uhrzeit {hour.label} – {(hour.hour + 1) % 24}:00 Uhr
                      </div>
                      <div className="flex justify-between space-x-3">
                        <span>Tarif:</span>
                        <span className={hour.is_day_tariff ? "text-brand-amber font-semibold" : "text-sky-300 font-semibold"}>
                          {hour.is_day_tariff ? 'Tagtarif (31,85 ct)' : 'Nachttarif (19,39 ct)'}
                        </span>
                      </div>
                      <div className="flex justify-between space-x-3">
                        <span>Monatssumme Stunde:</span>
                        <span className="font-mono">{formatNumber(hour.total_kwh)} kWh</span>
                      </div>
                      {isPeakBakingHour && (
                        <div className="text-[11px] text-brand-amber mt-1 italic">
                          🔥 Haupt-Backzeit der Backstube
                        </div>
                      )}
                    </div>
                  )}

                  {/* Single bar colored by tariff */}
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full rounded-t transition-all duration-300 group-hover:brightness-110 ${
                      hour.is_day_tariff ? 'bg-brand-amber' : 'bg-brand-navy'
                    } ${isPeakBakingHour ? 'ring-2 ring-brand-amber ring-offset-1' : ''}`}
                  />

                  {/* Hour label */}
                  <span className="text-[10px] text-brand-muted mt-1.5 font-medium">
                    {hour.hour % 3 === 0 ? hour.label.slice(0, 2) : ''}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Bakery Storytelling Callout */}
          <div className="mt-3 p-3 bg-brand-amber-light/70 rounded-xl border border-brand-amber/30 flex items-center space-x-2.5 text-xs text-brand-navy">
            <Info className="w-4 h-4 text-brand-amber shrink-0" />
            <p>
              <strong>Backstuben-Effekt:</strong> Zwischen 03:00 und 06:00 Uhr laufen Ihre Backöfen auf Hochtouren – und fallen voll in den <strong>günstigen Nachttarif (19,39 ct)</strong>. Ab 06:00 Uhr greift der Tagtarif.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};

