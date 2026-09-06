# Component 3 — Evidence capture

The dependency-free Node CLI implements `now`, exact-file capture, and an explicitly
selected Git commit comparison. Run it with Node 22 or later on a POSIX filesystem.
Git 2.34 or later is required only for `tracked` policy checks or explicit Git
commit-range capture. Local/local artifact capture does not require or invoke Git
for tracking validation. Component 1's [configuration](project-configuration.md),
[Core boundary](core-integration.md), and [workflow contract](workflow-contract.md)
remain authoritative. Component 2's [authoring policy](../policies/chronicle_authoring.md)
requires review of support and significance after acquisition.

## Commands

```sh
node scripts/chronicle-kit.mjs now
node scripts/chronicle-kit.mjs capture artifact \
  --config /work/sample/settings/kit.json \
  --source /work/sample/reports/check-output.bin \
  --id EVD-0001 --artifact checks/output.bin \
  --title 'Selected check output' --kind test_output \
  --media-type application/octet-stream
node scripts/chronicle-kit.mjs capture git \
  --config /work/sample/settings/kit.json \
  --repository /work/sample/source --base release-start --target release-end \
  --id EVD-0002 --artifact changes/selected.patch \
  --title 'Explicit release commit comparison'
chronicle validate /work/sample/project-history
```

Paths and names above are examples. No dataset or tracking default exists. Capture
requires an existing initialized dataset. Configuration paths resolve relative to
the config file; source and repository command arguments resolve relative to the
invocation directory. IDs are explicitly selected Core `EVD-` IDs, never allocated
by mining history. `--artifact` is a relative path beneath `evidence/artifacts/`;
the record is `evidence/records/<id>.yaml`. Its JSON serialization is valid YAML
accepted by the installed Core v0.2.1 CLI. Standard output is the generated Core
evidence record; errors produce stderr and nonzero exit status.

`now` samples the machine clock and emits UTC RFC 3339 with seconds, dropping
fractional precision. Equal samples stay equal; regressing samples stay regressed.
The stateless helper neither establishes monotonic ordering nor invents an offset
or second to satisfy chronology. Capture records its own machine capture time;
there is no caller timestamp override or historical occurrence inference.

File mode requires source, title, Core evidence kind and media type. It reads one
regular file without transformations, checks its size/modification metadata across
the read, writes the observed bytes, and hashes those captured bytes. Empty files,
binary bytes, CRLF and Unicode work unchanged. Source symlinks/special files are
refused. Reading may update the source's filesystem access time; the helper never
writes source content. Source bytes are buffered in memory; this is a small local
capture tool, not a streaming archival service.

An intentionally sanitized or derived source requires both `--derivative 'what
was changed upstream'` and `--limitations 'what this prevents establishing'`.
These assertions are retained in Core's `description`; capture does not sanitize
or authenticate them. Raw source provenance means only the exact bytes read from
the selected local source. It does not claim that the source was never modified
before selection. Artifact `origin.command` is a JSON argument-vector description
of the logical file-read operation, not a full invocation or a shell command.
Source paths may be confidential; review consumer privacy rules before capture.

## Git scope and deterministic controls

Both revisions are mandatory and must resolve to commits. The implementation
resolves each once with `rev-parse --verify --end-of-options <revision>^{commit}`
and disables replacement refs. It records the full immutable SHA-1 or SHA-256
commit IDs in Core's `origin.base_revision` and `origin.target_revision`.

The comparison uses a freshly initialized bare repository with an empty template,
no populated HEAD/index, and the selected repository's object database as a
read-only alternate. User/system configuration and attributes, Git environment
redirects, dirty working-tree/index attributes, repository info attributes, external
diff commands and text conversion cannot substitute output. It uses actual Git
patch output with `--binary --full-index --no-ext-diff --no-textconv`, fixed Myers
algorithm/context/prefixes, no color, and no rename detection. Repository/user
attributes are deliberately neutralized, so custom binary/text classification
cannot silently change the captured comparison. The patch need not match a
consumer's customized plain `git diff` display. `origin.command` retains the
actual Git argument vector including the transient isolated directory; the
record description explains isolation. The scratch directory is removed after
successful acquisition, while the patch and full commit identities persist.

Scope is every path in the two resolved commit trees, with no pathspec or inferred
"recent work". Uncommitted staged, unstaged and untracked bytes are excluded.
Submodules produce pointer changes; LFS pointer blobs remain pointers, without
fetching underlying data. Local graft files are rejected. Partial/promisor repositories are conservatively
rejected before resolving any revision: effective included repository configuration
containing `extensions.partialClone`, `remote.*.promisor` or
`remote.*.partialCloneFilter` is unsupported, even when a flag is false or the
remote is unused. Git 2.34 can fetch missing objects during revision resolution;
this early refusal prevents that hidden source mutation. No remote fetch or
checkout is performed. Missing objects in supported repositories fail; Git patch output over the 64 MiB
subprocess buffer fails without a successful capture. The consumer must retain
source objects separately if future repository inspection matters.

## Boundaries and failure behavior

Only the artifact and its Core record are created in the dataset. No Current,
milestone, engineering event, disposition, proposal or receipt is authored.
Capture is acquisition before recommendation/approval; success means these bytes
and an evidence record were created. It does not imply main-agent acceptance,
semantic truth, or a successfully published prepared proposal. Full dataset
validation remains the installed `chronicle validate` authority; tests exercise
real Core validation rather than a copied validator. Production capture does not
call Core validation automatically or treat pre-existing dataset validity as
established. Run the displayed validation command on the chosen dataset.

All five config fields are strict (including duplicate/unknown rejection),
dataset/workflow/config placement is checked, and symlink ancestors, traversal
and case/Unicode aliases are refused conservatively. This can reject names a
case-sensitive filesystem would otherwise allow. Local tracking never invokes Git
or requires exclusions, even inside a worktree. Local is not a claim of exclusion;
the consumer manages source-control exposure separately. Tracked locations require
Git and an appropriate worktree and cannot conflict with effective ignore rules,
including global/system and repository rules. These policies apply independently
to both locations; all filesystem checks still apply to local paths. The helper
never edits ignores, stages, commits, or replaces Core's `.gitattributes`.

Cooperating captures use `operations/capture.lock` within configured persistent
workflow storage. Use one agreed workflow location per dataset; switching workflow
locations is not an authorized migration or concurrent-writer coordination scheme.
Exclusive file creation also prevents overwrite if a destination already exists.
A lock conflict does not remove or modify the other operation's state. Recheck
configuration bytes and destinations after acquiring the lock; changed config
fails. Source capture/Git revision selection precede any workflow mutation.

Failures after locking preserve the lock, operation identity, intended paths,
write identities/hashes and failure details for explicit reconciliation. Cleanup
removes only unchanged verified operation-owned complete writes; partial or changed
files remain. An interruption may leave an artifact, record or scratch files:
inspect the retained operation and current files, and never infer publication
success from presence alone. No automatic resume, receipt or transaction platform
is implemented. Successful captures remove their temporary lock/scratch.

The filesystem must be locally controlled during an operation. These checks and
lock are not an OS-level transaction against an adversary swapping directory
entries while a process runs; Node's path APIs do not provide `openat` directory
capability guarantees here. Do not run concurrent noncooperating writers or
redirect configured paths during capture. The CLI trusts installed Node and, for
Git-dependent operations, installed Git and the supplied object database, but
never executes artifact or provenance text.

## Tests and deliberate deferrals

Run `node --test tests/component-3.test.mjs tests/component-2.test.mjs`. Fixtures
initialize and validate disposable Core datasets with `/usr/bin/chronicle` and
create their own local Git commits; they require no dependencies or network.
Unreadable-file testing requires a normal unprivileged user. Tests include
valid hash/provenance for a report that does not establish a proposed gate claim:
byte integrity is explicitly distinct from evidentiary support.

Working-tree/staged/unstaged/untracked capture, pathspec-limited commit ranges,
partial/promisor repository capture, remote object retrieval, semantic claim
checking, streaming huge artifacts,
guarded proposal publication and automatic failure recovery are deferred.
No Core changes or consumer-specific behavior belong to this component.
