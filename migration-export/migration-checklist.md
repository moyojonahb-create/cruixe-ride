# Read-only migration checklist

- [ ] Resume source Cloud; do not repoint the app.
- [ ] Create a private export directory OUTSIDE Git with owner-only permissions.
- [ ] Use More → Database → Manage → Settings → Export data for the full database/account export.
- [ ] Save the downloaded backup privately; never publish hashes, tokens or user records.
- [ ] Record source snapshot time and actual export size. No backup timestamp is known yet.
- [ ] Inspect inventory from the real export; do not assume this list is exhaustive: profiles, drivers, rides, offers, ride_requests, ride_offers, driver_documents, wallets, wallet_transactions, driver_wallets, platform_ledger, notifications, messages, trip_events, live_locations, town_pricing, deposits, withdrawals, disputes, mirror_outbox.
- [ ] For specific table checks, run export-database.mjs with a real unique ordering key, then verify-export.mjs. Record inaccessible rows/counts as unknown, not zero.
- [ ] Discover missing tables and real primary/foreign keys from the accurate schema in the built-in backup. API metadata alone is not sufficient.
- [ ] Download authorized storage files through More → Storage. Preserve bucket/path/original filenames and record sizes/content types. Filename listings alone do not prove file transfer.
- [ ] Restore privately into a NEW empty isolated project; do not overwrite the existing destination.
- [ ] Preserve auth UUIDs and database relationships via the approved backup. Configure sign-in providers, redirects and secrets separately; test existing-user sign-in.
- [ ] Compare actual table counts, keys, financial records, storage file sizes and account relationships. Never adjust balances to make counts match.
- [ ] Review a collision-safe merge plan before any future destination write. No automatic migration is included.
- [ ] Remove the temporary `/admin/migration-export` page when handover is finished.