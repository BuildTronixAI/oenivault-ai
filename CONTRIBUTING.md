# Contributing to OeniVault AI

## Branching

- `main` — production-ready
- `cursor/<feature>-a4b8` — agent/feature work
- Open a PR into `main` for review

## Local development

1. Copy `backend/.env.example` → `backend/.env` and `frontend/.env.example` → `frontend/.env`
2. Apply `database/schema.sql` and `database/seed.sql`
3. Run backend (`npm run dev` in `backend/`) and frontend (`npm run dev` in `frontend/`)

## Code style

- TypeScript strict mode
- Prefer explicit types on public APIs
- Keep routes thin; put logic in `services/`
- Validate request bodies with shared helpers in `utils/validation.ts`

## Commits

Use clear, imperative messages focused on why the change exists.
