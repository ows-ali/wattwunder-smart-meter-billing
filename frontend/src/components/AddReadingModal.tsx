import React, { useState } from 'react';
import { X, Send, CheckCircle2, AlertCircle } from 'lucide-react';

interface AddReadingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReadingAdded: (month: string) => void;
}

export const AddReadingModal: React.FC<AddReadingModalProps> = ({
  isOpen,
  onClose,
  onReadingAdded,
}) => {
  const [timestamp, setTimestamp] = useState('2026-11-01T04:00:00');
  const [energyWh, setEnergyWh] = useState('12500');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/readings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: timestamp.trim(),
          energy_wh: parseInt(energyWh, 10),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Fehler beim Übermitteln des Messwertes');
      }

      const data = await res.json();
      setStatusMessage({
        type: 'success',
        text: `Messwert erfolgreich erfasst! (${data.message})`,
      });

      // Extract month to trigger refresh
      const month = timestamp.slice(0, 7);
      setTimeout(() => {
        onReadingAdded(month);
        onClose();
      }, 1200);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Verbindungsfehler zur API',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-brand-card w-full max-w-md rounded-2xl border border-brand-border p-6 shadow-2xl relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-brand-muted hover:text-brand-navy p-1 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold text-brand-navy mb-1">
          Neuen Smart-Meter-Messwert melden
        </h3>
        <p className="text-xs text-brand-muted mb-5 leading-relaxed">
          Simuliert die automatische Datenübertragung eines Zählers an die WattWunder-Abrechnungsplattform (Endpoint: <code className="bg-brand-bg px-1 py-0.5 rounded font-mono text-[11px]">POST /api/readings</code>).
        </p>

        {statusMessage && (
          <div
            className={`p-3 rounded-xl mb-4 text-xs flex items-center space-x-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-brand-navy uppercase tracking-wider mb-1">
              Zeitstempel (ISO 8601)
            </label>
            <input
              type="text"
              required
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
              placeholder="YYYY-MM-DDTHH:MM:SS"
              className="w-full px-3 py-2 text-sm bg-brand-bg border border-brand-border rounded-lg text-brand-navy font-mono focus:outline-none focus:ring-2 focus:ring-brand-navy"
            />
            <p className="text-[11px] text-brand-muted mt-1">
              Tipp: Wählen Sie einen neuen Monat wie <code className="font-semibold text-brand-navy">2026-11-01T04:00:00</code>, um den Monatswechsel zu testen!
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-navy uppercase tracking-wider mb-1">
              Verbrauch im 15-Min-Intervall (Wattstunden / Wh)
            </label>
            <input
              type="number"
              min="0"
              required
              value={energyWh}
              onChange={(e) => setEnergyWh(e.target.value)}
              placeholder="z.B. 12500"
              className="w-full px-3 py-2 text-sm bg-brand-bg border border-brand-border rounded-lg text-brand-navy font-mono focus:outline-none focus:ring-2 focus:ring-brand-navy"
            />
            <p className="text-[11px] text-brand-muted mt-1">
              12.500 Wh = 12,5 kWh (entspricht einem typischen Ofen-Backzyklus)
            </p>
          </div>

          <div className="pt-3 flex items-center justify-end space-x-3 border-t border-brand-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-brand-muted hover:text-brand-navy transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-1.5 bg-brand-navy text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-opacity-90 disabled:opacity-50 transition-all shadow-sm"
            >
              <Send className="w-3.5 h-3.5 text-brand-amber" />
              <span>{loading ? 'Speichern...' : 'Messwert einspielen'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

