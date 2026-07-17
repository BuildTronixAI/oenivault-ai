# OeniVault AI — Operations Runbook

## Local

```bash
cd backend && cp .env.example .env   # DATABASE_URL, JWT_SECRET
npm install && npm run seed && npm run dev

cd frontend && cp .env.example .env
npm install && npm run dev
```

## Add a climate sensor (admin API)

```bash
TOKEN=... # admin JWT
curl -X POST "$API/api/climate/sensors" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sensorName":"Zone C","sensorType":"combined","location":"Aisle C","facilityId":"<facility-uuid>"}'
# Response includes api_key — give to device; shown once in full
```

Ingest:

```bash
curl -X POST "$API/api/climate/ingest" \
  -H "x-sensor-key: <api_key>" \
  -H "Content-Type: application/json" \
  -d '{"temperature":55.2,"humidity":62}'
```

## Resolve an alert

Admin: Climate page → Resolve, or `PATCH /api/climate/alerts/:id`.

## Reset a password

1. User: `POST /api/auth/forgot-password` `{ "email" }`
2. With SMTP: click emailed link → `POST /api/auth/reset-password` `{ "token", "newPassword" }`
3. Without SMTP (dev): token is returned in JSON — use immediately

## Invite a customer (admin)

`POST /api/customers/invite` `{ "email", "fullName", "facilityId" }`  
Customer completes via `POST /api/auth/accept-invite` `{ "token", "password" }`.

## Redeploy

- Frontend: push `main` → Vercel (root `frontend/`)
- Backend: push `main` → host running `npm start` with env vars
- DB: `psql $DATABASE_URL -f database/migrations/*.sql` in order

## Health

`GET /api/health` → `{ status: "ok", database: "connected" }`
