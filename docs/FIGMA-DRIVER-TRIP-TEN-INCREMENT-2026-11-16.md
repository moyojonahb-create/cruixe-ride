# Driver trip lifecycle — ten-screen increment, 16 November 2026

## Figma scope and integration

Source file: `YLDdDmUNi4qbEb3mFfwpkB`. This batch maps Requests (`1105:239`), Fare/offer (`1126:105`), Offer accepted (`1153:105`), En route pickup (`1153:165`), Arrived/waiting (`1153:225`), Onboard/start (`1182:198`), En route destination (`1182:281`), Destination reached (`1185:115`), Cash confirmation (`1185:198`) and Receipt/earnings (`1185:281`). It preserves the previous account, history, records and exception migrations.

DriverLifecycleLayout shares the exported ribbon/curve, local Poppins and existing navigation. DriverRequestViews, DriverActiveTripContent and DriverFinishBodies supply the content. Existing request/detail pages, FullScreenNavigation, DriverDestinationReached and TripCollectSheet retain their actual data, navigation and service callbacks. Requests preserve realtime filtering and privacy-limited rider profiles. Offers use the existing offer service; sending an offer does not claim acceptance. Parcel detail retains its existing specialized view. Runtime maps remain actual map components, not Figma map screenshots.

Navigate to pickup is local presentation state: the current backend normalizes `enroute` into arrival, so navigation must not post that status. Actual arrival uses the saved accepted state and existing transition service. Passenger-onboard confirmation is also local; only Start trip posts in_progress from arrived. Synchronous locks prevent double arrival/start/completion/collection taps; failed actions remain retryable. A late arrival-time read cannot regress a newer trip state. Existing no-show, safety, call, chat, unread messages, GPS, route and voice controls remain connected.

Cash confirmation is available only for an explicitly cash ride with a finite fare. The dashboard's uncollected-trip lookup now also filters cash. Not received does not settle anything. The receipt appears after successful persistence, and fees/net earnings are displayed only from finite ledger values. Missing earnings never become invented $0 earnings. No backend/schema/RLS, payment model or service contracts were changed.

## Verification and review boundaries

Node22 application TypeScript passes. The nine focused suites pass all57 tests: lifecycle status boundaries and retry, cash/non-cash guards, settlement service, receipt routing, trip presentation/recovery/exceptions, records and account state. Changed-file ESLint has no errors and five existing hook/any warnings in FullScreenNavigation and DriverDashboard. The production build passes; the staging gallery is excluded from production output.

Browser QA covers all ten components at360/375/390/400/430px, XR414×896 and16Pro402×874 (70 cases), checks loaded artwork/fonts, horizontal overflow and uncaught exceptions, and traverses the connected preview controls. Visual review corrected filter-label contrast. Content can scroll independently of the footer on smaller screens. The staging-only route `/staging/trip-10` is explicitly labelled sample data; it renders the actual presentation components with a sample grid map and local callbacks, never backend mutations. These checks are fixture/component evidence, not authenticated live-trip or financial acceptance.

All ten final acceptance statuses remain UNVERIFIED until dedicated authenticated staging sessions verify live realtime requests, navigation/location, trip mutations and persisted financial records. The341-frame inventory and accepted count are unchanged.

## Deployment

Deploy the tested pushed commit only to the existing SSO-protected `cruixe-staging` project as a preview using `npm run build:staging` and Node22. The exact commit, READY result and deployment URL are recorded in draft PR#7 and the deployment report. No main merge or production promotion is included.
