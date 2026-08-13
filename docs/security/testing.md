# Security tests

Run `npm run security:check`, or separately:

- `npm run typecheck`
- `npm run test:run`
- `npm run test:security`
- `npm run security:service-role-scan`
- `npm run security:check`
- `npm run build`

The deterministic suite covers role normalization, the capability matrix, tenant-context selection, cross-tenant negative cases, team scoping, rate-limit failure states, safe company-deletion contracts, and OAuth state binding/tamper rejection. It uses fake identifiers and no network or production secrets.

The suite does not prove hosted Supabase RLS/policies, Vercel Firewall, TLS delivery, backups, Auth limits, or that migration 018 has been applied. Those require external verification.

Real database tests are currently unavailable because this workstation has no Docker/Supabase local runtime. They must never be pointed at a remote database.
