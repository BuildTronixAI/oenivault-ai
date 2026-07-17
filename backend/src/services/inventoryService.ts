import { pool } from '../database/pool';
import { AppError } from '../middleware/errorHandler';
import { AuthUser } from '../middleware/auth';
import { Wine } from '../models/Wine';
import { Collection } from '../models/Collection';
import { WineFilters } from '../utils/wineFilters';

const SORT_MAP: Record<NonNullable<WineFilters['sort']>, string> = {
  name: 'w.name',
  vintage: 'w.vintage',
  value: 'w.estimated_value',
  created: 'w.created_at',
  quantity: 'w.quantity',
};

export async function listWines(user: AuthUser, filters: WineFilters = {}) {
  const params: unknown[] = [];
  const where: string[] = [];

  if (user.role !== 'admin') {
    params.push(user.id);
    where.push(`c.customer_id = $${params.length}`);
  }

  if (filters.q) {
    params.push(`%${filters.q}%`);
    where.push(
      `(w.name ILIKE $${params.length} OR w.region ILIKE $${params.length} OR w.varietal ILIKE $${params.length} OR w.location_code ILIKE $${params.length} OR w.notes ILIKE $${params.length})`
    );
  }
  if (filters.region) {
    params.push(`%${filters.region}%`);
    where.push(`w.region ILIKE $${params.length}`);
  }
  if (filters.varietal) {
    params.push(`%${filters.varietal}%`);
    where.push(`w.varietal ILIKE $${params.length}`);
  }
  if (filters.vintageMin != null) {
    params.push(filters.vintageMin);
    where.push(`w.vintage >= $${params.length}`);
  }
  if (filters.vintageMax != null) {
    params.push(filters.vintageMax);
    where.push(`w.vintage <= $${params.length}`);
  }
  if (filters.collectionId) {
    params.push(filters.collectionId);
    where.push(`w.collection_id = $${params.length}`);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const sortCol = SORT_MAP[filters.sort ?? 'created'];
  const order = filters.order === 'asc' ? 'ASC' : 'DESC';

  if (user.role === 'admin') {
    const result = await pool.query<Wine & { collection_name: string; customer_name: string | null }>(
      `SELECT w.*, c.name AS collection_name, u.full_name AS customer_name
       FROM wines w
       JOIN collections c ON c.id = w.collection_id
       JOIN users u ON u.id = c.customer_id
       ${whereSql}
       ORDER BY ${sortCol} ${order} NULLS LAST`,
      params
    );
    return result.rows;
  }

  const result = await pool.query<Wine & { collection_name: string }>(
    `SELECT w.*, c.name AS collection_name
     FROM wines w
     JOIN collections c ON c.id = w.collection_id
     ${whereSql}
     ORDER BY ${sortCol} ${order} NULLS LAST`,
    params
  );
  return result.rows;
}

export async function getFilterOptions(user: AuthUser) {
  const params = user.role === 'admin' ? [] : [user.id];
  const regionSql =
    user.role === 'admin'
      ? `SELECT DISTINCT region FROM wines WHERE region IS NOT NULL AND region <> '' ORDER BY 1`
      : `SELECT DISTINCT w.region FROM wines w JOIN collections c ON c.id = w.collection_id
         WHERE c.customer_id = $1 AND w.region IS NOT NULL AND w.region <> '' ORDER BY 1`;
  const varietalSql =
    user.role === 'admin'
      ? `SELECT DISTINCT varietal FROM wines WHERE varietal IS NOT NULL AND varietal <> '' ORDER BY 1`
      : `SELECT DISTINCT w.varietal FROM wines w JOIN collections c ON c.id = w.collection_id
         WHERE c.customer_id = $1 AND w.varietal IS NOT NULL AND w.varietal <> '' ORDER BY 1`;

  const [regionRes, varietalRes] = await Promise.all([
    pool.query<{ region: string }>(regionSql, params),
    pool.query<{ varietal: string }>(varietalSql, params),
  ]);

  return {
    regions: regionRes.rows.map((r) => r.region),
    varietals: varietalRes.rows.map((r) => r.varietal),
  };
}

export async function getWine(id: string, user: AuthUser) {
  const result = await pool.query<Wine & { customer_id: string }>(
    `SELECT w.*, c.customer_id
     FROM wines w
     JOIN collections c ON c.id = w.collection_id
     WHERE w.id = $1`,
    [id]
  );
  const wine = result.rows[0];
  if (!wine) throw new AppError('Wine not found', 404, 'NOT_FOUND');
  if (user.role !== 'admin' && wine.customer_id !== user.id) {
    throw new AppError('Insufficient permissions', 403, 'FORBIDDEN');
  }
  return wine;
}

async function assertCollectionAccess(collectionId: string, user: AuthUser) {
  const result = await pool.query<Collection>('SELECT * FROM collections WHERE id = $1', [collectionId]);
  const collection = result.rows[0];
  if (!collection) throw new AppError('Collection not found', 404, 'NOT_FOUND');
  if (user.role !== 'admin' && collection.customer_id !== user.id) {
    throw new AppError('Insufficient permissions', 403, 'FORBIDDEN');
  }
  return collection;
}

export async function createWine(
  user: AuthUser,
  input: {
    collectionId: string;
    name: string;
    vintage?: number | null;
    region?: string | null;
    varietal?: string | null;
    quantity: number;
    locationCode?: string | null;
    notes?: string | null;
    estimatedValue?: number | null;
  }
) {
  await assertCollectionAccess(input.collectionId, user);

  const result = await pool.query<Wine>(
    `INSERT INTO wines (
       collection_id, name, vintage, region, varietal, quantity,
       location_code, notes, estimated_value
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [
      input.collectionId,
      input.name,
      input.vintage ?? null,
      input.region ?? null,
      input.varietal ?? null,
      input.quantity,
      input.locationCode ?? null,
      input.notes ?? null,
      input.estimatedValue ?? null,
    ]
  );
  return result.rows[0];
}

export async function updateWine(
  id: string,
  user: AuthUser,
  input: Partial<{
    name: string;
    vintage: number | null;
    region: string | null;
    varietal: string | null;
    quantity: number;
    locationCode: string | null;
    notes: string | null;
    estimatedValue: number | null;
  }>
) {
  await getWine(id, user);

  const result = await pool.query<Wine>(
    `UPDATE wines SET
       name = COALESCE($2, name),
       vintage = COALESCE($3, vintage),
       region = COALESCE($4, region),
       varietal = COALESCE($5, varietal),
       quantity = COALESCE($6, quantity),
       location_code = COALESCE($7, location_code),
       notes = COALESCE($8, notes),
       estimated_value = COALESCE($9, estimated_value)
     WHERE id = $1
     RETURNING *`,
    [
      id,
      input.name ?? null,
      input.vintage !== undefined ? input.vintage : null,
      input.region !== undefined ? input.region : null,
      input.varietal !== undefined ? input.varietal : null,
      input.quantity ?? null,
      input.locationCode !== undefined ? input.locationCode : null,
      input.notes !== undefined ? input.notes : null,
      input.estimatedValue !== undefined ? input.estimatedValue : null,
    ]
  );
  return result.rows[0];
}

export async function deleteWine(id: string, user: AuthUser) {
  await getWine(id, user);
  await pool.query('DELETE FROM wines WHERE id = $1', [id]);
}

export async function listCollections(user: AuthUser) {
  if (user.role === 'admin') {
    const result = await pool.query(
      `SELECT c.*, u.full_name AS customer_name, u.email AS customer_email,
              (SELECT COUNT(*)::int FROM wines w WHERE w.collection_id = c.id) AS wine_count,
              (SELECT COALESCE(SUM(w.estimated_value * w.quantity), 0) FROM wines w WHERE w.collection_id = c.id) AS total_value
       FROM collections c
       JOIN users u ON u.id = c.customer_id
       ORDER BY c.created_at DESC`
    );
    return result.rows;
  }

  const result = await pool.query(
    `SELECT c.*,
            (SELECT COUNT(*)::int FROM wines w WHERE w.collection_id = c.id) AS wine_count,
            (SELECT COALESCE(SUM(w.estimated_value * w.quantity), 0) FROM wines w WHERE w.collection_id = c.id) AS total_value
     FROM collections c
     WHERE c.customer_id = $1
     ORDER BY c.created_at DESC`,
    [user.id]
  );
  return result.rows;
}

export async function createCollection(
  user: AuthUser,
  input: { customerId: string; facilityId: string; name: string; totalCases?: number }
) {
  if (user.role !== 'admin' && input.customerId !== user.id) {
    throw new AppError('Insufficient permissions', 403, 'FORBIDDEN');
  }

  const result = await pool.query<Collection>(
    `INSERT INTO collections (customer_id, facility_id, name, total_cases)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [input.customerId, input.facilityId, input.name, input.totalCases ?? 0]
  );
  return result.rows[0];
}

export async function applyValuation(id: string, user: AuthUser, persist = true) {
  const { estimateValue } = await import('./valuationService');
  const wine = await getWine(id, user);
  const valuation = await estimateValue({
    name: wine.name,
    vintage: wine.vintage,
    region: wine.region,
    varietal: wine.varietal,
  });

  if (!persist) {
    return { wine, valuation };
  }

  const result = await pool.query<Wine>(
    `UPDATE wines SET estimated_value = $2 WHERE id = $1 RETURNING *`,
    [id, valuation.estimatedValue]
  );
  return { wine: result.rows[0], valuation };
}
