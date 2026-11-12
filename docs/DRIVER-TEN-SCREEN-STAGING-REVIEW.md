# Driver ten-screen staging review

This increment exposes seven **existing** registration screens and adds three read-only account detail screens. It is not ten newly matched Figma designs: Figma context/screenshot requests stalled, so exact visual migration remains unverified.

Staging-only entry: `/staging/driver-10`. Its selector opens profile photo, identity, licence, vehicle details, vehicle documents, vehicle photos, application review, personal details, contact details and vehicle profile. Preview registration fields are disabled; submission and upload paths cannot execute even for an authenticated user. Sample account values are explicitly labelled and never written.

Live entry: `/driver/profile` → Personal details / Contact details / Vehicle details. The new screens display canonical account values, distinguish absent values, and connect Back, application/documents and contact-support actions. They do not introduce a new edit/persistence contract. Existing authenticated registration stays at `/driver/register`; phone-sized inputs now use 16px text to avoid iOS input zoom.

Current registration API still does not persist date of birth, licence number or licence expiry. This batch does not resolve that pre-existing gap, provision accounts or establish live application/ride acceptance.

Validation: 53 focused Vitest tests pass (registration submission/recovery and preview safety, three account screens, signup, staging guards). Application TypeScript and changed-file lint pass. Chromium checks pass for all ten screens at 360px and XR 414×896: 20 screens, no horizontal overflow or uncaught browser errors. Physical Safari/iPhone and exact Figma comparison remain pending. Tests use fixture values, not real accounts.

Keep PRs draft. Deploy only the dedicated cruixe-staging project using its existing isolated environment configuration. No main, production, schema, credentials, cash-flow or wallet changes.
