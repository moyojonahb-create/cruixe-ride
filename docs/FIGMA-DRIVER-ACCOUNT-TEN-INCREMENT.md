# Ten new Driver account screens

Approved Figma file: YLDdDmUNi4qbEb3mFfwpkB. This is a new ten-screen increment after the earlier staging selector; the preceding seven registration screens and three read-only account details are not counted again.

| Screen | Figma node | Live entry |
| --- | --- | --- |
| Edit personal details | 1365:140 | /driver/account/personal-edit |
| Profile update review | 1367:140 | Successful personal-details save |
| Emergency contact | 1356:140 | /driver/account/emergency |
| Edit emergency contact | 1365:314 | Edit Contact |
| Emergency contact review | 1367:368 | Successful contact save |
| Account security | 1356:186 | /driver/account/security |
| Change password | 1365:347 | Change Password |
| Password change review | 1367:414 | Successful password change |
| Help Centre | 1365:413 | /driver/account/help |
| Contact Support | 1365:449 | Contact Support |

Driver Profile exposes these routes. Data loading failures show Retry instead of empty editable records. Direct review URLs do not manufacture success. Personal name saves use the existing Go profile endpoint; emergency contacts use the existing authenticated contact helper and normalize Zimbabwe phone numbers. Password changes verify the current authenticated identity/current password before updating; success clears password fields, failures preserve retry input and concurrent submissions are blocked. Help topics connect to existing application, wallet and contact pages.

`/staging/account-10` provides visual review of all ten using the same components, clearly marked sample values, and no account/password/support writes. This route is compiled only in staging mode.

## Evidence and limitations

Figma design contexts and inline screenshots succeeded for all ten frames. Fresh asset-link downloads failed HTTP403, including an explicit network-access attempt. Read-only authenticated exports recovered26 original SVG assets, vendored with unmodified root dimensions. No Figma canvas changes were made.

48 focused Vitest regressions passed across account forms, security/support, emergency contact, registration, and staging guards. TypeScript passed; changed-file ESLint had zero errors. Chromium checked all ten screens at360/400/414px:30 passing render checks, no horizontal overflow or uncaught browser errors, and every displayed SVG had its original dimensions. Reference screenshots and rendered400px screens were visually reviewed.

Documented prototype differences: real OS chrome replaces mock status icons;16px editable input text avoids Safari zoom; unavailable date of birth, home address and relationship fields are disabled rather than silently discarded. Display name currently uses full legal name. Two-step setup is unavailable. Support opens an email draft through the existing support address; it does not create or claim a support ticket. Save/review text reflects actual server confirmation rather than the prototype's sample success states. Password requirements retain the app's existing stronger policy.

These are fixture and regression checks, not authenticated staging account/password acceptance or physical iPhone testing. Dedicated test accounts and the complete two-device cash-ride evidence remain separate. No backend/schema, production, main, wallet implementation or credential changes. Keep PRs draft.
