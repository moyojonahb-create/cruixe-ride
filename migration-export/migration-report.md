# Migration report

Verified at 2026-10-22 UTC.

| Item | Result |
| --- | --- |
| Source database metadata | Failed: pooler unavailable / connection timeout |
| Actual application records exported | 0 |
| Actual row counts / relationships / primary keys | Inaccessible; unknown, not zero |
| Accurate schema SQL | Unavailable; no database-schema.sql fabricated |
| Storage buckets, paths, sizes, content types | Unverified / unavailable |
| Actual storage file contents | None exported |
| Auth export | Cannot run while Cloud is paused; supported built-in database export includes accounts/password hashes |
| Destination database | Not accessed or modified |
| Application connection | Unchanged |
| Download package | Non-sensitive source tools and instructions only |

Files created: README.md, migration-report.md, migration-checklist.md, export-database.mjs, export-storage.mjs, verify-export.mjs, export-utils.mjs, export-tools.test.mjs and .gitignore under `migration-export/`, plus the guarded instructions page.

`database-inventory.csv`, `storage-inventory.csv` and `database-schema.sql` are intentionally absent: actual contents could not be obtained. No dummy rows or reconstructed SQL are presented as actual exports. The selected-table tool can later write a private CSV inventory and JSONL records with count verification. Sensitive credential-like data is excluded and reported; selected-table output is not a full backup.

Server-side privileged export capability has not been established. Existing admin verification is not permission to bypass RLS. The webpage has no private-data download path. Owner-run table access verifies admin authority on the source server and still honors that session's RLS.

Cloud reactivation is required for the source database export, table reads and storage downloads. Auth transfer requires the supported database export, held privately outside Git, and isolated restore testing; do not export password hashes or identity metadata through the page. Export job/provider settings have not been verified.

Root .gitignore is managed read-only here; `migration-export/.gitignore` adds local protection, and the tools reject all output paths inside the repository. Keep manually downloaded backups outside Git too.

Remaining verification: real authenticated source export, live row counts, storage contents, account sign-in after isolated restore. No claim of completed migration is made.