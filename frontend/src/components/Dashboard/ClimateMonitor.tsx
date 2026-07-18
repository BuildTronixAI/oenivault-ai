import { useAuth } from '../../hooks/useAuth';
import { useClimate } from '../../hooks/useClimate';
import { useToast } from '../../context/ToastContext';

function fmt(n: string | number | null | undefined, suffix: string) {
  if (n == null || n === '') return '—';
  return `${Number(n).toFixed(1)}${suffix}`;
}

function timeAgo(iso: string | null) {
  if (!iso) return 'No data';
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return 'Just now';
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  const days = Math.floor(ms / 86_400_000);
  return days >= 2 ? `${days}d ago · stale` : '1d ago · stale';
}

export function ClimateMonitor({ compact = false }: { compact?: boolean }) {
  const { isAdmin } = useAuth();
  const { pushToast } = useToast();
  const { latest, alerts, loading, live, resolveAlert, acknowledgeAlert, thresholds } =
    useClimate();

  if (loading && latest.length === 0) {
    return <p className="text-sm text-parchment-200/50">Loading climate…</p>;
  }

  return (
    <div className={compact ? 'space-y-4' : 'space-y-8'}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider">
        <span
          className={`inline-block h-2 w-2 rounded-full ${live ? 'status-live animate-pulse' : 'status-offline'}`}
        />
        <span className="text-parchment-200/50">{live ? 'Live' : 'Offline'}</span>
        {thresholds && (
          <span className="ml-auto normal-case tracking-normal text-parchment-200/40">
            Ideal {thresholds.tempWarnMin}–{thresholds.tempWarnMax}°F · {thresholds.humidityWarnMin}–
            {thresholds.humidityWarnMax}% RH
          </span>
        )}
      </div>

      <div className={`grid gap-4 ${compact ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
        {latest.map((z) => (
          <div
            key={z.sensor_id}
            className={`border-b pb-3 ${z.alert_triggered ? 'border-burgundy-500' : 'border-cellar-600'}`}
          >
            <p className="text-xs uppercase tracking-wider text-parchment-200/50">
              {z.sensor_name ?? 'Sensor'} · {z.location ?? 'Vault'}
            </p>
            <div className="mt-2 flex items-baseline gap-4">
              <p className="font-display text-3xl text-parchment-50">{fmt(z.temperature, '°F')}</p>
              <p className="font-display text-2xl text-gold-400">{fmt(z.humidity, '%')}</p>
            </div>
            <p className="mt-1 text-xs text-parchment-200/40">{timeAgo(z.timestamp)}</p>
          </div>
        ))}
        {latest.length === 0 && (
          <p className="text-sm text-parchment-200/50 sm:col-span-2">
            {isAdmin
              ? 'No sensor readings yet. Add a sensor below or wait for the vault gateway to report.'
              : 'Sensors are not reporting yet. Contact your vault operator if this persists.'}
          </p>
        )}
      </div>

      {!compact && alerts.length > 0 && (
        <section>
          <h3 className="mb-3 font-display text-xl text-gold-300">Active alerts</h3>
          <ul className="space-y-2">
            {alerts.map((a) => (
              <li
                key={a.id}
                className={`flex flex-wrap items-center justify-between gap-3 border-l-2 bg-cellar-800/50 px-4 py-3 text-sm ${
                  a.severity === 'critical' ? 'border-burgundy-500' : 'border-gold-500'
                }`}
              >
                <div>
                  <span
                    className={`font-medium capitalize ${
                      a.severity === 'critical' ? 'text-burgundy-400' : 'text-gold-400'
                    }`}
                  >
                    {a.severity}
                  </span>
                  <span className="ml-2 text-parchment-200/80">{a.message}</span>
                  <p className="mt-0.5 text-xs text-parchment-200/40">
                    {a.alert_type} · {new Date(a.created_at).toLocaleString()}
                    {a.acknowledged_at ? ' · Acknowledged' : ''}
                  </p>
                </div>
                {isAdmin && (
                  <div className="flex flex-wrap gap-2">
                    {!a.acknowledged_at && (
                      <button
                        type="button"
                        className="btn-secondary !py-1 !text-xs"
                        onClick={() =>
                          void acknowledgeAlert(a.id).catch((err) =>
                            pushToast(err instanceof Error ? err.message : 'Acknowledge failed', 'alert')
                          )
                        }
                      >
                        Acknowledge
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-secondary !py-1 !text-xs"
                      onClick={() =>
                        void resolveAlert(a.id).catch((err) =>
                          pushToast(err instanceof Error ? err.message : 'Resolve failed', 'alert')
                        )
                      }
                    >
                      Resolve
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
