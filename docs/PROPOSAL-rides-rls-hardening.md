# PROPOSAL — `rides` RLS hardening and money-column lockdown

**Status: PROPOSAL. Nothing here has been applied.** It touches money and RLS,
and a subtly wrong RLS policy locks real users out of their own rides, which is
worse than the hole it closes.

**Requires: Jonah's decision. Do not apply without it.**

---

## The hole

`rides` carries this policy:

```sql
"Users can update their own rides"  UPDATE
  qual:       (select auth.uid()) = user_id
  with_check: (select auth.uid()) = user_id
```

It constrains **which row** a rider may update and nothing else. RLS is
row-level; without column-level grants, **every column on that row is writable
by the client** — including `fare`, `cancellation_fee` and `status`.

An authenticated rider can issue:

```sql
UPDATE rides SET fare = 0.01, cancellation_fee = 0, status = 'completed'
WHERE id = '<their own ride>';
```

Postgres will allow it. The anon key ships in the client bundle by design, so
this needs nothing but a signed-in account.

### The asymmetry is the tell

The driver policy on the same table does it properly:

```sql
"Drivers can update rides assigned to them"  UPDATE
  qual: driver_id IS NOT NULL AND is_ride_driver(...)
        AND status = ANY (ARRAY['accepted','in_progress','arrived','completed'])
```

Someone understood this risk and wrote the status-transition guard — for
drivers, and not for riders. **That is an oversight, not a design decision**,
and the driver policy is a worked example of the right shape sitting in the same
table.

### Exposure today

One driver, 87 rides, 5 completed, all internal. Nobody has exploited it. It
becomes real the moment a stranger has an account.

---

## What currently writes `rides` from the client

**This list is the constraint on the fix.** Measured, not assumed:

| Path | Writes | Consequence for this proposal |
|---|---|---|
| `src/lib/requestRide.ts:153` | `.insert([row])` | INSERT, not UPDATE. Unaffected |
| `src/lib/rideMatching.ts:89` `cancelRideRequest` | `status: 'cancelled'` | **No Go call at all.** This is why 37 rides are cancelled and `cancellation_fees` has 0 rows |
| `src/lib/rideMatching.ts:112` `updateRideFare` | **`fare`** | Go-first, **falls back to a direct Supabase write** when `isGoBackendConfigured()` is false |
| `src/components/driver/TripCollectSheet.tsx:90` | `driver_collected_at` | Driver-side, covered by the driver policy |

**`updateRideFare` is what a `REVOKE` on `fare` breaks.** Its Supabase fallback
guards with a client-side `.eq('status','pending')` that RLS does not enforce —
so today the guard is advisory, and after a revoke the fallback fails outright.

---

## Proposal

### 1. Constrain rider status transitions

Mirror the driver policy's shape. A rider should be able to move a ride to
`cancelled` and nothing else — every other transition belongs to the driver or
the backend.

```sql
DROP POLICY "Users can update their own rides" ON public.rides;

CREATE POLICY "Users can update their own rides" ON public.rides
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK (
    (select auth.uid()) = user_id
    AND status = ANY (ARRAY['pending', 'cancelled'])
  );
```

`USING` decides which rows are visible to the update; `WITH CHECK` decides what
the row may look like afterwards. Both are needed: `USING` alone would let a
rider write any status.

### 2. Money columns become backend-only — `REVOKE`, not a trigger

```sql
REVOKE UPDATE (fare, cancellation_fee) ON public.rides FROM authenticated;
```

**Why `REVOKE` over a trigger.** A revoke fails loudly at the boundary with a
permission error that surfaces in Sentry as itself. A trigger either silently
discards the change or raises mid-transaction, and both read as application
logic bugs — you would spend a day looking in the wrong layer. The failure mode
should name its own cause.

The cost is that `REVOKE` is blunt: it cannot express "unless the ride is
pending". That nuance belongs in the backend, which is where it is going anyway.

### 3. Ordering — this is the part that matters

**The backend must own the write before the client loses permission to make it.**
Same shape as the S7 config-before-manifest rule, and the same failure if
reversed.

| Step | Action | Why this order |
|---|---|---|
| 1 | Fix and **deploy** the Go cancellation path | Cancellation must work server-side before RLS stops the client doing it |
| 2 | Point `cancelRideRequest` at `POST /api/rides/:id/cancel` | It currently bypasses Go entirely |
| 3 | Confirm `isGoBackendConfigured()` is true in production | `updateRideFare`'s fallback dies at step 4 |
| 4 | Apply the `WITH CHECK` policy | |
| 5 | Apply the `REVOKE` | |

**Reversed, riders cannot cancel rides.** Apply the revoke while
`cancelRideRequest` still writes through Supabase and every cancellation fails
with a permission error — a working user-facing feature broken to close a hole
nobody has exploited.

### 4. What this does NOT fix

The Go cancellation path never charged a fee — 37 cancelled rides, all with
`cancellation_fee = 0`, and 0 rows in `cancellation_fees`. **This proposal
closes the write hole; it does not decide whether cancellation fees should be
charged at all.** That is a pricing decision and it is Jonah's.

---

## Verification before applying

Run against a branch database, not production:

```sql
-- as an authenticated rider, on their own ride: must FAIL
UPDATE rides SET fare = 0.01 WHERE id = '<own ride>';
UPDATE rides SET status = 'completed' WHERE id = '<own ride>';

-- must still SUCCEED
UPDATE rides SET status = 'cancelled' WHERE id = '<own pending ride>';
```

The second block matters more than the first. It is easy to close the hole and
ship a policy that also blocks the legitimate path, and the symptom — riders
unable to cancel — is worse than the vulnerability.
