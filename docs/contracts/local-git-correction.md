# Correction — Git-independent local tracking mode

This is the user-authorized corrective task for the confirmed Component 6 blocker.
Component 6 remains paused. Correct the existing shared tracking check used by
artifact capture and publication configuration/prepare/apply; no command-specific
bypasses, general VCS abstraction, installer, or additional product operation.

## Required semantics

- `local`: never invoke Git for tracking validation. No Git executable/worktree or
  ignore policy is required. Local operation does not assert that Git excludes the
  selected data; exposure management is the consumer's explicit responsibility.
  All existing filesystem, configuration, path, disjointness, overwrite, locking,
  evidence, approval, staleness and Core validation checks still apply.
- `tracked`: explicitly require available Git and an appropriate worktree. Preserve
  existing effective-ignore checks and fail before dataset/workflow writes when
  requirements fail. Never degrade to local. Diagnose unavailable Git clearly.
- Explicit Git commit-range capture still requires Git, regardless of tracking.
  Artifact capture and local/local prepare/apply require only installed Core and
  Node with the existing POSIX filesystem constraints.

No advisory is required. Do not add Git-backed optional probes to local mode.
Reject unsupported policy values at the existing configuration boundary. Keep
accepted public fields/format versions and Core integration unchanged.

## Changes and verification

Production change stays in the shared tracking abstraction unless a concrete
necessary dependency is reported. Correct only directly contradictory documentation
about local exclusions, tracked content and helper-wide Git prerequisites. Update
old assertions that required local exclusions/tracked-content rejection to the
explicit newly authorized semantics; retain their useful no-index/ignore-mutation
checks and all tracked-mode protections. Report every accepted file changed.

New executable tests must remove Git from PATH, verify it is unavailable, and
exercise real artifact capture, prepare, bound main-agent approval, apply and Core
validation. Both tracked dimensions and explicit commit-range capture must reject
missing Git before mutation. Also instrument process spawning to prove local
tracking never attempts Git, instead of swallowing an execution failure. Include
local paths inside a worktree without exclusions; no tracking probe or ignore/index
mutation is permitted. Preserve existing tracked-mode checks with Git installed.
Test shared checking across artifact capture, prepare and apply, including config
failures and later loss of Git for a previously prepared tracked proposal.

Run all Component 2–5 regressions plus the focused correction suite against installed
Core v0.2.1. Record exact counts, diagnostics and changes. No Core source imports or
Core edits. Use isolated synthetic fixtures; no actual consumer integration.

## Gauntlet and stop

Corrective contract → developer → executable regression evidence → independent
read-only critic → at most two repair submissions → ACCEPT or escalation. Critic
checks true zero-Git local operation, retained tracked safeguards, early mutation
failure, shared rather than per-command correction, and scope restraint.
Integrate only the accepted correction. Stop afterward; do not resume Component 6,
redesign its blocked work, or begin dogfooding, HERA, ARIS or Component 7.
