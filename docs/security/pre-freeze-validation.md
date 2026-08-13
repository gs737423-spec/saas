# Security pre-freeze validation

Date: 2026-08-13. Status: **NOT READY FOR FREEZE**.

## Local commands

- `npm run typecheck`
- `npm run test:run`
- `npm run test:security`
- `npm run security:service-role-scan`
- `npm run security:check`
- `npm run build`
- `npm audit --omit=dev`

## Dependency result

React Router was patched from 7.18.1 to 7.18.2. The application uses Declarative Mode (`BrowserRouter`, `Routes`, `Route`) and no RSC APIs, but the compatible patch was applied because 7.18.1 was in the affected version range of GHSA-qwww-vcr4-c8h2.

## Database validation

Local database tests were **NOT RUN**. This workstation has no Docker command/service, Supabase CLI, PostgreSQL client, `supabase/config.toml`, seed, or existing local database script. No remote URL, key, project ref, or environment file was read or used.

Consequently, these gates remain unproven:

- fresh migration reset attempt 1 and 2;
- migration 018 execution;
- catalog grants and `SECURITY DEFINER` definition;
- delete RPC transaction/concurrency behavior;
- real RLS Tenant A/B and platform-admin behavior;
- real rate-limit RPC and audit-log persistence.

## Code-level validation

The candidate includes deterministic tests for RBAC, tenant selection, cross-tenant query scoping, OAuth company binding, fail-closed rate limiting, request IDs, deletion contracts, and the service-role boundary. Sync locks, connection updates, order-item deletes, and integration status counts now require explicit company scope.

## Freeze blockers

1. Local Supabase/Postgres tooling unavailable; all real database gates are NOT RUN.
2. Existing-company ownership has no deterministic source. No owner was inferred.
3. Hosted Supabase, Storage, Vercel, TLS, email DNS, backups and branch controls remain external validation.

Migration 018 remains local and unapplied remotely.
