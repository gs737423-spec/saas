# Security invariants

1. `company_id` supplied by a client is only a requested context; membership is revalidated server-side.
2. A service-role query over tenant data must use the `companyId` resolved by `requireCompany`/`requireCapability`.
3. Unknown or missing tenant roles receive no capability.
4. Platform administrator and tenant administrator are separate authorities.
5. Multiple memberships without `X-Company-Id` return `409 COMPANY_CONTEXT_REQUIRED`; one membership remains automatic.
6. Critical endpoints return `503` when rate-limit infrastructure is unavailable. They never silently allow.
7. Company hard deletion is performed only by `delete_company_if_empty`; dependencies block the atomic transaction.
8. Team mutations require `team.invite` or `team.remove` and scope the target membership to the resolved tenant.
9. Structured security logs contain identifiers and safe codes only, never credentials, tokens, authorization headers, or raw bodies.
10. Changes to these files require deterministic security regression tests.

RLS is declared by repository migrations. Its hosted state is not proven here. Service-role queries bypass RLS, so backend company scoping remains a security invariant.
