# Milestone admission

This policy refines, without changing, the accepted [workflow contract](../docs/workflow-contract.md)
and [Core boundary](../docs/core-integration.md). Only the responsible main agent
promotes milestones through an explicit disposition approving an exact proposal.

> Would a technical project owner returning after several days need this development on the primary History timeline to understand where the project is, why its direction changed, or what important validated knowledge was gained?

Bias strongly toward **no milestone**. State the concrete changed understanding,
capability, architecture, significant failure, approach, or phase. If that sentence
cannot be supported by relevant evidence and scoped authority, do not recommend
promotion. Use subordinate recording or defer the claim. The number of tasks,
commits, reviewers, successful runs, or hours spent cannot supply significance.

## Necessary distinctions

- Task completion != milestone. A completed task may add no useful history at all.
- Critic ACCEPT != milestone. It establishes only the acceptance scope stated;
  acceptance of an internal component does not establish a capability or gate.
- Git branch != Chronicle branch. Only meaningful divergence warrants a lane.
- New Current status != necessarily new milestone. Operational changes belong in Current.
- Valid evidence hash != truthful claim. Hashes check bytes, not authenticity,
  relevance, validity of reasoning, acceptance authority, or historical significance.

An important hypothesis confirmed or disproved, an established consequential root
cause, or a meaningful accepted capability can merit one candidate. A benchmark
is usually subordinate; it can support a candidate direction change when the
result actually causes an authorized change of chosen approach. A rejected or
abandoned approach qualifies only when its significant consequence is established;
ordinary failed experiments remain subordinate. Reverts follow the same rule:
undoing a routine commit is subordinate, while an evidenced strategic return may
qualify as a direction change. No event kind is automatically a milestone.

## Deterministic choice when several effects exist

First resolve workflow replay/pending states below. For a genuinely new assessment:

1. A **significant established chosen-direction change or meaningful divergence**
   takes `BRANCH_OR_DIRECTION_CHANGE`. A proposal to change approach without an
   established decision does not. A new lane is not required for every change.
2. Otherwise a **significant established consequence or validated knowledge gain**
   takes `MILESTONE_CANDIDATE`. Acceptance of a narrow component alone fails this test.
3. Otherwise an **established operational state change** takes `CURRENT_STATE_UPDATE`
   when Current can exist; recommend roadmap as a companion if actually affected.
4. Otherwise **useful new subordinate information** takes `ENGINEERING_EVENT`.
5. Otherwise take `NO_CHRONICLE_UPDATE`.

These are evidence-based tie-breaks, not a promotion ladder. An unsupported broad
claim cannot outrank a supported small fact. If evidence is ambiguous but the
bounded observation is established and worth retaining, recommend an event that
states the uncertainty, not the claimed breakthrough. If nothing new is established
or sources are missing/irrelevant, recommend no update and list the missing support.
A project with no accepted milestone cannot author Current: use a useful unlinked
event and/or roadmap recommendation, or no update if there is no useful change.

Companion actions are recommendations to update Current or roadmap, never a second
primary classification. Recommend them only for changed facts; do not refresh Current
merely because a curator ran. A significant historical failure can be a milestone
candidate without changing the accepted Current pointer. Significance is independent
of timestamp precision: a candidate may retain a missing historical instant as a
blocking authoring question; never invent time to make it publishable.

## Replay, evidence changes, and accumulation

Start with stable packet IDs and prior dispositions, then compare claim, evidence,
acceptance scope, and relevant context. SHA-256 workflow/proposal digests bind exact
persisted artifacts for integrity/staleness checks; **they are not semantic-equality
identifiers**. Formatting-only byte changes do not create new progress. Do not edit
an immutable old bundle to substitute new bytes.

- Same already-applied claim and scope with a verified receipt: `NO_CHRONICLE_UPDATE`,
  reuse prior disposition/receipt, no duplicate supporting records or milestone.
- Same no-update, deferred, or rejected assessment without substantive change:
  `NO_CHRONICLE_UPDATE`, reuse its existing decision, including its original meaning.
- An approved proposal without a verified successful receipt: `NO_CHRONICLE_UPDATE`
  for fresh authoring, identify **pending publication**, and request reconciliation.
  Never count success or allocate replacement records. Missing/inconsistent audit
  artifacts likewise block automated publication. Only the responsible writer can
  verify recovery ownership, bindings, full actions and Core validation.
- Changed evidence or relevant context permits reassessment, not automatic promotion.
  Explain the substantive difference, retain provenance, and recommend explicit
  `supersedes` when reconsidering the earlier decision. A changed hash alone is insufficient.
- A new aggregate packet can establish a newly meaningful accepted capability using
  previously subordinate packets. List contributing IDs and dispositions; assess the
  **new aggregate claim** once, reuse existing supporting records, and recommend late
  attachment only if warranted. Prior subordinate publication does not veto promotion.

Many iterations should yield zero automatic milestones. One significant accepted
aggregate may yield one candidate; replay after verified publication yields none.
No background scheduler, threshold counter, keyword rule, or engineering acceptance
may bypass responsible-main-agent judgment.
