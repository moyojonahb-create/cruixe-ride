# Batch 20 — non-wallet Rider journeys

Target PR: #6 `codex/figma-frontend-foundation` (based on PR #5). This batch produces **20 Figma-sourced visual state foundations** in one atomic Git commit, plus a real schedule-review handoff. These are not all wired into business flows.

## Classification and status

| Group | Figma frames | What exists | Integration remaining |
|---|---|---|---|
| Shared Ride (7) | 526:410, 526:483, 526:729, 526:562, 526:648, 526:819, 526:909 | Seven distinct state variants in reusable renderer | Server-authoritative two-seat match, passenger assignments, boarding PIN generation/verification, live shared-route progress |
| Guest booking (6) | 504:410, 513:410, 513:503, 514:410, 536:760, 536:832 | Six state variants, redacted invalid links | Authenticated invitation issuance, recipient verification, expiry/revocation, secure access to another person's ride |
| Scheduled rides (5) | 482:718, 482:772, 482:813, 546:630, 536:672 | Five visual state variants; **real ScheduleRide date/time review** now calls original onConfirm only after confirmation | Full upcoming ride list and editing integration; reliable server-based notifications |
| Matching (2) | 536:533, 631:96 | Two visual state variants | Expired-offer states wired to server, booking confirmation route parity |

## Staging review only

`/staging/figma-20` is available exclusively when Vite builds in `staging` mode; it is absent in production-mode builds. Navigation in this view lets reviewers inspect every visual state in one visit. It does not create rides or fake confirmations; all business action buttons indicate their wiring is pending, and the inputs show non-personal placeholders. **Do not ship the gallery in production.**

The UI renderer `src/components/journeys/Batch20JourneyScreen.tsx` takes caller-supplied `JourneyData` and action callbacks, and does not issue backend requests or generate PINs, share tokens, driver quotes or money records. Each node is identified by its exact Figma node ID.

## Live integration in this batch

`src/components/ride/ScheduleRide.tsx` now adds the actual Rider schedule-review step (Figma `482:772`) before calling the existing parent `onConfirm(selectedTime, remindMe)`. No changes to dispatch lead time or scheduling API. Confirmation still depends on the actual backend; the review is not a booked ride.

## Release gates

- **Not accepted as 20 completed production screens.** They are 20 visible state foundations, and one functional scheduler review change.
- Full design fidelity requires asset audits and visual checks at 360/375/390/400/430 widths.
- Wire each live flow only after backend and privacy contracts are confirmed, then verify interactive states.
- Vercel Ready and passing CI only establish successful build, not real bookings.
- Reserve full Rider↔Driver end-to-end user testing until complete migration per product owner direction.
- Wallets deferred to final batch; `main` and production unchanged.
