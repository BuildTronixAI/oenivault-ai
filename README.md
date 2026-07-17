# OeniVault AI

AI-powered wine business management for storage facilities and collectors.

**Inventory · Climate monitoring · Customer portal · Admin dashboard**

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, TypeScript, TailwindCSS, Vite |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL (Supabase) |
| Auth | JWT (bcrypt + jsonwebtoken) |
| Real-time | Socket.io (Phase 2) |

## Quick start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+ (local or Supabase)

### 1. Database

```bash
# Create DB, then apply schema + seed
psql "$DATABASE_URL" -f database/schema.sql
psql "$DATABASE_URL" -f database/seed.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env   # set DATABASE_URL and JWT_SECRET
npm install
npm run dev
# → http://localhost:4000
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env   # set VITE_API_URL=http://localhost:4000
npm install
npm run dev
# → http://localhost:5173
```

### Demo accounts (after seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@oenivault.ai` | `Admin123!` |
| Customer | `collector@example.com` | `Customer123!` |

## Phase 1 (this branch)

- [x] Signup / login / logout / refresh
- [x] Role-based access (admin vs customer)
- [x] Wine inventory CRUD
- [x] Collections
- [x] Customer portal (own collection only)
- [x] Admin dashboard (all customers + collections)

## Repo layout

See [BUILD_SPEC.md](./BUILD_SPEC.md) and [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md).

## License

Proprietary — BuildTronix AI
