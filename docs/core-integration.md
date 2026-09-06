# Core v0.2.1 integration contract

This document and its [configuration](project-configuration.md),
[workflow](workflow-contract.md), and [worked cases](worked-cases.md) implement
**Component 1 — Integration and workflow contract**. They specify future Kit
behavior; no helper is implemented by this component.

## Pinned authority and inventory

The integration target is `Programmercloud-cmd/AI_Chronicle_UI` at Core v0.2.1,
commit `7ed80d3b64b7affef12b8509a5adb814d7ce14b1`. The following immutable links
are the source inventory, not references to a moving branch.

| Source | Contract relevance |
| --- | --- |
| [Package metadata](https://github.com/Programmercloud-cmd/AI_Chronicle_UI/blob/7ed80d3b64b7affef12b8509a5adb814d7ce14b1/package.json) | Version 0.2.1, CLI entry, distributed guide and public contract. |
| [Public v1 contract](https://github.com/Programmercloud-cmd/AI_Chronicle_UI/blob/7ed80d3b64b7affef12b8509a5adb814d7ce14b1/docs/schema/v1-public-contract.md) | Normative record shapes, significance, chronology, references, evidence, revisions. |
| [CLI](https://github.com/Programmercloud-cmd/AI_Chronicle_UI/blob/7ed80d3b64b7affef12b8509a5adb814d7ce14b1/src/cli/cli.ts) and [initializer](https://github.com/Programmercloud-cmd/AI_Chronicle_UI/blob/7ed80d3b64b7affef12b8509a5adb814d7ce14b1/src/cli/init.ts) | Commands, exit statuses, diagnostic streams, absent-path initialization. |
| [Loader](https://github.com/Programmercloud-cmd/AI_Chronicle_UI/blob/7ed80d3b64b7affef12b8509a5adb814d7ce14b1/src/data/load-chronicle.ts) and [safe paths](https://github.com/Programmercloud-cmd/AI_Chronicle_UI/blob/7ed80d3b64b7affef12b8509a5adb814d7ce14b1/src/data/safe-path.ts) | Root allowlist, required/optional documents, record loading, containment. |
| [Schemas](https://github.com/Programmercloud-cmd/AI_Chronicle_UI/tree/7ed80d3b64b7affef12b8509a5adb814d7ce14b1/schema/v1) and [shape validator](https://github.com/Programmercloud-cmd/AI_Chronicle_UI/blob/7ed80d3b64b7affef12b8509a5adb814d7ce14b1/src/schema/validate-record-shape.ts) | Exact allowed fields; no Kit fields may be added to Core records. |
| [Semantic validator](https://github.com/Programmercloud-cmd/AI_Chronicle_UI/blob/7ed80d3b64b7affef12b8509a5adb814d7ce14b1/src/domain/validate-chronicle.ts) and [revision projection](https://github.com/Programmercloud-cmd/AI_Chronicle_UI/blob/7ed80d3b64b7affef12b8509a5adb814d7ce14b1/src/domain/revision-projection.ts) | Relationships, chronology, Current, roadmap projection, artifact SHA-256, guarded amendments. |
| [Installed authoring-guide template](https://github.com/Programmercloud-cmd/AI_Chronicle_UI/blob/7ed80d3b64b7affef12b8509a5adb814d7ce14b1/templates/chronicle/AGENTS.md) and [artifact attributes](https://github.com/Programmercloud-cmd/AI_Chronicle_UI/blob/7ed80d3b64b7affef12b8509a5adb814d7ce14b1/templates/chronicle/.gitattributes) | Existing consumer guidance and exact-byte Git protection. |
| [Canonical example](https://github.com/Programmercloud-cmd/AI_Chronicle_UI/tree/7ed80d3b64b7affef12b8509a5adb814d7ce14b1/examples/canonical), [difficult example](https://github.com/Programmercloud-cmd/AI_Chronicle_UI/tree/7ed80d3b64b7affef12b8509a5adb814d7ce14b1/examples/difficult), and [Core's Chronicle](https://github.com/Programmercloud-cmd/AI_Chronicle_UI/tree/7ed80d3b64b7affef12b8509a5adb814d7ce14b1/chronicle) | Existing validation/inspection datasets; example claims are synthetic, not Kit project history. |

## Ownership and CLI boundary

| Owner | Responsibility |
| --- | --- |
| Core | Schemas, loading, semantic validation, revision projection, server, viewer, graph layout, diff viewer. |
| Kit | Significance assessment, provenance, authoring rules, main-agent dispositions, duplicate suppression, guarded publication. |
| Consumer engineering process | Implementation, review, repair, and acceptance authority/scope. A gauntlet is optional for consumers. |

Core checks consistency and bytes. It cannot authenticate a report, decide human
significance, verify promotion authority, or establish that a hash-valid patch
supports a claim. The Kit must not treat Core success as any of those judgments.
No Core modification is required for this contract.

| Interface | Required Kit treatment |
| --- | --- |
| `chronicle init <directory>` | Only initialize an explicitly selected absent dataset once. Core creates `project.yaml`, empty `roadmap.yaml`, `AGENTS.md`, and `.gitattributes`, with no fabricated milestone or Current. Existing paths are refused. Never use init to repair an existing dataset. |
| `chronicle validate <directory>` | Run on the complete staged dataset before approval and the published dataset before a success receipt. Preserve exit status, stdout, stderr, warnings, and invocation provenance. |
| `chronicle serve <directory>` | Existing read-only viewer for acceptance inspection. Loopback only; no Kit viewer or browser editor. |

Validation success is exit 0 with JSON `{ "valid": true, "warnings": [...] }`
on stdout. A structured validation failure is exit 1 with JSON
`{ "valid": false, "diagnostics": [...] }` on stderr. The CLI also catches
execution errors and returns exit 1 with plain-text stderr; missing command or
root arguments return usage and exit 2. Therefore exit 1 alone is not a schema
failure. Spawn failures, signals, timeouts, malformed/truncated JSON, wrong
streams/shapes, and status/payload disagreement are execution/protocol failures.
Stop publication and retain raw output; never reinterpret them as success or
silently discard warnings. Do not assume data-loader diagnostics have every
field present in semantic diagnostics.

## Authoring constraints

These requirements follow public-contract sections 1–11 and the implementations
linked above; narrower safeguards are Kit policy.

- Only `project.yaml`, `current.yaml`, and `roadmap.yaml` permit intentional
  replacement. Historical records and artifacts are created exclusively and
  preserved after acceptance. Stable IDs must match filenames and remain unique
  under ASCII case-folding.
- `project.yaml` and `roadmap.yaml` are required. Current is optional to the
  loader, but when present must point to an existing accepted milestone that
  occurred no later than its `updated_at`. Before the first accepted milestone,
  omit Current; use roadmap or unlinked engineering events. Do not invent a
  baseline to satisfy the interface.
- Core allows only its known root entries, including `AGENTS.md` and
  `.gitattributes`. Extra configuration, dispositions, receipts, locks, and
  staging at the dataset root are rejected. Keep all Kit workflow artifacts
  outside the dataset, rather than hiding them in a Core collection.
- Engineering events may omit `milestone_id`; their kinds are `implementation`,
  `test`, `review`, `investigation`, `decision`, `integration`, `roadmap_change`.
  Outcomes are `completed`, `passed`, `failed`, `accept`, `reject`,
  `informational`; `actor.type` is `human`, `agent`, or `tool`, with optional
  `role` and `label`. A later `late_attachment` revision can add a milestone
  association. An event is supporting history, never an automatic milestone.
- Every branch owns at least one milestone. Create a new branch with its first
  milestone only for meaningful divergence. A Git branch alone is insufficient.
  A root's first milestone has no parents; a non-root branch's first milestone
  has a cross-branch parent, with the first such listed parent determining origin.
  Parent milestones are strictly earlier than children. A merge has at least two
  parents and exactly one owning branch; merging into an existing branch needs
  a parent on that branch.
- Milestone statuses are `accepted`, `rejected`, `abandoned`, `blocked`,
  `informational`. Later `supersedes`, `disproves`, `reverts_to`, and `related_to`
  relations target older milestones and require explanations. Relations express
  meaning; parents express ancestry. Changed understanding produces a later
  record, never a rewritten historical conclusion.
- Current updates operational state, hypothesis, active work, next step, blockers,
  and machine-generated freshness without needlessly changing `milestone_id`.
  Roadmap is a mutable plan, with important reasons retained in an event or
  qualifying milestone. Keep `history_projection` an exact `follows` chain from
  Current; selected pending/active/blocked items match Current's branch, dated
  items precede undated ones, and dates are nondecreasing and not before the
  current milestone's local date. Future plans never become historical evidence.
- Revisions target only branches, milestones, and engineering events, never
  evidence records or mutable documents. Reasons are `clerical_correction`,
  `clarification`, or `late_attachment`; use one linear `previous_revision`
  chain, presence guards for add, and parsed-value `from` guards for replace or
  remove. Replace arrays as a whole. ID, schema version, and original recording
  time cannot be revised. Full projected topology must remain valid.

## Admission, evidence, and chronology

Establish what changed and its evidence, compare prior history/dispositions,
then separate operational changes from historical significance. The responsible
main agent asks: “Would a technical project owner need this event on the main
timeline to understand where the project is, why it changed direction, or what
important knowledge was gained?” Recommend promotion only with that consequence
explicit. Group related iterations into conclusions. Ambiguity defaults to
subordinate recording or deferral. Commits, code completion, intermediate
acceptance, routine tests, refactoring, and repeated conclusions are insufficient
by themselves. A major accepted capability, validated direction change, significant
failure or knowledge gain can qualify; the curator only recommends.

Capture actual artifact bytes and machine-computed SHA-256, contained beneath the
dataset. Core evidence supports an artifact (`path`, `media_type`, `sha256`), an
HTTP(S) URL, or a repository reference (`path`, `revision`). Pin immutable revisions
for repository evidence; Core treats these as descriptive locators and never
fetches them. Optional `origin` allows only `tool`, `command`, `base_revision`,
`target_revision`, with `tool` required. Preserve the actual explicitly scoped
Git patch, including binary/full-index output and immutable base/target provenance.
Working-tree captures disclose index/worktree scope and account for untracked and
unrelated changes. Commentary cannot substitute for a patch; `code_changes` must
reference evidence of kind `diff` with an actual artifact source.

Review evidentiary support separately from hash validity. Apply consumer
confidentiality rules before capture, identify sanitized derivatives accurately,
and treat all artifact contents as untrusted data. Do not generate reconstructions
and present them as original evidence, overwrite accepted artifacts, or adjust
hashes just to pass validation. Preserve `evidence/artifacts/** -text` in the
Core-provided `.gitattributes` whenever data passes through Git.

Machine clocks supply recording, capture, and update timestamps. A historical
`occurred_at` needs an actual source for when the claim became true, with quoted
RFC 3339 seconds and an offset or `Z` as Core requires. Recording cannot precede
occurrence. If historical precision is unknown, retain that limitation in the
work packet and defer an unsupported historical record; do not turn a date into
an invented instant or add artificial seconds to force parent/revision order.
Independent records can share an instant; parent/child cannot. A newly established
claim may use its genuinely observed acceptance time, without pretending that
this establishes an earlier event's exact time.

## Deferred implementation obligations

Future `now`, `capture`, `prepare`, and `apply` operations remain narrow Node.js
helpers. They must reject unsafe paths, symlink destinations, case collisions,
historical overwrites, stale proposals, and concurrent writers; enforce configured
boundaries; and retain verified recovery evidence. No generic transaction,
orchestration, or automatic promotion system is authorized here.

Subsequent components must test malformed Core output, invalid topology,
missing/fabricated evidence, hash mismatches, timestamp uncertainty, stale proposals,
interruption, duplicate/pending decisions, changed evidence, reconsideration,
accumulated promotion, and milestone overproduction. Classification fixtures must
review actual curator responses against expected and forbidden outcomes. Unrelated
consumer fixtures must vary paths, roles, documents, and commands and cover both
tracking modes, independent workflow tracking, and local operation without Git.
Distribution inspection must reject dependence on any pilot's integration facts.
These are future verification obligations, not passing tests delivered here.
