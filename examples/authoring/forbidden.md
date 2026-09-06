# Forbidden promotion and invalid records

[The 13 policy packets](forbidden.json) each name the claim, prior context, evidence
limits, expected classification, non-author decision and reason. They are manually
reviewed policy examples, not an automatic keyword classifier. The tests preserve
the unchanged dataset and persist exact recommendation/disposition artifacts;
they never fabricate milestone proposals from these triggers.

| Trigger alone | Decision |
| --- | --- |
| A commit exists | Reject promotion |
| Many lines changed | Reject promotion |
| Developer work completed | Reject promotion |
| A critic returned ACCEPT | Reject promotion |
| Tests passed | Reject promotion |
| A benchmark ran | Reject promotion |
| A Git branch was created | Reject promotion |
| Documentation changed | Reject promotion |
| Time elapsed | Reject promotion |
| Evidence has a valid hash | Reject promotion |

These packets establish no new operational state or useful unrecorded subordinate
conclusion, so their primary result is `NO_CHRONICLE_UPDATE`. A different packet
may deserve an engineering event; the trigger is never enough for a milestone.

The plausible-but-irrelevant case supplies an actual passing input-schema check:
JSON contains a `tokens` array with `"007"`. It does **not** test downstream
conversion/storage or establish end-to-end identifier preservation. Its exact
bytes and valid SHA-256 can be bound while its claimed support is rejected.
The primary classification is ENGINEERING_EVENT for the new useful narrow check; the main-agent disposition defers the requested broad claim. No event is published until a separately scoped exact proposal is prepared and approved. No milestone is justified.

The historical-time case records a significant accepted capability only at date
precision. It can remain `MILESTONE_CANDIDATE` while its main-agent decision is
`defer`. Significance and publishability are separate: do not invent seconds,
change the date, or substitute capture/recording time for unknown occurrence.

The changed-conclusion case rejects a requested historical revision. A correctly
recorded quantity claim must not become rejected merely because a later identifier
requirement differs. The primary recommendation is `BRANCH_OR_DIRECTION_CHANGE`;
the requested rewrite is rejected and no publication occurs. Core can validate
some such revisions structurally, but it cannot decide whether the asserted
clerical-error justification is truthful. A later scoped milestone and relation
is the correct authoring path, after new preparation and explicit approval.

## Cases Core itself rejects

The test constructs each intentionally invalid dataset from an independently
valid baseline and checks the exact public diagnostic code. They are retained
under `core-invalid/` in the test evidence directory and never passed to apply.

| Invalid mutation | Expected Core diagnostic |
| --- | --- |
| Current points to absent `MISS-001` | `current-milestone-missing` |
| Parent and child share occurrence instant | `parent-not-earlier` |
| Artifact bytes changed without changing its accepted record | `artifact-sha256-mismatch` |
| Revision's guarded `from` differs from the recorded value | `guard-mismatch` |

Core-invalid and policy-forbidden are deliberately different categories.
Core verifies consistency and exact bytes; the responsible agent must still
review relevance, authority, chronology provenance and returning-owner significance.
