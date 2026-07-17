import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ClimateMonitor } from '../components/Dashboard/ClimateMonitor';
import { useClimate } from '../hooks/useClimate';
import { useAuth } from '../hooks/useAuth';
import type { ClimateThresholds } from '../types';

const EMPTY_THRESHOLDS: ClimateThresholds = {
  tempWarnMin: 52,
  tempWarnMax: 58,
  tempCritMin: 48,
  tempCritMax: 62,
  humidityWarnMin: 55,
  humidityWarnMax: 75,
  humidityCritMin: 45,
  humidityCritMax: 85,
};

export function ClimatePage() {
  const { isAdmin, user } = useAuth();
  const {
    readings,
    sensors,
    toast,
    dismissToast,
    thresholds,
    saveThresholds,
    createSensor,
    muteAlerts,
    refresh,
  } = useClimate();

  const [threshForm, setThreshForm] = useState<ClimateThresholds>(EMPTY_THRESHOLDS);
  const [threshMsg, setThreshMsg] = useState<string | null>(null);
  const [threshErr, setThreshErr] = useState<string | null>(null);
  const [threshSaving, setThreshSaving] = useState(false);

  const [sensorName, setSensorName] = useState('');
  const [sensorType, setSensorType] = useState('combined');
  const [location, setLocation] = useState('');
  const [facilityId, setFacilityId] = useState('');
  const [sensorErr, setSensorErr] = useState<string | null>(null);
  const [sensorSubmitting, setSensorSubmitting] = useState(false);
  const [createdApiKey, setCreatedApiKey] = useState<string | null>(null);

  const [muteMsg, setMuteMsg] = useState<string | null>(null);
  const [muteErr, setMuteErr] = useState<string | null>(null);

  useEffect(() => {
    if (thresholds) setThreshForm(thresholds);
  }, [thresholds]);

  useEffect(() => {
    if (user?.facility_id) setFacilityId(user.facility_id);
  }, [user?.facility_id]);

  const sparkTemps = useMemo(() => {
    const vals = readings
      .slice(0, 48)
      .map((r) => (r.temperature != null ? Number(r.temperature) : null))
      .filter((n): n is number => n != null && !Number.isNaN(n));
    if (vals.length === 0) return [];
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const span = max - min || 1;
    return vals.map((v) => ((v - min) / span) * 100);
  }, [readings]);

  async function onSaveThresholds(e: FormEvent) {
    e.preventDefault();
    setThreshSaving(true);
    setThreshMsg(null);
    setThreshErr(null);
    try {
      await saveThresholds(threshForm);
      setThreshMsg('Thresholds saved.');
    } catch (err) {
      setThreshErr(err instanceof Error ? err.message : 'Failed to save thresholds');
    } finally {
      setThreshSaving(false);
    }
  }

  async function onCreateSensor(e: FormEvent) {
    e.preventDefault();
    setSensorSubmitting(true);
    setSensorErr(null);
    setCreatedApiKey(null);
    try {
      const fid = facilityId.trim() || user?.facility_id || '';
      if (!fid) {
        setSensorErr('Facility ID is required.');
        return;
      }
      const sensor = await createSensor({
        sensorName,
        sensorType,
        location,
        facilityId: fid,
      });
      if (sensor.api_key) setCreatedApiKey(sensor.api_key);
      setSensorName('');
      setLocation('');
      await refresh();
    } catch (err) {
      setSensorErr(err instanceof Error ? err.message : 'Failed to create sensor');
    } finally {
      setSensorSubmitting(false);
    }
  }

  async function onMute() {
    setMuteMsg(null);
    setMuteErr(null);
    try {
      await muteAlerts(1);
      setMuteMsg('Alerts muted for 1 hour.');
    } catch (err) {
      setMuteErr(err instanceof Error ? err.message : 'Failed to mute alerts');
    }
  }

  function patchThresh(key: keyof ClimateThresholds, value: string) {
    const n = Number(value);
    if (Number.isNaN(n)) return;
    setThreshForm((prev) => ({ ...prev, [key]: n }));
  }

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

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-parchment-50 md:text-4xl">Climate</h1>
          <p className="mt-1 text-parchment-200/65">Live vault temperature and humidity monitoring.</p>
        </div>
        {isAdmin && (
          <button type="button" className="btn-secondary" onClick={() => void onMute()}>
            Mute alerts 1h
          </button>
        )}
      </div>
      {muteMsg && <p className="text-sm text-gold-400">{muteMsg}</p>}
      {muteErr && <p className="text-sm text-burgundy-400">{muteErr}</p>}

      <ClimateMonitor />

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h2 className="font-display text-xl text-gold-300">Last 24 hours</h2>
          <p className="text-xs text-parchment-200/45">
            For 7-day trends, open{' '}
            <Link to="/reports" className="text-gold-400 hover:underline">
              Reports
            </Link>
            .
          </p>
        </div>

        {sparkTemps.length > 0 && (
          <div className="mb-4 flex h-16 items-end gap-0.5 border border-cellar-700/80 bg-cellar-900/30 px-2 py-2">
            {sparkTemps.map((h, i) => (
              <div
                key={i}
                className="min-w-[2px] flex-1 rounded-t bg-gold-500/70"
                style={{ height: `${Math.max(8, h)}%` }}
                title={`Reading ${i + 1}`}
              />
            ))}
          </div>
        )}

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

      {isAdmin && (
        <>
          <section className="space-y-4 border-t border-cellar-700 pt-6">
            <h2 className="font-display text-xl text-gold-300">Sensors</h2>
            <ul className="divide-y divide-cellar-700/80 border-y border-cellar-700/80">
              {sensors.map((s) => (
                <li key={s.id} className="flex flex-wrap items-baseline justify-between gap-2 py-3 text-sm">
                  <div>
                    <p className="font-medium text-parchment-50">{s.sensor_name ?? 'Unnamed'}</p>
                    <p className="text-parchment-200/50">
                      {[s.sensor_type, s.location].filter(Boolean).join(' · ') || '—'}
                    </p>
                  </div>
                  <span className={`text-xs ${s.active ? 'text-gold-400' : 'text-parchment-200/40'}`}>
                    {s.active ? 'Active' : 'Inactive'}
                  </span>
                </li>
              ))}
              {sensors.length === 0 && (
                <li className="py-6 text-center text-sm text-parchment-200/50">No sensors registered.</li>
              )}
            </ul>

            <form onSubmit={onCreateSensor} className="grid max-w-xl gap-4 md:grid-cols-2">
              <h3 className="font-display text-lg text-parchment-50 md:col-span-2">Add sensor</h3>
              <div>
                <label className="label-field" htmlFor="sensor-name">
                  Name
                </label>
                <input
                  id="sensor-name"
                  className="input-field"
                  required
                  value={sensorName}
                  onChange={(e) => setSensorName(e.target.value)}
                />
              </div>
              <div>
                <label className="label-field" htmlFor="sensor-type">
                  Type
                </label>
                <input
                  id="sensor-type"
                  className="input-field"
                  required
                  value={sensorType}
                  onChange={(e) => setSensorType(e.target.value)}
                  placeholder="combined"
                />
              </div>
              <div>
                <label className="label-field" htmlFor="sensor-loc">
                  Location
                </label>
                <input
                  id="sensor-loc"
                  className="input-field"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div>
                <label className="label-field" htmlFor="sensor-facility">
                  Facility ID
                </label>
                <input
                  id="sensor-facility"
                  className="input-field"
                  required
                  value={facilityId}
                  onChange={(e) => setFacilityId(e.target.value)}
                />
              </div>
              {createdApiKey && (
                <div className="md:col-span-2 rounded border border-gold-500/40 bg-cellar-900/60 p-3 text-sm">
                  <p className="text-xs uppercase tracking-wide text-gold-400">API key (shown once)</p>
                  <p className="mt-1 break-all font-mono text-parchment-50">{createdApiKey}</p>
                </div>
              )}
              {sensorErr && <p className="md:col-span-2 text-sm text-burgundy-400">{sensorErr}</p>}
              <button type="submit" className="btn-primary md:col-span-2" disabled={sensorSubmitting}>
                {sensorSubmitting ? 'Creating…' : 'Create sensor'}
              </button>
            </form>
          </section>

          <section className="space-y-4 border-t border-cellar-700 pt-6">
            <h2 className="font-display text-xl text-gold-300">Thresholds</h2>
            <form onSubmit={onSaveThresholds} className="grid max-w-2xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {(
                [
                  ['tempWarnMin', 'Temp warn min'],
                  ['tempWarnMax', 'Temp warn max'],
                  ['tempCritMin', 'Temp crit min'],
                  ['tempCritMax', 'Temp crit max'],
                  ['humidityWarnMin', 'Humidity warn min'],
                  ['humidityWarnMax', 'Humidity warn max'],
                  ['humidityCritMin', 'Humidity crit min'],
                  ['humidityCritMax', 'Humidity crit max'],
                ] as const
              ).map(([key, label]) => (
                <div key={key}>
                  <label className="label-field" htmlFor={key}>
                    {label}
                  </label>
                  <input
                    id={key}
                    type="number"
                    step="0.1"
                    className="input-field"
                    value={threshForm[key]}
                    onChange={(e) => patchThresh(key, e.target.value)}
                  />
                </div>
              ))}
              {threshMsg && <p className="text-sm text-gold-400 sm:col-span-2 lg:col-span-4">{threshMsg}</p>}
              {threshErr && <p className="text-sm text-burgundy-400 sm:col-span-2 lg:col-span-4">{threshErr}</p>}
              <button type="submit" className="btn-primary sm:col-span-2 lg:col-span-4" disabled={threshSaving}>
                {threshSaving ? 'Saving…' : 'Save thresholds'}
              </button>
            </form>
          </section>
        </>
      )}
    </div>
  );
}
