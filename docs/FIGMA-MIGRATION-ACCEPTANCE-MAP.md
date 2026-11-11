# CruiXe Figma → GitHub migration: source-of-truth and acceptance map

Updated 2026-11-11. Scope: **PR #6** (`codex/figma-frontend-foundation`) based on **PR #5** (`codex/economy-cash-milestone`). Status **IN PROGRESS**, NOT rollout approval.

## Sources and protective boundaries

- Rider Figma page `0:1`, Driver onboarding and flows also on page `0:1`: https://www.figma.com/design/YLDdDmUNi4qbEb3mFfwpkB/CruiXe-Ride-Fronted?node-id=0-1
- Wallet Figma page `613:410`; wallet dashboard frame `285:27`.
- The separate `763:90` page has no children currently returned by the design metadata read; use the live main-page Driver frames, **not** archived page `1039:196`.
- Backend, ledger, auth, API calls, RLS and payments belong to the existing code. Do **not** delete route/business logic as a shortcut to visual parity.
- Keep `main` and production untouched. A Vercel Ready build is **not** proof of successful rider ↔ driver staging integration.

## Implementation owners (roles, not presumed active agents)

- Product/UI: Figma visual parity, exact approved local assets, safe areas, controls and interactions.
- Mobile/Frontend: responsive React/TypeScript implementation and route preservation.
- Backend/Realtime: verify current Go/Supabase/dispatch contract before changing API use.
- Payments/Security: preserve wallet PIN gating, transaction data, receipt accuracy, vehicle document auth/storage.
- QA/Release: CI, staging-only environment isolation, two-device acceptance and regression tests.
- Engineering manager: scope review, dependencies, gates, no unverified claims of completion.

## Route-to-Figma migration worklist

| Status | React route / implementation | Figma frames | Required behavior |
|---|---|---|---|
| Foundation in PR #6; recheck | `/ride`, Rider home/components | Rider main page `0:1` | Map, location editor, tier chooser; shared ride maximum 2 |
| Foundation in PR #6; recheck | `/auth`, `/signup` | Rider main page `0:1` | Existing phone verification, login/session recovery |
| Foundation in PR #6; recheck | `/driver`, `/driver/dashboard`, `/driver/requests` | `1063:103`, `1105:105`, `1105:172`, `1105:239`, `1105:296` | Existing availability, dispatch, fare, notifications |
| NOT migrated | Driver account setup `/driver/register`, driver application | `1092:105`, `1095:153`, `1093:105`, `1097:106` | Account/security, OTP methods, existing validations |
| NOT migrated | Driver identity and document wizard | `1101:105`, `1101:170`, `1101:240`, `1101:315`, `1101:391`, `1101:466` | No changes to document permissions, capture/upload or validation until verified |
| NOT migrated | Driver application review and states | `1101:546`, `1101:619`, `1101:689`, `1101:759` | Application submitted/changes requested/verified must reflect backend |
| NOT migrated | `/wallet`, `src/pages/RiderWalletPage.tsx` | Wallet Dashboard `285:27` | Live balance, PIN verification, deposits, transfer, withdraw, actual transaction list; never use Figma sample data |
| NOT migrated | `/driver/wallet` | Wallet page `613:410` (identify exact driver frame before implementation) | Existing driver ledger, earnings privacy, top-up and PIN |
| NOT migrated/partially existing | `/ride/:rideId/matching`, `/driver/ride/:rideId` | Rider/Driver trip flow on `0:1` | Live synchronized offer → pickup → trip → receipt; error states |
| NOT migrated/partially existing | `/history`, `/profile`, `/driver/profile` and communications/safety | Find matching named nodes on main page before editing | Keep production hooks, permissions and route targets |

## Evidence recorded from repo at migration baseline

- PR #6 head before this tracker: `c0fc4bb6a7c066fe11ec714ce922d7c289b909a0`; draft, open.
- PR #6 description reports 205 frontend tests passing, 12 live tests skipped and a Vercel protected Ready preview. These are prior reported results; **not rerun by this tracker commit**.
- `src/pages/DriverRegistrationPage.tsx` currently delegates to `DriverRegistrationWizard`, whose existing validation and uploads must be preserved.
- `src/pages/RiderWalletPage.tsx` contains live wallet hooks, PIN checks, transaction, deposit and security controls. Its previous appearance must be replaced **without replacing its real data with Figma placeholders**.

## Completion gates

1. Each visible route visually matched to the exact frame and its exported local assets, not an embedded screenshot.
2. No old-UI fallback on reachable Rider or Driver flows; old logic retained behind new components until feature parity is proven.
3. All actions connected (back, navigation, luggage, SOS, location, booking and cancel) with meaningful failure/permission states.
4. Run Node 22 typecheck, lint, unit tests and staging build on the resulting SHA; pass necessary backend tests.
5. Confirm isolated Vercel preview uses staging Supabase and staging Railway API/WSS endpoints; no production fallbacks.
6. Verify rider/driver two-device ride, payment, cancellation and receipt lifecycle, then test iPhone XR and iPhone 16 Pro screen widths.
7. Only then mark PR ready for review; do not merge automatically.

**Important:** This file is a migration control document, not a claim that these outstanding screens are complete.
