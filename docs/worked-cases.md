# Component 1 worked cases

These are design walkthroughs, not runnable fixtures, captured evidence, or actual
project history. IDs below are illustrative stable IDs; no invented hashes or
historical instants are supplied. A later implementation must generate actual
artifact hashes/timestamps and validate concrete proposals using Core. Every case
uses the explicit [configuration contract](project-configuration.md) and immutable
[workflow artifacts](workflow-contract.md).

## 1. Subordinate acceptance

**Packet:** `packet-parser-review-02` reports that a critic accepted a bounded
parser refactor after tests. Its summary identifies the critic's authority over
that component only, the exact acceptance report, actual test output, and scoped
Git patch. Acceptance time is taken from the recorded review; capture and
recording times come from the machine clock. The project has no accepted milestone
yet, so Current is absent.

**Assessment:** `ENGINEERING_EVENT`. The refactor preserves behavior and does not
establish a significant capability or project conclusion. The curator explains
why passing this narrow review does not answer the returning-owner question.

**Disposition and proposal:** the main agent approves `author` for a prepared
proposal creating `EVT-000001` with `kind: review`, `outcome: accept`, the actual
critic actor, and evidence references. The event omits `milestone_id`. Create-only
evidence files/artifacts are included in the same proposal. Current and branches
remain absent; the existing project/roadmap are retained. Validate the complete
staged dataset, bind all bytes, approve, publish, validate, and record a receipt.

**Expected:** one subordinate event, zero milestones. A later meaningful accepted
capability may cite this packet and evidence and add a `late_attachment` revision
targeting `EVT-000001` with guarded `add` of `/milestone_id` if still absent.
Repeated engineering acceptance does not become one milestone per iteration.

**Forbidden:** synthesizing a baseline milestone to make Current available,
claiming broader capability acceptance, or linking to a nonexistent milestone.
If the acceptance report is missing or contradicts the claim, defer rather than
fabricate evidence. A valid hash of unsupported text is not proof of acceptance.

## 2. Current-only change

**Packet:** `packet-next-action-07` establishes that an external blocker cleared
and the immediate next step changed. Current already points to accepted milestone
`CAP-001` on `BR-MAIN`; no accepted historical capability changed. The packet
includes the actual blocker-resolution source, the previous Current snapshot,
relevant roadmap, and prior dispositions.

**Assessment:** `CURRENT_STATE_UPDATE`. The curator recommends updated
`active_work`, `next_step`, and blocker summary, with no milestone candidate and
no roadmap change in this particular case.

**Disposition and proposal:** preserve `milestone_id: CAP-001`; prepare a guarded
replacement of `current.yaml` with a machine-generated `updated_at`, operational
fields, and the unchanged valid history projection. The packet's supporting
source is retained in workflow storage; no new Core evidence record is needed
for this Current-only proposal. Core validates the complete staged dataset. The
main agent records `author`, approving precisely that one replacement, then
publication verifies the old digest, validates, and records the receipt.

**Expected:** changed Current, no new event or milestone. Replaying the packet
returns the prior disposition and receipt rather than refreshing the timestamp
again. A materially changed roadmap would be an explicit companion action in a
new proposal, preserving its follows-chain.

**Forbidden:** moving the current pointer merely because the operational summary
changed, sneaking a companion action into apply, or creating Current when no
accepted milestone exists. Without an accepted milestone, record the warranted
plan change in roadmap or defer the Current action; do not invent a pointer.

## 3. Validated direction change

**Packet:** `packet-transport-choice-11` establishes a significant measured
limitation of a previously accepted transport approach and acceptance of a new
architectural direction. It references exact experiment output, method and scope,
the decision authority's report, and the actual scoped code diff if code claims
are included. Prior milestone `NET-001` on `BR-MAIN` predates the actual new
acceptance instant; relevant earlier dispositions include several subordinate
experiments. The packet identifies the new conclusion beyond those experiments.

**Assessment:** `BRANCH_OR_DIRECTION_CHANGE`. The curator makes the downstream
architectural consequence explicit and recommends `NET-002`, a new meaningful
lane `BR-TRANSPORT`, parent `NET-001`, and `supersedes` targeting `NET-001` with a
concrete explanation. A `disproves` relation is warranted only if the evidence
actually disproves the older claim, not merely because another design is preferred.

**Disposition and proposal:** the responsible main agent confirms acceptance
scope and authorizes `author`. The validated proposal creates branch and first
milestone together, plus actual evidence and any required events/revisions; it
does not alter the older accepted milestone. `NET-002` uses the sourced instant
when the new claim became true and a separate machine recording time. Its first
cross-branch parent establishes the branch origin. Because this case accepts the
new direction as the project state, Current points to accepted `NET-002`. The
proposal also updates roadmap's selected future items to the new branch with an
exact follows-chain from `NET-002`, preserving real status and date constraints.
All companion actions are in the approved manifest before publication.

**Expected:** one meaningful later milestone and one lane for real divergence,
not one node per supporting experiment. A direction change without meaningful
divergence can remain on the existing branch. Existing subordinate events are
reused; an accumulated claim can cite them and propose valid late attachments
without re-creating them.

**Forbidden:** treating a Git branch as a Chronicle branch, creating an empty
lane, overwriting `NET-001`, converting a merely selected approach into a fully
accepted implementation, or declaring a broader acceptance gate passed without
that authority's evidence. If the only historical source has date precision,
retain the uncertainty and defer the historical record rather than invent seconds
or perturb ancestry timestamps to make validation pass.

## 4. Duplicate replay

**Packet sequence:** `packet-parser-review-02` from case 1 is supplied again, then
many packets report additional successful runs of the same established result.
The first replay's stable packet ID resolves to its author disposition and
successful publication receipt. The reviewed claim, evidence scope, and relevant
project context are unchanged.

**Assessment/action:** verify the stored bundle/receipt and reuse them. Do not
allocate another event or change any dataset file. A summary reformatted from one
Markdown layout to another changes its byte digest but does not establish new
progress; inspect the same packet identity and prior decision, retain the new
submission as an input artifact if needed, and do not publish duplicates. The
changed bytes cannot be substituted into the immutable earlier bundle.

For newly identified packets that only repeat an established conclusion, the
curator recommends `NO_CHRONICLE_UPDATE`, and the main agent records `no_update`
with auditable evidence/context and no proposal. Replaying the identical no-update
assessment reuses that disposition. The same rule applies to unchanged `defer`
and `reject` decisions; changing a decision requires an explicit new assessment.

If `packet-parser-review-02` later includes a materially different test outcome,
identify the changed evidence, preserve the old version, and reassess the claim.
Explicit reconsideration appends a new disposition with `supersedes` referencing
the earlier decision; it never edits that decision or silently recasts its receipt.
A rejected recommendation can therefore be reconsidered when warranted without
pretending the earlier rejection never happened.

A new `packet-capability-acceptance-20` may later aggregate those subordinate
packets into one newly accepted meaningful capability, with acceptance scope and
consequence actually established. It lists their stable IDs/prior dispositions;
curator `MILESTONE_CANDIDATE` plus exact main-agent author approval can produce one
milestone. Earlier applied inputs do not prohibit this new aggregate claim; they
prevent duplicate supporting records.

**Expected sequence:** many iterations yield zero automatic milestones; a real
accepted capability yields one candidate, and replay after publication yields
zero additional nodes. Digests enforce integrity, while packet identities,
prior dispositions, evidence, and claim scope govern replay decisions.

**Forbidden:** treating hash inequality as new significance, treating byte-equal
but differently scoped packets as automatically interchangeable, or preventing
legitimate accumulated promotion because contributing packets were recorded before.

## 5. Pending publication

**Packet:** `packet-capability-acceptance-20` has a frozen validated proposal and
an immutable author disposition. Publication was interrupted after some guarded
writes. There is no successful receipt. Stable packet lookup finds this approval,
so the result is pending, not another milestone candidate to publish under new IDs.

**Reconciliation:** read the configuration/baseline bindings, retained payloads,
disposition, operation journal, actual dataset bytes, and previous validation
output. Confirm which writes belong to this operation and which actions remain.
If no writes occurred and all preconditions are unchanged, resume the same frozen
proposal/approval. If verified operation-owned partial writes occurred, finish only
the remaining approved actions when safe, then validate the complete dataset and
verify resulting digests before creating a receipt. Do not replace frozen recording
timestamps with new ones just because apply resumed later.

If all target files are present but a crash occurred before receipt creation,
file presence alone proves neither ownership nor complete publication. Establish
the journal and manifest bindings, verify all intended actions, rerun full Core
validation, and issue an explicit reconciled success receipt only if completion
is demonstrated. Its recording time is the actual reconciliation time.

If another writer changed Current, the proposal is stale. Stop; do not overwrite
the newer state. A changed proposal needs new validation and a new exact author
disposition linked through `supersedes` when reconsidering the earlier approval.
Missing or inconsistent journals, snapshots, evidence, or disposition bytes stop
automated publication pending manual reconciliation. Any rollback is limited to
verified writes owned by this operation, with recovery evidence preserved.

**Expected:** one pending approval is reconciled/resumed, eventually with one
verified success receipt if safe. A post-publication validation failure retains
failure evidence and remains incomplete. A receipt missing its bound result
artifacts is inconsistent and cannot be counted as proof of completion.

**Forbidden:** inferring success from a missing receipt, blindly repeating writes
with new IDs, deleting unrelated data, marking partial publication successful, or
rewriting the old disposition to claim that an unapproved proposal was applied.
