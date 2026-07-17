/**
 * Apply schema + seed demo facility, admin, customer, and wines.
 * Usage: npm run seed (requires DATABASE_URL)
 */
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { pool } from '../database/pool';

dotenv.config();

const FACILITY_ID = 'a0000000-0000-4000-8000-000000000001';
const ADMIN_ID = 'b0000000-0000-4000-8000-000000000001';
const CUSTOMER_ID = 'b0000000-0000-4000-8000-000000000002';
const COLLECTION_ID = 'c0000000-0000-4000-8000-000000000001';

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }

  const schemaPath = path.resolve(__dirname, '../../../database/schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  await pool.query(schemaSql);
  console.log('Schema applied.');

  const adminHash = await bcrypt.hash('Admin123!', 10);
  const customerHash = await bcrypt.hash('Customer123!', 10);

  await pool.query(
    `INSERT INTO facilities (id, name, location, capacity_cases)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
    [FACILITY_ID, "Carl's Wine Vault", 'Napa Valley, CA', 5000]
  );

  await pool.query(
    `INSERT INTO users (id, email, password_hash, full_name, role, facility_id)
     VALUES ($1, $2, $3, $4, 'admin', $5)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'admin'`,
    [ADMIN_ID, 'admin@oenivault.ai', adminHash, 'Carl Admin', FACILITY_ID]
  );

  await pool.query(
    `INSERT INTO users (id, email, password_hash, full_name, role, facility_id)
     VALUES ($1, $2, $3, $4, 'customer', $5)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
    [CUSTOMER_ID, 'collector@example.com', customerHash, 'Alex Collector', FACILITY_ID]
  );

  await pool.query(`UPDATE facilities SET owner_id = $1 WHERE id = $2`, [ADMIN_ID, FACILITY_ID]);

  await pool.query(
    `INSERT INTO collections (id, customer_id, facility_id, name, total_cases)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (id) DO NOTHING`,
    [COLLECTION_ID, CUSTOMER_ID, FACILITY_ID, 'Alex Private Cellar', 12]
  );

  const wines = [
    {
      id: 'd0000000-0000-4000-8000-000000000001',
      name: 'Opus One',
      vintage: 2018,
      region: 'Napa Valley',
      varietal: 'Bordeaux Blend',
      quantity: 6,
      location: 'A-12-3',
      notes: 'Client favorite',
      value: 450,
    },
    {
      id: 'd0000000-0000-4000-8000-000000000002',
      name: 'Domaine de la Romanée-Conti Échézeaux',
      vintage: 2015,
      region: 'Burgundy',
      varietal: 'Pinot Noir',
      quantity: 3,
      location: 'B-04-1',
      notes: 'Long-term hold',
      value: 3200,
    },
    {
      id: 'd0000000-0000-4000-8000-000000000003',
      name: 'Château Margaux',
      vintage: 2016,
      region: 'Bordeaux',
      varietal: 'Cabernet Sauvignon',
      quantity: 12,
      location: 'A-01-2',
      notes: null,
      value: 890,
    },
  ];

  for (const w of wines) {
    await pool.query(
      `INSERT INTO wines (id, collection_id, name, vintage, region, varietal, quantity, location_code, notes, estimated_value)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (id) DO NOTHING`,
      [w.id, COLLECTION_ID, w.name, w.vintage, w.region, w.varietal, w.quantity, w.location, w.notes, w.value]
    );
  }

  await pool.query(
    `INSERT INTO climate_sensors (id, facility_id, sensor_name, sensor_type, location, active)
     VALUES
       ('e0000000-0000-4000-8000-000000000001', $1, 'Vault Zone A', 'temperature', 'Main cellar — aisle A', TRUE),
       ('e0000000-0000-4000-8000-000000000002', $1, 'Vault Zone A Humidity', 'humidity', 'Main cellar — aisle A', TRUE)
     ON CONFLICT (id) DO NOTHING`,
    [FACILITY_ID]
  );

  console.log('Seed complete.');
  console.log('  Admin:    admin@oenivault.ai / Admin123!');
  console.log('  Customer: collector@example.com / Customer123!');
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
