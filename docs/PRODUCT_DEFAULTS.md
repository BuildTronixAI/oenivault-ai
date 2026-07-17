# Product defaults (pending stakeholder confirmation)

These defaults unblock buildout. Override anytime.

| Decision | Default | Notes |
|----------|---------|-------|
| Audience | Facility operators **and** collectors | Dual role already in schema |
| Branding | Current cellar theme (burgundy/gold) | Swap assets when logo provided |
| Payments | **Free MVP first** | No Stripe until post-launch |
| Valuation | Heuristic + optional `VALUATION_API_URL` | No paid wine DB required for launch |
| Signup | Invite-preferred; public signup remains for demo (`ALLOW_PUBLIC_SIGNUP=true`) | Set `false` in production |
| Password reset | Email link when SMTP configured; otherwise returns reset token in API (dev only) | |
| Multi-facility | Soft facility scoping on admin queries | Single-facility deploy OK |

## Blocked on you (infra)

- Supabase project URL + `DATABASE_URL`
- Vercel project / deploy token
- SMTP credentials for real email
- Domain DNS for `oenivault.ai`
- Real IoT sensor hardware or gateway
