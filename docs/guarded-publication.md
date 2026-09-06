# Component 4 — Guarded publication

The existing CLI now supports `prepare` and `apply` in addition to the unchanged
[Component 3 capture modes](evidence-capture.md). The implementation uses Node
builtins and the installed Core v0.2.1 CLI. The [Component 1 workflow contract](workflow-contract.md),
[configuration contract](project-configuration.md), and [Component 2 authoring policy](../policies/chronicle_authoring.md)
remain authoritative. This document specifies the narrow JSON request/context
encoding consumed by the publication implementation; none of these fields are
Chronicle schema extensions.

## Commands and review sequence

```sh
node scripts/chronicle-kit.mjs prepare --config /work/settings/kit.json \
  --bundle DSP-00000000-0000-4000-8000-000000000001 \
  --request dispositions/DSP-00000000-0000-4000-8000-000000000001/request.json
node scripts/chronicle-kit.mjs apply --config /work/settings/kit.json \
  --bundle DSP-00000000-0000-4000-8000-000000000001
```

The UUID above illustrates syntax; generate an actual unique bundle UUID with a
tool such as `crypto.randomUUID()`. Paths in the configuration resolve against
its directory. All request/payload/snapshot locators below resolve against the
explicit workflow directory. No dataset, workflow, or tracking default exists.
`prepare` returns a review receipt as JSON. The responsible main agent reviews
that proposal and then **exclusively creates** the separate, immutable Component
1 `disposition.json`. `apply` returns a publication receipt only after complete
publication and final validation, or returns a previously verified success receipt.
Errors go to stderr with exit 1. Neither operation creates an approval.

Populate this persistent bundle before preparation:

```text
dispositions/DSP-<UUID>/
  work-summary.md
  recommendation.md
  context.json
  inputs/                 # exact proposed files and retained evidence/packets
  context/                # exact relevant record snapshots
  request.json
```

Use the accepted summary/recommendation templates. The recommendation remains
opaque, exact reviewed Markdown: the helper checks its integrity, not the truth
of its prose. Keep exactly one primary curator classification. A disagreement
belongs in the responsible main-agent disposition's reason, while preserving
the actual recommendation. A machine clock supplies decision timestamps; the
helper validates timestamp syntax but cannot prove how another actor obtained it.

The strict request is:

```json
{
  "format_version": 1,
  "inputs": [
    {
      "packet_id": "investigation-packet-17",
      "summary": { "path": "dispositions/DSP-<UUID>/work-summary.md", "sha256": "<exact SHA-256>" },
      "evidence": []
    }
  ],
  "actions": [
    { "path": "engineering-events/EVT-000017.yaml", "action": "create", "source": "dispositions/DSP-<UUID>/inputs/event.yaml" }
  ],
  "warning_reviews": []
}
```

All keys shown are required. Each action explicitly selects `create` or `replace`;
there is no deletion action. At least one input binds the adjacent combined
`work-summary.md`. Additional packet summaries need their paths and exact hashes
listed in that combined summary. Packet IDs cannot repeat in a decision. Evidence
members are exactly `{ "locator": "...", "sha256": "..." }`, as in Component 1.

The strict `context.json` shape is:

```json
{
  "format_version": 1,
  "project_id": "the-existing-project-id",
  "current": null,
  "previous_milestone": null,
  "roadmap": { "path": "dispositions/DSP-<UUID>/context/roadmap.yaml", "sha256": "<exact SHA-256>" },
  "history": [],
  "acceptance": { "actors": ["responsible-main-agent"], "scope": "The exact assessed claim and authority scope" },
  "prior_dispositions": [],
  "prior_receipts": [],
  "snapshots": [],
  "evidence_roles": [],
  "packet_review": { "mode": "new", "reason": "Why this is a new bounded assessment", "contributors": [] }
}
```

`current` is null exactly when the baseline lacks Current; otherwise it is a
retained `{path, sha256}` snapshot matching baseline `current.yaml`. `roadmap`
always binds an exact retained snapshot matching baseline `roadmap.yaml`.
`history`, `snapshots`, and `prior_receipts` contain `{path, sha256}` references.
`previous_milestone` is null or `{locator, sha256}`. The helper verifies these
bindings; the reviewer supplies the relevant history rather than inferring it
from commits or loading unbounded history. `acceptance.actors` lists accountable
main-agent/human identifiers and must include the disposition actor. This is
accountability metadata, not authentication, a signature, or an authorization
service; callers must control workflow storage and responsibly create approvals.

Each `prior_dispositions` member is `{id, sha256}` for the exact prior
`dispositions/<id>/disposition.json`. A prior successful author decision also
requires its exact receipt reference in `prior_receipts`. `packet_review.mode` is
`new`, `reconsider`, or `aggregate`; its nonempty reason records the reviewed scope
and substantive change. A same-packet reassessment requires `reconsider` and an
explicit bound `supersedes` on the new disposition. A new aggregate uses a new
packet ID, and `contributors` lists bound prior disposition IDs for subordinate
contributions. These are reviewed assertions: changed hashes alone never prove
new significance. The helper does not decide semantic equality or milestone merit.

## Evidence locators and supported serialization

Workflow references must be retained regular files within storage, never symlinks
or escapes. Existing Chronicle IDs resolve by the public collection filename and
must bind its exact digest. `evidence/artifacts/<path>` may bind an existing
contained dataset artifact; preferably retain explicitly scoped workflow snapshots
when later audit needs them independently. Remote evidence binds the existing
Core record, never unobserved remote content. Neither command fetches anything.

`evidence_roles` in the assessed context explicitly declares every distinct input
`evidence` locator once as `{locator, role}`. The only roles are `record`,
`artifact`, and `opaque`; missing, duplicate, extra, and unknown declarations fail.
The context digest binds these declarations through the unchanged Component 1
disposition. This is Component 4 context encoding, not new disposition fields.
Existing Chronicle ID locators inherently require `record`; contained dataset
`evidence/artifacts/...` locators inherently require `artifact`. Neither intrinsic
role may be contradicted. With no input evidence, use `evidence_roles: []`.

A workflow `record` is explicitly supplied as a Core-record snapshot and must use
supported JSON serialization. JSON is valid Core YAML and the exact serialization
produced by Component 3. EVD IDs likewise require JSON record serialization for
source inspection. Other existing Core IDs are retained/hash-bound through their
public dataset filename without a general YAML parser. Declared records read only
the narrow identity/source fields needed for audit bindings; this does not add a
second Core schema validator or attest that a standalone snapshot passed Core.

An artifact-bearing EVD record requires the exact record hash and a separate
`artifact` role binding with the declared SHA-256 in the same input. A matching
`opaque` hash cannot stand in for that artifact role. URL and `repository_ref`
sources bind the Core record, not unavailable remote content. Unsupported record
serialization, including quoted-key YAML, fails explicitly rather than guessing
whether its text is a record. Preserve the original record; do not relabel it as
opaque to claim Core-record provenance or silently omit its artifact binding.

`artifact` and `opaque` inputs are unrestricted exact bytes and are **never parsed**
for content-based role guessing. Binary reports may start with `{`, contain JSON,
look like YAML, or contain NUL bytes. A workflow source deliberately declared
`opaque` proves only the retained byte-source binding, not that it is a Core record.
The reviewer must reject claims that misuse that role; the helper cannot establish
semantic truth from either content or caller declarations. It never executes
artifact text, fetches sources, or changes captured bytes.

Project identity is `project.id`. The small identity reader supports JSON or the
initializer/canonical form: ordinary block mappings with single-line scalar
leaves at indentation zero/two. Ambiguous nesting, duplicate keys, aliases,
anchors, block/multiline scalars, and complex YAML forms fail closed. It does not
parse general YAML or duplicate Core semantics. Use an existing supported form;
do not rewrite accepted data merely to bypass this limitation. Project replacement
must retain the same ID. All Core records/payload bytes otherwise remain exact and
are validated by Core, including normal YAML in events, Current, and roadmap.

## Preparation and exact approval binding

Preparation snapshots the complete live file inventory, empty directories, and
explicit absence of optional mutable documents. It retains a full staged dataset,
including existing authoring guidance and `.gitattributes`, outside Chronicle.
Only explicit request actions change the stage. Baseline bytes/digests, fixed new
payload bytes, config bytes/resolution base/locations, project identity, input
bindings, context, summary, recommendation, request, Core execution identity,
validation output, and warning reviews all enter `proposal.json`. Its digest is
SHA-256 of that exact persisted file. `proposal/baseline.json` is also persisted;
its exact bytes are the baseline digest. Hashes never mean semantic equality.
Reformatting a request, context, payload, or approved proposal changes its binding.

Core is invoked as `chronicle validate <full-stage>` through its resolved installed
executable. Public package metadata must identify `project-chronicle` v0.2.1.
The proposal records executable path/hash, package path/hash/version, argv, and
the target Core commit. The target commit is the integration pin, not a claim
that package metadata cryptographically proves build provenance. Consumers trust
the installed CLI. No private Core module or validator is imported.

Raw stdout/stderr and process exit status/signal/error are retained. Validation
bindings also require the exact expected stdout/stderr/result paths and invocation:
the proposal phase names its own full staged dataset; a publication receipt names
that operation's `operations/OP-<UUID>/validation/` artifacts and the live dataset.
A staged result or another operation's result cannot substitute for final validation,
even if both report success with identical warnings. Valid Core
success is exit 0, JSON `{valid:true,warnings:[...]}` on stdout, and empty stderr.
Structured invalid data is exit 1 with `{valid:false,diagnostics:[...]}` on stderr
and empty stdout. Other output, malformed/duplicate JSON, contradictory status,
spawn failure, signal, or timeout is an execution/protocol failure. Both kinds
of failure retain evidence and prevent a ready proposal. Validation runs have a
60-second timeout and 64 MiB output bound; no automatic retries or repairs.

Warnings are not silently ignored. Before ready preparation, `warning_reviews`
must contain one entry per Core warning in its original order:

```json
{
  "warning": { "code": "<actual Core code>", "...": "<all actual fields>" },
  "decision": "accept",
  "reason": "Why this known warning is acceptable for the bounded proposal"
}
```

Copy the actual diagnostic object (not this placeholder). For example, a completed
subordinate roadmap task can truthfully lack a milestone; a warning does not
justify creating one. A failed warning review retains diagnostic artifacts but
creates no `proposal.json`. Inspect the warnings, make a new reviewed bundle, and
prepare it explicitly. The exact reviewed warning objects/reasons are bound by
the proposal, so no extra fields are added to the immutable disposition format.
Any new or changed final warning requires reconciliation, not implicit acceptance.

## Apply, receipts, and state transitions

`apply` strictly validates the complete Component 1 disposition, adjacent bundle,
exact proposal digest, summary/evidence/context/recommendation bindings, authority
actor, and prior/superseding decisions. Unknown fields, nested duplicate JSON keys,
unsupported versions, invalid hashes, or missing references fail. Author decisions
cannot use `NO_CHRONICLE_UPDATE`. Every added milestone requires
`MILESTONE_CANDIDATE` or `BRANCH_OR_DIRECTION_CHANGE`; an engineering ACCEPT does
not promote anything. All intended companion actions must already be in the
approved proposal. Apply never regenerates their content or timestamps.

Both operations use the same exclusive workflow `operations/capture.lock` directory
as Component 3. No process steals locks based on age, PID, or missing metadata.
Use one agreed persistent workflow per dataset and cooperating local writers.
The live configuration, complete baseline, destination safety, Core identity,
approval, proposal and stage are checked again under that guard before publication.
Historical branches, milestones, engineering events, revisions, EVD records, and
artifacts are exclusively created. Only existing `project.yaml`, `current.yaml`,
and `roadmap.yaml` permit intentional replacement. Mutable files with additional
hardlinks are refused so in-place replacement cannot alter unrelated linked files.
Project identity, `.gitattributes`, and existing guidance remain protected.

Before writes, persist an operation intent, exact mutable preimages, and one
exclusive bundle `attempt.json` pointing to the operation and eventual receipt.
Persist a per-action intent before each write and verified inode/device/hash proof
after each completed write. Then compare the entire resulting state, validate
live Core, recheck approved/result bytes, and create an exclusive `PUB-<UUID>`
receipt. It binds the disposition and proposal, baseline, dataset identity,
operation journal, created/replaced paths and resulting hashes, machine publication
time, raw final Core result, warning reviews, and success/failure state.

| Observed state | Behavior |
| --- | --- |
| `PREPARED_UNAPPROVED` | Reviewable stage; no author disposition, no live writes. |
| Author disposition, no attempt/recovery evidence | Authorized and pending; apply may start if all preconditions remain exact. |
| `PUBLISHED` with consistent attempt, journal, validation, receipt and resulting live state | Return that same verified receipt with zero dataset writes. |
| Attempt without complete matching success, orphaned matching operation, missing/altered receipt, partial write, failed final validation | `RECONCILIATION_REQUIRED`; preserve evidence and refuse blind retry. |
| Shared lock exists, including after interruption | Refuse competing operation; explicit reconciliation must resolve ownership. |

Successful replay verifies the recorded complete resulting live state. If later
legitimate publications have changed it, this direct replay conservatively asks
for reconciliation; the prior-decision review path can still verify the retained
receipt as historical evidence for a new assessed packet. No duplicate records
are allocated. Same stable packet IDs cannot bypass prior decisions by formatting
changes. Previously subordinate packets may contribute to a new explicit aggregate
claim, without recreating their events. A prepared unresolved bundle or pending
prior authorization is never mistaken for completion.

## Failure limits and verification

This is not an ACID multi-file transaction. Mutable replacement is in-place after
exact precondition and hardlink checks; interruption may leave truncated or partial
bytes. Failure receipts and journals report only verified completed writes and
identify an uncertain next action. Complete intended bytes alone do not prove
success or ownership. Locks, partial files, and recovery evidence remain for
explicit reconciliation. No automated rollback, resume, cleanup of dataset files,
or deletion of unrelated project files occurs. If persistence itself fails, even
a failure receipt may be absent: the retained attempt/intent and observed files
are recovery evidence, never proof of success. A crash after a valid success
receipt but before lock removal still leaves a conservative lock to reconcile.

As in Component 3, the supported environment is locally controlled POSIX storage,
Node 22+, and an installed Core v0.2.1 CLI. Git 2.34+ is additionally required when
either tracking policy is `tracked`; its absence fails before publication. This is not protection from
an actor coherently rewriting all approvals or swapping filesystem paths outside
the cooperating-writer guard. Dataset and workflow tracking are independently
checked independently. Tracked locations check existing/proposed paths and effective
ignores. Local tracking invokes no Git and requires neither a worktree nor exclusions;
the consumer manages source-control exposure separately. Local/local prepare/apply
work without the Git executable, with all other safety checks intact. Explicit Git
evidence capture still requires Git. The helper never stages, commits, pushes, edits ignores,
installs dependencies, upgrades Core, or writes inside another consumer project.

Run `node --test tests/component-2.test.mjs tests/component-3.test.mjs tests/component-4.test.mjs`.
Tests use real installed Core for positive validation and warning cases. Local
controlled validator fixtures exercise protocol errors, final failure, warning
changes, actual child-process interruption, and concurrency; they are labeled
as failure mechanisms rather than real Core acceptance. Deferrals remain remote
publication, distributed locking, watchers/daemons, automatic retries/recovery,
large-file streaming, and every later component. No Core or consumer-specific
adaptation is part of this implementation.
