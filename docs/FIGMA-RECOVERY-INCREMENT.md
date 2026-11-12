# Recovery screen increment

Migrates approved Figma `491:1042` (Set a new password) and `491:1082` (Password updated) into the existing `/reset-password` flow. Original SVG exports are local under `public/brand/recovery`; existing licensed local Poppins files are reused. No Figma file edits.

Password updates still call Supabase Auth. Success requires a successful response. Failed requests remain retryable. Continue to login signs out only the current local session before navigating to sign-in. Existing expired-link UI and recovery session detection are unchanged.

The requirements remain stricter than the prototype wording: both a number AND a special character are required by the existing app policy. Requirement indicators reflect actual entered text rather than the prototype's example checkmarks. Responsive layout avoids the reference's negative right offsets; touch inputs use16px text to avoid iOS zoom.

Validation: four action tests pass; application TypeScript and changed-file lint pass; both real presentation components checked at360/400/414px with original asset dimensions and no horizontal overflow. Local fixture screenshots were compared with the Figma renders. This is not an authenticated staging password-reset or physical iPhone acceptance result.

`/staging/recovery` is available only in staging builds. It uses the same components, explicitly labels preview data, and never changes a password. The live workflow remains `/auth` → recovery email → `/reset-password`.
