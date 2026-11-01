# CruiXe authenticated staging verification requirements

Status: BLOCKED. No dedicated nonproduction environment or disposable rider/driver identity has been verified or approved. Existing connected Supabase/Railway services must not receive test bookings, offer mutations, wallet transactions, storage uploads or matching writes. Local frontend fixtures are MOCKED/ISOLATED evidence only.

## Environment identity and approval

Record the owner-approved Supabase project reference, nonproduction backend URL, WebSocket URL, frontend origin, storage bucket IDs, deployment/version and test window. Independently confirm each belongs to staging, with no production credentials, production databases, Redis namespaces, storage buckets, notification recipients or provider webhooks. An APP_ENV label or localhost URL alone is insufficient. Obtain explicit approval before creating resources, identities, data or running mutations; this document performs none of them.

## Services and authority

Use a separate Supabase project, a nonproduction backend deployment and isolated Redis/queue namespaces where required. Deploy reviewed schema and backend versions through a separately approved workflow. Preserve auth, RLS, rider ownership, driver eligibility, JWT/session checks, financial authority and assignment authority. Do not weaken checks to make a test pass. Provider integrations must use supported sandbox modes or remain disabled, including payments, SMS/email, push and calling. Block all outbound production provider writes.

## Disposable identities and test data

Provision dedicated disposable rider A/rider B and approved driver A/driver B through the approved identity process. Record roles/ownership and eligibility; prohibit real customer identities and copied production sessions. Seed only synthetic destinations, fares governed by the staging pricing authority, balances from an approved staging ledger/fixture process, vehicles and requested/cancelled/assigned states using authorized staging APIs. A frontend fixture or screenshot does not establish a valid backend ride. Never fake a matching success.

## Isolated storage

Use a staging-only private luggage-photo bucket and prefix per test run, synthetic image files, normal ownership policies and signed-URL expiry. Verify upload, preview, removal and denied cross-account access. Never use production buckets or customer photos. Retain only redacted visual evidence.

## Credentials

Supply test secrets through an approved secret manager or injected local environment outside committed files; use short-lived least-privilege sessions. Do not paste passwords/tokens into chat, reports, screenshots or test output. Do not copy or inspect production credentials to create sessions. Keep service-role credentials out of the frontend and automated browser. Redact credentials, cookies, tokens and sensitive query parameters in network evidence. Confirm only the approved staging hosts are reachable from the test context.

## Required acceptance evidence

1. Verify signed-in rider ownership and unauthorized/expired-session denials; never bypass a 401.
2. Exercise Choose a Ride -> Set Destination -> Trip Configuration with provider-backed results and a real staging route.
3. Verify passenger limits, optional luggage upload/preview/removal, Cash/eligible Wallet selection, unavailable payment methods and Schedule without premature ride submission.
4. Submit only an approved staging booking. Record its authorized ride ID and lifecycle; test Finding Drivers with that state.
5. Exercise driver offers/assignment/cancellation only through staging authority; record actual results and concurrency behavior. Never turn mocked state into integration PASS.
6. Verify route/back/reload selection, animated cradle, shared ribbon, reduced motion, keyboard/focus, screen readers and mobile safe areas at 393x852 and 360x800 plus physical devices.
7. Retain exact commands, versions, exit codes, console/network results, environment identity and redacted screenshots. Separate frontend MOCKED/ISOLATED results from authenticated integration results.

## Cleanup and exit

Use a run ID and inventory of owned records, images, accounts, sessions and queues. Cancel remaining test rides through authorized APIs, remove only run-owned storage/data using an approved cleanup procedure, revoke test sessions and rotate/revoke temporary secrets. Verify no live requests, pending notifications, wallet obligations or assigned rides remain. Do not delete shared data or run global reset/clean commands. Record cleanup evidence and owner signoff; do not propose integration/release until the relevant verification gates pass.
