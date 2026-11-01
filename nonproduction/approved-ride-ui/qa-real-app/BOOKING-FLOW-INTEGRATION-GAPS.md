Date: 1 November 2026 (Africa/Johannesburg). Status vocabulary: PASS, FAIL, BLOCKED, NOT VERIFIED. Browser fixture evidence is explicitly isolated and mocked; it does not verify live application services. No backend, production data, RLS, ledger, assignment authority or approved CI payload was changed.

# BOOKING FLOW INTEGRATION GAPS

**Real booking end-to-end: BLOCKED. Production readiness: NO-GO.** No ride, payment, offer, cancellation, upload, notification or database write was attempted. The browser harness never clicks Confirm location & continue; it measures that button and tests only local selection/navigation. Fixture auth, wallet, pricing and search results are labelled QA data, not successful real-service behavior.

| Stage / requirement | Status | Boundary and gap |
|---|---|---|
| Ride Home -> Choose a Ride | PASS | Approved isolated presentation and local transition; actual deployed route remains NOT VERIFIED. |
| Choose a Ride -> Set Destination | PASS | Economy selection opens the existing address screen in the isolated browser checks. |
| Set Destination -> Trip Configuration | PASS | QA-only named result selection renders configuration. Real geocoding/pickup/routing provenance is NOT VERIFIED. |
| Trip Configuration -> Finding Drivers | BLOCKED | Actual backend creation must be tested in staging. No real request submitted. |
| Driver Assigned -> Active Ride -> Completion | BLOCKED | Source screens/status handling and participant-scoped socket integration exist. No actual rider/driver lifecycle executed. |
| Actual rider authentication | NOT VERIFIED | useAuth + getUser paths exist; fixture identity cannot certify them. Test stale, revoked, expired and wrong-role sessions in approved staging. |
| Verified pickup/destination | NOT VERIFIED | Finite coordinate validation exists; verification provenance and supported service-area rules need authoritative contract proof. |
| Supported ride categories | NOT VERIFIED | UI offers Economy/Share/Parcel and special parcel handling. Server-supported categories/capacity and scheduled-parcel behavior need contract validation. |
| Authoritative fare quote | FAIL | Client default rates and tier multipliers remain; inspected UI does not require a server quote identity/revision/expiry before proceeding. |
| Passenger/luggage selection | PASS | Local passenger increment exercised. Real payload persistence, uploads and capacity enforcement remain NOT VERIFIED. |
| Supported payment methods | NOT VERIFIED | Request validator accepts cash/wallet; actual wallet lock, balance, provider availability and settlement unverified. No dummy balance may be used as production evidence. |
| Backend-controlled creation | FAIL | Direct Supabase insert fallback remains on unavailable/unconfigured Go, including auth-related fallback classification. Review and fail closed against an agreed authoritative service contract. |
| Valid status transitions | NOT VERIFIED | Client/server normalization and backend handlers exist; authorization, expected-version/state conflicts and race behavior need staging tests. |
| Real driver assignment | BLOCKED | No live driver or offer acceptance. Go/RPC authority paths and deployed access controls require coordinated contract review. |
| Reliable cancellation | NOT VERIFIED | Direct Supabase cancellation fallback exists; end-to-end fee/state/race/authority behavior is unverified. No financial or assignment logic was changed. |
| Honest offline/reconnect | FAIL | Offline request currently returns ok:true with a synthetic queued ID. Separate queued intent from an acknowledged backend ride, reconcile idempotently, and never show assignment/search as confirmed success solely from that ID. |
| Accurate wallet unavailable state | NOT VERIFIED | useWallet null fallback exposes balance 0; UI consumers must preserve loading/error/unknown distinctions. No ledger modifications authorized or performed. |

## Safe integration sequence

1. Agree the authoritative quote, creation, cancellation, assignment and settlement contracts. Preserve existing Go security hardening and RLS; do not silently port service code from the isolated snapshot.
2. Establish approved staging URLs/project identity, disposable rider and driver identities, isolated payment sandbox/storage/Redis and notification sinks. The existing qa-stabilization/STAGING-REQUIREMENTS.md remains the prerequisite.
3. Add fail-closed frontend behavior around those contracts, supported methods and unverified route/price states. Test offline intent, duplicate submits, lost acknowledgements and concurrent transitions without production writes.
4. Run authenticated staging lifecycle and native acceptance before removing any blocker. UI screenshots and mocked tests cannot substitute for these results.
