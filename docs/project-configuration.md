# Explicit project configuration contract

This is Kit configuration format 1, not a Core schema extension. Every future
Kit operation that writes a dataset requires an explicit `--config <file>`.
There is no default dataset location or tracking policy. Missing or invalid
configuration stops before any dataset or workflow mutation. `now`, a clock-only
operation, does not need a project configuration.

## Fields and path resolution

| Field | Required type | Contract |
| --- | --- | --- |
| `format_version` | integer `1` | Reject unsupported versions. |
| `dataset_path` | non-empty string | Explicit location of the Core dataset. |
| `dataset_tracking` | `tracked` or `local` | Explicit dataset tracking choice. |
| `workflow_path` | non-empty string | Persistent Kit workflow storage outside the dataset. |
| `workflow_tracking` | `tracked` or `local` | Independent workflow tracking choice. |

These five fields are required; reject duplicate keys, unknown fields, invalid
JSON, invalid field types, and unsupported values rather than guessing intent.
These are Kit format-1 choices, not extra restrictions claimed of Core.

Resolve relative paths against the configuration file's directory, never the
process working directory. Absolute paths support machine-local configurations;
do not expand environment variables or `~` implicitly. Resolve existing path
ancestors and compare the resulting filesystem locations before mutation, including
case aliases on the target filesystem. Dataset and workflow must be disjoint:
neither equal nor an ancestor of the other. For absent leaves use the resolved
existing ancestor plus the remaining normalized path, then recheck on creation.
Reject symlink write destinations and escapes. The configuration file itself must
be outside the dataset. A configuration stored in workflow storage is permitted;
its bytes and base directory must still be bound during preparation.

Example choices below are illustrative, not defaults:

```json
{
  "format_version": 1,
  "dataset_path": "../project-history",
  "dataset_tracking": "tracked",
  "workflow_path": "../.agent-decisions",
  "workflow_tracking": "local"
}
```

If the file is `/workspace/sample/settings/chronicle-kit.json`, these resolve to
`/workspace/sample/project-history` and `/workspace/sample/.agent-decisions`.
A completely local consumer can instead explicitly select `/srv/notes/history`
and `/srv/notes/workflow`, both `local`, without any Git repository. Relative
`chronicle/`, `dev/chronicle/`, or an external directory are all possible choices;
none is preferred by the contract. No workflow artifact may be temporary-only:
loss of dispositions or receipts breaks auditable duplicate suppression.

## Tracking and adoption

| Choice | Required treatment |
| --- | --- |
| `tracked` | Require the Git executable and an appropriate worktree containing the selected location; check effective ignore rules for existing and proposed files, including ignored ancestors, global excludes, and repository-local rules. Fail clearly if Git is unavailable; never degrade to local. Refuse contradictory configuration instead of force-adding. A new file may be untracked before the consumer stages it; “tracked” expresses intended durable versioning, not automatic staging. |
| `local` | Require no Git executable, worktree, or ignore policy. Never invoke Git merely to validate this tracking choice. Existing filesystem/configuration and publication safeguards still apply. The consumer manages source-control exposure separately: local does not mean Git-ignored or untracked, and the Kit neither verifies exclusion nor untracks existing files. |

Apply these rules independently to dataset and workflow. `tracked`/`local`,
`local`/`tracked`, both tracked, and both local are supported whenever their
individual locations satisfy their policies. For nested/separate worktrees,
evaluate each tracked location in its actual owning worktree. Do not silently stage,
commit, untrack, move, delete, overwrite, or add ignore rules to reconcile a
choice. Diagnose the conflict and let the consumer make an explicit correction.
Preserve Core's evidence `.gitattributes` for any dataset passing through Git.
Git remains required for explicitly selected Git commit-range evidence capture,
even when both tracking policies are local. Local artifact capture and local/local
prepare/apply do not invoke Git for tracking validation.

Adoption copies a pinned Kit release and merges its instruction fragment after
review; consumers explicitly select paths and both tracking policies, review
source-control exposure separately, and validate the selected existing dataset.
Consumers may choose exclusions for local data; exclusions are not an operational
precondition and do not remove files already in Git.
Initialize only an explicitly selected absent dataset. Preserve existing project
identity and authoring guidance; do not regenerate data during adoption or
updates. Updates use reviewed file diffs. A change of configured path is not an
authorized migration; reconcile against the existing workflow's dataset identity
before publication. Binding proposals to resolved locations and configuration
bytes prevents an old approval from being redirected by a config edit.

Configuration, persistent work packets, context snapshots, recommendations,
dispositions, proposals, receipts, locks, staging, and recovery evidence all stay
outside the Chronicle dataset. Kit-owned `dev/` engineering evidence is separate
from a consumer's configured persistent workflow store. A consumer may name its
own persistent location under `dev/`; that naming does not make it disposable.

## Failure cases for later implementation tests

Missing fields, unknown tracking choices, equal/nested locations, symlink aliases,
ignored tracked destinations, unavailable Git for tracked policies, and a changed
configuration between prepare/apply must stop without publication. Missing or
contradictory configuration causes no dataset or workflow writes. Verify distinct
paths in another consumer with different role names, documents, and check
commands; no pilot-specific path or policy is part of this contract.
