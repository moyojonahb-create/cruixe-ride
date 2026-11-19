# Firebase live backend activation

This branch is based on the existing live commit
`3ffe639adbf685e2ec6ff6fca65fda6393e20d7a`. It applies the tested Firebase/notification
worker implementation plus CruiXe Ride server log branding. It contains no schema
migration, dependency update, money-provider activation or mobile/frontend update.
The separate migration PR has additional ride changes outside this release.

Production target:
- Railway project: `b5d8ef48-4935-45f4-bcaa-07207efc7a32`
- Environment: `333219f9-d9c6-4cf0-9a15-dd4ca8b65271`
- API service: `692c5a82-f351-416b-bc4b-ed4fcc435aa4`
- API: `https://koloi-ride-with-confidence-production.up.railway.app`
- Previous successful deployment: `d78211a2-bcb2-4f83-b6af-6876a5629928`

Both `FIREBASE_PROJECT_ID` and `FIREBASE_SERVICE_ACCOUNT_JSON` were confirmed present
through variable-name metadata; their values are redacted. No private credential
is read into this report, source or tests. The API and standalone worker parse the
saved service-account key and authenticate it against Google's fixed OAuth
endpoint before starting. That credential check sends no notification. The provider
refreshes OAuth tokens, requires Firebase acknowledgement and fails closed on
missing configuration/provider rejection. Registered risk-job handlers are retained;
unsupported financial/placeholder jobs cannot claim success.

The API process registers and starts notification workers because this Railway
environment currently contains only the API and Redis services. The worker uses
existing notification tables and existing device registration routes. A startup
error must keep the new deployment unhealthy. Deploy the exact tested commit with
`/health/live` as its Railway healthcheck and keep the previous build available
for rollback. Verify source SHA, startup/worker logs, `/health/live` and
`/health/ready` after the release. Do not log credential values or device tokens.

Run `go test ./...` in backend before deployment. Credential authentication and a
provider-ready health result do not establish end-to-end delivery. Physical Android
registration/permission and one ordinary authorized test notification are a separate
acceptance checkpoint. Do not use emergency, real call or financial events for it.
iPhone still needs its Firebase app configuration and Apple/APNs signing setup.

## Latest migrated iPhone web review

The former Safari link resolved to production frontend commit `3ffe639`.
A separate protected frontend deployment now builds migration/mobile commit
`0650c1db45050025182800bfec89680d5d632137` (Vercel deployment
`dpl_FkJrvZcCCXdCoBjxCvg2hM8pztaW`). Its clean origin is
`https://cruixe-ride-eltgbr29l-jonah-b-moyos-projects.vercel.app`.
The deployed entry bundle contains the newer Rider schedule/layout code and live
API host, with no staging API host. Do not publish its private share token here.

Browser verification caught a CORS gap: the existing live API did not authorize
that origin. `CORS_ADDITIONAL_ORIGINS` adds explicit HTTPS origins while preserving
`CORS_ALLOW_ORIGINS`. Wildcards, credentials and paths are rejected; the existing
production base allowlist remains mandatory. Middleware tests verify that both
existing/native origins and the review origin work, while an unrelated site is
rejected. Full backend tests pass before applying the exact origin.

The public alias is not promoted by this review deployment. Screens marked
preview-only in the acceptance ledger remain incomplete as live workflows; a new
frontend deployment is not acceptance of all migrated frames. Actual Safari login,
Google/email redirect behavior and two-device rides still require verification.
