import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../services/api';
import { getAccessToken } from '../services/auth';
import type { Collection, Wine, WineInput } from '../types';

export interface InventoryFilters {
  q?: string;
  region?: string;
  varietal?: string;
  vintageMin?: string;
  vintageMax?: string;
  collectionId?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

function toQuery(filters: InventoryFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v != null && String(v).trim() !== '') params.set(k, String(v));
  });
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function useInventory(initialFilters: InventoryFilters = {}) {
  const [wines, setWines] = useState<Wine[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [filterOptions, setFilterOptions] = useState<{ regions: string[]; varietals: string[] }>({
    regions: [],
    varietals: [],
  });
  const [filters, setFilters] = useState<InventoryFilters>(initialFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [wineRes, collRes, opts] = await Promise.all([
        apiRequest<{ wines: Wine[] }>(`/api/inventory${toQuery(filters)}`),
        apiRequest<{ collections: Collection[] }>('/api/collections'),
        apiRequest<{ regions: string[]; varietals: string[] }>('/api/inventory/filters/options'),
      ]);
      setWines(wineRes.wines);
      setCollections(collRes.collections);
      setFilterOptions(opts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addWine = useCallback(async (input: WineInput) => {
    const res = await apiRequest<{ wine: Wine }>('/api/inventory', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    setWines((prev) => [res.wine, ...prev]);
    return res.wine;
  }, []);

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
    setWines((prev) => prev.map((w) => (w.id === id ? { ...w, ...res.wine } : w)));
    return res.wine;
  }, []);

  const deleteWine = useCallback(async (id: string) => {
    const res = await apiRequest<{
      softDeleted?: boolean;
      archived?: boolean;
      deleted_at?: string | null;
      wine?: Wine;
    }>(`/api/inventory/${id}`, { method: 'DELETE' });
    setWines((prev) => prev.filter((w) => w.id !== id));
    return res;
  }, []);

  const importCsv = useCallback(async (csv: string, collectionId: string) => {
    const res = await apiRequest<{
      imported?: number;
      created?: number;
      wines?: Wine[];
      message?: string;
    }>('/api/inventory/import', {
      method: 'POST',
      body: JSON.stringify({ csv, collectionId }),
    });
    return res;
  }, []);

  const valuateWine = useCallback(async (id: string, persist = true) => {
    const res = await apiRequest<{
      wine: Wine;
      valuation: {
        estimatedValue: number;
        confidence: string;
        source: string;
        rationale: string[];
      };
    }>(`/api/inventory/${id}/valuate`, {
      method: 'POST',
      body: JSON.stringify({ persist }),
    });
    setWines((prev) => prev.map((w) => (w.id === id ? { ...w, ...res.wine } : w)));
    return res;
  }, []);

  const downloadExport = useCallback(
    async (format: 'csv' | 'pdf') => {
      const token = getAccessToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/reports/export/${format}${toQuery(filters)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `oenivault-inventory.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    },
    [filters]
  );

  return {
    wines,
    collections,
    filterOptions,
    filters,
    setFilters,
    loading,
    error,
    refresh,
    addWine,
    createCollection,
    updateWine,
    deleteWine,
    importCsv,
    valuateWine,
    downloadExport,
  };
}
