# Database

PostgreSQL schema lives in `database/schema.sql`.

## Tables

| Table | Purpose |
|-------|---------|
| `facilities` | Storage sites (e.g. Carl's Wine Vault) |
| `users` | Admins & customers (JWT auth via `password_hash`) |
| `collections` | Customer wine collections at a facility |
| `wines` | Individual bottles/cases |
| `climate_sensors` | IoT sensors (Phase 2) |
| `climate_readings` | Sensor time series (Phase 2) |
| `alerts` | Climate / ops alerts (Phase 2) |

## Apply

```bash
# Option A — seed script (recommended)
cd backend && cp .env.example .env   # set DATABASE_URL
npm install && npm run seed

# Option B — raw SQL
psql "$DATABASE_URL" -f database/schema.sql
```

## Demo IDs

Seed script uses fixed UUIDs for local demos (facility `a000…001`, admin `b000…001`, customer `b000…002`).
