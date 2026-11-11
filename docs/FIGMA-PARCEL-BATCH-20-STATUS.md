# Batch 3 — 20 Parcel screens (Figma → PR #6)
Source of truth: CruiXe Ride Main Figma `YLDdDmUNi4qbEb3mFfwpkB`. Target: `codex/figma-frontend-foundation`. Do not touch wallets or production.

## Screen foundation inventory

| Role | Figma node | Screen | Present status |
|---|---|---|---|
| Driver | 1210:116 | New parcel delivery | Figma-inspired real request banner on DriverRideDetails; gallery state |
| Driver | 1210:225 | Collect the parcel | Gallery state; lifecycle backend pending |
| Driver | 1211:126 | Navigate to pickup | Gallery state; parcel GPS integration pending |
| Driver | 1210:312 | Parcel collection at sender | Gallery state; collection verification pending |
| Driver | 1211:244 | Parcel collected | Gallery state; authoritative event pending |
| Driver | 1211:313 | Parcel in transit | Gallery state; courier status feed pending |
| Driver | 1210:397 | Arrived at recipient | Gallery state; arrival confirmation pending |
| Driver | 1210:482 | Verify delivery code | Gallery state; secure code verification API pending |
| Driver | 1232:166 | Confirm handover | Gallery state; server-signed handover pending |
| Driver | 1211:428 | Cash collection | Gallery state; payment ledger contract pending |
| Driver | 1210:551 | Delivered and receipt | Gallery state; verified receipt data pending |
| Rider | 491:617 | Parcel pickup & handover | Gallery state; source-of-truth collection pending |
| Rider | 491:660 | Live tracking | Gallery state; parcel location feed pending |
| Rider | 491:711 | Parcel delivered | Gallery state; verified completion pending |
| Rider | 491:735 | Delivery problem | Gallery state; support workflow pending |
| Rider | 565:576 | Failed delivery options | Gallery state; changes API pending |
| Recipient | 565:490 | Recipient live tracking | Gallery state; authenticated recipient invite pending |
| Rider | 572:460 | Retry delivery review | Gallery state; reattempt API pending |
| Rider | 573:410 | Return to sender review | Gallery state; reversal workflow pending |
| Recipient | 546:1066 | Private handover | Gallery state; secure delivery-code protocol pending |

**Counts:** 20 distinct Figma state foundations (11 Driver, 9 Rider/recipient). **Not 20 complete working screens.** The renderer receives data and callbacks but never creates parcel delivery proofs, private codes, payment confirmations or status changes. Gallery fixtures expose no real ride data.

## Integrated live-app improvements

- `ParcelBookingSheet`: Rider's existing authenticated recipient form preserved (real photo upload and validation) with updated Figma title and styling hook.
- `DriverRideDetails`: existing authenticated Driver parcel request view now has a context-specific request header; existing offer, photo and route functionality retained.
- `RideMatching`: actual `vehicle_type=parcel` shows parcel courier search and parcel no-driver state; server booking state and retry remain unchanged.

## Review link and acceptance

`/staging/parcel-20` is enabled in **staging build only**, clearly marked visual QA. Gallery buttons intentionally do not perform delivery or payment actions. No real private PINs or passenger identity data supplied.

The first 20-screen gallery remains at `/staging/figma-20`.

Gates before any production merge: TypeScript, lint, tests, staging build, visual parity including exact static assets, backend parcel state machine and authorization/RLS review, signed handover/PIN validation, fail-closed private recipient links, truthful cash confirmation, updated receipts and two-device mobile test. The latter is deferred until full migration as requested.

No updates to `main` or production.
