# Component 5 — Authoring examples

Produce focused, reusable authoring examples and tests against the accepted
[Core integration](../core-integration.md), [workflow/disposition contract](../workflow-contract.md),
[curator policies](../../policies/chronicle_authoring.md), [evidence capture](../evidence-capture.md)
and [guarded publication](../guarded-publication.md). These are authoritative.
Preserve accepted files and behavior; report a blocking incompatibility rather
than changing contracts. Any actual helper defect requires an explicit report,
small scoped correction and critic review, never a silent workaround.

## Deliverables

An easy-to-find authoring index, focused worked recipes, minimal scenario inputs /
record fixtures, and executable example verification. All project claims are
clearly synthetic teaching scenarios, not real Kit history or consumer acceptance.
Use a small test-only fixture driver to exercise accepted behavior; do not create
a production runner, orchestrator, installer or new disposition operation merely
to remove repetition. Do not copy Core schemas or helper implementations.

Cover no update; subordinate event with real linked evidence (unlinked before the
first accepted milestone); Current-only operational change; significant accepted
milestone; meaningful branch/direction change; rejected/abandoned path followed by
an accepted approach; roadmap-only plan change; clerical historical revision;
late evidence attachment; code-change milestone with actual captured Git diff;
successful replay and pending reconciliation; and later accumulated promotion
from several already-dispositioned subordinate results.

For each case make the packet, evidence/support limits, prior context, one primary
curator classification, responsible-main-agent decision, intended files, validation,
publication and resulting state easy to locate. Show the main agent's intent before
preparation but create the exact author disposition only **after** preparation and
Core validation, as required by the accepted workflow. Non-author decisions have
no proposal or publication; verify their unchanged dataset separately with Core.
Use actual persisted digest bindings and generated decision IDs/timestamps in
executable fixtures. Recommendations never approve themselves.

## Truthful semantics

Chronology must cite explicit sources. Distinguish hypothetical fixture history
from actual machine-observed experiment/capture/publication times. Never describe
invented fixture events as real project acceptance, infer a historical instant
from a capture time, or add seconds mechanically to satisfy Core ancestry. Where
an executable toy acceptance establishes the example claim, retain its observed
result and actual acceptance instant. Tests may wait for a genuinely later clock
sample before performing a later acceptance; they must not fabricate its timestamp.
Date-only historical sources demonstrate deferral.

Current preserves its accepted milestone pointer for operational changes.
Rejected/abandoned milestones never become Current anchors. New branches require
meaningful divergence and a first milestone with the justified earlier cross-branch
parent. Later semantic relations express changed understanding. Revisions correct
recording errors or attach evidence; they do not rewrite an old conclusion simply
because the project now believes something different. Evidence records themselves
are not revision targets. Code commentary requires a real artifact-backed diff,
captured by Component 3 from explicitly selected immutable Git revisions.

Roadmap-only changes can be operational without History merit. When a planning
reason is historically significant, explain the separate justified event or later
milestone and the exact companion changes rather than inventing history for every
status edit. Accumulated promotion must establish one new aggregate claim, list
prior packet/disposition contributions and preserve their existing events.

## Negative cases and tests

Explicitly refuse milestone promotion based solely on a commit, line count,
developer completion, critic ACCEPT, passing tests, a benchmark, Git branch,
documentation change, elapsed time or valid evidence hash. Include plausible but
irrelevant evidence, unsupported historical precision, and misuse of revisions for
changed conclusions. These are policy refusals, not claims that Core can judge
significance or truth. Test no promotion/no unintended writes, not keyword heuristics.

Add a small set of intentionally Core-invalid records/datasets with exact expected
diagnostic codes: ensure failures occur for the intended semantic reason. Every
positive final dataset must validate using installed Core v0.2.1. Positive
publication examples use real prepare/apply and retain approval/receipt evidence.
Check stable Current identity, branch origin/chronology, immutable revised source,
diff bytes/SHA-256/provenance, zero-write replay and valid accumulated promotion.
Inspect all distributable examples for consumer-specific paths, commands or roles;
human, CI and investigator summaries must not require a gauntlet. Prior tests and
contracts remain intact. Report counts by positive publication/no-write,
policy-negative and Core-invalid categories without double-counting.

## Gauntlet and stop

Component contract → developer → executable examples/evidence → independent
read-only critic → at most two repair submissions → ACCEPT or escalation.
Critic focuses on truthful chronology, restrained significance, usable recipes,
Current/history separation, branches/revisions, evidence relevance, replay and
consumer independence. Integrate only accepted files. Stop after Component 5;
no Component 6/adoption, dogfooding, HERA, Core edits, automatic installation,
background orchestration or engineering-component milestone promotion.
