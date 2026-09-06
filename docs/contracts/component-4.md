# Component 4 — Guarded publication

Implement `prepare` and `apply` only against the accepted
[workflow](../workflow-contract.md), [configuration](../project-configuration.md),
[Core boundary](../core-integration.md), [curator policies](../../policies/chronicle_authoring.md)
and [capture behavior](../evidence-capture.md). Extend the existing CLI as explicitly
authorized; preserve all other accepted files. A blocking contract incompatibility
requires stopping and reporting it. New publication code, documentation and tests
may be separate files; no general transaction or orchestration framework.

## Prepare and approval

Require explicit configuration, a bounded request with exact create/replace actions,
and retained work-summary/context/recommendation input. Workflow references are
contained regular files. Validate strict JSON workflow artifacts, including
duplicate keys and unknown fields, without inventing Core schema fields.

Snapshot the complete dataset inventory (including optional-document absence),
configuration bytes and resolution base, project identity and every proposed byte.
Stage a full dataset outside the live dataset, preserving authoring guidance and
artifact attributes. Reject deletion, historical replacement, unsafe paths,
symlinks and case aliases. Only `project.yaml`, `current.yaml`, `roadmap.yaml`
permit intentional replacement. Project metadata replacement preserves identity.

Run installed Core v0.2.1 `chronicle validate <staged-dataset>` and retain raw stdout,
stderr, exit status, execution identity, diagnostics and warnings. Protocol or
execution failure is distinct from invalid Chronicle data. No review-ready proposal
on either failure. Freeze a deterministic exact-byte proposal manifest binding all
actions, previous digests/absences, staged bytes, full baseline, context, summary,
recommendation, configuration and validation. Persist a review receipt. Preparation
does not mutate the live dataset or imply approval. Digests are integrity bindings,
not semantic equality identifiers; never manufacture timestamps for ordering.

An immutable Component 1 disposition, recorded separately by the responsible main
agent, must approve the exact proposal. Verify its complete shape, ID/bundle,
author decision, actor/accountability scope, input/evidence/context/recommendation
bindings and supersession references. Preserve the actual curator recommendation;
the main agent may disagree explicitly. Every milestone action requires the
accepted milestone/direction classification. No approval is inferred or generated
by prepare/apply. Warnings need explicit reviewed dispositions bound by the proposal;
do not add fields to the accepted disposition format.

## Apply and state

Before dataset writes, verify all artifacts, live baseline and destination safety
again under the same `operations/capture.lock` serialization used by Component 3.
This legacy name remains the shared Kit writer guard; a lock of unknown ownership,
stale age or incomplete metadata never authorizes a second writer. Use one agreed
workflow location per dataset on a locally controlled POSIX filesystem.

Historical branches, milestones, events, revisions and evidence remain exclusive
creates. Mutable replacements bind and retain exact old bytes. All actions and
timestamps were fixed before approval. Retain an operation-owned write journal
outside Chronicle before writes. After writes, compare the resulting full state,
run Core validation on the live dataset, retain raw results and warnings, and
create an immutable receipt with disposition/proposal/baseline bindings, operation
journal, paths/actions/resulting digests, timestamp and success/failure status.
No successful receipt before every intended write and validation is verified.

Distinguish prepared/unapproved, authorized/unattempted, successfully published,
and `RECONCILIATION_REQUIRED`. An unattempted approval may safely apply against its
unchanged baseline. A verified success replay reuses its receipt with zero dataset
writes. An attempt without a consistent successful receipt is reconciliation,
never blind retry. A missing receipt is not success. Persist failed/partial-write
evidence conservatively; do not automatically roll back or delete unrelated files.
Abrupt termination may leave only intent and observed files, so identify uncertain
writes honestly. No ACID/crash-atomic multi-file claim or automatic recovery.

Stable packet IDs and verified prior dispositions drive replay review. Formatting
changes alone are not new progress. Changed context/evidence requires explicit
reconsideration; aggregate promotion uses a new bounded packet citing contributors
without duplicating prior records. The helper enforces audit bindings and explicit
prior-decision handling; it cannot decide semantic significance or truth.

## Evidence and gauntlet

Test valid/invalid staging; historical overwrite/deletion; allowed mutable files;
stale Current/roadmap/full dataset; altered payloads/proposals/recommendations;
missing/wrong/malformed disposition; unsafe paths/symlinks/case aliases; shared lock
conflicts and ambiguous locks; successful/failed final validation; exact receipts;
success replay, never-attempted approval, missing/old receipts, interrupted/partial
writes and preservation of unrelated files; configuration boundaries, local without
Git and tracking constraints. Run accepted Component 2/3 tests unchanged. Use real
installed Core for positive integration; controlled subprocess fixtures may exercise
execution/protocol failures without being claimed as Core acceptance evidence.

Developer → executable evidence → independent read-only critic → at most two repair
submissions → ACCEPT or escalation. Integrate only accepted files. Stop at Component
4 acceptance; no Component 5, dogfooding, Core/HERA edits, new milestones, automatic
Git actions, distributed locks, daemons, retries, upgrades or remote publication.
