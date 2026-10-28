# P0.3 remote verification procedure

The dormant workflow `.github/workflows/p03-verification.yml` is `workflow_dispatch` only. It does not run on pushes, does not deploy, and has no production credential path.

1. Preserve the intended local snapshot and obtain approval to transfer it. The safe transfer is a reviewed branch or commit pushed by the operator; this preparation does not push or upload the current dirty tree. Do not use the production branch or include `.env` files.
2. Dispatch **P0.3 Remote Verification** from the reviewed snapshot with `run_integration=false` first. The workflow uses the module Go version (1.26.3 minimum), `GOMAXPROCS=2`, Go package parallelism 1, bounded timeouts, and uploads compiler/test logs.
3. Treat compile and unit tests as PASS only when their commands exit 0. A timeout, runner failure or missing output is BLOCKED.
4. Set `run_integration=true` only after a separately approved disposable PostgreSQL target is available. Supply only a short-lived DSN through the repository secret `CRUIZE_P03_TEST_DSN`; it must identify the isolated lab described in `nonproduction/p03/README.md`. Never use Supabase, Railway or any production hostname. Without the secret, the integration job records SKIPPED without connecting.
5. Download the artifact, review `p03-toolchain.log`, `p03-compile.log`, `p03-unit.json` and (when enabled) `p03-integration.json`. The existing integration package still skips command cases until the reviewed adapter fixture is connected; skipped cases are not a PASS.

Consent remains fail-closed: the adapter cannot activate until an approved durable consent policy source and terms-fingerprint contract are supplied. The live accept RPC, direct frontend mutations and existing handlers remain unchanged. P0.3 activation and production remain NO-GO until one-writer cutover, PostgreSQL concurrency, rollback, idempotency and authorization evidence is complete.