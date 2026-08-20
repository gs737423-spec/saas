# Security tests

Run `npm run security:check`, or separately:

- `npm run typecheck`
- `npm run test:run`
- `npm run test:security`
- `npm run security:service-role-scan`
- `npm run security:check`
- `npm run build`

The deterministic suite covers mandatory platform-admin MFA/AAL2, atomic first-owner provisioning, role normalization, the capability matrix, tenant A/B context selection, cross-tenant and identifier-tampering negative cases, team scoping, rate-limit failure states, safe company-deletion contracts, and OAuth state binding/tamper rejection. It uses fake identifiers and no network or production secrets.

CI runs `npm ci`, typecheck, the complete test suite, `npm audit --omit=dev --audit-level=high`, the service-role static scan, and build. Migration `023_platform_admin_mfa_and_owner_provisioning.sql` is intentionally not applied by CI.

The suite does not prove hosted Supabase RLS/policies, Vercel Firewall, TLS delivery, backups, Auth limits, or that migration 018 has been applied. Those require external verification.

Real database tests are currently unavailable because this workstation has no Docker/Supabase local runtime. They must never be pointed at a remote database.
