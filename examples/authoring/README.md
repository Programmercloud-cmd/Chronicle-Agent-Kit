# Authoring examples

Choose the case closest to the **owner-facing consequence**, then narrow its claim
to the evidence you actually have. A completed task or a passing check is not by
itself a milestone. Ask: “Would a technical project owner returning after several
days need this development on the primary History timeline to understand where
the project is, why its direction changed, or what important validated knowledge
was gained?” Default to no update, an engineering event, or deferral.

These independent examples describe a **synthetic token-import teaching project**.
Executable toy checks really ran; their bounded outputs and observation instants
are retained as artifacts. They are not acceptance evidence for a real product.
The saved datasets are reading fixtures. Never copy their project identity,
occurrence times, approvals or evidence into your project's history.

| Your situation | Recipe | Primary classification |
| --- | --- | --- |
| Nothing new | [No update](cases/01-no-update/README.md) | `NO_CHRONICLE_UPDATE` |
| Useful bounded result, no project consequence | [Subordinate event](cases/02-subordinate-event/README.md) | `ENGINEERING_EVENT` |
| Blocker/work/hypothesis/next step changed | [Current only](cases/03-current-only/README.md) | `CURRENT_STATE_UPDATE` |
| A meaningful bounded capability was accepted | [Milestone](cases/04-milestone/README.md) | `MILESTONE_CANDIDATE` |
| Meaningful divergence needs a separate lineage | [Branch/direction](cases/05-direction/README.md) | `BRANCH_OR_DIRECTION_CHANGE` |
| A significant approach failed or was abandoned | [Abandoned approach](cases/06-abandoned/README.md) | `BRANCH_OR_DIRECTION_CHANGE` |
| Future sequence changed, not history | [Roadmap only](cases/07-roadmap/README.md) | `CURRENT_STATE_UPDATE` |
| A historical record contains a clerical error | [Historical correction](cases/08-correction/README.md) | `ENGINEERING_EVENT` |
| Legitimate evidence was retained but attached late | [Late evidence](cases/09-late-evidence/README.md) | `ENGINEERING_EVENT` |
| A significant code capability was accepted | [Actual captured diff](cases/10-code-change/README.md) | `MILESTONE_CANDIDATE` |
| The packet was already published | [Successful replay](cases/11-duplicate-replay/README.md) | `NO_CHRONICLE_UPDATE` |
| Several subordinate results now establish one new claim | [Accumulated promotion](cases/12-accumulated/README.md) | `MILESTONE_CANDIDATE` |
| Approval exists, publication has not happened | [Pending authorization](cases/13-pending/README.md) | `NO_CHRONICLE_UPDATE` |

Read [the common authoring sequence](process.md) once. Each recipe has a compact
packet/recommendation/decision description and a focused `dataset/` containing
actual Core-format records. [Forbidden cases](forbidden.md) distinguish a policy
refusal from the four examples that Core itself rejects.

The curator's primary classification describes significance, not a schema type:
a correction may be `ENGINEERING_EVENT` while its exact proposal creates only a
revision; a roadmap operational update may be `CURRENT_STATE_UPDATE` without any
new history. Companion effects always belong in the approved proposal.

## Executable verification

From the Kit repository, with the already installed Core v0.2.1:

```sh
node --test tests/component-5.test.mjs
chronicle validate examples/authoring/cases/05-direction/dataset
```

The tests call the unchanged `now`, `capture`, `prepare`, and `apply` CLI operations.
They keep fresh complete workflow artifacts, final datasets, exact source reports,
raw staged/final validation and publication receipts under a new
`dev/evidence/component-5/run-<machine-time>/` directory. That is test evidence
storage, not a consumer default. `index.json`, each `result.json`, and `steps/*.json`
locate the exact bundles/receipts. Each generated configuration explicitly selects
independent local dataset/workflow paths; the tests never install dependencies or
modify a consumer project. The test-only fixture builder is not a Kit authoring API.

The compact saved datasets are also revalidated through installed Core. Their
capture provenance truthfully retains the source paths and Git object identities
from the original toy run; those locators are descriptive, not a requirement that
another machine has the same directories. Contained captured bytes remain the
portable evidence. Code evidence includes both an actual patch and bounded test
results: neither commentary nor a valid hash establishes semantic truth alone.
