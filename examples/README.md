# Choose an authoring recipe

Use these rules with the [workflow contract](../docs/workflow-contract.md) and
[prepare/apply formats](../docs/guarded-publication.md). The [five worked cases](../docs/worked-cases.md)
provide additional context. Try the [fresh consumer exercise](consumer/README.md)
for real capture, preparation, exact approval, publication and replay. Its synthetic
records are never permission to author real project history.

| Progress | Curator primary | Intended records / responsible decision |
| --- | --- | --- |
| No useful new fact or unchanged replay | NO_CHRONICLE_UPDATE | Retain/reuse no-update workflow decision; no dataset writes. Applied replay reuses original author disposition and receipt. |
| Useful subordinate result | ENGINEERING_EVENT | Evidence and engineering event; leave unlinked if no appropriate milestone exists. No fabricated baseline or Current. |
| Active work, blocker, hypothesis or next step changes | CURRENT_STATE_UPDATE | Replace Current, update machine freshness time, preserve accepted milestone identity. |
| Significant validated capability/knowledge | MILESTONE_CANDIDATE | Explicit main-agent approval after preparation; accepted milestone with sourced occurrence, recording time, branch, parents, actual evidence and acceptance criteria/results. Current may advance. |
| Meaningful chosen divergence | BRANCH_OR_DIRECTION_CHANGE | A new branch and its first milestone together; first parent across branches establishes origin and must be earlier. Use explained semantic relations only where true. Git branch creation alone is insufficient. |
| Consequential abandoned approach | BRANCH_OR_DIRECTION_CHANGE | Preserve abandoned/rejected milestone; later accepted approach can supersede it. Never point Current at rejected/abandoned history. |
| Future plan changes without History significance | CURRENT_STATE_UPDATE when Current projection/operations change; otherwise ENGINEERING_EVENT for a useful planning rationale | Replace roadmap order/status/sequence; maintain Current's projection chain when present. Preserve significant rationale in an event or independently qualifying milestone. |
| Clerical/capture error | ENGINEERING_EVENT | Append guarded clerical_correction revision; keep historical file bytes. This classification need not add a redundant event. |
| Later legitimate evidence | ENGINEERING_EVENT | Capture new evidence, then late_attachment revision targeting event/milestone and changing allowed evidence attachment fields. Evidence records themselves are not revision targets. |
| Significant established new conclusion after old conclusion was honestly recorded | MILESTONE_CANDIDATE or BRANCH_OR_DIRECTION_CHANGE according to consequence | Later milestone and explained relation; never disguise changed understanding as a correction. |
| Significant code capability | MILESTONE_CANDIDATE | Actual explicitly scoped captured Git patch, full immutable revisions, artifact SHA-256, code_changes.diff_evidence_id and explanatory commentary. Commentary never substitutes for the patch. |
| Several subordinate results establish one new capability | MILESTONE_CANDIDATE | New aggregate packet, bound contributing dispositions/receipts and evidence; one new meaningful milestone without duplicating earlier events. |
| Approved proposal with no successful receipt | NO_CHRONICLE_UPDATE for fresh authoring | Reconcile existing approval, baseline and operation state. No replacement disposition and no presumed success. |

For every authored case: packet → read-only recommendation → complete proposal →
Core validation → responsible exact author disposition → guarded apply → live Core
validation and successful receipt. Keep all approval and recovery artifacts outside
Core. Review warnings explicitly; never change hashes to make validation pass.

Do not promote merely because a commit exists, lines changed, work finished, review
accepted, tests passed, benchmark ran, Git branch appeared, documentation changed,
time elapsed or evidence hashes validate. A plausible schema-check report does not
prove downstream identifier preservation. A date-only historical source does not
supply an exact occurrence instant: retain the candidate if significance is supported,
but defer authoring until truthful chronology is available.

The repository's archived executable authoring cases are acceptance provenance and
contain original machine capture paths. They are intentionally outside this clean
payload; they are not runtime dependencies or transplantable approvals. These recipes
retain their authoring semantics without distributing machine-local evidence.
