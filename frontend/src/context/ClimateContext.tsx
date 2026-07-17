import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { apiRequest } from '../services/api';
import { getAccessToken } from '../services/auth';
import {
  connectClimateSocket,
  disconnectClimateSocket,
  onClimateAlert,
  onClimateReading,
} from '../services/websocket';
import type {
  Alert,
  ClimateReading,
  ClimateSensor,
  ClimateThresholds,
  LatestClimate,
} from '../types';

export interface ClimateContextValue {
  alerts: Alert[];
  latest: LatestClimate[];
  readings: ClimateReading[];
  sensors: ClimateSensor[];
  thresholds: ClimateThresholds | null;
  loading: boolean;
  error: string | null;
  live: boolean;
  toast: Alert | null;
  dismissToast: () => void;
  refresh: () => Promise<void>;
  resolveAlert: (id: string) => Promise<void>;
  acknowledgeAlert: (id: string) => Promise<void>;
  saveThresholds: (next: ClimateThresholds) => Promise<ClimateThresholds>;
  createSensor: (input: {
    sensorName: string;
    sensorType: string;
    location: string;
    facilityId: string;
  }) => Promise<ClimateSensor>;
  muteAlerts: (hours: number) => Promise<void>;
}

export const ClimateContext = createContext<ClimateContextValue | null>(null);

export function ClimateProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [latest, setLatest] = useState<LatestClimate[]>([]);
  const [readings, setReadings] = useState<ClimateReading[]>([]);
  const [sensors, setSensors] = useState<ClimateSensor[]>([]);
  const [thresholds, setThresholds] = useState<ClimateThresholds | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [toast, setToast] = useState<Alert | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [alertsRes, latestRes, readingsRes, threshRes, sensorsRes] = await Promise.all([
        apiRequest<{ alerts: Alert[] }>('/api/climate/alerts'),
        apiRequest<{ latest: LatestClimate[] }>('/api/climate/latest'),
        apiRequest<{ readings: ClimateReading[] }>('/api/climate/readings?hours=24'),
        apiRequest<{ thresholds: ClimateThresholds }>('/api/climate/thresholds'),
        apiRequest<{ sensors: ClimateSensor[] }>('/api/climate/sensors').catch(() => ({
          sensors: [] as ClimateSensor[],
        })),
      ]);
      setAlerts(alertsRes.alerts);
      setLatest(latestRes.latest);
      setReadings(readingsRes.readings);
      setThresholds(threshRes.thresholds);
      setSensors(sensorsRes.sensors ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load climate data');
      setAlerts([]);
      setLatest([]);
      setReadings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const resolveAlert = useCallback(async (id: string) => {
    await apiRequest(`/api/climate/alerts/${id}`, { method: 'PATCH' });
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const acknowledgeAlert = useCallback(async (id: string) => {
    await apiRequest(`/api/climate/alerts/${id}/ack`, { method: 'PATCH' });
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, acknowledged_at: new Date().toISOString() } : a
      )
    );
  }, []);

  const saveThresholds = useCallback(async (next: ClimateThresholds) => {
    const res = await apiRequest<{ thresholds: ClimateThresholds }>('/api/climate/thresholds', {
      method: 'PUT',
      body: JSON.stringify(next),
    });
    setThresholds(res.thresholds ?? next);
    return res.thresholds ?? next;
  }, []);

  const createSensor = useCallback(
    async (input: {
      sensorName: string;
      sensorType: string;
      location: string;
      facilityId: string;
    }) => {
      const res = await apiRequest<{ sensor: ClimateSensor }>('/api/climate/sensors', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      setSensors((prev) => [res.sensor, ...prev]);
      return res.sensor;
    },
    []
  );

  const muteAlerts = useCallback(async (hours: number) => {
    await apiRequest('/api/climate/mutes', {
      method: 'POST',
      body: JSON.stringify({ hours }),
    });
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    const s = connectClimateSocket(token);
    const onConnect = () => setLive(true);
    const onDisconnect = () => setLive(false);
    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    if (s.connected) setLive(true);

    const offReading = onClimateReading((payload) => {
      const row: LatestClimate = {
        sensor_id: payload.sensor.id,
        sensor_name: payload.sensor.sensor_name,
        sensor_type: null,
        location: payload.sensor.location,
        facility_id: payload.sensor.facility_id,
        temperature: payload.reading.temperature,
        humidity: payload.reading.humidity,
        timestamp: payload.reading.timestamp,
        alert_triggered: payload.reading.alert_triggered,
      };
      setLatest((prev) => {
        const others = prev.filter((p) => p.sensor_id !== row.sensor_id);
        return [row, ...others];
      });
      setReadings((prev) =>
        [{ ...payload.reading, sensor_name: payload.sensor.sensor_name }, ...prev].slice(0, 200)
      );
    });

    const offAlert = onClimateAlert((alert) => {
      setAlerts((prev) => [alert, ...prev.filter((a) => a.id !== alert.id)]);
      setToast(alert);
      window.setTimeout(() => setToast((t) => (t?.id === alert.id ? null : t)), 8000);
    });

    return () => {
      offReading();
      offAlert();
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      disconnectClimateSocket();
      setLive(false);
    };
  }, []);

  const value = useMemo(
    () => ({
      alerts,
      latest,
      readings,
      sensors,
      thresholds,
      loading,
      error,
      live,
      toast,
      dismissToast: () => setToast(null),
      refresh,
      resolveAlert,
      acknowledgeAlert,
      saveThresholds,
      createSensor,
      muteAlerts,
    }),
    [
      alerts,
      latest,
      readings,
      sensors,
      thresholds,
      loading,
      error,
      live,
      toast,
      refresh,
      resolveAlert,
      acknowledgeAlert,
      saveThresholds,
      createSensor,
      muteAlerts,
    ]
  );

  return <ClimateContext.Provider value={value}>{children}</ClimateContext.Provider>;
}
