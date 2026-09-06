# Component 2 — Curator policies and fixtures

This bounded implementation uses the accepted [Component 1 workflow](../workflow-contract.md),
[configuration](../project-configuration.md), and [Core integration](../core-integration.md)
contracts as authoritative inputs. Do not modify those accepted contracts.

## Deliverables

- Distributable `agents/progress_curator.md`, `policies/milestone_admission.md`,
  `policies/chronicle_authoring.md`, and `policies/current_state.md`.
- Portable work-summary and curator-recommendation Markdown templates.
- Clearly labeled synthetic disposition-related examples for replay,
  reconsideration, pending decisions, and accumulated promotion. They are not
  real author approvals, records, receipts, or evidence of project progress.
- Classification fixtures, documented expected outcomes, and dependency-free
  tests for fixture completeness/coverage and evaluation of actual curator outputs.
  Do not implement a keyword classifier and call its output curator verification.
- README navigation, usage and verification instructions, and compatibility evidence.

The curator remains read-only, returns exactly one of the five accepted labels,
and may recommend companion Current/roadmap effects. It cannot implement code,
perform ordinary code review, write Chronicle records or dispositions, approve
its own recommendation, or promote milestones. The returning-owner question and
conservative admission rules control classification, independent of framework.

## Required coverage

Each fixture supplies a work packet, prior Chronicle/Current/disposition context,
evidence references (or explicit absence), one expected primary classification,
allowed companion actions, forbidden classifications, and concise rationale.
Keep inputs separable from expected results so a delegated curator can be assessed
without reading the answer key. Synthetic source material must be visibly labeled
and support assessing relevance and acceptance scope, not merely supply claims
that a hash is valid. Real fixture-byte hashes must never pretend authenticity.

Cover routine commits, formatting/refactoring, repeated tests, intermediate
developer/critic acceptance, accepted internal components without project impact,
Current-only updates, confirmed/disproved significant hypotheses, established root
cause, meaningful capability/gate acceptance, benchmarks with and without changed
approach, rejected/abandoned approaches, real direction changes, reverts, ambiguous,
missing and irrelevant evidence, accumulated promotion, disposition replay, and
changed evidence/context permitting reconsideration. Include human, CI,
investigator, and other-framework inputs without requiring a gauntlet.

Exercise stable packet-ID/prior-disposition replay handling, formatting-only byte
changes, missing/pending receipts, unchanged no-update/defer/reject outcomes, and
legitimate new aggregate claims. Exact-byte hashes are integrity/staleness bindings,
not semantic equality. Explicitly distinguish task completion, critic acceptance,
Git branches, operational Current changes, and hash validity from milestone merit.

## Verification and gauntlet

Developer implements and records temporary evidence under `dev/evidence/component-2/`.
Root arranges an actual read-only curator pass on inputs without the answer key,
then compares outputs to expected/forbidden results and reviews explanations and
companion recommendations. Independent critic evaluates the policies, fixtures,
actual responses, and Component 1 compatibility. At most two repair submissions
are allowed after the initial submission; then escalate concrete unresolved defects.
Only accepted deliverables integrate. No milestone follows automatically from ACCEPT.

## Exclusions

No safety helper, capture/prepare/apply implementation, guarded publication,
dataset authoring, Core change, consumer adapter, pilot, dependency installation,
or Component 3 work. Tests/evaluation tooling are confined to Component 2 quality
checks; distribution behavior must not depend on local `dev/` evidence, gauntlet
roles, specific consumer paths, command names, policies, or document structure.
