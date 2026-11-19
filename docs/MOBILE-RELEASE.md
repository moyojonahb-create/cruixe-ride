# Android and iPhone builds with live services

The migrated React app at the repository root is packaged with Capacitor.
`apps/mobile` is a separate Expo experiment, not the migrated Rider/Driver app.
The canonical root app ID is `zw.co.cruixe` on Android, iPhone and xtool. The
previous development APK used `zw.co.pickme`. Confirm store ownership before
distribution: changing an application ID creates a distinct installation, not an
update to an app published under the old ID.

## Repeatable build

Run the manual **Mobile builds** GitHub Actions workflow on the reviewed
mobile branch. Configure the `mobile-production` environment secrets first:

- `CRUIXE_PRODUCTION_SUPABASE_PUBLISHABLE_KEY`: publishable/anon key for the live Supabase project.
- `CRUIXE_PRODUCTION_MAPBOX_ACCESS_TOKEN`: public Mapbox token allowed for native use.

Never put service-role keys or signing credentials in Vite variables. The workflow
uses the live database and Go host explicitly. The native build script fails if
the publishable key is absent and replaces inherited service URLs with the selected
profile. The old staging profile remains available only as an explicit option. No Vercel login or
remote `server.url` is embedded: the application bundles its web assets.

The artifacts are a debug APK (private Android installation) and an unsigned
iPhone simulator app. The simulator artifact cannot install on a physical iPhone.
The local Android live-service build passed `:app:assembleDebug` (45s incremental
after the full native build). All ten plugin Java/Kotlin sources compiled. The
GitHub workflow and iPhone native compile remain unverified.

For local builds use Node 22, `npm ci`, set the live publishable key and map token as in the
workflow, then `node scripts/build-mobile.mjs production` and `npx cap sync android` or `ios`.
Android needs Java 21 and Android SDK 36; run `cd android && bash gradlew :app:assembleDebug`.
iOS uses SwiftPM on macOS: open `ios/App/App.xcodeproj` after sync. Supply an
Apple team and provisioning for a device build. Do not distribute simulator output
as an IPA. Never commit signing assets.

## Physical-device distribution blockers

- Apple Developer team, registered bundle ID, signing and App Store Connect access
  are required for TestFlight. No signed archive/upload has been performed.
- Android release signing/Play Console setup has not been verified. Debug APKs
  are not a Play release.
- Native push configuration (APNs entitlements and Firebase configuration) and
  foreground/background permission behavior require device verification.
- The installed Transistorsoft v9 SDK requires a release license on both platforms;
  debug operation does not establish release licensing.
- Verify backend CORS and Supabase auth redirects for the native origins; test
  login/recovery, resume, offline recovery, GPS, offers, calls and notifications
  on two physical devices. No live money or emergency notifications in this test.
- Native icons/splash assets are generated defaults pending design review.
- Offer delivery, cash confirmation and record-authorization fixes require backend
  deployment and live workflow acceptance before public launch. Wallet remains outside
  the current implementation batch.

## xtool evaluation

Evaluated https://github.com/xtool-org/xtool on 2026-11-19.
The Contacts compatibility gap was fixed by upgrading the upstream package from
7.1.0 to 8.0.0. Its public TypeScript definitions are unchanged, and Capacitor now
includes all ten iOS plugins using SwiftPM with no missing-package warning.

`native/xtool` provides a SwiftPM app entry point using a programmatically created
Capacitor bridge, avoiding Xcode storyboard compilation. It retains the generated
CapApp-SPM plugin dependency graph and Objective-C plugin linking. The normal
Xcode project is also preserved for macOS builds.

To build with xtool, first install Swift and the Apple Darwin SDK following the
[upstream Linux guide](https://xtool.sh/documentation/xtooldocs/installation-linux).
With the live project's publishable key and map token set, run:

```sh
node scripts/prepare-xtool.mjs production
cd native/xtool
xtool dev build --ipa
# After secure Apple signing setup:
xtool dev build --sign --ipa
```

Preparation builds actual production web assets and copies the full plugin class list
and permission descriptions. It does not sign, install, upload or accept a build.
Generated assets remain ignored. The wrapper is not yet compiler/device verified.

The downloaded xtool AppImage runs its help and SDK-status commands on this host.
Its build command fails before compilation with SwiftNIO `epoll_ctl: Operation not
permitted`, including a retry outside the command sandbox. The host also has no
Swift toolchain or Apple Darwin SDK (`xtool sdk status`: Not installed). SDK setup
needs an authenticated Apple Xcode download. Device signing/installation still
needs an Apple account and device connectivity; xtool does not grant TestFlight
access. Keep Apple passwords and signing material out of chat.

## Evidence

Baseline frontend: `511f43371eb20a3b9a22770d68cf984dc78daf9c`.
After the Contacts upgrade, 386 frontend tests passed (12 skipped): 373 on the
initial run and 13 across three suites rerun with their missing fixture environment.
TypeScript and the production-profile web build passed (5m46s). The bundled API, WSS and Supabase
URLs were verified as live; staging service hosts were absent. These are not native QA.
iOS SwiftPM project generation and discovery of all ten plugins succeeded on Linux;
iPhone native compilation has not passed on that host. The manual workflow records the
exact GitHub SHA in each artifact name when a configured build succeeds.

## Live service status at the switch

The selected live API is `https://koloi-ride-with-confidence-production.up.railway.app`
and WSS is its `/ws` endpoint. The selected live Supabase project is
`foksbnjtzubsjpeoorvo`, matching the existing frontend production configuration
and a healthy connected project. This is distinct from staging. The backend's
actual database project could not be independently confirmed: the Railway token
is scoped to staging and OAuth variable values are redacted.

On 2026-11-19 production `/health/live` returned 200 but `/health/ready` returned
503: PostgreSQL/Redis healthy, Asynq disabled, notifications noop, dispatch off.
Production native CORS origins already pass. Building against live services does
not repair that deployment or establish ride workflow readiness. No production
schema or backend deployment was changed by the mobile configuration switch.

## Ride workflow source fixes in this branch

- `confirmCashCollection` rejects non-cash calls before issuing any request and
  constrains legacy writes/reads to completed cash rides: seven focused tests pass.
- `SubmitOffer` emits participant-targeted `ride_offer` only after persistence,
  using the authoritative ride owner: full rides Go package and six new cases pass.
- Disputes derive roles from actual ride participation; ride-linked emergencies
  require ownership. Full business tests and a disposable PostgreSQL integration
  passed, covering unrelated users, forged roles, driver-row spoofing and no-ride
  emergency compatibility. These changes are not deployed to the live API.

Evidence logs for this session are `/tmp/cruixe-mobile-production-build.log`,
`/tmp/cruixe-mobile-test-retry.log`, `/tmp/cruixe-live-offer-go-test.log`,
`/tmp/cruixe-business-auth-tests.log` and `/tmp/cruixe-business-auth-postgres.log`.
The database integration uses a disposable local database, not production records.

## Android package validation

The final production-profile debug APK is generated at
`android/app/build/outputs/apk/debug/app-debug.apk`. It is for physical-device
acceptance against live services, not an App Store/Play submission. Confirm the
packaged hosts and signature before sharing. Android background permissions and
notification behavior still need actual-device acceptance.

## Live dispatch activation and Firebase follow-up

On 2026-11-19, production variables `ASYNQ_ENABLED=true` and
`DISPATCH_MODE=authoritative` were applied to service
`692c5a82-f351-416b-bc4b-ed4fcc435aa4`, production environment
`333219f9-d9c6-4cf0-9a15-dd4ca8b65271`. Existing build `3ffe639` was
redeployed as `c3f1f2c6-409e-491e-9e3e-a6e3e40a9584` and reached SUCCESS.
Runtime readiness rose from 40 to 80: PostgreSQL, Redis, Asynq configuration and
authoritative dispatch report ready. Notifications remain noop and total readiness
remains HTTP503. This health result does not prove job consumption or ride acceptance.

The notification follow-up in this branch starts/registers API-process notification
workers, propagates startup errors, archives unsupported work instead of acknowledging
placeholder jobs, and adds native Firebase FCM HTTPv1 with server-only
`FIREBASE_PROJECT_ID` and `FIREBASE_SERVICE_ACCOUNT_JSON`. It preserves custom gateway
support, refreshes Google OAuth credentials, requires service acknowledgement, and
rejects an absent provider instead of recording a false delivery. The separate
worker command uses the same native provider factory. These code changes are not
deployed to production yet.

Firebase provisioning could not begin: `console.firebase.google.com` and
`auth.firebase.tools` both return CONNECT403 under the environment network policy.
Firebase CLI login failed before offering a sign-in URL. The cloud browser also
failed to initialize. No Google credentials or Firebase project are available.
Enable access to Firebase/Google sign-in and provide an authenticated Google session
to create the project; store service credentials only in Railway server variables.
Android needs the project's `google-services.json`; iPhone also needs Firebase app
configuration plus APNs signing credentials. No real notifications were sent.

Focused Go tests cover native FCM acknowledgements/token reuse/provider rejection,
missing credentials, unsupported financial-job rejection and native readiness.
The live backend health checks were read without changing production records.

## Uniform CruiXe identity check (2026-11-19)

The root Capacitor app, Android namespace/application ID/Java activity package,
Android package/scheme resources, iOS Debug/Release bundle IDs, and xtool bundle
and generated Info.plist identity now all use `zw.co.cruixe`. The visible app name
is CruiXe. The separate Expo experiment already uses CruiXe branding and its
distinct `zw.co.cruixe.mobile` identifier; it is not the root release app.

The user's Firebase screenshot shows zero apps in Koloi project `koloi-87f15`.
Register Android package `zw.co.cruixe` and Apple bundle ID `zw.co.cruixe` there.
No Firebase configuration files or native callback URLs tied to the old ID were
found in the reviewed root app. FileProvider authority derives from applicationId.
No release signingConfig, Apple signing team or store publication record was found
in the repository. This does not establish absence of an existing Play/App Store
listing: store-console access is unavailable. Check store ownership and any OAuth,
APNs or Transistorsoft release-license registration against the new ID before launch.
Historical staging/audit documents retain the identifiers used by their old builds.
The old APK download was built under the old ID; use the newly rebuilt APK once
its package and signature verification pass. No store or Firebase registration was
changed by this source migration.

Identity validation passed: Capacitor sync on both platforms; Android
`:app:assembleDebug` (52s), apksigner verification, and aapt2 package check
(`zw.co.cruixe`, version1.0, minSDK24/target36). The APK's embedded Capacitor config
uses the new ID, bundles web assets, and contains live API/Supabase hosts with
no staging service hosts. Rebuilt APK SHA256:
`e9c4226740e6c7499cb8238aec5b3c31f9c5ac63ff8a926d8d8633fcee0f0c77`.
iPhone sync is not an Xcode compilation/signing claim.
