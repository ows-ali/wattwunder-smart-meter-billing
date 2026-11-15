import { useEffect, useState } from 'react';
import { BillResponse } from './types';
import { Header, formatGermanMonth } from './components/Header';
import { BillHero } from './components/BillHero';
import { BillTable } from './components/BillTable';
import { UsageChart } from './components/UsageChart';
import { AddReadingModal } from './components/AddReadingModal';
import { AlertCircle, Calendar, ChevronDown, RefreshCw, RotateCw, ShieldCheck } from 'lucide-react';

export function App() {
  const [billData, setBillData] = useState<BillResponse | null>(null);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Fetch available billing months
  const fetchMonths = async () => {
    try {
      const res = await fetch('/api/months');
      if (!res.ok) throw new Error('Monatsliste konnte nicht geladen werden.');
      const data = await res.json();
      const months: string[] = data.months || [];
      setAvailableMonths(months);

      // If current selection is not in the list, set to first available
      if (months.length > 0 && !months.includes(selectedMonth)) {
        setSelectedMonth(months[0]);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  // Fetch bill for selected month
  const fetchBill = async (month: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/bill?month=${encodeURIComponent(month)}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Rechnungsdaten konnten nicht geladen werden.');
      }
      const data: BillResponse = await res.json();
      setBillData(data);
    } catch (err: any) {
      setError(err.message || 'Verbindung zum Abrechnungsserver fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  };

  // Force reloads readings.csv and tariff.json from disk
  const handleReloadFiles = async () => {
    setLoading(true);
    try {
      await fetch('/api/reload', { method: 'POST' });
      await fetchMonths();
      if (selectedMonth) {
        await fetchBill(selectedMonth);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonths();
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      fetchBill(selectedMonth);
    }
  }, [selectedMonth]);

  const handleReadingAdded = async (newMonth: string) => {
    await fetchMonths();
    setSelectedMonth(newMonth);
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col font-sans">
      
      {/* Top Header */}
      <Header
        customerName={billData?.customer_name || 'Bäckerei Sonnenschein'}
        accountNumber={billData?.account_number || 'WW-78492-DE'}
        meterId={billData?.meter_id || '1EMH0004928172'}
        onOpenAddReading={() => setIsModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Prominent Month Selector Banner */}
        <div className="bg-brand-card rounded-2xl border border-brand-border p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-brand-bg flex items-center justify-center border border-brand-border text-brand-navy shrink-0">
              <Calendar className="w-5 h-5 text-brand-navy" />
            </div>
            <div>
              <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider block">
                Abrechnungsmonat auswählen
              </span>
              <span className="text-sm font-bold text-brand-navy">
                Aktuell gewählt: {formatGermanMonth(selectedMonth)}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative">
              <label htmlFor="dashboard-month-select" className="sr-only">Monat wählen</label>
              <select
                id="dashboard-month-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-brand-bg border-2 border-brand-navy/30 hover:border-brand-navy text-brand-navy text-sm font-bold rounded-xl px-4 py-2 pr-9 appearance-none focus:outline-none focus:ring-2 focus:ring-brand-navy cursor-pointer transition-all shadow-xs"
              >
                {availableMonths.map((m) => (
                  <option key={m} value={m} className="font-semibold text-brand-navy">
                    {formatGermanMonth(m)}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-brand-navy">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>

            <button
              onClick={handleReloadFiles}
              title="readings.csv und tariff.json neu von der Festplatte laden"
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-brand-border bg-brand-bg text-brand-navy text-xs font-semibold hover:bg-brand-border/40 transition-colors shadow-xs"
            >
              <RotateCw className="w-3.5 h-3.5 text-brand-amber" />
              <span>Dateien neu laden</span>
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <RefreshCw className="w-8 h-8 text-brand-navy animate-spin" />
            <p className="text-sm font-semibold text-brand-muted">
              Berechne Smart-Meter-Abrechnung für {formatGermanMonth(selectedMonth)}...
            </p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
            <h3 className="text-lg font-bold text-rose-900">Abrechnung konnte nicht geladen werden</h3>
            <p className="text-sm text-rose-700 max-w-md mx-auto">{error}</p>
            <button
              onClick={() => fetchBill(selectedMonth)}
              className="inline-flex items-center space-x-2 bg-brand-navy text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-opacity-90"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Erneut versuchen</span>
            </button>
          </div>
        )}

        {!loading && !error && billData && (
          <>
            {/* Hero & Metrics */}
            <BillHero
              summary={billData.summary}
              tariff={billData.tariff}
              month={billData.month}
              daysCount={billData.daily_breakdown.length}
            />

            {/* Detailed Line Items */}
            <BillTable
              summary={billData.summary}
              tariff={billData.tariff}
            />

            {/* Consumption Chart (Daily & 24h Profile) */}
            <UsageChart
              dailyData={billData.daily_breakdown}
              hourlyData={billData.hourly_breakdown}
              month={billData.month}
            />
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-brand-border bg-brand-card py-6 mt-12 text-xs text-brand-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Zertifizierte Smart-Meter-Abrechnung gem. Messstellenbetriebsgesetz (MsbG)</span>
          </div>
          <p>© {new Date().getFullYear()} WattWunder Energie GmbH · Ihr Partner für dynamische Stromtarife</p>
        </div>
      </footer>

      {/* Modal for reporting readings */}
      <AddReadingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onReadingAdded={handleReadingAdded}
      />

    </div>
  );
}

export default App;
