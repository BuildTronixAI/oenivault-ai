import { ClimateMonitor } from '../components/Dashboard/ClimateMonitor';
import { useClimate } from '../hooks/useClimate';

export function ClimatePage() {
  const { readings, toast, dismissToast } = useClimate();

  return (
    <div className="relative space-y-8 animate-fade-in">
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-fade-up border border-burgundy-500/60 bg-cellar-900 px-4 py-3 shadow-lg">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-burgundy-400">{toast.severity} alert</p>
              <p className="mt-1 text-sm text-parchment-50">{toast.message}</p>
            </div>
            <button type="button" className="text-xs text-parchment-200/50 hover:text-parchment-50" onClick={dismissToast}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div>
        <h1 className="font-display text-3xl font-semibold text-parchment-50 md:text-4xl">Climate</h1>
        <p className="mt-1 text-parchment-200/65">Live vault temperature and humidity monitoring.</p>
      </div>

      <ClimateMonitor />

      <section>
        <h2 className="mb-3 font-display text-xl text-gold-300">Last 24 hours</h2>
        <div className="overflow-x-auto rounded-md border border-cellar-700">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-cellar-800/80 text-xs uppercase tracking-wide text-parchment-200/50">
              <tr>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Sensor</th>
                <th className="px-4 py-3 font-medium">Temp</th>
                <th className="px-4 py-3 font-medium">Humidity</th>
                <th className="px-4 py-3 font-medium">Alert</th>
              </tr>
            </thead>
            <tbody>
              {readings.slice(0, 40).map((r) => (
                <tr key={r.id} className="border-t border-cellar-700/80">
                  <td className="px-4 py-2 text-parchment-200/70">
                    {new Date(r.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-2">{r.sensor_name ?? r.sensor_id.slice(0, 8)}</td>
                  <td className="px-4 py-2">
                    {r.temperature != null ? `${Number(r.temperature).toFixed(1)}°F` : '—'}
                  </td>
                  <td className="px-4 py-2">
                    {r.humidity != null ? `${Number(r.humidity).toFixed(1)}%` : '—'}
                  </td>
                  <td className="px-4 py-2">
                    {r.alert_triggered ? (
                      <span className="text-burgundy-400">Yes</span>
                    ) : (
                      <span className="text-parchment-200/40">No</span>
                    )}
                  </td>
                </tr>
              ))}
              {readings.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-parchment-200/50">
                    No readings in the last 24 hours.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
