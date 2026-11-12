# Figma flow connection increment — 12 November 2026

This increment continues the Rider and Driver migration from `f3591925e620b68aa4e76ef65e0fc4ebb069a30c`. It is not a claim that all approved screens are complete. The two-device staging ride remains deferred at the user's request. PR #5 stays draft.

## Source reconciliation

The frontend foundation is a descendant of cash milestone `4056fe5df06454f4d73181ee016b33a089346e71`, including the earlier cash receipt and strict staging build changes. A different frontend HEAD alone is therefore not a missing-code blocker. Deployed service identity, configuration and authenticated behavior still require independent verification.

## Connected behaviors

- A guarded route retains its pathname, query and fragment through sign-in. Sign-in/signup switches and OAuth callback destinations preserve that journey. External or looping authentication destinations fall back to the Rider home. A failed nickname lookup now exits the busy state and offers retry.
- Driver Welcome sign-in leads through account access back to the Driver entry, instead of closing a generic modal without a destination. This connection uses the existing account-access UI; it does not certify visual parity with the dedicated Figma Driver sign-in screen `1086:105`.
- Driver request recovery checks for assigned active trips and completed cash trips awaiting collection after missed Realtime events. Foreground/reconnect and a five-second visible-page fallback recover the dashboard; overlapping and stale requests are ignored.
- Driver profile document lookup uses the Driver row ID referenced by the document foreign key, rather than the Auth user UUID.
- Rider Safety's trusted-contact action opens saved-contact management using the existing authenticated profile fields. Full multi-contact and per-contact notification preferences in Figma are not supported by that contract and are not claimed complete.

## Remaining screen work

The existing acceptance ledger contains 341 frames, not 341 independent app routes. Preview galleries, ID-reference counts and mocked successful states are not completion evidence. See `FIGMA-FLOW-COMPLETION-QA.md` for the family-by-family source audit and `FIGMA-SCREEN-ACCEPTANCE-MATRIX.json` for individual entries.

Remaining work includes role-specific authentication variants; registration persistence for date of birth/licence details; multi-contact storage and notification preferences; support/lost-item/device-security journeys; shared-trip dispatch; parcel recipient/proof/code lifecycle; remaining state/error/retry mappings; and deferred wallet visual migration. Existing real account, ride, safety and payment behavior must be preserved when those views are implemented.

No staging test accounts, physical-device ride, staging sign-off, merge or production release are part of this increment. Local tests do not establish authenticated service acceptance.
