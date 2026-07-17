export interface WineFilters {
  q?: string;
  region?: string;
  varietal?: string;
  vintageMin?: number;
  vintageMax?: number;
  collectionId?: string;
  sort?: 'name' | 'vintage' | 'value' | 'created' | 'quantity';
  order?: 'asc' | 'desc';
}

export function parseWineFilters(query: Record<string, unknown>): WineFilters {
  const num = (v: unknown) => {
    if (v == null || v === '') return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };

  const sort = query.sort as WineFilters['sort'] | undefined;
  const order = query.order as WineFilters['order'] | undefined;

  return {
    q: typeof query.q === 'string' && query.q.trim() ? query.q.trim() : undefined,
    region: typeof query.region === 'string' && query.region.trim() ? query.region.trim() : undefined,
    varietal: typeof query.varietal === 'string' && query.varietal.trim() ? query.varietal.trim() : undefined,
    vintageMin: num(query.vintageMin),
    vintageMax: num(query.vintageMax),
    collectionId: typeof query.collectionId === 'string' ? query.collectionId : undefined,
    sort: sort && ['name', 'vintage', 'value', 'created', 'quantity'].includes(sort) ? sort : 'created',
    order: order === 'asc' || order === 'desc' ? order : 'desc',
  };
}
