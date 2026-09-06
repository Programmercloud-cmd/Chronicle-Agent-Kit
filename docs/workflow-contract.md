# Curator, disposition, and publication contract

This is an Agent Kit workflow contract outside Core. The responsible main agent
(or a human acting in that role) alone decides what to author and promotes every
milestone explicitly. A curator recommendation and engineering acceptance are
inputs, not publication authority. Human confirmation is needed only for disputed
facts, unresolved significance, or consumer-specific authority requirements.

## Bounded curator packet and result

A packet identifies stable work-packet IDs, summaries, accepted or otherwise
established results, newly supplied information, acceptance authority and scope,
claims mapped to actual evidence, limitations, and timestamp provenance. Include
the previous human-facing milestone, Current if present, relevant roadmap,
branch/history context, relevant events, and recent dispositions. Distinguish an
accepted narrow implementation from acceptance of a broader capability or gate.
Never infer missing acceptance from partial progress.

The read-only curator returns exactly one classification, with rationale,
evidence references, unresolved questions, companion Current/roadmap effects,
and candidate branch, parent, and semantic relationships when applicable.

| Kit classification | Core authoring-guide label | Meaning |
| --- | --- | --- |
| `NO_CHRONICLE_UPDATE` | `NO_UPDATE` | Nothing useful warrants a dataset change. |
| `ENGINEERING_EVENT` | `ENGINEERING_EVENT` | Supporting activity/conclusion; no main History node. |
| `CURRENT_STATE_UPDATE` | `CURRENT_STATE_UPDATE` | Operational status changed without a historical milestone. |
| `MILESTONE_CANDIDATE` | `MILESTONE` | Explicit significant consequence warrants main-agent assessment. |
| `BRANCH_OR_DIRECTION_CHANGE` | `BRANCH_CHANGE` | Significant divergence or direction change; a new lane only where meaningful. |

The correspondence comes from the pinned [Core authoring guide](https://github.com/Programmercloud-cmd/AI_Chronicle_UI/blob/7ed80d3b64b7affef12b8509a5adb814d7ce14b1/templates/chronicle/AGENTS.md).
Kit candidate labels deliberately leave approval with the main agent. One primary
classification may recommend companion effects; it is not permission to omit
those effects from the proposal being approved.

The curator does not implement code, perform ordinary code review, write records,
or promote milestones. Native Codex delegation supplies the Markdown role and a
bounded packet. If subagents are unavailable, the main agent performs and records
the same assessment. The later role/template component will package this contract;
Component 1 does not install agents.

## Persisted artifacts and digest meaning

A decision bundle resides under configured workflow storage, outside the dataset.
Use a tool-generated unique ID such as `DSP-<UUID>` as the bundle name. This
component specifies the layout/relationships, not a generator:

```text
dispositions/DSP-<UUID>/
  work-summary.md
  context.json
  recommendation.md
  inputs/                 # exact referenced packet/evidence snapshots as needed
  context/                # exact assessed mutable/historical record snapshots
  proposal.json           # only for an author decision
  proposal/               # staged Core files and validation output, if authoring
  disposition.json
receipts/PUB-<UUID>.json
operations/OP-<UUID>/      # locks, staging, guarded-write journal, recovery evidence
```

Every digest means lowercase hexadecimal SHA-256 of **exact persisted bytes**,
without newline conversion, JSON reserialization, or semantic canonicalization.
Proposal/workflow digests bind artifacts for integrity and staleness checks;
**they are not semantic-equality identifiers**. Reformatting identical content
changes its digest. Stable packet IDs and review of prior dispositions drive
duplicate suppression; a changed digest by itself is not a new accomplishment.

The complete summary and reviewed recommendation are stored beside the disposition.
The immutable `context.json` manifest identifies assessed project identity,
Current (including explicit absence), previous milestone, relevant roadmap/history,
acceptance scope, prior dispositions/receipts, and referenced snapshots by locator
and SHA-256. Retain exact copies of mutable context so later replacement cannot
destroy the audit. The summary binds its underlying packet files and referenced
evidence, including limitations about external sources. `context_digest` hashes
the manifest bytes; its listed hashes bind the context bytes transitively.

Locators in workflow artifacts are workflow-relative POSIX paths or existing
Chronicle IDs, never arbitrary filesystem escapes. Workflow-relative references
must resolve within storage to retained regular files. A Chronicle ID resolves
within the configured dataset and must carry the exact record digest; artifact
sources additionally bind the exact artifact digest. For later mutable context
use the retained workflow snapshot. External URL/repository evidence binds the
Core record/locator, not unavailable remote bytes; disclose that limitation and
capture an actual artifact where the claim needs byte-verifiable source material.

## Immutable main-agent disposition

`disposition.json` is exclusively created and never edited. Format 1 has the
following fields, with no implied Core extension:

| Field | Type / presence | Meaning |
| --- | --- | --- |
| `format_version` | integer `1`, required | Kit workflow version. |
| `id` | non-empty tool-generated unique string, required | Bundle identity; must match the containing bundle. |
| `recorded_at` | machine-generated RFC 3339 instant, required | Actual decision-recording time. |
| `actor` | non-empty string, required | Responsible main-agent or human identifier, linked to the packet's authority scope. |
| `inputs` | non-empty array, required | Stable packet identities and exact-byte audit bindings, described below. |
| `context_digest` | SHA-256, required | Hash of adjacent `context.json`. |
| `recommendation_digest` | SHA-256, required | Hash of adjacent `recommendation.md`. |
| `classification` | one of the five Kit labels, required | Classification assessed for this decision. |
| `decision` | `no_update`, `author`, `defer`, or `reject`, required | Responsible decision, distinct from recommendation and publication outcome. |
| `reason` | non-empty string, required | Concise justification, including disagreement with curator if any. |
| `proposal_digest` | SHA-256, required exactly for `author`; absent otherwise | Hash of adjacent `proposal.json`, approving every action and staged byte it binds. |
| `supersedes` | prior disposition ID, optional | Explicit reconsideration, without changing the earlier artifact. |

Each `inputs` member has `packet_id` (stable non-empty string), `summary`
(`{path, sha256}` of adjacent `work-summary.md` or its referenced retained packet
summary), and `evidence` (an array, possibly empty, of `{locator, sha256}` exact
source bindings). The combined `work-summary.md` must itself be bound by at least
one member's `summary`; if multiple packet files are used, it lists and hashes
them. An artifact-bearing Chronicle evidence record needs bindings for both record
and artifact. Repeated packet IDs within one disposition are invalid. Reject
unknown fields, unsupported versions, duplicate JSON keys, invalid locators,
missing referenced artifacts, digest mismatches, and invalid supersession
references. The actor is accountability metadata, not cryptographic authentication.

`no_update` accepts that no dataset change is warranted; `defer` retains an open
question or unmet prerequisite; `reject` declines the recommendation; `author`
approves an exact prepared proposal. A main-agent disagreement is recorded in the
reason while retaining the actual reviewed recommendation. An author decision
cannot have `NO_CHRONICLE_UPDATE` as its classification. Every proposal adding a
milestone needs an explicit author disposition with `MILESTONE_CANDIDATE` or
`BRANCH_OR_DIRECTION_CHANGE`, even if engineering acceptance is already recorded.

## Proposal and receipt bindings

A persisted proposal manifest binds the exact configuration bytes and their
resolution base, resolved dataset/workflow locations, dataset project identity,
complete baseline file inventory/digests (including expected absences), and each
intended action with its dataset-relative target, `create` or allowed `replace`,
expected previous digest/absence, staged workflow-relative file locator, and new
SHA-256. It also binds the staged Core-validation output/exit status and Core
version/commit identity used to validate the full staged dataset. No implicit
follow-up write is approved: Current, roadmap, evidence, revisions, and their
timestamps must all be among the intended actions. All staged files are fixed
before proposal hashing. Workflow-only metadata is not copied into the dataset.

A receipt is an immutable workflow artifact with a unique publication ID,
machine recording time, disposition ID, applied proposal digest, resolved dataset
identity/location, resulting path/digest inventory for the writes, and final
Core-validation result (status, warnings, exact stdout/stderr artifact bindings,
and execution identity). It links the operation journal proving which guarded
writes occurred. Only verified completed publication may produce a success
receipt. An author disposition alone never claims publication succeeded.
Receipt/journal implementation details belong to Component 4; these minimum audit
bindings and recovery obligations are its contract.

## Authoring sequence and publication guards

1. Establish the work packet, claims, actual evidence, chronology, and acceptance
   scope; resolve prior dispositions by stable packet IDs.
2. Persist the bounded curator recommendation and assessed context.
3. Prepare the full Core-format proposed dataset under workflow staging, capturing
   baseline/configuration bindings and exact intended actions.
4. Run authoritative Core validation on that staged dataset; retain diagnostics
   and resolve errors, review warnings, then freeze proposal and payload bytes.
5. Record the responsible-main-agent disposition approving that exact proposal.
6. Before publication, check all bindings again under an exclusive writer lock.
   Reject stale state, changed configuration, changed staged bytes, unsafe paths,
   case collisions, symlink destinations, or historical overwrites. Historical
   records/artifacts use exclusive create; only project, Current, and roadmap
   permit guarded replacement. Do not regenerate approved timestamps at apply.
7. Publish the approved changes, validate the resulting full dataset through Core,
   verify resulting file digests, and exclusively create the success receipt.

Non-author decisions persist their auditable bundle without a proposal or dataset
writes. A lock and guarded journal belong outside the dataset. Failure recovery
may affect only this operation's verified writes; never undo another writer's
changes. Retain failure evidence and refuse to label partial publication successful.
No general-purpose transaction platform is required by this contract.

## Replay, reconsideration, and recovery

Lookup by stable packet IDs and relevant prior dispositions first, including
whether each packet supported a subordinate result or a broader claim. Verify
the associated artifacts before relying on their status. Content/context digests
check whether the exact reviewed materials remain intact; they do not replace
the review of packet identity, evidence, scope, and prior outcomes.

| Prior state | Required result |
| --- | --- |
| Successful receipt for these inputs and the same authored claim/scope | Reuse disposition/receipt; create no duplicate Core records. Formatting-only changes to packets are not new progress. |
| Identical no-update, deferred, or rejected input/context assessment | Reuse existing disposition rather than append a fresh copy. |
| Same packet IDs, substantively changed evidence or relevant context | Reassess the changed material explicitly, record what changed, and retain prior provenance. A byte difference alone does not prove substantive change. |
| Explicit reconsideration | Append a new disposition with `supersedes`; preserve old decision, proposal, and receipt. Do not silently reverse a decision. |
| Approved proposal without a successful receipt | Pending, not completed. Reconcile or safely resume the same approval; do not allocate replacement records blindly. |
| Previously subordinate packets accumulated into a meaningful accepted capability | A new bounded packet states the new aggregate claim and lists contributing stable IDs/prior dispositions. Assess one candidate; do not duplicate the earlier supporting events. |
| Missing/inconsistent bundle, receipt, evidence, or journal | Stop automated publication pending reconciliation. Never infer success from absent artifacts. |

For pending publication, inspect the bound baseline, proposal, write journal,
actual files, and final validation evidence. Resume only if unchanged preconditions
or verified operation-owned partial writes establish which approved actions remain.
If all intended bytes are present, that alone is insufficient: verify ownership,
all bindings and complete intended actions, rerun full Core validation, and record
an explicit reconciled receipt only when completion is demonstrated. If stale
context requires a changed proposal, obtain a new exact author disposition;
reconsideration links the earlier decision. Uncertain ownership, unrelated writes,
or lost recovery evidence require manual reconciliation, not overwrite or cleanup.

See the [five worked cases](worked-cases.md) for expected and forbidden outcomes.
