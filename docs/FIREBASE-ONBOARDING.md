# Firebase delivery setup

Android application `zw.co.cruixe` is registered in Firebase project
`koloi-87f15`. The user-supplied Android configuration is installed and the
Google Services processing task and native build passed. The Capacitor push
plugin already includes Firebase Messaging; no second client SDK is required.

## Server credentials

In Firebase, open Project settings → Service accounts → Firebase Admin SDK.
Generate a private key and keep the downloaded JSON private on your computer.
It is a different file from Android's `google-services.json`.

In Railway, choose CruiXe → production → koloi-ride-with-confidence → Variables.
Add both server variables together:

- `FIREBASE_PROJECT_ID`: `koloi-87f15`
- `FIREBASE_SERVICE_ACCOUNT_JSON`: the complete service-account JSON, stored as
  a secret variable through the Railway dashboard.

Do not put that JSON into chat, GitHub, Vite variables or mobile app assets.
Do not configure a generic `NOTIFICATION_FCM_ENDPOINT` alongside native Firebase.
An Android client API key cannot replace the service-account credential.

The live backend still runs the earlier main build. The tested native FCM and
notification-worker implementation is in PR8; it must be deployed after server
configuration is complete. Do not interpret saved variables or a passing build
as delivery acceptance.

## Device acceptance

Install the new Firebase-configured APK and grant notification permission.
Sign in using an authorized test account and verify the FCM token is registered
to that account. Send one ordinary test notification and check provider
acknowledgement plus foreground/background delivery. Do not use an emergency,
real call or money event as the test. Confirm authorization on device registration.

iPhone requires a separate Firebase Apple app registered as `zw.co.cruixe`, its
`GoogleService-Info.plist`, and Apple/APNs credentials and signing before physical
delivery can be accepted. Android success does not establish iPhone readiness.
