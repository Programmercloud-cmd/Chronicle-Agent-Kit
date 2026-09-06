# Current-state classification

Follow the [Core integration contract](../docs/core-integration.md) and
[milestone admission tie-breaks](milestone_admission.md). Current describes the
project's operational state, hypothesis, active work, next step, blockers, and
freshness; it is not a second History timeline.

Recommend `CURRENT_STATE_UPDATE` when those facts have substantively changed and
no significant History or direction consequence is established. Examples include
a new blocker, changed next task, resumed investigation, or a revised operational
hypothesis still awaiting validation. A planned change is not an accepted capability.
No dataset write is useful for a merely repeated status or a new clock reading.

Keep the existing accepted `milestone_id` unless an accepted later milestone
actually becomes the project state. Current-only updates do not fabricate a
baseline, create a milestone, or move its pointer to an event, rejected milestone,
or unaccepted candidate. A hypothesis can change operationally without asserting
that it is confirmed or disproved.

Current cannot exist before the first accepted milestone. In that situation,
recommend an unlinked useful engineering event and, if affected, roadmap; do not
create Current or a synthetic accepted baseline to satisfy the interface.

For a milestone/direction recommendation, Current and roadmap are companions only
where the established new facts change them. Historical significant failure or
rejected/abandoned work need not move Current's pointer. Keep roadmap's projection
an exact follows-chain from Current, respecting branch and chronology constraints;
unknown context remains an unresolved question before authoring.

The writer supplies machine-generated `updated_at` when preparing an actual change,
not the curator. Never invent timestamps, rewrite historical occurrence times,
or regenerate frozen proposal times during replay or pending-publication recovery.
All companion writes belong in the same exact approved proposal; recommendations
are not permission for unapproved later changes.
