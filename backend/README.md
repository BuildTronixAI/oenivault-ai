# OeniVault AI Backend

Express + TypeScript API for auth, inventory, and customers.

## Setup

```bash
cp .env.example .env
npm install
npm run seed   # applies schema + demo data (requires DATABASE_URL)
npm run dev
```

Health check: `GET http://localhost:4000/api/health`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Compile to `dist/` |
| `npm start` | Run compiled server |
| `npm run seed` | Create schema + seed demo users |
| `npm run typecheck` | TypeScript check |
