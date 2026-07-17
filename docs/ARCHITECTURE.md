# Architecture

## Overview

OeniVault AI is a fullstack wine vault platform:

```
React (Vite)  ──REST/JWT──►  Express API  ──SQL──►  PostgreSQL (Supabase)
```

## Layers

| Layer | Responsibility |
|-------|----------------|
| `frontend/` | SPA: auth screens, role-based dashboards, inventory UI |
| `backend/` | REST API, JWT auth, RBAC, business logic |
| `database/` | Canonical schema + migrations |

## Auth & roles

- Passwords hashed with bcrypt; access + refresh JWTs issued on login/signup
- Roles: `admin` (facility operator) and `customer` (collector)
- Customers only see wines/collections where `collections.customer_id = user.id`
- Admins see all facility data; `/api/customers` is admin-only

## Phase map

1. **Phase 1** — Auth, inventory CRUD, customer portal, admin dashboard
2. **Phase 2** — IoT climate ingest, Socket.io live updates, threshold alerts, in-app + email notifications
3. **Phase 3** — Valuations, search/filter, reports, export
