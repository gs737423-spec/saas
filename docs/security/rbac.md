# Tenant RBAC

Roles accepted by code are `owner`, `admin`, `manager`, `member`, and `viewer`. Other values normalize to `unknown` and receive no capability. The repository does not identify a trustworthy existing owner; no account is inferred or promoted to owner. Owner transfer remains blocked pending a product/data decision.

| Capability group | owner | admin | manager | member | viewer |
| --- | --- | --- | --- | --- | --- |
| Operational reads | yes | yes | yes | yes | yes |
| Operational writes | yes | yes | yes | yes | no |
| Team read | yes | yes | yes | yes | yes |
| Team invite/remove | yes | yes, lower roles only | no | no | no |
| Company settings | yes | yes | no | no | no |

Generic invitations cannot assign owner. Admin can assign manager/member/viewer; owner can additionally assign admin. Neither generic removal path can remove owner or an unknown legacy role. Platform administrators are checked exclusively through `platform_admins`, require explicit tenant context, and do not derive authority from this matrix.
