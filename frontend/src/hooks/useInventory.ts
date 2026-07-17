import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../services/api';
import type { Collection, Wine, WineInput } from '../types';

export function useInventory() {
  const [wines, setWines] = useState<Wine[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [wineRes, collRes] = await Promise.all([
        apiRequest<{ wines: Wine[] }>('/api/inventory'),
        apiRequest<{ collections: Collection[] }>('/api/collections'),
      ]);
      setWines(wineRes.wines);
      setCollections(collRes.collections);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addWine = useCallback(
    async (input: WineInput) => {
      const res = await apiRequest<{ wine: Wine }>('/api/inventory', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      setWines((prev) => [res.wine, ...prev]);
      return res.wine;
    },
    []
  );

  const createCollection = useCallback(
    async (input: { customerId: string; facilityId: string; name: string; totalCases?: number }) => {
      const res = await apiRequest<{ collection: Collection }>('/api/collections', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      setCollections((prev) => [res.collection, ...prev]);
      return res.collection;
    },
    []
  );

  const updateWine = useCallback(async (id: string, input: Partial<WineInput>) => {
    const res = await apiRequest<{ wine: Wine }>(`/api/inventory/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
    setWines((prev) => prev.map((w) => (w.id === id ? res.wine : w)));
    return res.wine;
  }, []);

  const deleteWine = useCallback(async (id: string) => {
    await apiRequest(`/api/inventory/${id}`, { method: 'DELETE' });
    setWines((prev) => prev.filter((w) => w.id !== id));
  }, []);

  return {
    wines,
    collections,
    loading,
    error,
    refresh,
    addWine,
    createCollection,
    updateWine,
    deleteWine,
  };
}
