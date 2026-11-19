# CruiXe Ride cloud naming inventory

Audit date: 2026-11-19. This pass covers resources identified as belonging to
CruiXe Ride; unrelated projects in the accounts are outside scope.

| Platform | Current resource | Target | Verified result |
| --- | --- | --- | --- |
| GitHub | moyojonahb-create/cruixe-ride | cruixe-ride | Repository already uses the target name. Remaining README, service-worker notification title, runtime log and startup/error messages corrected on the mobile review branch. |
| Vercel | cruixe-ride; cruixe-staging | Existing CruiXe names | All six visible projects inspected. Neither CruiXe project uses PickMe/Koloi/Voyex. Domain lists were also checked: cruixe-ride.vercel.app and cruixe-staging.vercel.app only. Other apps belong to separate products. |
| Railway project | CruiXe (b5d8ef48-4935-45f4-bcaa-07207efc7a32) | CruiXe Ride | Rename attempted; projectUpdate returned Not Authorized. Not changed. |
| Railway production API | koloi-ride-with-confidence (692c5a82-f351-416b-bc4b-ed4fcc435aa4) | cruixe-ride-api | Rename attempted; serviceUpdate returned Not Authorized. Not changed. |
| Railway staging | cruixe-go-staging; cruixe-redis-staging | Existing CruiXe names | Already branded. Generic Redis service is infrastructure, not a legacy product name. |
| Firebase | Koloi, project koloi-87f15 | Display/public-facing name CruiXe Ride | User screenshots establish project identity. Console access from the task returns proxy CONNECT403; no signed-in browser session available to the agent. Not changed. |
| Supabase production | Cruize-ride (foksbnjtzubsjpeoorvo) | CruiXe Ride | Connected tool verified current name. No rename operation is exposed and Management API is proxy-blocked. Not changed. |
| Supabase staging | cruixe-staging (sgqqhrrdfyrebqreodfl) | Existing CruiXe name | Already branded. |

## Stable identifiers and URLs

Firebase project ID koloi-87f15 cannot be renamed; changing its display name does
not replace its project ID. A replacement project would require a separate
resource migration, new mobile configuration, credentials and delivery checks.
Supabase project refs and GitHub repository/service resource IDs are likewise
identities, not user-visible branding text.

The live API hostname still contains koloi. Installed APKs, web builds, WebSocket
settings and potentially external clients use it. A hostname migration requires
a compatible entrypoint, client rebuilds, CORS/Auth redirect verification and
cutover checks. No hostname or credential was changed by this naming pass.
Historical audit records and database/API field names are preserved so the
application's contracts, account identifiers and existing evidence remain valid.

## Required dashboard changes

- Railway project settings: project name to CruiXe Ride; API service settings:
  service name to cruixe-ride-api. Current project-scoped token cannot do this;
  account-level rename permission is required. An attempted local CLI install
  failed during its postinstall step before account sign-in could begin.
- Firebase Project settings → General: change project display name and
  public-facing name to CruiXe Ride. Do not delete/recreate the project.
- Supabase Project settings → General: project name to CruiXe Ride.

The user requested renaming before further Railway/Firebase configuration. No
Firebase credentials, delivery configuration, live deployment or data mutation
was performed in this pass. New source branding requires normal build/deployment
review; it does not claim that deployed web/mobile/server messages changed.

Verification: service-worker JavaScript syntax, frontend TypeScript and Go
server/worker/scheduler checks passed.

The earlier Firebase project-picker screenshot also lists Voyex (`voyex-8057b`).
Its registered apps and active integrations were not accessible to this task. It
is a legacy-brand candidate, not proof of another resource that can be renamed
without checking its use. The registered CruiXe Android config supplied by the
user belongs to Koloi (`koloi-87f15`), so that is the confirmed active Firebase
project for the current app.
