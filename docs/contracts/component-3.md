# Component 3 — Evidence capture

Implement only narrow timestamp and evidence-capture operations against accepted
[Core integration](../core-integration.md), [configuration](../project-configuration.md),
[workflow](../workflow-contract.md), and [curator policies](../../policies/chronicle_authoring.md).
All accepted Component 1 and 2 files, including README and tests, remain unchanged.
If a blocking incompatibility is discovered, stop and report it rather than
silently changing an accepted contract.

## Deliverables and scope

- `scripts/chronicle-kit.mjs`: small transparent Node CLI implementing only `now`
  and capture of an explicit existing file or explicit Git commit range.
- New capture usage/provenance documentation and focused executable tests.
- Temporary executable evidence in `dev/evidence/component-3/`; independent
  read-only critic acceptance and a reviewed file manifest before integration.

`now` samples the machine clock and emits UTC RFC 3339 including seconds. Equal
or regressing observations must never be advanced to fabricate ordering. Document
the stateless clock boundary; tests may inject an explicit clock into a narrow
function, but production must not accept user-supplied capture timestamps.

Capture requires explicit format-1 configuration and an existing initialized
dataset. Enforce the accepted disjoint locations and independent tracking choices
before dataset/workflow writes; no default paths or tracking, no automatic ignore
edits, staging or commits. Capture is the evidence acquisition step preceding
content assessment: its evidence record and artifact establish no claim acceptance,
main-agent disposition, milestone promotion or successful prepared-proposal publication.
Do not implement prepare/apply or a transaction platform.

Existing-file mode copies exact regular-file bytes without transformation, hashes
the captured bytes, and exclusively creates a Core artifact evidence record with
machine capture time and truthful supported provenance fields. Intentionally
sanitized/derived input must be declared and described as a derivative with its
limitations. The helper performs no sanitization itself and does not authenticate
source assertions. Reject missing/unreadable/special sources and refuse historical
artifact/record overwrite, even when new bytes or hashes differ.

Git mode requires repository, base and target explicitly. Resolve both to immutable
commit object IDs before capturing actual binary-capable/full-index diff output.
Use argument-vector invocation without a shell. Disable external diff drivers,
textconv and configuration/environment behaviors that can substitute transformed
patch output. Prevent working-tree/index/untracked changes and unrelated Git
environment overrides from changing the selected commit comparison. Preserve exact
captured patch bytes and resolved IDs with truthful provenance. No inferred ranges.
Working-tree capture is deliberately deferred to keep scope complete and narrow.

Use Core fields only; authoring input checks are not a replacement Core validator.
Do not import private Core modules, copy validators, install dependencies, or edit
Core. Integration fixtures initialize and validate disposable datasets through the
installed `chronicle` CLI; preserve its artifact `.gitattributes`. Failures must
not overwrite existing files or remove anything outside verified operation-owned
writes. Any needed lock/recovery/control material lives outside the dataset.

## Filesystem and concurrency

Constrain artifacts beneath `evidence/artifacts/` and records beneath
`evidence/records/` of the configured dataset. Reject traversal, unsafe relative
paths, symlink destinations/ancestors and case collisions; use exclusive creation.
Never interpret evidence contents or provenance text as commands. Cooperating
capture writers must not race case-colliding names. Document actual platform and
concurrent filesystem limitations honestly rather than claiming a hostile-filesystem
transaction guarantee. Avoid general-purpose abstractions not needed for capture.

## Acceptance evidence

Test machine time formatting/seconds/regressions; CRLF/empty/binary/Unicode exact
bytes and SHA-256; missing/unreadable inputs; existing artifacts and records;
traversal, symlinks and case collisions; configuration rejection/no-write behavior;
explicit Git commit comparison and binary changes; immutable resolved IDs; invalid
revisions; external diff/textconv resistance; unrelated working-tree exclusion;
and generated record validation through installed Core v0.2.1. Include a valid
captured artifact/provenance that does not support a requested semantic claim,
preserving Component 2's integrity-versus-truth distinction.

Developer → executable evidence → independent read-only critic → at most two
repair submissions → ACCEPT or orchestrator escalation. Critic checks bytes,
provenance, scope, boundary/overwrite safety, Core coupling and unnecessary complexity.
No automatic History milestone follows acceptance. Stop after Component 3; no
Component 4, guarded proposal publication, Core changes or consumer integration.
