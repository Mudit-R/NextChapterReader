# Database permission regression checks

The 20261030 migration restricts catalog writes to the server-controlled
`app_metadata.role = admin` claim and comment/reply updates to their owner.
Reading scroll-depth records are also restricted to their owner.
It also prevents ownership reassignment through UPDATE. Existing public reads
and owner create/delete workflows remain available.

For existing deployments, run `migrations/20261030_content_permissions.sql`
as the database owner. The migration can be applied repeatedly. For new databases,
the same policies are included in `database_setup.sql` (which also fixes a missing
UUID type on `book_reply_reports.user_id`). Do not rerun the full bootstrap on a
live database just to change these policies.

Grant catalog admin access only through a trusted Supabase Admin API or dashboard
operation that sets app_metadata, then refresh that user's session/JWT. A frontend
profile flag does not grant catalog permissions. Never expose the service-role
key to a browser. Review any other permissive policies in your deployed database:
Postgres combines permissive policies with OR, so unrelated existing policies can
widen access. These changes cover three content tables, not every authorization
surface of the application.

The regression runner creates a disposable PostgreSQL database container,
bootstraps the actual schema with local Supabase auth stubs, applies the migration
twice, and executes owner, non-owner, anonymous and admin scenarios:

```
python database/tests/run_permissions.py
```

Requires Docker and the `postgres:16-alpine` image. No production URL or credentials
are used. The auth stubs model JWT claims and database roles for local SQL testing;
they do not replace Supabase session validation in a deployed app.
