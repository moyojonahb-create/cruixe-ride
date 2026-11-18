# CruiXe Driver migration TODO

Use the [screen acceptance ledger](FIGMA-SCREEN-ACCEPTANCE-MATRIX.json) for Figma node IDs and live integration status. The ten Support, Account Review and Cash Issue frames at `/staging/driver-support-10` use sample data. The staging controls only switch previews.

| Workstream | Deferred work | Acceptance evidence |
|---|---|---|
| Support tickets | Add owned ticket creation, inbox, status, message history, replies, resolution and reopening. Keep the existing email contact path available. | Ticket and message IDs come from the server. Test two accounts for isolation, retries, authorized status transitions and recorded staff responses. |
| Account appeals | Establish eligible decisions, private evidence upload, reviewer access and auditable outcomes. | Confirm submission only after server acknowledgement. Test access to evidence and verify that an appeal cannot change account eligibility by itself. |
| Cash issues and wallet disputes | Persist unpaid cash issues and add owned dispute records, status and receipt rules. | An unpaid or unconfirmed fare never issues a paid receipt. Test retries and confirm no duplicate settlement or credit. |
| Driver wallet and eligibility | Deploy the updated Go eligibility response to isolated staging. Verify low-balance handling and wallet PIN flows against staging. | Other denials use the generic path. No actual balance appears in the alert. Confirm the top-up states against deposit records. |
| Account identity and recovery | Verify contact changes and generated-email login compatibility, OTP flows, MFA enforcement and recovery. Check the password-reset redirect. | Dedicated staging accounts can keep access after verified changes. Expired codes and failed verification leave identity unchanged. |
| Parcel lifecycle | Establish assigned-courier state transitions, pickup verification, private recipient handover and delivery receipts. | Verify authorized access, replay handling, correct payment state and two-device lifecycle. |
| Parcel and student communications | Verify role-specific access to sender, recipient and student messaging and calls. Establish the student booking signal and offer states. | Test caller identity, channel membership and contact privacy before connecting variants. |
| Figma and staging acceptance | Compare rendered screens across target phone sizes. Review accessibility, authenticated routes and data, then two-device flows. | Update each ledger row with evidence. Production sign-off remains deferred. |
| Existing Rider wallet coverage | Investigate the eight Rider wallet tests reproduced at the starting checkpoint. | Run and compare that suite independently of Driver migration. |
