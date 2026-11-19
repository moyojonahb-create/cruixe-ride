# Latest migrated Safari review deployment

The previously supplied production alias served frontend commit
`3ffe639adbf685e2ec6ff6fca65fda6393e20d7a`, which explains the old-screen report.
The current migrated frontend is deployed separately from
`0650c1db45050025182800bfec89680d5d632137`:

- Vercel deployment: `dpl_FkJrvZcCCXdCoBjxCvg2hM8pztaW`
- Clean origin: `https://cruixe-ride-eltgbr29l-jonah-b-moyos-projects.vercel.app`
- Target: protected preview using live service configuration
- State: READY
- Entry asset: `/assets/index-C35nTybp.js`

Protected fetches returned HTTP200 for /ride and the entry asset. Deployed JS
contains the newer Rider schedule/layout class sequence and the live API hostname,
with no staging API hostname. This confirms served artifact/source identity, not
pixel acceptance or authenticated workflow acceptance. Private share tokens are
kept out of repository documentation. Open the new hostname in Safari; an existing
Home Screen shortcut still addresses the old origin. Many Figma frames remain
preview-only rather than connected product workflows.

## API access blocker and concrete pending release

The live API preflight did not allow this new review origin. A focused CORS fix,
commit `a97a54e7a6a3c8f64726389a6783c47f06ea2488` on the Firebase activation branch,
adds exact HTTPS origins through CORS_ADDITIONAL_ORIGINS without replacing the
existing base allowlist. Tests reject wildcard/credential/path origins and retain
both existing website and native origins. Full backend tests passed.

CORS_ADDITIONAL_ORIGINS is saved with the exact new review origin, but the active
backend d921b3cf does not yet consume that optional setting. The production-only
source commit update is staged as patch
`d88c589f-3f24-4088-985a-93a3d7fd639e`. Staged diff inspection confirms one
non-destructive commit-SHA change on service
`692c5a82-f351-416b-bc4b-ed4fcc435aa4` in production environment
`333219f9-d9c6-4cf0-9a15-dd4ca8b65271`; no repo/branch/root/build settings change.

Automatic approval review rejected an all-environment live source switch as too
broad. The safer production-only patch was prepared, but automatic approval also
rejected accept-deploy because explicit user confirmation for that production
release is required. Do not claim this fix deployed or use another route to apply
it without that confirmation. On approval, recheck the staged diff, apply only
this production patch, verify its deployment SHA and liveness/readiness, then check
preflight headers for the review origin and an unrelated origin. Test login and
Google/email callbacks separately; they have not been accepted on the new origin.
