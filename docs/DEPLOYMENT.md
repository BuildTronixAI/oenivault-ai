# Deployment

## Frontend (Vercel)

1. Import `BuildTronixAI/oenivault-ai` in Vercel
2. Root directory: `frontend`
3. Build: `npm run build` · Output: `dist`
4. Env: `VITE_API_URL` = public API URL

`frontend/vercel.json` enables SPA rewrites.

## Backend

Run Express on a Node host (Railway, Render, Fly, or a VPS):

1. Set `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`
2. `npm run build && npm start` in `backend/`
3. Run `npm run seed` once against the production DB (or apply migrations manually)

Supabase Edge Functions are optional later; Phase 1 uses a standard Express process against Supabase Postgres.

## Database (Supabase)

1. Create a Supabase project
2. Copy the Postgres connection string into `DATABASE_URL`
3. For serverless/pg pools set `DATABASE_SSL=true` if required
4. Apply schema via `npm run seed` or SQL editor with `database/schema.sql`
