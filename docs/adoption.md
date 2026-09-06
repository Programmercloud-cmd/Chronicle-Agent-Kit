# Adopt a pinned copy

1. Independently install and trust Chronicle Core **v0.2.1** and Node **22+** on a
   POSIX filesystem. Core supplies `chronicle init`, `validate`, and `serve`.
   Follow the [pinned Core consumer installation instructions](https://github.com/Programmercloud-cmd/AI_Chronicle_UI/blob/7ed80d3b64b7affef12b8509a5adb814d7ce14b1/README.md#consumer-install-and-use-chronicle):
   obtain the v0.2.1 release archive and install it independently; no source checkout is needed.
   Git 2.34+ is required only for tracked locations or explicit Git capture.
2. Obtain the selected Kit artifact and its independently reviewed content pin.
   Copy its files into an absent project-selected directory. Verify the pin and
   payload with `node <kit>/scripts/audit-distribution.mjs <kit>`. See
   [distribution](distribution.md) for the repository allowlist and pin definition.
3. Copy [project_config.json](../templates/project_config.json) outside the dataset.
   Replace every placeholder with explicit choices. Relative paths resolve against
   this configuration file, not the shell directory. Dataset and persistent workflow
   must be disjoint; configuration must stay outside the dataset. Do not move or
   regenerate an existing dataset to match an example.
4. For tracked locations, initialize/select an appropriate Git worktree and review
   effective ignore rules. For local locations, separately review source-control
   exposure and backup: the Kit neither requires exclusions nor promises files are
   untracked. Never silently edit ignores, untrack data or discard prior workflow.
5. Merge or reference [AGENTS.fragment.md](../AGENTS.fragment.md) in the host's
   existing instruction hierarchy. Point it to this Kit and configuration. Supply
   [Progress Curator](../agents/progress_curator.md) and its linked policies to a
   human or read-only agent with a bounded [work summary](../templates/work_summary.md).
   No role framework or engineering process is required.
6. For an explicitly selected **absent** dataset run `chronicle init <dataset>` once.
   For an existing dataset preserve identity/guidance. Run `chronicle validate <dataset>`;
   stop on errors and review warnings. Create the selected persistent workflow directory
   outside it. Preserve Core's `.gitattributes` when passing evidence through Git.
7. Retain the adopted `RELEASE.json` in workflow storage under a distinct pin-specific
   filename. In each relevant proposal bind that exact copy through `context.snapshots`
   as `{path, sha256}`. Do not add Kit fields to Core records or configuration.
8. Try the [isolated consumer exercise](../examples/consumer/README.md), then assess
   a real bounded packet using the summary/recommendation templates. Follow the
   [publication reference](guarded-publication.md): retain context/evidence, prepare,
   inspect every proposed action and Core diagnostics, exclusively create the exact
   author [disposition](../templates/disposition.json), apply, validate the live dataset,
   and verify the successful receipt. The exercise's synthetic approval is never
   approval for project history. Non-author decisions have no proposal digest or writes.

Three illustrative choices (all explicit, not defaults):

| Model | Dataset | Workflow | Kit |
| --- | --- | --- | --- |
| A | `chronicle/`, tracked | `dev/chronicle-workflow/`, local | `dev/chronicle-kit/` |
| B | `dev/chronicle/`, local | `dev/chronicle-workflow/`, local | `dev/chronicle-kit/` |
| C | externally chosen absolute path, local | separate external absolute path, local | any chosen project directory |

The unrelated Lumen exercise uses `specimen-ledger/`, `decision-cabinet/` and
`tools/history-notes/`; these names are also only examples. Both tracked and both
mixed tracking combinations are valid when each tracked location meets its rules.

# Manual upgrade

Obtain version B separately and verify its pin. Review A→B file differences together
with local adaptations; select reviewed changes into a separate copy before switching
the host reference. Preserve dataset, configuration, tracking policy, host instructions
and persistent workflow bytes. Keep the prior pin and adopt a new pin-specific workflow
snapshot; old decisions continue to identify A. Do not overwrite local adaptations.

Recheck all five configuration fields and the new metadata's supported contract/Core
versions; run payload verification and the isolated example with the new copy, then
Core validation on the selected existing dataset. Unsupported config versions fail;
read and explicitly review any required contract migration before use. There is no
automatic migration, installer, ignore edit or data regeneration. Pending approvals
remain bound to their exact artifacts and baseline; reconcile them explicitly rather
than retrying through altered code or redirecting configuration. The publication
helper does not have a separate config-check command: prepare validates configuration
without live dataset mutation; use it only for a real reviewed proposal when needed.
