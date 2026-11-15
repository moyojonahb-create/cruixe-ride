# Driver records: ten-screen increment

Approved file: YLDdDmUNi4qbEb3mFfwpkB. Source contexts and screenshots recovered before implementation; original asset URLs returned 403, so authenticated SVG exports supplied the artwork. Red hero text follows the user's white-text correction applied to Figma on 2026-11-15.

| Screen | Figma node | Live entry |
| --- | --- | --- |
| Driver Verification | 1349:282 | Profile → Documents; /driver/records/verification |
| Update Vehicle | 1365:242 | Profile → Vehicle details; /driver/records/vehicle |
| Renew Vehicle Documents | 1365:278 | Verification → Manage documents |
| Vehicle Update Review | 1367:278 | Successful vehicle save |
| Document Review Status | 1367:322 | Verification → Document status or successful upload |
| Document Changes Requested | 1369:356 | Current rejected documents only |
| Resubmit Document | 1369:392 | Correct a selected rejected document |
| Ride History | 1373:140 | /driver/trips |
| Ride History Details | 1373:179 | Select a trip |
| Parcel History | 1373:218 | History → Parcels |

Staging selector: `/staging/records-10`. Uses these same components with labeled sample data, no account/document writes, and a sample in-app receipt. Compiled only in staging mode.

## Connections

Vehicle saves use PATCH /api/drivers/me with make, model, colour and plate only. Approval and service category remain server-owned. Failed saves preserve values; concurrent submissions are blocked. Copied review routes display current records and never manufacture successful saves.

Document reads reuse the authenticated Driver application query and newest-per-type semantics. Private storage paths are under the authenticated user ID; document metadata uses the Driver row ID and POST /api/drivers/documents. Uploads enter pending review. A metadata-save retry reuses the uploaded file. Rejected records remain historical records when a new submission is added. An ambiguous network response can still require checking the latest server records before retrying; this is not a new server idempotency guarantee.

History reads the latest 50 rides scoped to the Driver ID, distinguishes vehicle_type=parcel, and handles query failure with Retry. Selected completed trips reopen the existing in-app receipt and refresh fare/payment from the existing ride endpoint before opening. Download remains an additional receipt action. Cash is confirmed only when driver_collected_at exists and payment has not failed; completion and wallet flags alone do not confirm cash. The UI does not write or change the first confirmation timestamp.

## Validation

51 focused Vitest checks passed: 13 new Driver records/history regressions, 5 receipt checks, 4 application-status checks and 29 staging guards. TypeScript passed; changed-file ESLint had no errors (four existing-style Fast Refresh export warnings). Chromium rendered all ten screens at 360/400/414px: 30 passing layout checks, no overflow/page errors, all displayed SVGs loaded and all hero text computed white. A selected sample receipt reopened with pending confirmation and Download. Relevant rendered screenshots were visually inspected. New regressions are included in CI.

## Differences and outstanding acceptance

- Real browser/OS chrome replaces Figma's simulated status bar; controls use touch-friendly sizing and 16px input text.
- Vehicle make and model are separate supported fields; service category is read-only.
- Document number and expiry editing are visibly unavailable because the existing endpoint does not persist them. Accepted uploads are JPEG, PNG, WebP or PDF up to 5MB; HEIC is not accepted.
- Review copy is based on actual data. No sample verified/paid/received status is used in authenticated screens. Document review requests are uploads, not invented support tickets.
- History includes explicit payment state, confirmation time and trip reference, which lengthens the details screen; the page scrolls. Navigation adds Rides/Parcels and Back to History controls.
- Original exported icons and Poppins are retained. Cards adapt to content instead of clipping to prototype heights.

Physical iPhone XR checks, authenticated staging saves/uploads and the full two-device cash ride remain unverified. The sample receipt test is not live payment evidence. Check all ten via the selector on Safari, then use dedicated staging accounts to exercise live routes. No staging sign-off is asserted.
