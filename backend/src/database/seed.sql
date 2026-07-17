-- OeniVault AI — seed data for local/demo
-- Passwords: Admin123! / Customer123! (bcrypt cost 10)

INSERT INTO facilities (id, name, location, capacity_cases)
VALUES (
  'a0000000-0000-4000-8000-000000000001',
  'Carl''s Wine Vault',
  'Napa Valley, CA',
  5000
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, email, password_hash, full_name, role, facility_id)
VALUES
  (
    'b0000000-0000-4000-8000-000000000001',
    'admin@oenivault.ai',
    '$2b$10$8K1p/a0dL1LXMIgoEDFrwOfMQsZqHqHqHqHqHqHqHqHqHqHqHqHqH',
    'Carl Admin',
    'admin',
    'a0000000-0000-4000-8000-000000000001'
  ),
  (
    'b0000000-0000-4000-8000-000000000002',
    'collector@example.com',
    '$2b$10$8K1p/a0dL1LXMIgoEDFrwOfMQsZqHqHqHqHqHqHqHqHqHqHqHqHqH',
    'Alex Collector',
    'customer',
    'a0000000-0000-4000-8000-000000000001'
  )
ON CONFLICT (email) DO NOTHING;

-- Note: placeholder hashes above are invalid. Real seed hashes are generated
-- by backend/scripts/generate-seed-hashes.ts and written below after build.
-- For reliable seeds, run: npm run seed:hashes (backend) then re-apply this file.
-- Temporary: backend seed endpoint / scripts/seed.ts inserts correct hashes.

UPDATE facilities
SET owner_id = 'b0000000-0000-4000-8000-000000000001'
WHERE id = 'a0000000-0000-4000-8000-000000000001';

INSERT INTO collections (id, customer_id, facility_id, name, total_cases)
VALUES (
  'c0000000-0000-4000-8000-000000000001',
  'b0000000-0000-4000-8000-000000000002',
  'a0000000-0000-4000-8000-000000000001',
  'Alex Private Cellar',
  12
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO wines (id, collection_id, name, vintage, region, varietal, quantity, location_code, notes, estimated_value)
VALUES
  (
    'd0000000-0000-4000-8000-000000000001',
    'c0000000-0000-4000-8000-000000000001',
    'Opus One',
    2018,
    'Napa Valley',
    'Bordeaux Blend',
    6,
    'A-12-3',
    'Client favorite',
    450.00
  ),
  (
    'd0000000-0000-4000-8000-000000000002',
    'c0000000-0000-4000-8000-000000000001',
    'Domaine de la Romanée-Conti Échézeaux',
    2015,
    'Burgundy',
    'Pinot Noir',
    3,
    'B-04-1',
    'Long-term hold',
    3200.00
  ),
  (
    'd0000000-0000-4000-8000-000000000003',
    'c0000000-0000-4000-8000-000000000001',
    'Château Margaux',
    2016,
    'Bordeaux',
    'Cabernet Sauvignon',
    12,
    'A-01-2',
    NULL,
    890.00
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO climate_sensors (id, facility_id, sensor_name, sensor_type, location, active)
VALUES
  (
    'e0000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000001',
    'Vault Zone A',
    'temperature',
    'Main cellar — aisle A',
    TRUE
  ),
  (
    'e0000000-0000-4000-8000-000000000002',
    'a0000000-0000-4000-8000-000000000001',
    'Vault Zone A Humidity',
    'humidity',
    'Main cellar — aisle A',
    TRUE
  )
ON CONFLICT (id) DO NOTHING;
