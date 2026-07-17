import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../services/api';
import type { Alert } from '../types';

export function useClimate() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ alerts: Alert[] }>('/api/climate/alerts');
      setAlerts(res.alerts);
    } catch {
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { alerts, loading, refresh };
}
