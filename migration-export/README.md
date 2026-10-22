# Migration Export Center

Source tools: `migration-export/`. Instructions page: `/admin/migration-export`.

## Verified status — 2026-10-22 UTC
The source Cloud database metadata query failed with `SUPABASE_POOLER_UNAVAILABLE` (connection timeout). No database records, schema, bucket inventory or storage files were exported. No destination access was attempted. The production connection is unchanged.

## Full database and account export (supported route)
React cannot securely provide a complete privileged export. Resume the source Cloud backend, then open **More → Database → Manage → Settings → Export data**. In the Database card choose Export, then Start export. Download the result from the emailed link or More → Storage. Store it outside this repository in a private directory. Limits: source must be running, database up to 15 GB, export up to 5 GB, once every 24 hours.

This includes database structure, data and user accounts with password hashes. It excludes storage file contents, functions, secrets and sign-in provider configuration. Do not put this backup on the webpage or in Git. No dump script or auth.users paging tool is included.

## Selected application table export (optional, not a full backup)
Requires Node 20 or 22. Uses an existing authenticated administrator's short-lived access token and a publishable key. No service-role key, password or connection string is accepted. Obtain credentials only through your own trusted local application session; never paste them into chat or commit them. The source URL must be your source application backend, NOT your independent destination.

Set `EXPORT_SOURCE_URL`, `EXPORT_PUBLISHABLE_KEY`, `EXPORT_ADMIN_TOKEN`, and `EXPORT_DIR` in your local environment. `EXPORT_DIR` must be a new directory outside the Git repository (for example a private folder in your home directory). Run:

```sh
node migration-export/export-database.mjs --table profiles --order id
node migration-export/verify-export.mjs
```

Repeat only for explicitly selected tables, using their real unique key (`--order key1,key2` for composite keys). The exporter verifies the user and server-side admin role before reading records, honors RLS, paginates until exhaustion, writes JSONL plus a manifest, and compares exact authorized counts before/after. It refuses credential-like tables/columns. Counts are RLS-visible counts, not guaranteed global totals. A live dataset is not a transactionally consistent snapshot; use the built-in backup for a full migration. A manifest marks failures or concurrent changes as incomplete.

The API's schema description, when accessible, supplies column metadata only; it is not complete SQL or authoritative relationship/primary-key information. No SQL is fabricated. The suggested table list in `migration-checklist.md` is unverified, not a production inventory.

## Storage
Run `node migration-export/export-storage.mjs` for the supported storage handover instructions. This script does NOT copy files. Use **More → Storage** for authorized downloads and preserve paths manually. Storage inventory and actual file-copy completeness remain unverified.

## Downloads and security
The admin page uses the existing admin guard but contains only non-sensitive tools and documentation. It does not fetch or offer private records, credentials, storage objects or backups. There is no private export endpoint; this avoids relying on browser-only admin checks. ZIP contains source tools/documentation only, not production data.

## Destination safety
Do not restore directly into the existing independent destination. First restore into an empty isolated project you own, verify UUID relationships and sign-in, and design a reviewed conflict/merge plan. The tools never write to either database. Provider configuration and keys must be configured separately. Existing destination data must remain untouched.