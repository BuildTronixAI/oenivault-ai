import { useEffect, useState } from 'react';
import { apiRequest } from '../services/api';

export interface FacilityOption {
  id: string;
  name: string;
  city?: string | null;
  location?: string | null;
  country?: string | null;
}

export function useFacilities() {
  const [facilities, setFacilities] = useState<FacilityOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await apiRequest<{ facilities: FacilityOption[] }>('/api/preferences/facilities');
        if (!cancelled) setFacilities(res.facilities ?? []);
      } catch (err) {
        if (!cancelled) {
          setFacilities([]);
          setError(err instanceof Error ? err.message : 'Failed to load facilities');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { facilities, loading, error };
}
