# Local byte-preserving verification commit - 2026-11-01

**Local commit: PASS. Remote publication: NOT RUN, intentionally held for user review.**

Commit: `bb887feaa86589c47f2d728d3d57a087ef89ffe8`  
Branch: `verify/cruixe-approved-ui-20261101-2a3ff775`  
Parent: `1e6df6b60ce90c0b8c7779c392ad8ab4cc5d01a8`  
New bare repository: `C:\Users\MUSAE\AppData\Local\Temp\cruixe-byte-exact-20261101-od_hee1c`  
Separate index: `C:\Users\MUSAE\AppData\Local\Temp\cruixe-byte-exact-20261101-od_hee1c\approved-verification.index`

| Gate | Result | Finding |
|---|---|---|
| Existing report and exact evidence inventory | PASS | Reviewed before recovery. |
| Git attributes / conversion diagnosis | PASS | System core.autocrlf=true. No applicable .gitattributes or info/attributes overrides; text/eol/filter/working-tree-encoding unspecified for approved paths. The original two text-file mismatches were CRLF-to-LF conversion. |
| Author identity | PASS | Existing repository-local user.name/email reused exactly as author and committer via process environment. No invented identity or global configuration changes. |
| Isolated staging | PASS | A fresh bare repository and separate index were populated from the reviewed base. hash-object --no-filters --stdin and explicit cacheinfo insertion preserve original bytes. Neither existing checkout/index was used for staging. |
| Staged blobs | PASS | All three SHA256 values match the unchanged approved plan. |
| Committed blobs | PASS | All three SHA256 values match the same approved plan after commit. |
| Commit scope and parent | PASS | Exactly three added files; one parent at reviewed base; no unrelated changes. |
| Original and previous clone preservation | PASS | Original index bytes, branch, HEAD, tracked status and 60 targeted file hashes unchanged. Prior temporary clone index, HEAD and worktree unchanged. |
| Target remote and branch | PASS | Configured PickMe-App remote; prior canonical identity cruixe-ride. Read-only ls-remote returned success with no approved branch remotely. |
| Full untracked-content hash audit | BLOCKED | An existing renamed dependency-cache file returned WinError 1392. Cache left untouched, excluded from payload, never used to execute code. No full untracked byte-audit pass is claimed. |
| Push / remote workflow / artifacts | NOT RUN | Stopped after local commit, as requested. Run URL: none. |
| Remote TypeScript / Vitest / ESLint / build | NOT RUN | No remote workflow run. Historical successful baseline remains historical. |
| Heavy local checks | NOT RUN | No compiler, test suite or production build attempted. |
| Authenticated E2E | BLOCKED | Dedicated approved staging and identities unavailable. |

| Committed file | Staged and committed hash result | Approved SHA256 |
|---|---|---|
| `.github/workflows/cruixe-approved-frontend-verify.yml` | PASS | `df87da029f44ed0cbb0a64b95e778d261bb2b45f8f3e44d19300c6090f4f3f2d` |
| `nonproduction/approved-ride-ui/qa-ci/review/approved-frontend-ci.tgz` | PASS | `2a3ff7756e8f1ab4cafa4aeceb44c73f05fc0268392aacf91af6a417878f4879` |
| `nonproduction/approved-ride-ui/qa-ci/review/review-manifest.json` | PASS | `a62194cc43b2756f8cac74f52e1d8c9b73df2cb3336b85ea1dcf75b1d315ee9c` |

The earlier helper attempt failed before commit creation because Python text output normalized the temporary Git alternates metadata to CRLF. A new helper wrote that internal reference as LF bytes and used another fresh bare repository. The failed helper and draft repository remain intact. This correction changed no approved payload bytes or checksum requirements.

The bare repository reads base objects through an alternate reference to the prior temporary clone at `C:\Users\MUSAE\AppData\Local\Temp\cruixe-approved-ui-2a3ff775\.git\objects`. Retain both directories; neither was reset, cleaned or removed. Only the reviewed local commit was created; no GitHub/API write, backend operation, production service access or booking flow occurred.

**Frontend integration: NO-GO pending actual remote gates. Production release: NO-GO independently pending approved staging and authenticated validation.**

Safe next step: review this commit and separately authorize publication. Immediately before any later push, repeat the three-file and committed-byte checks, remote/branch checks and no-unrelated-change review. The earlier publication script must not be rerun blindly: it targets the previous clone and refuses existing destinations. No push command was executed in this recovery.

Evidence: [precommit blob checks](commit-recovery-precommit.json), [commit result](commit-recovery-result.json), [preservation](commit-recovery-preservation-after.json), [final target checks](commit-recovery-final-checks.json), [exact local changed-file inventory](commit-recovery-inventory.json).
