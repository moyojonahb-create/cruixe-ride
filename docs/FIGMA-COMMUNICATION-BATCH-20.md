# CruiXe Batch 4 — 20 communication Figma states

Target GitHub PR #6, branch `codex/figma-frontend-foundation`, Vercel staging only.

## Frame inventory
| Contact | Figma states | Count |
|---|---|---:|
| Rider | 1240:116 (message), 1240:169 (connecting), 1240:214 (ringing), 1240:259 (connected), 1240:301 (ended), 1240:329 (failed) | 6 |
| Parcel sender | 1253:117, 1253:167, 1253:211, 1253:255, 1253:297, 1253:324 | 6 |
| Parcel recipient | 1253:352, 1253:402, 1253:446, 1253:490, 1253:532, 1253:559 | 6 |
| Student Rider | 1270:729 (message), 1270:779 (connecting) | 2 |
| Total | 20 distinct Figma nodes | 20 |

## Real integration in this batch

- `DriverMessageSheet` restyled header and red accents; preserves Supabase message subscriptions, sending, presence, delivery/read stamps and original direct-call behavior. The Figma Rider message node corresponds to this view; sender/recipient/student variants require contact-specific auth before hookup.
- `ActiveCallOverlay` adopts the single CruiXe red style and Figma status metadata without changing Agora call status, real duration, mute, speaker or hangup handlers. Its Figma IDs are presentation markers; the contact-specific variants are not wired to independent voice call implementations.
- `/staging/communication-20` presents all 20 design state foundations and is built only in staging Vite mode. Gallery intentionally does not initiate calls or send messages.

## Acceptance status

**20 visually browsable state foundations, NOT 20 integrated production-ready communication flows.** Caller identity, channel permissions, recipient authorization and call/connection statuses must always originate from the authenticated backend. Staging gallery intentionally uses generic contact labels and no fabricated chat logs or durations.

Remaining: complete Figma visual fidelity (including all approved assets), connect recipient and student communications safely, inspect mute/speaker/call errors on real devices, test across phone widths, verify RLS and private contacts, and carry out the final Rider/Driver test once all screens are migrated.

Go/TypeScript/unit/lint/staging build and Vercel readiness are gating checks. `main` and production unchanged. Wallets deferred.
