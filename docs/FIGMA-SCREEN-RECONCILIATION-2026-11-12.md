# CruiXe migration reconciliation — node-ID evidence audit

Audit date: 2026-11-12. Source: [Figma Main](https://www.figma.com/design/YLDdDmUNi4qbEb3mFfwpkB/CruiXe-Ride-Fronted?node-id=0-1) and Wallets page `613:410`. GitHub branch `codex/figma-frontend-foundation`, PR #6. This is an inventory **not a visual or functional acceptance report**.

## Counting rule

We count Figma top-level portrait mobile **frames** with width 350–440 px and height >=700 px; for Main use canvas depth 2/4, for Wallets depth 2/4. We exclude nested frames, decorative map overlays, archived pages, motion concepts and duplicate component subframes. This is a **new scope definition**, not directly comparable with the previously reported 163 Rider + 71 Driver audited flows.

## Counts

| Category | Frames |
|---|---:|
| Main · Driver | 149 |
| Main · Rider/other | 168 |
| Wallet page | 24 |
| **Total distinct top-level frames** | **341** |
| Exact node ID referenced in selected live React implementation files | 29 |
| In one of three batches' staging galleries, not referenced in selected live files | 47 |
| No exact ID mapping in scanned live files or gallery inventory | 265 |

The three galleries define 60 distinct Figma IDs, of which 13 also appear in scanned live files. **Code references do not establish working flows, visual parity, backend integration, or final testing.** Unmapped does NOT imply missing code—only that this audit cannot establish a reliable exact Figma-to-implementation link. Neither live-referenced nor gallery-only screens should be called completed. The earlier '86' was a sum of work activities, not unique accepted screens.

### Scanned implementation files

- `src/components/driver/DriverRegistrationWizard.tsx`
- `src/components/driver/ApplicationStatus.tsx`
- `src/components/driver/FullScreenNavigation.tsx`
- `src/pages/RideMatching.tsx`
- `src/pages/driver/DriverRideDetails.tsx`
- `src/pages/ResetPassword.tsx`
- `src/components/ride/ScheduleRide.tsx`
- `src/pages/RiderWalletPage.tsx`
- `src/components/ride/ActiveCallOverlay.tsx`
- `src/components/driver/DriverMessageSheet.tsx`

### Limitations and next QA gate

- No source-verified count of fully integrated and visually accepted screens can be reported yet; classification requires comparing actual screenshots and exercising corresponding authenticated workflows.
- Screen groups and variants may share one React component, so route counts are **not** screen counts.
- Driver account, parcel private codes and payments must pass backend contract/security tests before any state can be marked accepted.
- Confirm the final scope includes no archived/experimental frames; then attach individual acceptance outcomes in a separate evidence ledger.
- Wallet migration is deferred. Production and main remain unchanged.

## Complete audited inventory

| Figma ID | Page/side | Screen name | Evidence category | Live file(s) or gallery |
|---|---|---|---|---|
| `1063:103` | Main/Driver | CruiXe Driver / welcome · Netflix Red + White | No explicit node-ID mapping found; integration unverified | — |
| `1086:105` | Main/Driver | CruiXe Driver / 02 · Sign In | No explicit node-ID mapping found; integration unverified | — |
| `1092:105` | Main/Driver | CruiXe Driver / 03 · Create Account | No explicit node-ID mapping found; integration unverified | — |
| `1095:153` | Main/Driver | CruiXe Driver / 03B · Account Security | No explicit node-ID mapping found; integration unverified | — |
| `1093:105` | Main/Driver | CruiXe Driver / 04 · Verify Phone | No explicit node-ID mapping found; integration unverified | — |
| `1097:106` | Main/Driver | CruiXe Driver / 04B · Verification Methods | No explicit node-ID mapping found; integration unverified | — |
| `1101:105` | Main/Driver | CruiXe Driver / 05 · Your profile photo | Referenced in live React code (NOT acceptance proof) | `src/components/driver/DriverRegistrationWizard.tsx` |
| `1101:170` | Main/Driver | CruiXe Driver / 06 · Verify your identity | No explicit node-ID mapping found; integration unverified | — |
| `1101:240` | Main/Driver | CruiXe Driver / 07 · Driver's licence | No explicit node-ID mapping found; integration unverified | — |
| `1101:315` | Main/Driver | CruiXe Driver / 08 · About your vehicle | Referenced in live React code (NOT acceptance proof) | `src/components/driver/DriverRegistrationWizard.tsx` |
| `1101:391` | Main/Driver | CruiXe Driver / 09 · Vehicle documents | No explicit node-ID mapping found; integration unverified | — |
| `1101:466` | Main/Driver | CruiXe Driver / 10 · Photograph your car | No explicit node-ID mapping found; integration unverified | — |
| `1101:546` | Main/Driver | CruiXe Driver / 11 · Review your details | No explicit node-ID mapping found; integration unverified | — |
| `1101:619` | Main/Driver | CruiXe Driver / 12 · Application received | Referenced in live React code (NOT acceptance proof) | `src/components/driver/ApplicationStatus.tsx` |
| `1101:689` | Main/Driver | CruiXe Driver / 13 · Changes requested | Referenced in live React code (NOT acceptance proof) | `src/components/driver/ApplicationStatus.tsx` |
| `1101:759` | Main/Driver | CruiXe Driver / 14 · You're verified! | Referenced in live React code (NOT acceptance proof) | `src/components/driver/ApplicationStatus.tsx` |
| `1102:105` | Main/Driver | CruiXe Driver / Capture Guide · Profile photo | No explicit node-ID mapping found; integration unverified | — |
| `1102:155` | Main/Driver | CruiXe Driver / Capture Guide · Identity document | No explicit node-ID mapping found; integration unverified | — |
| `1102:206` | Main/Driver | CruiXe Driver / Capture Guide · Driver licence | No explicit node-ID mapping found; integration unverified | — |
| `1102:259` | Main/Driver | CruiXe Driver / Capture Guide · Vehicle documents | No explicit node-ID mapping found; integration unverified | — |
| `1102:312` | Main/Driver | CruiXe Driver / Capture Guide · Vehicle photos | No explicit node-ID mapping found; integration unverified | — |
| `1105:105` | Main/Driver | CruiXe Driver / 15 · Home · Offline | No explicit node-ID mapping found; integration unverified | — |
| `1105:172` | Main/Driver | CruiXe Driver / 15B · Home · Online | No explicit node-ID mapping found; integration unverified | — |
| `1105:239` | Main/Driver | CruiXe Driver / 16 · Requests | No explicit node-ID mapping found; integration unverified | — |
| `1105:296` | Main/Driver | CruiXe Driver / 17 · Drive | No explicit node-ID mapping found; integration unverified | — |
| `1105:353` | Main/Driver | CruiXe Driver / 18 · Earnings | No explicit node-ID mapping found; integration unverified | — |
| `1105:410` | Main/Driver | CruiXe Driver / 19 · Account | No explicit node-ID mapping found; integration unverified | — |
| `1107:188` | Main/Driver | CruiXe Driver / 20 · Notifications | No explicit node-ID mapping found; integration unverified | — |
| `1126:105` | Main/Driver | CruiXe Driver / 21 · Fare $5.00 | No explicit node-ID mapping found; integration unverified | — |
| `1127:453` | Main/Driver | CruiXe Driver / 22 · Offer Sent · Waiting for Rider | No explicit node-ID mapping found; integration unverified | — |
| `1153:105` | Main/Driver | CruiXe Driver / 23 · Rider Accepted Your Offer | No explicit node-ID mapping found; integration unverified | — |
| `1153:165` | Main/Driver | CruiXe Driver / 24 · En Route to Rider Pickup | No explicit node-ID mapping found; integration unverified | — |
| `1153:225` | Main/Driver | CruiXe Driver / 25 · Arrived · Waiting for Rider | No explicit node-ID mapping found; integration unverified | — |
| `1182:198` | Main/Driver | CruiXe Driver / 26 · Passenger Onboard · Start Trip | No explicit node-ID mapping found; integration unverified | — |
| `1182:281` | Main/Driver | CruiXe Driver / 28 · En Route to Destination | No explicit node-ID mapping found; integration unverified | — |
| `1185:115` | Main/Driver | CruiXe Driver / 29 · Destination Reached | No explicit node-ID mapping found; integration unverified | — |
| `1185:198` | Main/Driver | CruiXe Driver / 30 · Confirm Cash Payment | No explicit node-ID mapping found; integration unverified | — |
| `1185:281` | Main/Driver | CruiXe Driver / 31 · Trip Receipt and Earnings | No explicit node-ID mapping found; integration unverified | — |
| `1264:118` | Main/Driver | CruiXe Driver / 21B · New Request · Booked for Someone Else | No explicit node-ID mapping found; integration unverified | — |
| `1331:155` | Main/Driver | CruiXe Driver / 18A · Private Earnings | No explicit node-ID mapping found; integration unverified | — |
| `1336:140` | Main/Driver | CruiXe Driver / 18B · Top Up Drive Wallet | No explicit node-ID mapping found; integration unverified | — |
| `1338:140` | Main/Driver | CruiXe Driver / 18C · Top-Up Confirmation | No explicit node-ID mapping found; integration unverified | — |
| `1340:140` | Main/Driver | CruiXe Driver / 18D · Payment Processing | No explicit node-ID mapping found; integration unverified | — |
| `1340:182` | Main/Driver | CruiXe Driver / 18E · Top-Up Successful | No explicit node-ID mapping found; integration unverified | — |
| `1340:225` | Main/Driver | CruiXe Driver / 18F · Wallet Activity | No explicit node-ID mapping found; integration unverified | — |
| `1342:140` | Main/Driver | CruiXe Driver / 18G · Low Work Balance Warning | No explicit node-ID mapping found; integration unverified | — |
| `1349:140` | Main/Driver | CruiXe Driver / 19A · Personal Details | No explicit node-ID mapping found; integration unverified | — |
| `1349:188` | Main/Driver | CruiXe Driver / 19B · Contact Details | No explicit node-ID mapping found; integration unverified | — |
| `1349:234` | Main/Driver | CruiXe Driver / 19C · Vehicle Details | No explicit node-ID mapping found; integration unverified | — |
| `1349:282` | Main/Driver | CruiXe Driver / 19D · Driver Verification | No explicit node-ID mapping found; integration unverified | — |
| `1356:140` | Main/Driver | CruiXe Driver / 19E · Emergency Contact | No explicit node-ID mapping found; integration unverified | — |
| `1356:186` | Main/Driver | CruiXe Driver / 19F · Account Security | No explicit node-ID mapping found; integration unverified | — |
| `1356:232` | Main/Driver | CruiXe Driver / 19G · Driver Badge Progress | No explicit node-ID mapping found; integration unverified | — |
| `1360:142` | Main/Driver | CruiXe Driver / 19H · Achievement History | No explicit node-ID mapping found; integration unverified | — |
| `1360:204` | Main/Driver | CruiXe Driver / 19I · Badge Requirements | No explicit node-ID mapping found; integration unverified | — |
| `1365:140` | Main/Driver | CruiXe Driver / 19J · Edit Personal Details | No explicit node-ID mapping found; integration unverified | — |
| `1365:176` | Main/Driver | CruiXe Driver / 19K · Change Email | No explicit node-ID mapping found; integration unverified | — |
| `1365:209` | Main/Driver | CruiXe Driver / 19L · Change Phone | No explicit node-ID mapping found; integration unverified | — |
| `1365:242` | Main/Driver | CruiXe Driver / 19M · Update Vehicle | No explicit node-ID mapping found; integration unverified | — |
| `1365:278` | Main/Driver | CruiXe Driver / 19N · Renew Vehicle Documents | No explicit node-ID mapping found; integration unverified | — |
| `1365:314` | Main/Driver | CruiXe Driver / 19O · Edit Emergency Contact | No explicit node-ID mapping found; integration unverified | — |
| `1365:347` | Main/Driver | CruiXe Driver / 19P · Change Password | No explicit node-ID mapping found; integration unverified | — |
| `1365:380` | Main/Driver | CruiXe Driver / 19Q · Two-Step Verification | No explicit node-ID mapping found; integration unverified | — |
| `1365:413` | Main/Driver | CruiXe Driver / 19R · Help Centre | No explicit node-ID mapping found; integration unverified | — |
| `1365:449` | Main/Driver | CruiXe Driver / 19S · Contact Support | No explicit node-ID mapping found; integration unverified | — |
| `1367:140` | Main/Driver | CruiXe Driver / 19T · Profile Update Review | No explicit node-ID mapping found; integration unverified | — |
| `1367:186` | Main/Driver | CruiXe Driver / 19U · Verify New Email | No explicit node-ID mapping found; integration unverified | — |
| `1367:232` | Main/Driver | CruiXe Driver / 19V · Verify New Phone | No explicit node-ID mapping found; integration unverified | — |
| `1367:278` | Main/Driver | CruiXe Driver / 19W · Vehicle Update Review | No explicit node-ID mapping found; integration unverified | — |
| `1367:322` | Main/Driver | CruiXe Driver / 19X · Document Review Status | No explicit node-ID mapping found; integration unverified | — |
| `1367:368` | Main/Driver | CruiXe Driver / 19Y · Emergency Contact Review | No explicit node-ID mapping found; integration unverified | — |
| `1367:414` | Main/Driver | CruiXe Driver / 19Z · Password Change Review | No explicit node-ID mapping found; integration unverified | — |
| `1367:460` | Main/Driver | CruiXe Driver / 19AA · Two-Step Setup | No explicit node-ID mapping found; integration unverified | — |
| `1367:506` | Main/Driver | CruiXe Driver / 19AB · Support Request Received | No explicit node-ID mapping found; integration unverified | — |
| `1367:550` | Main/Driver | CruiXe Driver / 19AC · Support Ticket Status | No explicit node-ID mapping found; integration unverified | — |
| `1369:140` | Main/Driver | CruiXe Driver / 19AD · Email Verified | No explicit node-ID mapping found; integration unverified | — |
| `1369:176` | Main/Driver | CruiXe Driver / 19AE · Phone Verified | No explicit node-ID mapping found; integration unverified | — |
| `1369:212` | Main/Driver | CruiXe Driver / 19AF · Two-Step Enabled | No explicit node-ID mapping found; integration unverified | — |
| `1369:248` | Main/Driver | CruiXe Driver / 19AG · Recover Driver Account | No explicit node-ID mapping found; integration unverified | — |
| `1369:284` | Main/Driver | CruiXe Driver / 19AH · Recovery Code | No explicit node-ID mapping found; integration unverified | — |
| `1369:320` | Main/Driver | CruiXe Driver / 19AI · Reset Password | No explicit node-ID mapping found; integration unverified | — |
| `1369:356` | Main/Driver | CruiXe Driver / 19AJ · Document Changes Requested | No explicit node-ID mapping found; integration unverified | — |
| `1369:392` | Main/Driver | CruiXe Driver / 19AK · Resubmit Document | No explicit node-ID mapping found; integration unverified | — |
| `1369:428` | Main/Driver | CruiXe Driver / 19AL · Support Inbox | No explicit node-ID mapping found; integration unverified | — |
| `1369:464` | Main/Driver | CruiXe Driver / 19AM · Support Conversation | No explicit node-ID mapping found; integration unverified | — |
| `1369:500` | Main/Driver | CruiXe Driver / 19AN · Support Reply Sent | No explicit node-ID mapping found; integration unverified | — |
| `1369:536` | Main/Driver | CruiXe Driver / 19AO · Request Account Review | No explicit node-ID mapping found; integration unverified | — |
| `1369:572` | Main/Driver | CruiXe Driver / 19AP · Account Review Submitted | No explicit node-ID mapping found; integration unverified | — |
| `1373:140` | Main/Driver | CruiXe Driver / 32 · Ride History | No explicit node-ID mapping found; integration unverified | — |
| `1373:179` | Main/Driver | CruiXe Driver / 33 · Ride History Details | No explicit node-ID mapping found; integration unverified | — |
| `1373:218` | Main/Driver | CruiXe Driver / 34 · Parcel History | No explicit node-ID mapping found; integration unverified | — |
| `1373:257` | Main/Driver | CruiXe Driver / 35 · Top-Up Failed | No explicit node-ID mapping found; integration unverified | — |
| `1373:296` | Main/Driver | CruiXe Driver / 36 · Top-Up Pending | No explicit node-ID mapping found; integration unverified | — |
| `1373:335` | Main/Driver | CruiXe Driver / 37 · Wallet Transaction Details | No explicit node-ID mapping found; integration unverified | — |
| `1373:374` | Main/Driver | CruiXe Driver / 38 · Rider Cancelled Ride | No explicit node-ID mapping found; integration unverified | — |
| `1373:413` | Main/Driver | CruiXe Driver / 39 · Pickup No-Show Resolution | No explicit node-ID mapping found; integration unverified | — |
| `1373:452` | Main/Driver | CruiXe Driver / 40 · Account Suspended | No explicit node-ID mapping found; integration unverified | — |
| `1373:491` | Main/Driver | CruiXe Driver / 41 · Account Reactivated | No explicit node-ID mapping found; integration unverified | — |
| `1376:140` | Main/Driver | CruiXe Driver / 42 · Fare Dispute Status | No explicit node-ID mapping found; integration unverified | — |
| `1376:173` | Main/Driver | CruiXe Driver / 43 · Safety Incident Submitted | No explicit node-ID mapping found; integration unverified | — |
| `1376:206` | Main/Driver | CruiXe Driver / 44 · Safety Case Status | No explicit node-ID mapping found; integration unverified | — |
| `1376:239` | Main/Driver | CruiXe Driver / 45 · Wallet Transaction Dispute | No explicit node-ID mapping found; integration unverified | — |
| `1376:272` | Main/Driver | CruiXe Driver / 46 · Wallet Dispute Status | No explicit node-ID mapping found; integration unverified | — |
| `1376:305` | Main/Driver | CruiXe Driver / 47 · Support Ticket Resolved | No explicit node-ID mapping found; integration unverified | — |
| `1376:338` | Main/Driver | CruiXe Driver / 48 · Reopen Support Ticket | No explicit node-ID mapping found; integration unverified | — |
| `1376:371` | Main/Driver | CruiXe Driver / 49 · Cash Issue Recorded | No explicit node-ID mapping found; integration unverified | — |
| `1495:38` | Main/Driver | CruiXe Driver / 15C · Waiting Room · Online & Available | No explicit node-ID mapping found; integration unverified | — |
| `1210:116` | Main/Driver | CruiXe Driver / Parcel 01 · Delivery Request | Referenced in live React code (NOT acceptance proof) | `src/pages/driver/DriverRideDetails.tsx`, `src/lib/parcelBatch20Screens.ts` |
| `1210:225` | Main/Driver | CruiXe Driver / Parcel 02 · Parcel Job Accepted | Staging gallery only (not live-integrated) | `src/lib/parcelBatch20Screens.ts` |
| `1211:126` | Main/Driver | CruiXe Driver / Parcel 03 · Navigate to Sender Pickup | Staging gallery only (not live-integrated) | `src/lib/parcelBatch20Screens.ts` |
| `1210:312` | Main/Driver | CruiXe Driver / Parcel 04 · Arrived for Parcel Collection | Staging gallery only (not live-integrated) | `src/lib/parcelBatch20Screens.ts` |
| `1211:244` | Main/Driver | CruiXe Driver / Parcel 05 · Parcel Collected | Staging gallery only (not live-integrated) | `src/lib/parcelBatch20Screens.ts` |
| `1211:313` | Main/Driver | CruiXe Driver / Parcel 06 · Parcel in Transit | Staging gallery only (not live-integrated) | `src/lib/parcelBatch20Screens.ts` |
| `1210:397` | Main/Driver | CruiXe Driver / Parcel 07 · Arrived at Recipient | Staging gallery only (not live-integrated) | `src/lib/parcelBatch20Screens.ts` |
| `1210:482` | Main/Driver | CruiXe Driver / Parcel 08 · Verify Recipient Delivery | Staging gallery only (not live-integrated) | `src/lib/parcelBatch20Screens.ts` |
| `1232:166` | Main/Driver | CruiXe Driver / Parcel 09 · Proof of Recipient Handover | Staging gallery only (not live-integrated) | `src/lib/parcelBatch20Screens.ts` |
| `1211:428` | Main/Driver | CruiXe Driver / Parcel 10 · Parcel Cash Payment | Staging gallery only (not live-integrated) | `src/lib/parcelBatch20Screens.ts` |
| `1210:551` | Main/Driver | CruiXe Driver / Parcel 11 · Delivered and Receipt | Staging gallery only (not live-integrated) | `src/lib/parcelBatch20Screens.ts` |
| `1182:115` | Main/Driver | CruiXe Driver / Parcel · Collection Code Verification (reserved) | No explicit node-ID mapping found; integration unverified | — |
| `1240:116` | Main/Driver | CruiXe Driver / Communication · Message Rider | Referenced in live React code (NOT acceptance proof) | `src/components/driver/DriverMessageSheet.tsx`, `src/lib/communicationBatch20Screens.ts` |
| `1240:169` | Main/Driver | CruiXe Driver / Calling · Connecting | Referenced in live React code (NOT acceptance proof) | `src/components/ride/ActiveCallOverlay.tsx`, `src/lib/communicationBatch20Screens.ts` |
| `1240:214` | Main/Driver | CruiXe Driver / Calling · Ringing | Referenced in live React code (NOT acceptance proof) | `src/components/ride/ActiveCallOverlay.tsx`, `src/lib/communicationBatch20Screens.ts` |
| `1240:259` | Main/Driver | CruiXe Driver / Calling · Active | Referenced in live React code (NOT acceptance proof) | `src/components/ride/ActiveCallOverlay.tsx`, `src/lib/communicationBatch20Screens.ts` |
| `1240:301` | Main/Driver | CruiXe Driver / Calling · Ended | Referenced in live React code (NOT acceptance proof) | `src/components/ride/ActiveCallOverlay.tsx`, `src/lib/communicationBatch20Screens.ts` |
| `1240:329` | Main/Driver | CruiXe Driver / Calling · Failed | Referenced in live React code (NOT acceptance proof) | `src/components/ride/ActiveCallOverlay.tsx`, `src/lib/communicationBatch20Screens.ts` |
| `1253:117` | Main/Driver | CruiXe Driver / Parcel Sender · Message | Staging gallery only (not live-integrated) | `src/lib/communicationBatch20Screens.ts` |
| `1253:167` | Main/Driver | CruiXe Driver / Parcel Sender · Connecting | Staging gallery only (not live-integrated) | `src/lib/communicationBatch20Screens.ts` |
| `1253:211` | Main/Driver | CruiXe Driver / Parcel Sender · Ringing | Staging gallery only (not live-integrated) | `src/lib/communicationBatch20Screens.ts` |
| `1253:255` | Main/Driver | CruiXe Driver / Parcel Sender · Active | Staging gallery only (not live-integrated) | `src/lib/communicationBatch20Screens.ts` |
| `1253:297` | Main/Driver | CruiXe Driver / Parcel Sender · Ended | Staging gallery only (not live-integrated) | `src/lib/communicationBatch20Screens.ts` |
| `1253:324` | Main/Driver | CruiXe Driver / Parcel Sender · Failed | Staging gallery only (not live-integrated) | `src/lib/communicationBatch20Screens.ts` |
| `1253:352` | Main/Driver | CruiXe Driver / Parcel Recipient · Message | Staging gallery only (not live-integrated) | `src/lib/communicationBatch20Screens.ts` |
| `1253:402` | Main/Driver | CruiXe Driver / Parcel Recipient · Connecting | Staging gallery only (not live-integrated) | `src/lib/communicationBatch20Screens.ts` |
| `1253:446` | Main/Driver | CruiXe Driver / Parcel Recipient · Ringing | Staging gallery only (not live-integrated) | `src/lib/communicationBatch20Screens.ts` |
| `1253:490` | Main/Driver | CruiXe Driver / Parcel Recipient · Active | Staging gallery only (not live-integrated) | `src/lib/communicationBatch20Screens.ts` |
| `1253:532` | Main/Driver | CruiXe Driver / Parcel Recipient · Ended | Staging gallery only (not live-integrated) | `src/lib/communicationBatch20Screens.ts` |
| `1253:559` | Main/Driver | CruiXe Driver / Parcel Recipient · Failed | Staging gallery only (not live-integrated) | `src/lib/communicationBatch20Screens.ts` |
| `1261:509` | Main/Driver | CruiXe Driver / Booking for Someone Else · Passenger Details | No explicit node-ID mapping found; integration unverified | — |
| `1263:124` | Main/Driver | CruiXe Driver / Booking for Someone Else · Offer Accepted | No explicit node-ID mapping found; integration unverified | — |
| `1264:227` | Main/Driver | CruiXe Driver / 22B · Offer Sent · Booked for Someone Else | No explicit node-ID mapping found; integration unverified | — |
| `1270:129` | Main/Driver | CruiXe Driver / Student 01 · New Student Ride Request | No explicit node-ID mapping found; integration unverified | — |
| `1270:239` | Main/Driver | CruiXe Driver / Student 02 · Offer Sent · Waiting for Student | No explicit node-ID mapping found; integration unverified | — |
| `1270:323` | Main/Driver | CruiXe Driver / Student 03 · Offer Accepted | No explicit node-ID mapping found; integration unverified | — |
| `1270:729` | Main/Driver | CruiXe Driver / Student rider · Message | Staging gallery only (not live-integrated) | `src/lib/communicationBatch20Screens.ts` |
| `1270:779` | Main/Driver | CruiXe Driver / Student rider · Connecting | Staging gallery only (not live-integrated) | `src/lib/communicationBatch20Screens.ts` |
| `1270:823` | Main/Driver | CruiXe Driver / Student rider · Ringing | No explicit node-ID mapping found; integration unverified | — |
| `1270:867` | Main/Driver | CruiXe Driver / Student rider · Active | No explicit node-ID mapping found; integration unverified | — |
| `1270:909` | Main/Driver | CruiXe Driver / Student rider · Ended | No explicit node-ID mapping found; integration unverified | — |
| `1270:936` | Main/Driver | CruiXe Driver / Student rider · Failed | No explicit node-ID mapping found; integration unverified | — |
| `4:14` | Main/Rider | Splash Screen 1 | No explicit node-ID mapping found; integration unverified | — |
| `1692:38` | Main/Rider | Splash Screen 2 | No explicit node-ID mapping found; integration unverified | — |
| `631:90` | Main/Rider | CruiXe · main account scren creation | No explicit node-ID mapping found; integration unverified | — |
| `631:91` | Main/Rider | CruiXe · Login Screen | No explicit node-ID mapping found; integration unverified | — |
| `491:1101` | Main/Rider | CruiXe · Account Recovery / Invalid OTP — Rider | No explicit node-ID mapping found; integration unverified | — |
| `491:1042` | Main/Rider | CruiXe · Account Recovery / New Password — Rider | Referenced in live React code (NOT acceptance proof) | `src/pages/ResetPassword.tsx` |
| `491:1131` | Main/Rider | CruiXe · Account Recovery / OTP Expired — Rider | Referenced in live React code (NOT acceptance proof) | `src/pages/ResetPassword.tsx` |
| `491:1082` | Main/Rider | CruiXe · Account Recovery / Password Updated — Rider | Referenced in live React code (NOT acceptance proof) | `src/pages/ResetPassword.tsx` |
| `536:599` | Main/Rider | CruiXe • Missing destinations / 04 / Recover account | No explicit node-ID mapping found; integration unverified | — |
| `536:635` | Main/Rider | CruiXe • Missing destinations / 05 / Verify your email | No explicit node-ID mapping found; integration unverified | — |
| `631:92` | Main/Rider | CruiXe · ride home screen | No explicit node-ID mapping found; integration unverified | — |
| `631:93` | Main/Rider | CruiXe · Set destination screen. | No explicit node-ID mapping found; integration unverified | — |
| `631:94` | Main/Rider | CruiXe · Choose a ride | No explicit node-ID mapping found; integration unverified | — |
| `631:95` | Main/Rider | CruiXe · first screen to find drivers | No explicit node-ID mapping found; integration unverified | — |
| `631:96` | Main/Rider | CruiXe · rIDE cONFIRMATION SREEN | Staging gallery only (not live-integrated) | `src/lib/journeyBatch20Screens.ts` |
| `631:97` | Main/Rider | CruiXe / ECONOMY / Finding nearby drivers | Referenced in live React code (NOT acceptance proof) | `src/pages/RideMatching.tsx` |
| `631:100` | Main/Rider | CruiXe · druvers offers screen pop up | Referenced in live React code (NOT acceptance proof) | `src/pages/RideMatching.tsx` |
| `844:519` | Main/Rider | CruiXe / LOCATION / Choose on map | No explicit node-ID mapping found; integration unverified | — |
| `844:376` | Main/Rider | CruiXe / LOCATION / Current location confirmed | No explicit node-ID mapping found; integration unverified | — |
| `844:233` | Main/Rider | CruiXe / LOCATION / Search destination | No explicit node-ID mapping found; integration unverified | — |
| `844:90` | Main/Rider | CruiXe / LOCATION / Search pickup | No explicit node-ID mapping found; integration unverified | — |
| `631:99` | Main/Rider | CruiXe · No drivers found nearby · keep searching | Referenced in live React code (NOT acceptance proof) | `src/pages/RideMatching.tsx` |
| `1634:100` | Main/Rider | CruiXe · Adjust fare before requesting | No explicit node-ID mapping found; integration unverified | — |
| `1721:93` | Main/Rider | CruiXe / ECONOMY / Finding nearby drivers · $5 | No explicit node-ID mapping found; integration unverified | — |
| `1721:228` | Main/Rider | CruiXe / ECONOMY / Finding nearby drivers · $7 | No explicit node-ID mapping found; integration unverified | — |
| `536:533` | Main/Rider | CruiXe • Missing destinations / 03 / Offers expired | Staging gallery only (not live-integrated) | `src/lib/journeyBatch20Screens.ts` |
| `345:600` | Main/Rider | Driver Accepted | Referenced in live React code (NOT acceptance proof) | `src/pages/RideMatching.tsx` |
| `371:1407` | Main/Rider | Driver En Route | No explicit node-ID mapping found; integration unverified | — |
| `371:1479` | Main/Rider | Driver Arrived | No explicit node-ID mapping found; integration unverified | — |
| `386:1135` | Main/Rider | Trip in Progress | No explicit node-ID mapping found; integration unverified | — |
| `631:104` | Main/Rider | CruiXe · Trip complete card | No explicit node-ID mapping found; integration unverified | — |
| `631:103` | Main/Rider | CruiXe · Rate driver | No explicit node-ID mapping found; integration unverified | — |
| `415:582` | Main/Rider | Cancel ride | No explicit node-ID mapping found; integration unverified | — |
| `850:249` | Main/Rider | CruiXe / CANCEL / Confirm cancellation | No explicit node-ID mapping found; integration unverified | — |
| `850:153` | Main/Rider | CruiXe / CANCEL / Driver too far selected | No explicit node-ID mapping found; integration unverified | — |
| `850:209` | Main/Rider | CruiXe / CANCEL / Other reason entered | No explicit node-ID mapping found; integration unverified | — |
| `850:305` | Main/Rider | CruiXe / CANCEL / Ride cancelled | No explicit node-ID mapping found; integration unverified | — |
| `850:97` | Main/Rider | CruiXe / CANCEL / Wait time selected | No explicit node-ID mapping found; integration unverified | — |
| `864:97` | Main/Rider | CruiXe / RATING / 1 star | No explicit node-ID mapping found; integration unverified | — |
| `864:200` | Main/Rider | CruiXe / RATING / 2 stars | No explicit node-ID mapping found; integration unverified | — |
| `864:303` | Main/Rider | CruiXe / RATING / 3 stars | No explicit node-ID mapping found; integration unverified | — |
| `864:406` | Main/Rider | CruiXe / RATING / 4 stars | No explicit node-ID mapping found; integration unverified | — |
| `864:509` | Main/Rider | CruiXe / RATING / 5 stars | No explicit node-ID mapping found; integration unverified | — |
| `864:642` | Main/Rider | CruiXe / RATING / Written feedback preview | No explicit node-ID mapping found; integration unverified | — |
| `546:702` | Main/Rider | CruiXe / Rider Completion / 08 / Driver cancelled — automatic recovery | No explicit node-ID mapping found; integration unverified | — |
| `546:887` | Main/Rider | CruiXe / Rider Completion / 12 / Pickup waiting — no-show warning | No explicit node-ID mapping found; integration unverified | — |
| `547:824` | Main/Rider | CruiXe / Rider Completion / 29 / Previous rides and trip history | No explicit node-ID mapping found; integration unverified | — |
| `547:899` | Main/Rider | CruiXe / Rider Completion / 30 / Ride history details | No explicit node-ID mapping found; integration unverified | — |
| `832:90` | Main/Rider | CruiXe / Rider Completion / Older Rides · Pagination Preview | No explicit node-ID mapping found; integration unverified | — |
| `631:105` | Main/Rider | CruiXe · Ride updated | No explicit node-ID mapping found; integration unverified | — |
| `392:1586` | Main/Rider | CruiXe · Ride activity | No explicit node-ID mapping found; integration unverified | — |
| `526:410` | Main/Rider | Shared Ride / 01 / Finding a Shared Ride · Rider B | Referenced in live React code (NOT acceptance proof) | `src/pages/RideMatching.tsx`, `src/lib/journeyBatch20Screens.ts` |
| `526:483` | Main/Rider | Shared Ride / 02 / Shared Match Confirmed · Rider B | Staging gallery only (not live-integrated) | `src/lib/journeyBatch20Screens.ts` |
| `526:729` | Main/Rider | Shared Ride / 03 / Another Passenger Joining · Rider A (parallel alert) | Staging gallery only (not live-integrated) | `src/lib/journeyBatch20Screens.ts` |
| `526:562` | Main/Rider | Shared Ride / 04 / Shared Driver En Route · Rider B | Referenced in live React code (NOT acceptance proof) | `src/pages/RideMatching.tsx`, `src/lib/journeyBatch20Screens.ts` |
| `526:648` | Main/Rider | Shared Ride / 05 / Driver Arrived + Boarding PIN · Rider B | Referenced in live React code (NOT acceptance proof) | `src/pages/RideMatching.tsx`, `src/lib/journeyBatch20Screens.ts` |
| `526:819` | Main/Rider | Shared Ride / 06 / Shared Trip in Progress · Rider A | Staging gallery only (not live-integrated) | `src/lib/journeyBatch20Screens.ts` |
| `526:909` | Main/Rider | Shared Ride / 07 / Shared Trip in Progress · Rider B | Staging gallery only (not live-integrated) | `src/lib/journeyBatch20Screens.ts` |
| `634:90` | Main/Rider | CruiXe / SHARED RECEIPT / Passenger A · Tariro | No explicit node-ID mapping found; integration unverified | — |
| `634:175` | Main/Rider | CruiXe / SHARED RECEIPT / Passenger B · Sipho Maseko | No explicit node-ID mapping found; integration unverified | — |
| `631:98` | Main/Rider | CruiXe / SHARED RIDE / Finding compatible drivers · 2 passengers max | No explicit node-ID mapping found; integration unverified | — |
| `629:90` | Main/Rider | CruiXe · Shared No Drivers Found | Referenced in live React code (NOT acceptance proof) | `src/pages/RideMatching.tsx` |
| `320:495` | Main/Rider | Shared Ride · Find drivers | No explicit node-ID mapping found; integration unverified | — |
| `504:410` | Main/Rider | CruiXe · Book for Someone Else — Passenger Details | Staging gallery only (not live-integrated) | `src/lib/journeyBatch20Screens.ts` |
| `513:410` | Main/Rider | CruiXe · Guest Booking / Share Ride Link — Booker | Staging gallery only (not live-integrated) | `src/lib/journeyBatch20Screens.ts` |
| `513:503` | Main/Rider | CruiXe · Guest Booking / Booking Status — Booker | Staging gallery only (not live-integrated) | `src/lib/journeyBatch20Screens.ts` |
| `514:410` | Main/Rider | CruiXe · Guest Booking / Connected to Ride — Passenger | Staging gallery only (not live-integrated) | `src/lib/journeyBatch20Screens.ts` |
| `536:760` | Main/Rider | CruiXe • Missing destinations / 07 / Guest ride invitation | Staging gallery only (not live-integrated) | `src/lib/journeyBatch20Screens.ts` |
| `536:832` | Main/Rider | CruiXe • Missing destinations / 08 / Guest ride link | Staging gallery only (not live-integrated) | `src/lib/journeyBatch20Screens.ts` |
| `482:718` | Main/Rider | CruiXe · Schedule a Ride — Rider | Referenced in live React code (NOT acceptance proof) | `src/components/ride/ScheduleRide.tsx`, `src/lib/journeyBatch20Screens.ts` |
| `482:772` | Main/Rider | CruiXe · Review Scheduled Ride — Rider | Referenced in live React code (NOT acceptance proof) | `src/components/ride/ScheduleRide.tsx`, `src/lib/journeyBatch20Screens.ts` |
| `482:813` | Main/Rider | CruiXe · Ride Scheduled — Rider | Referenced in live React code (NOT acceptance proof) | `src/components/ride/ScheduleRide.tsx`, `src/lib/journeyBatch20Screens.ts` |
| `546:630` | Main/Rider | CruiXe / Rider Completion / 07 / Upcoming scheduled rides | Staging gallery only (not live-integrated) | `src/lib/journeyBatch20Screens.ts` |
| `536:672` | Main/Rider | CruiXe • Missing destinations / 06 / Manage scheduled ride | Staging gallery only (not live-integrated) | `src/lib/journeyBatch20Screens.ts` |
| `276:27` | Main/Rider | Add parcel photo | No explicit node-ID mapping found; integration unverified | — |
| `491:617` | Main/Rider | CruiXe · Parcel / Pickup & Handover — Rider | Staging gallery only (not live-integrated) | `src/lib/parcelBatch20Screens.ts` |
| `491:660` | Main/Rider | CruiXe · Parcel / Live Tracking — Rider | Staging gallery only (not live-integrated) | `src/lib/parcelBatch20Screens.ts` |
| `491:711` | Main/Rider | CruiXe · Parcel / Delivered — Rider | Staging gallery only (not live-integrated) | `src/lib/parcelBatch20Screens.ts` |
| `602:578` | Main/Rider | CruiXe / LEGAL / Parcel Service Rules | No explicit node-ID mapping found; integration unverified | — |
| `565:576` | Main/Rider | CruiXe / NEW / Failed Parcel Delivery — Resolution | Staging gallery only (not live-integrated) | `src/lib/parcelBatch20Screens.ts` |
| `565:490` | Main/Rider | CruiXe / NEW / Parcel Recipient — Live Tracking | Staging gallery only (not live-integrated) | `src/lib/parcelBatch20Screens.ts` |
| `572:460` | Main/Rider | CruiXe / NEXT / 02 / Parcel Redelivery & Return Review | Staging gallery only (not live-integrated) | `src/lib/parcelBatch20Screens.ts` |
| `573:410` | Main/Rider | CruiXe / NEXT / 02B / Return to Sender — Review | Staging gallery only (not live-integrated) | `src/lib/parcelBatch20Screens.ts` |
| `546:976` | Main/Rider | CruiXe / Rider Completion / 14 / Parcel recipient details | No explicit node-ID mapping found; integration unverified | — |
| `546:1019` | Main/Rider | CruiXe / Rider Completion / 15 / Parcel recipient invitation | No explicit node-ID mapping found; integration unverified | — |
| `546:1066` | Main/Rider | CruiXe / Rider Completion / 16 / Parcel drop-off verification | Staging gallery only (not live-integrated) | `src/lib/parcelBatch20Screens.ts` |
| `546:1108` | Main/Rider | CruiXe / Rider Completion / 17 / Parcel verification code rejected | No explicit node-ID mapping found; integration unverified | — |
| `546:1143` | Main/Rider | CruiXe / Rider Completion / 18 / Parcel received and confirmed | No explicit node-ID mapping found; integration unverified | — |
| `605:489` | Main/Rider | CruiXe / SUPPORT CASE / Parcel Case — Resolved | No explicit node-ID mapping found; integration unverified | — |
| `631:102` | Main/Rider | CruiXe · Nodrivers found parcel side | Referenced in live React code (NOT acceptance proof) | `src/pages/RideMatching.tsx` |
| `631:101` | Main/Rider | CruiXe · Parcel screen finding driver | Referenced in live React code (NOT acceptance proof) | `src/pages/RideMatching.tsx` |
| `491:735` | Main/Rider | CruiXe · Parcel / Delivery Problem — Rider | Staging gallery only (not live-integrated) | `src/lib/parcelBatch20Screens.ts` |
| `514:495` | Main/Rider | CruiXe · Universal Ride Receipt — Solo Shared Parcel | No explicit node-ID mapping found; integration unverified | — |
| `278:27` | Main/Rider | Choose payment method | No explicit node-ID mapping found; integration unverified | — |
| `572:410` | Main/Rider | CruiXe / NEXT / 01 / Payment Successful · Thank You | No explicit node-ID mapping found; integration unverified | — |
| `667:90` | Main/Rider | CruiXe / ECOCASH DIRECT / Pay for your ride | No explicit node-ID mapping found; integration unverified | — |
| `681:90` | Main/Rider | CruiXe / ECONOMY / Cash payment selected · alternative | No explicit node-ID mapping found; integration unverified | — |
| `678:90` | Main/Rider | CruiXe / PAYMENTS / Choose cash on trip · selection state | No explicit node-ID mapping found; integration unverified | — |
| `547:632` | Main/Rider | CruiXe / Rider Completion / 25 / Manage payment methods | No explicit node-ID mapping found; integration unverified | — |
| `547:716` | Main/Rider | CruiXe / Rider Completion / 26 / Link mobile money securely | No explicit node-ID mapping found; integration unverified | — |
| `547:752` | Main/Rider | CruiXe / Rider Completion / 27 / Remove payment method confirmation | No explicit node-ID mapping found; integration unverified | — |
| `547:791` | Main/Rider | CruiXe / Rider Completion / 28 / Ride payment failed — safe retry | No explicit node-ID mapping found; integration unverified | — |
| `371:1332` | Main/Rider | Communication Screen | No explicit node-ID mapping found; integration unverified | — |
| `847:209` | Main/Rider | CruiXe / CHAT / Call arrival drafted | No explicit node-ID mapping found; integration unverified | — |
| `847:262` | Main/Rider | CruiXe / CHAT / Call arrival sent | No explicit node-ID mapping found; integration unverified | — |
| `847:321` | Main/Rider | CruiXe / CHAT / Luggage drafted | No explicit node-ID mapping found; integration unverified | — |
| `847:374` | Main/Rider | CruiXe / CHAT / Luggage sent | No explicit node-ID mapping found; integration unverified | — |
| `847:97` | Main/Rider | CruiXe / CHAT / Main gate drafted | No explicit node-ID mapping found; integration unverified | — |
| `847:150` | Main/Rider | CruiXe / CHAT / Main gate sent | No explicit node-ID mapping found; integration unverified | — |
| `847:433` | Main/Rider | CruiXe / CHAT / Photo prepared | No explicit node-ID mapping found; integration unverified | — |
| `860:97` | Main/Rider | CruiXe / NOTE / Call arrival saved | No explicit node-ID mapping found; integration unverified | — |
| `845:628` | Main/Rider | CruiXe / NOTE / I have luggage | No explicit node-ID mapping found; integration unverified | — |
| `860:154` | Main/Rider | CruiXe / NOTE / Luggage saved | No explicit node-ID mapping found; integration unverified | — |
| `845:522` | Main/Rider | CruiXe / NOTE / Main gate | No explicit node-ID mapping found; integration unverified | — |
| `845:681` | Main/Rider | CruiXe / NOTE / Saved | No explicit node-ID mapping found; integration unverified | — |
| `482:568` | Main/Rider | CruiXe · Calling / Active — Rider | No explicit node-ID mapping found; integration unverified | — |
| `482:474` | Main/Rider | CruiXe · Calling / Connecting — Rider | No explicit node-ID mapping found; integration unverified | — |
| `482:672` | Main/Rider | CruiXe · Calling / CruiXe Agent Active — Rider | No explicit node-ID mapping found; integration unverified | — |
| `482:613` | Main/Rider | CruiXe · Calling / Ended — Rider | No explicit node-ID mapping found; integration unverified | — |
| `482:642` | Main/Rider | CruiXe · Calling / Failed — Rider | No explicit node-ID mapping found; integration unverified | — |
| `482:521` | Main/Rider | CruiXe · Calling / Ringing — Rider | No explicit node-ID mapping found; integration unverified | — |
| `536:410` | Main/Rider | CruiXe • Missing destinations / 01 / Note to driver | No explicit node-ID mapping found; integration unverified | — |
| `592:607` | Main/Rider | CruiXe / FINAL RIDER DESTINATIONS / 03 Location History & Data Controls | No explicit node-ID mapping found; integration unverified | — |
| `565:410` | Main/Rider | CruiXe / NEW / Trusted Contact — Live Trip Viewer | No explicit node-ID mapping found; integration unverified | — |
| `459:474` | Main/Rider | CruiXe · Add / Edit Trusted Contact — Rider | No explicit node-ID mapping found; integration unverified | — |
| `455:552` | Main/Rider | CruiXe · Emergency Calling — Rider | No explicit node-ID mapping found; integration unverified | — |
| `445:474` | Main/Rider | CruiXe · SOS Alert Failed — Rider | No explicit node-ID mapping found; integration unverified | — |
| `439:474` | Main/Rider | CruiXe · SOS Alert Sent — Rider | No explicit node-ID mapping found; integration unverified | — |
| `432:474` | Main/Rider | CruiXe · SOS Sending — Rider | No explicit node-ID mapping found; integration unverified | — |
| `426:786` | Main/Rider | CruiXe · Safety Centre / SOS — Rider | No explicit node-ID mapping found; integration unverified | — |
| `459:661` | Main/Rider | CruiXe · Safety Tips — Rider | No explicit node-ID mapping found; integration unverified | — |
| `449:474` | Main/Rider | CruiXe · Share My Trip — Rider | No explicit node-ID mapping found; integration unverified | — |
| `455:474` | Main/Rider | CruiXe · Trip Shared Successfully — Rider | No explicit node-ID mapping found; integration unverified | — |
| `455:625` | Main/Rider | CruiXe · Trusted Contacts — Rider | No explicit node-ID mapping found; integration unverified | — |
| `465:976` | Main/Rider | CruiXe · remove Trusted Contact — Rider | No explicit node-ID mapping found; integration unverified | — |
| `389:501` | Main/Rider | CruiXe · Rider account | No explicit node-ID mapping found; integration unverified | — |
| `483:600` | Main/Rider | CruiXe · Edit Profile / Details — Rider | No explicit node-ID mapping found; integration unverified | — |
| `483:642` | Main/Rider | CruiXe · Edit Profile / Updated — Rider | No explicit node-ID mapping found; integration unverified | — |
| `557:587` | Main/Rider | CruiXe / ACCOUNT / Saved Places · Manage and edit | No explicit node-ID mapping found; integration unverified | — |
| `547:410` | Main/Rider | CruiXe / ACCOUNT / Saved Places · View list | No explicit node-ID mapping found; integration unverified | — |
| `565:649` | Main/Rider | CruiXe / NEW / Logged-in Devices — Account Security | No explicit node-ID mapping found; integration unverified | — |
| `547:495` | Main/Rider | CruiXe / Rider Completion / 22 / Saved places — empty | No explicit node-ID mapping found; integration unverified | — |
| `547:552` | Main/Rider | CruiXe / Rider Completion / 23 / Add a saved place | No explicit node-ID mapping found; integration unverified | — |
| `547:590` | Main/Rider | CruiXe / Rider Completion / 24 / Edit a saved place | No explicit node-ID mapping found; integration unverified | — |
| `547:957` | Main/Rider | CruiXe / Rider Completion / 31 / Delete account — review consequences | No explicit node-ID mapping found; integration unverified | — |
| `547:994` | Main/Rider | CruiXe / Rider Completion / 32 / Delete account — verify identity | No explicit node-ID mapping found; integration unverified | — |
| `491:543` | Main/Rider | CruiXe · Notifications / Inbox — Rider | No explicit node-ID mapping found; integration unverified | — |
| `536:872` | Main/Rider | CruiXe • Missing destinations / 09 / Privacy & account | No explicit node-ID mapping found; integration unverified | — |
| `536:952` | Main/Rider | CruiXe • Missing destinations / 10 / Rider preferences | No explicit node-ID mapping found; integration unverified | — |
| `536:1032` | Main/Rider | CruiXe • Missing destinations / 11 / Notification preferences | No explicit node-ID mapping found; integration unverified | — |
| `592:410` | Main/Rider | CruiXe / FINAL RIDER DESTINATIONS / 01 My Support Cases | No explicit node-ID mapping found; integration unverified | — |
| `592:497` | Main/Rider | CruiXe / FINAL RIDER DESTINATIONS / 02 Legal & Policies | No explicit node-ID mapping found; integration unverified | — |
| `602:536` | Main/Rider | CruiXe / LEGAL / Fares & Cancellation Policy | No explicit node-ID mapping found; integration unverified | — |
| `602:452` | Main/Rider | CruiXe / LEGAL / Privacy Policy | No explicit node-ID mapping found; integration unverified | — |
| `602:410` | Main/Rider | CruiXe / LEGAL / Terms of Service | No explicit node-ID mapping found; integration unverified | — |
| `602:494` | Main/Rider | CruiXe / LEGAL / Wallet Terms | No explicit node-ID mapping found; integration unverified | — |
| `572:529` | Main/Rider | CruiXe / NEXT / 03 / Report Trip Issue | No explicit node-ID mapping found; integration unverified | — |
| `572:585` | Main/Rider | CruiXe / NEXT / 04 / Support Case Status | No explicit node-ID mapping found; integration unverified | — |
| `572:664` | Main/Rider | CruiXe / NEXT / 05 / Lost Item Recovery | No explicit node-ID mapping found; integration unverified | — |
| `605:410` | Main/Rider | CruiXe / SUPPORT CASE / Lost Item Case — Awaiting Rider | No explicit node-ID mapping found; integration unverified | — |
| `468:474` | Main/Rider | CruiXe · Live Support Chat — Rider | No explicit node-ID mapping found; integration unverified | — |
| `459:556` | Main/Rider | CruiXe · Support — Rider | No explicit node-ID mapping found; integration unverified | — |
| `546:938` | Main/Rider | CruiXe / Rider Completion / 13 / Missed pickup — trip not started | No explicit node-ID mapping found; integration unverified | — |
| `421:687` | Main/Rider | Tells us why | No explicit node-ID mapping found; integration unverified | — |
| `1634:236` | Main/Rider | CruiXe · Adjust fare · $5 | No explicit node-ID mapping found; integration unverified | — |
| `1634:237` | Main/Rider | No drivers found nearby · keep searching | No explicit node-ID mapping found; integration unverified | — |
| `1634:368` | Main/Rider | CruiXe · Adjust fare · $7 | No explicit node-ID mapping found; integration unverified | — |
| `1634:369` | Main/Rider | No drivers found nearby · keep searching | No explicit node-ID mapping found; integration unverified | — |
| `285:27` | Wallets/Wallet | Wallet / Dashboard | Referenced in live React code (NOT acceptance proof) | `src/pages/RiderWalletPage.tsx` |
| `285:34` | Wallets/Wallet | Wallet / Activation | No explicit node-ID mapping found; integration unverified | — |
| `285:38` | Wallets/Wallet | Wallet / Set PIN | No explicit node-ID mapping found; integration unverified | — |
| `285:42` | Wallets/Wallet | Wallet / Confirm PIN | No explicit node-ID mapping found; integration unverified | — |
| `285:46` | Wallets/Wallet | Wallet / PIN mismatch | No explicit node-ID mapping found; integration unverified | — |
| `285:50` | Wallets/Wallet | Wallet / Add Money | No explicit node-ID mapping found; integration unverified | — |
| `285:54` | Wallets/Wallet | Wallet / Confirm Top-Up | No explicit node-ID mapping found; integration unverified | — |
| `285:58` | Wallets/Wallet | Wallet / Top-Up Processing | No explicit node-ID mapping found; integration unverified | — |
| `285:62` | Wallets/Wallet | Wallet / Top-Up Successful | No explicit node-ID mapping found; integration unverified | — |
| `285:66` | Wallets/Wallet | Wallet / Top-Up Pending | No explicit node-ID mapping found; integration unverified | — |
| `285:70` | Wallets/Wallet | Wallet / Top-Up Failed | No explicit node-ID mapping found; integration unverified | — |
| `285:74` | Wallets/Wallet | Wallet / Transactions | No explicit node-ID mapping found; integration unverified | — |
| `285:78` | Wallets/Wallet | Wallet / Transactions Empty | No explicit node-ID mapping found; integration unverified | — |
| `285:82` | Wallets/Wallet | Wallet / Transactions Loading | No explicit node-ID mapping found; integration unverified | — |
| `285:86` | Wallets/Wallet | Wallet / Transactions Error | No explicit node-ID mapping found; integration unverified | — |
| `285:90` | Wallets/Wallet | Wallet / Transaction Details | No explicit node-ID mapping found; integration unverified | — |
| `285:94` | Wallets/Wallet | Wallet / Security | No explicit node-ID mapping found; integration unverified | — |
| `285:98` | Wallets/Wallet | Wallet / Ride Payment | No explicit node-ID mapping found; integration unverified | — |
| `285:102` | Wallets/Wallet | Wallet / Ride Payment Insufficient | No explicit node-ID mapping found; integration unverified | — |
| `285:106` | Wallets/Wallet | Wallet / Refund Details | No explicit node-ID mapping found; integration unverified | — |
| `285:110` | Wallets/Wallet | Wallet / Refund Completed | No explicit node-ID mapping found; integration unverified | — |
| `285:114` | Wallets/Wallet | Wallet / Refund Failed | No explicit node-ID mapping found; integration unverified | — |
| `285:118` | Wallets/Wallet | Wallet / Help | No explicit node-ID mapping found; integration unverified | — |
| `285:600` | Wallets/Wallet | Wallet / Top-Up Payment Methods | No explicit node-ID mapping found; integration unverified | — |

## Interpretation

Do not use 341-29 as a count of missing screens; 29 only means explicit node ID occurrence in a limited code audit. Do not use 341-86 either, because the 86 were mixed partial changes, previews, and overlapping states. Follow-on batches should resolve currently unmapped rows by locating actual React routes, comparing screenshots and using authenticated state transitions.
