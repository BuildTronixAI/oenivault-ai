# Deployment

## Frontend (Vercel)

1. Import `BuildTronixAI/oenivault-ai` in Vercel
2. Root directory: `frontend`
3. Build: `npm run build` · Output: `dist`
4. Env: `VITE_API_URL` = public API URL

`frontend/vercel.json` enables SPA rewrites.

## Backend (Node host)

Run Express on Railway, Render, Fly, or a VPS (not Supabase Edge Functions):

1. Set `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `APP_URL`
2. Optional: `SMTP_*`, `ALLOW_PUBLIC_SIGNUP=false`, `VALUATION_API_URL`
3. `npm ci && npm run build && npm start` in `backend/`
4. Apply schema: `psql "$DATABASE_URL" -f database/schema.sql` or `npm run seed` (staging only)
5. Cron: `npm run purge:readings` weekly

## Database (Supabase PostgreSQL)

1. Create project → copy connection string (use pooled URI if offered; set `DATABASE_SSL=true` if required)
2. Run `database/schema.sql` (includes migrations 001+002)
3. Enable daily backups / PITR in Supabase dashboard

## First production admin

After schema apply, either run a controlled seed or insert an admin user with a bcrypt hash, then set `ALLOW_PUBLIC_SIGNUP=false`.

## Checklist

- [ ] Supabase `DATABASE_URL`
- [ ] API host + health green
- [ ] Vercel frontend + custom domain
- [ ] SMTP for reset/invite/alerts
- [ ] Sensor keys issued to devices
