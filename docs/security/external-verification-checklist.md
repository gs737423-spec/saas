# External security verification checklist

## Supabase

- Confirm all migrations, including 018 after approval, are applied in order.
- Inspect actual RLS and storage policies, JWT expiry, MFA, Auth abuse protection, backups, and PITR.

## Vercel

- Review production-only secrets, deployment protection, Firewall/WAF, logs, rollback, and branch protection.

## Domain and email

- Verify HTTP to HTTPS, certificate, delivered HSTS/CSP, SPF, DKIM, and DMARC.
