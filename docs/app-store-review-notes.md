# App Store Connect — review notes (CruiXe iOS)

**How to use this file:** paste the *Review notes* section below into App Store
Connect → your build → **App Review Information → Notes** at submission. Fill in
the demo credentials first. Keep this file updated when the permission set or
the background behaviour changes, so the argument does not have to be
reconstructed from memory the night before a submission.

**Why this file exists.** The `Info.plist` usage descriptions in
`apps/mobile/app.json` are written for the **driver**, in a system alert, at the
moment they decide whether to grant. They are deliberately short: a paragraph in
that alert risks truncation and depresses the grant rate, and a driver who taps
"Don't Allow" costs live dispatch positions for that entire shift. The **full
operational justification belongs here**, where the reviewer will read it and
there is no length pressure. Two audiences, two artifacts.

---

## Submission checklist — do these before pasting anything

### 1. Credentials are never committed to this repo

**Do not put real demo credentials in this file, or anywhere in git.** Git
history is permanent — a later deletion does not remove them — and this is not
a throwaway login: the demo driver account can go **online against production
dispatch** and receive real ride requests from real riders.

- Keep the actual values in the team password manager.
- Enter them in App Store Connect → **App Review Information → Sign-in
  required → Demo Account** (the dedicated username/password fields), not in the
  free-text notes.
- **Verify the login works immediately before every submission.** A lapsed demo
  account is the single most likely rejection path here: the reviewer lands in
  the rider flow, never sees background location used, and rejects under 2.5.4
  having technically reached the app.
- Rotate the password after each review cycle.

### 2. Demo video recorded, hosted and reachable

Apple accepts demo videos specifically for flows a single reviewer cannot
reproduce alone, which is exactly this case — CruiXe is two-sided, and a
reviewer working solo can go online as a driver but cannot then request a ride
as a rider to trigger a trip.

**Hosting requirements — these fail submissions more often than the content:**

- The URL must be **publicly reachable without a login**. A Google Drive or
  Dropbox link that prompts for sign-in counts as inaccessible.
- It must stay live for the **entire review period**, including re-reviews after
  a rejection. Do not delete it when the build goes live.
- Keep it **under about three minutes**. A reviewer is looking to answer one
  question, not watch a product tour.

**Shot list — every row of the verification table must appear on camera:**

| # | Shot | Proves |
|---|---|---|
| 1 | Driver signs in, taps **Go online**; status shows online | Driver reaches the gated flow |
| 2 | Rider on a second device requests a ride; driver receives it and sends an offer; rider accepts | The loop a solo reviewer cannot produce |
| 3 | Rider's map showing the driver's car moving, both screens visible | Location drives a real user-facing feature |
| 4 | **Driver's screen locks** (show the lock clearly), then hold on the rider's screen while the car keeps moving | **The whole 2.5.4 argument** — this is the shot that matters |
| 5 | Driver switches to a navigation app; rider's map still updating | Why "While Using" is insufficient in practice |
| 6 | Rider uses *Share trip*; the shared link opens and tracks | Third-party live tracking |
| 7 | Driver toggles **Offline**; reporting stops | The stated data boundary is real |

Record both devices in one frame, or screen-record each and place them
side by side. Shot 4 is the one that answers the reviewer's actual question —
give it real time on screen, with visible movement, rather than a two-second cut.

Update the timestamps in the verification table to match the finished video.

### 3. Placeholders replaced

Search the pasted text for `<` before submitting — the video URL is the only
placeholder that should remain in this file, and it must be filled in the
pasted copy.

---

## Review notes — paste from here

### Demo account

CruiXe is a two-sided ride-hailing app. **The background-location behaviour only
appears on the driver side, and only once a driver is online with an accepted
trip.** Please use the pre-approved driver credentials supplied in the *Sign-in
required → Demo Account* fields of this submission rather than creating a new
account — a self-registered account lands in the rider flow and never reaches
the screens described here.

Driver accounts require document approval before they can go online; the supplied
account is already approved. A second set of rider credentials is included so the
full loop can be reproduced.

**We recognise a single reviewer cannot easily drive both sides at once.** A
demo video of the complete loop is linked below for that reason.

### What the app does

CruiXe connects riders and drivers in Zimbabwe. A rider requests a ride, nearby
drivers receive the request and send a fare offer, the rider accepts one, and the
driver then drives to the pickup point and completes the trip.

### Why the app needs Always-on location (background)

**The rider is watching the driver's car move on a live map for the entire
journey** — first as it approaches the pickup point, then throughout the trip.
That map is fed by the driver app reporting position continuously.

"While Using the App" is not sufficient for this, for a concrete reason:

> A driver mounts the phone on the windscreen and follows turn-by-turn
> directions **in a separate navigation app**, with CruiXe in the background and
> often with the screen off. Under "While Using", location reporting stops the
> moment CruiXe leaves the foreground — which is essentially the whole trip.

The user-visible consequences if this were foreground-only:

1. **The rider's map freezes** while they are waiting on a street corner, with
   no way to tell whether the car is still coming.
2. **Arrival estimates go stale**, because they are computed from the driver's
   current position.
3. **Trip sharing breaks.** A rider can share a live trip link with someone else
   (a family member following them home); that link goes blank.
4. **Emergency response degrades.** The in-app emergency button attaches the
   driver's current position to the alert. Without background location, an alert
   raised while the screen is off carries a stale position.

### Demo video of the full loop

**`<VIDEO URL — see submission checklist>`**

The behaviour being justified requires both sides of the marketplace at once: a
driver alone on one device can go online, but no trip starts until a rider
requests one, so background location never gets the chance to demonstrate
itself. The linked video records the complete loop end to end, including the
moment the driver's screen locks and the rider's map continues updating.

### How to verify each claim in the build

Each row can be reproduced with the supplied credentials and a second device, or
watched at the timestamp given in the video.

| Claim | How to see it | In the video |
|---|---|---|
| Rider watches driver move | Sign in as the rider on a second device or the web app, request a ride, accept the driver's offer, watch the map | 0:00–0:40 |
| Background reporting (the 2.5.4 question) | With a trip accepted, lock the driver's phone or switch to another app, then watch the rider's map keep updating | 0:40–1:20 |
| Live trip sharing | On the rider side, use *Share trip* during an active trip and open the link | 1:20–1:45 |
| Emergency button | Driver screen → safety control; the alert includes the current position | 1:45–2:05 |
| Nothing collected offline | Toggle the driver **Offline**; position reporting stops | 2:05–2:25 |

### Motion & Fitness

Used for stop detection only. The location library reads motion activity to tell
"the car is moving" from "the car is parked", and reduces location accuracy while
stationary. **This is a battery measure** — drivers are online for hours, and
sampling at full accuracy while parked drains the device materially. No motion
data is stored or transmitted; it is consumed on-device to modulate sampling.

### Data handling boundaries

- Location is collected **only while the driver is online**. Going offline stops
  collection.
- Location is not collected on the rider side outside of an active trip.
- The app does not sell location data or share it with third parties for
  advertising.
- Session replay masks all text by default, so typed values are not captured.

## Review notes — paste to here

---

## Permission-by-permission mapping

The short strings ship in the dialog; the long reasoning stays here.

### `NSLocationAlwaysAndWhenInUseUsageDescription`

**Ships to the driver:**
> Riders watch your car approach on their map, so CruiXe needs your location
> while you are online — including when your screen is off or you are using a
> navigation app. With "While Using" only, your rider's map freezes mid-trip.
> CruiXe never uses your location when you are offline.

Three short sentences, each doing one job: the mechanism (rider watches the car),
the failure case (map freezes mid-trip), and the boundary (nothing while
offline). The boundary sentence is kept despite the length pressure because a
stated limit measurably improves willingness to grant, and grant rate on this
permission is what determines whether dispatch has live positions at all.

**Full justification:** see "Why the app needs Always-on location" above.

### `NSLocationWhenInUseUsageDescription`

**Ships to the driver:**
> CruiXe uses your location to match you with riders nearby and show them where
> your car is. It is only used while you are signed in and online.

Covers the foreground case: matching and the rider-facing map.

### `NSLocationAlwaysUsageDescription`

Legacy key for iOS 10 and earlier. Same substance, shorter; retained so the
justification is present if an older OS or tooling path reads it.

### `NSMotionUsageDescription`

**Ships to the driver:**
> CruiXe uses motion activity to tell whether your car is moving or parked, so
> it can save battery while you are stopped.

Framed as a benefit to the driver, because it is one — battery over a long shift
is a real driver concern, and a permission that visibly serves the person
granting it is more likely to be granted.

---

## Known review risks

1. **Background location draws extra scrutiny for ride-hailing.** Guideline
   2.5.4 requires that background location be integral to the app, not
   incidental. The demo account and the verification table above exist so a
   reviewer can *see* the rider-side map updating, rather than taking the claim
   on trust. A reviewer who cannot reproduce the behaviour will reject it.
2. **A reviewer who cannot get online as a driver sees none of this.** Driver
   accounts are gated behind document approval. If the demo account lapses, the
   app looks like it requests Always-on location for no visible reason — the
   single most likely rejection path. **Verify the demo login works immediately
   before every submission.**
3. **iOS background behaviour is unvalidated as of this writing.** The
   background-location spike (`apps/spike-background-location/RUNBOOK.md`)
   covers Android only. An equivalent iOS pass is a prerequisite before an iOS
   release commitment — do not submit on the strength of Android results.

---

# Google Play — Android permissions review

Added 8 Sep 2026, from the **merged** manifest
(`app/build/intermediates/merged_manifest/debug/processDebugMainManifest/`)
rather than from `app/src/main/AndroidManifest.xml`. That distinction matters:
**we declare none of these ourselves.** Every permission below arrives from a
plugin at merge time, which is why reviewing the source manifest would show an
almost empty file and tell you nothing.

## `ACCESS_BACKGROUND_LOCATION` — DECISION PENDING S7, not a settled gate

**Present in the merged manifest. But it may not be needed at all.**

An earlier version of this section called it "the release gate" and stated that
Transistorsoft cannot function without it. **The second claim is wrong** and the
first is premature. Corrected 8 Sep 2026.

### What the platform actually requires

For a foreground service with `foregroundServiceType="location"`, the runtime
prerequisite is **at least one of** `ACCESS_COARSE_LOCATION` or
`ACCESS_FINE_LOCATION`. `ACCESS_BACKGROUND_LOCATION` is required for exactly one
thing: **starting** such a service while the app is in the background.

It is not what keeps a driver tracked. A driver taps "go online" **with the app
open**; the service starts in the foreground, and from that moment location
survives screen lock, backgrounding and a full shift on while-in-use alone.

### Corroborating evidence from the manifest itself

`START_FOREGROUND_SERVICES_FROM_BACKGROUND` and `RECEIVE_BOOT_COMPLETED` are
both present and both exist *only* to serve background-start and boot-restart.
They are the fingerprint of the capability this permission buys — which
independently confirms the reading above from a different direction than the
docs.

### What each branch costs

| Branch | Gains | Loses |
|---|---|---|
| **Keep** | `startOnBoot`, service self-restart after an OS kill | Declaration form, demo video, disclosure screen, multi-week review with rejection risk **on the launch critical path** |
| **Drop** | All four review requirements disappear | Boot restart; self-restart after an OS kill |

**`startOnBoot` is arguably a defect, not a feature.** A phone that reboots in a
driver's pocket and silently resumes broadcasting location — potentially
appearing available for dispatch — is a **consent defect**. The driver never
opened the app. Dropping it improves the product.

The real cost of dropping is the **OS-kill case**: a driver killed mid-shift
stops receiving offers until they reopen the app. On aggressive Samsung firmware
that may not be rare.

### S7 decides it, and S7 is now load-bearing

S7 was scoped as a curiosity about the terminated case. It is now the evidence
for this decision: **how often is the app actually killed mid-shift on the
SM-M075F with battery optimisation on?** Without that number this is a decision
made on vibes.

### The drop branch has a mandatory ORDER — this is the non-obvious part

The permission is declared by the **AAR itself**, not by our manifest or the
Capacitor wrapper:

```
uses-permission#android.permission.ACCESS_BACKGROUND_LOCATION
ADDED from [com.transistorsoft:tslocationmanager:4.5.1]
  .../transformed/tslocationmanager-4.5.1/AndroidManifest.xml:11:5-85
```

So removing it does not stop the native library from *attempting* the background
start. Sequence is what makes it safe:

1. **Config first** — `startOnBoot: false`, `stopOnTerminate: true` in
   `src/lib/backgroundLocation.ts`. This stops the SDK attempting the boot
   receiver and background restart at all.
2. **Manifest second** — `tools:node="remove"` on `ACCESS_BACKGROUND_LOCATION`,
   `RECEIVE_BOOT_COMPLETED` and `START_FOREGROUND_SERVICES_FROM_BACKGROUND`.

**Reversed, this crashes at boot.** Permission removed while config still says
`startOnBoot: true` means the SDK's boot receiver fires without the permission →
`SecurityException` / `ForegroundServiceStartNotAllowedException` **inside a
BroadcastReceiver**, which surfaces in Play vitals and counts against store
standing. Same components, opposite outcome, decided purely by order.

### S11 — conditional, drop branch only

**Do not run speculatively.** It requires making the change, so it is the
validation step *for* the drop, not an exploration of it. Run only if S7's kill
rate makes dropping attractive.

With config and manifest changed in the order above: driver online → reboot the
device → observe. Does anything crash? Does the SDK log and continue cleanly?
Does anything reach Sentry? Confirm the app returns to a sane state where the
driver is simply **offline until they open it**.

### If we keep it, these four are required

| Requirement | State |
|---|---|
| Play Console **declaration form** | not started |
| **Demo video** of the in-app flow leading to the request | not started |
| **Prominent in-app disclosure** before the OS prompt, in our own UI | **NOT BUILT** — 25th screen |
| Privacy policy covering background location | `/privacy` exists; needs review |

---

## `ACTIVITY_RECOGNITION` — declared by the AAR, never requested by us

Same AAR block as the permission above. **It is a runtime dangerous permission
on Android 10+, not a manifest formality.**

The SDK exposes `requestPermission(permission?: Permission)` for exactly this.
**Nothing in our code calls it.** `backgroundLocation.ts` calls `ready()` and
`start()` only; `nativeBridge.ts` calls Capacitor's *Geolocation* plugin, which
requests location and nothing else.

**Unverified:** whether the native SDK requests it internally during `start()`.
Our code definitely does not.

**Why it matters for the scenarios:** if it is never granted, motion-based state
detection degrades silently — the SDK falls back to less efficient tracking,
which costs battery, which is what gets a driver app uninstalled. It degrades
with **no error anywhere**.

That is the same shape as the phantom columns and the fatigue writer: declared,
plausible-looking, never wired. **Check the granted state on device before
S3–S5**, or those scenarios may measure a degraded mode without anyone knowing:

```
adb shell dumpsys package zw.co.pickme | grep -A1 ACTIVITY_RECOGNITION
```

---

## Superseded — the original gate framing

**Present in the merged manifest. Transistorsoft cannot function without it.**

This is the single biggest schedule risk between here and a Play release, and it
is **entirely non-technical**. Reviews take days to weeks and are rejected for
imprecise justification. Nothing about the code changes the outcome.

Four things are required, and all four must be ready before submission:

| Requirement | State |
|---|---|
| Play Console **declaration form**, explaining the use case | not started |
| **Demo video** showing the in-app flow leading to the request, and what the feature does | not started |
| **Prominent in-app disclosure**, shown *before* the OS prompt, in our own UI, naming the data and purpose | **NOT BUILT — see below** |
| Privacy policy covering background location | `/privacy` exists; needs review for this specifically |

### The disclosure is a screen that does not exist

Play requires a disclosure **distinct from the OS dialog**, in our own UI, shown
*before* the permission is requested, naming what is collected and why. That is a
real UI surface with mandated content — a **25th screen**, tracked as such in the
walkthrough checklist and currently marked *not yet built*.

The iOS section above ("Why the app needs Always-on location") already contains
usable justification copy. The Android disclosure has stricter placement rules
(before the prompt, dismissible only by explicit action) but the same substance.

## `SCHEDULE_EXACT_ALARM` — deliberately removed

Merged in by `@capacitor/local-notifications`. **Removed** via `tools:node="remove"`
in `app/src/main/AndroidManifest.xml`.

We deliver local notifications immediately (arrival announcements, ride offers)
and never schedule one for a future time, so there is no use case to declare —
and Play requires a policy justification for this permission. Carrying an
unjustifiable permission is worse than not having it.

**Do not re-add it by reflex.** A future plugin will pull it back in silently;
the removal line is what keeps it out.

**It fails at runtime, not build time.** `tools:node="remove"` builds cleanly and
then throws `SecurityException` at the call site if anything reaches
`AlarmManager`. **S9** — arrival notification on a locked screen — is the test
that proves the removal is safe. Do not consider it verified before S9 passes.

## `USE_EXACT_ALARM` — verified absent, must stay absent

The stricter sibling. Play restricts it to alarm-clock and calendar apps
outright; a ride-hailing app carrying it is a straightforward rejection.
Confirmed absent from the merged manifest (count 0). Re-check after any plugin
addition.

## Keep, no declaration needed

| Permission | Source | Note |
|---|---|---|
| `POST_NOTIFICATIONS` | push + local notifications | Required. Needs a runtime request on Android 13+; covered by S6 |
| `START_FOREGROUND_SERVICES_FROM_BACKGROUND` | background-geolocation | Needed for the service to restart |
| `HIGH_SAMPLING_RATE_SENSORS` | background-geolocation | Normal (non-dangerous) permission — no runtime prompt, no declaration. Activity recognition |
| `ACCESS_FINE_LOCATION` / `ACCESS_COARSE_LOCATION` | geolocation | Foreground location |
| `ACTIVITY_RECOGNITION` | background-geolocation | Motion state |
| `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_LOCATION` | background-geolocation | The tracking service |
| `RECEIVE_BOOT_COMPLETED`, `WAKE_LOCK` | background-geolocation | `startOnBoot` |

## Pre-existing, need disclosure and privacy-policy coverage

Not blockers, but do not meet them for the first time at submission:

- **`CAMERA`** — driver selfie check, document upload
- **`RECORD_AUDIO`** — Agora in-app voice calling
- **`READ_CONTACTS`** — contact picker for "book for someone else". Attracts more
  scrutiny than people expect for a picker; consider whether the OS contact
  picker (which needs no permission) would serve

## Re-run this review after any plugin change

The whole point is that our own manifest is nearly empty and the merged one is
not. After adding or updating any Capacitor plugin:

```
npx cap sync android
cd android && JAVA_HOME=<jdk21> ./gradlew :app:processDebugMainManifest
grep -oE 'android:name="android.permission.[A-Z_]+"' \
  app/build/intermediates/merged_manifest/debug/processDebugMainManifest/AndroidManifest.xml \
  | sort -u
```
