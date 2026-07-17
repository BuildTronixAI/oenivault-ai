# Phase 1 → Phase 2/3 “strict superset” verification

Automated checks that Phase 2/3 did not drop Phase 1 behavior after squash-merge conflict resolution.

## Evidence

1. **File-level:** `comm` of `origin/main` vs branch — zero files exist only on `main`.
2. **Route-level:** `npm run test:superset` asserts Phase 1 mounts + auth/inventory/customers/climate routes remain.
3. **Behavioral:** `npm run test:phase1` hits a live API and verifies:
   - login / signup / me / change-password
   - admin vs customer RBAC (403 on `/api/customers` for customers)
   - inventory create / update / delete
   - collections list
   - climate alerts + readings still readable

## CI

`.github/workflows/backend-ci.yml` runs typecheck, build, and `test:phase1` on PRs (Postgres service).
