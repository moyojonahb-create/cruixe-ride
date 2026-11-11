# CruiXe PR #6 — 50 non-wallet screen migration batch

Source: [CruiXe Ride Main](https://www.figma.com/design/YLDdDmUNi4qbEb3mFfwpkB/CruiXe-Ride-Fronted?node-id=0-1); target: `codex/figma-frontend-foundation`, protected Vercel `cruixe-staging`. Count: **50 exact Figma frames**, no Wallet screens.

**Strict accounting:** the 50 are a target batch, **NOT 50 delivered screens**. Entries described as *Updated* have implemented accessible states or initial visual changes; full frame-fidelity, missing document contracts, regression tests and device QA remain open. Never count a Figma frame, screenshot, routed placeholder or a green build alone as completed business functionality. Never overwrite PR #5 economy cash/receipt backend.

## Driver registration + application

| # | Figma node | Screen | Actual work state |
|---:|---|---|---|
| 1 | `1101:105` | Profile photo | Updated - integrated step 1 |
| 2 | `1101:170` | Verify identity | Updated - integrated step 2, full dual-sided ID pending |
| 3 | `1101:240` | Driver licence | Updated - integrated step 3 |
| 4 | `1101:315` | Vehicle details | Updated - integrated step 4 |
| 5 | `1101:391` | Vehicle documents | Updated - existing insurance only; remaining categories blocked by schema |
| 6 | `1101:466` | Vehicle photographs | Updated - existing single image; multi-view capture pending backend |
| 7 | `1101:546` | Review application | Updated - step 7 before Go submit |
| 8 | `1101:619` | Application received | Updated - backend pending variant |
| 9 | `1101:689` | Changes requested | Updated - rejected-documents variant |
| 10 | `1101:759` | Driver verified | Updated - backend approved variant |
| 11 | `1102:105` | Profile capture guidance | Added - connected from wizard |
| 12 | `1102:155` | ID capture guidance | Added - connected from wizard |
| 13 | `1102:206` | Licence capture guidance | Added - connected from wizard |
| 14 | `1102:259` | Vehicle documents guidance | Added - connected from wizard |
| 15 | `1102:312` | Car photos guidance | Added - connected from wizard |

## Driver live ride lifecycle

| # | Figma node | Screen | Actual work state |
|---:|---|---|---|
| 16 | `1153:105` | Rider accepted driver offer | Live trip presentation updated; full visual parity pending |
| 17 | `1153:165` | Driver en route to pickup | Live navigation state label and description updated; full visual parity pending |
| 18 | `1153:225` | Driver arrived | Live arrival state label and onboard CTA updated; full visual parity pending |
| 19 | `1182:198` | Passenger onboard / start trip | Pending visual migration |
| 20 | `1182:281` | En route to destination | Live route state label and trip description updated; full visual parity pending |
| 21 | `1185:115` | Destination reached | Interactive Figma-inspired confirmation connected to real completion guard; visual/device QA pending |
| 22 | `1185:198` | Confirm cash payment | Foundation in PR #6; verify parity |
| 23 | `1185:281` | Trip receipt and earnings | Foundation in PR #6; verify parity |
| 24 | `1264:118` | Booked for someone else request | Pending visual migration |
| 25 | `1495:38` | Online waiting room | Foundation in PR #6; verify parity |

## Rider recovery and core ride

| # | Figma node | Screen | Actual work state |
|---:|---|---|---|
| 26 | `491:1101` | Invalid OTP / account recovery | Pending |
| 27 | `491:1042` | New password | Pending Figma visual migration |
| 28 | `491:1131` | OTP expired | Pending |
| 29 | `491:1082` | Password updated | Pending |
| 30 | `631:92` | Rider home | Foundation in PR #6; visual QA pending |
| 31 | `631:93` | Destination editor | Foundation in PR #6; visual QA pending |
| 32 | `631:94` | Choose a ride | Foundation in PR #6; visual QA pending |
| 33 | `631:95` | Find drivers | Pending detailed parity |
| 34 | `631:96` | Ride confirmation | Pending detailed parity |
| 35 | `631:97` | Economy searching | Pending detailed parity |
| 36 | `631:100` | Driver offers | Pending detailed parity |
| 37 | `631:99` | No drivers found | No-drivers Figma styling integrated with live fare/search/cancel; visual and final QA pending |
| 38 | `631:103` | Rate driver | Pending detailed parity |
| 39 | `631:104` | Trip complete | Pending detailed parity |
| 40 | `345:600` | Driver accepted | Pending detailed parity |
| 41 | `371:1407` | Driver en route | Pending detailed parity |
| 42 | `371:1479` | Driver arrived | Pending detailed parity |
| 43 | `386:1135` | Trip in progress | Pending detailed parity |

## Rider shared / guest

| # | Figma node | Screen | Actual work state |
|---:|---|---|---|
| 44 | `526:410` | Shared ride searching — passenger B | Pending |
| 45 | `526:483` | Shared match confirmed | Pending |
| 46 | `526:562` | Shared driver en route | Pending |
| 47 | `526:648` | Shared boarding PIN | Pending |
| 48 | `526:819` | Shared trip in progress A | Pending |
| 49 | `526:909` | Shared trip in progress B | Pending |
| 50 | `504:410` | Book for someone else | Existing component; visual QA pending |

## Acceptance definition

- Confirm matching Figma visual and owned local assets at 360, 375, 390, 400, 430px; implement routes and state transitions, not static placeholder pages.
- Preserve Go API, Supabase/RLS, ride lifecycle, cash confirmation, safety and receipts; wallet screens remain deferred.
- Validate keyboard accessibility, back/cancel/refresh, loading/errors, auth, uploads, dispatch handoff and no expired asset URLs.
- Run Node 22 TypeScript, lint, unit and staging build; confirm Vercel Ready on exact SHA, then two-device Rider + Driver test. Protected preview is not production.
- For pending states, never display Figma example data as real operational records or approval.

## Driver navigation update (2026-11-11)

- Real-time navigation now derives Figma lifecycle labels from the server-provided ride status, without replacing `FullScreenNavigation`, `goBackend`, GPS routing or payment completion.
- Tests added under `src/test/driverTripPresentation.test.ts`. Four distinct frames have **partial live visual implementations**, NOT four accepted finished screens.
- Still outstanding: asset-level pixel parity, Rider/Driver two-device states, onboard-to-start confirmation, explicit destination-reached state, live cash and receipt QA, and screen-width verification.

## Destination Reached integration

- `DriverDestinationReached` displays actual destination, rider, passenger count, payment method and fare. `FullScreenNavigation` opens it as a confirmation when the driver selects Complete trip. Existing `completeTrip` API and far-from-destination double-confirm remain authoritative.
- Tests added: `src/test/DriverDestinationReached.test.tsx`. This counts as **one partially migrated state**, not full final acceptance; payment due and end-to-end receipt flow require separate review.

## Rider No Drivers (Figma `631:99`)

- Migrated the no-drivers visual state in `RideMatching.tsx` using the existing live `timedOut` condition and actual trip fare/route. Keep-searching, constrained fare adjustment and cancellation retain their original handlers. No fabricated driver availability.
- Visual and final end-to-end QA remain pending. No Wallet screens changed.

### Shared Ride no-driver variant (Figma `629:90`)

- When an actual `share` ride times out, the existing Rider matching recovery surface uses the same Figma treatment and actions. `tierKey` is sourced from the actual ride, not mock data.
- This Figma variant is **outside** the exact 50-frame selection and must not inflate the 50-screen completion count. Shared matching and boarding remain pending.
