# API Reference

Base URL: `http://localhost:4000` (dev)  
Auth: `Authorization: Bearer <accessToken>` unless noted.

## Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/signup` | No | Register customer `{ fullName, email, password }` |
| POST | `/api/auth/login` | No | `{ email, password }` → tokens + user |
| POST | `/api/auth/logout` | Yes | Client should discard tokens |
| POST | `/api/auth/refresh` | No | `{ refreshToken }` → new tokens |
| GET | `/api/auth/me` | Yes | Current user |

## Inventory

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/inventory` | Yes | List wines (scoped by role) |
| POST | `/api/inventory` | Yes | Add wine |
| GET | `/api/inventory/:id` | Yes | Get wine |
| PATCH | `/api/inventory/:id` | Yes | Update wine |
| DELETE | `/api/inventory/:id` | Yes | Delete wine |

### Wine body

```json
{
  "collectionId": "uuid",
  "name": "Opus One",
  "vintage": 2018,
  "region": "Napa Valley",
  "varietal": "Bordeaux Blend",
  "quantity": 6,
  "locationCode": "A-12-3",
  "notes": "Client favorite",
  "estimatedValue": 450
}
```

## Collections

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/collections` | Yes | List collections |
| POST | `/api/collections` | Yes | Create `{ customerId, facilityId, name, totalCases? }` |

## Customers (admin)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/customers` | Admin | List customers |
| POST | `/api/customers` | Admin | Create customer |
| GET | `/api/customers/:id` | Admin | Profile + collections |
| PATCH | `/api/customers/:id` | Admin | Update customer |

## Climate

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/climate/ingest` | Sensor API key (`x-sensor-key`) | Ingest temp/humidity reading |
| GET | `/api/climate/sensors` | Yes | List sensors |
| GET | `/api/climate/latest` | Yes | Latest reading per sensor |
| GET | `/api/climate/readings` | Yes | Last 24h readings (`?hours=`) |
| GET | `/api/climate/readings/:sensorId` | Yes | Single sensor history |
| GET/POST | `/api/climate/alerts` | Yes | Active alerts |
| PATCH | `/api/climate/alerts/:id` | Admin | Resolve alert |
| GET | `/api/climate/thresholds` | Yes | Warn/critical thresholds |

### Ingest body

```json
{ "temperature": 55.2, "humidity": 62.0 }
```

Header: `x-sensor-key: sensor_zone_a_demo_key`

### Realtime (Socket.io)

Connect with JWT in `auth.token`. Events:
- `climate:reading` — new reading
- `climate:alert` — new alert

Email alerts send when `SMTP_*` env vars are set; otherwise logged to the API console.

## Health

`GET /api/health` — `{ status, database }`
