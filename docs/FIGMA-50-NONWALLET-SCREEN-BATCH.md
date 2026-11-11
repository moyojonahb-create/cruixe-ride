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
| 16 | `1153:105` | Rider accepted driver offer | Pending visual migration |
| 17 | `1153:165` | Driver en route to pickup | Pending visual migration |
| 18 | `1153:225` | Driver arrived | Pending visual migration |
| 19 | `1182:198` | Passenger onboard / start trip | Pending visual migration |
| 20 | `1182:281` | En route to destination | Pending visual migration |
| 21 | `1185:115` | Destination reached | Pending visual migration |
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
| 37 | `631:99` | No drivers found | Pending detailed parity |
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
