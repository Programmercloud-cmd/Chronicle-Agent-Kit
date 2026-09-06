# Component 1 — Integration and workflow contract

Status: assigned; acceptance requires independent read-only critic review.

## Scope

Produce source-linked documentation for the independently versioned Chronicle
Agent Kit targeting Core v0.2.1, commit
`7ed80d3b64b7affef12b8509a5adb814d7ce14b1` in
`Programmercloud-cmd/AI_Chronicle_UI`. This component changes documentation only
in `Programmercloud-cmd/Chronicle-Agent-Kit`.

## Deliverables

- Core inventory with immutable source links, CLI diagnostic handling, public v1
  authoring constraints, and separate Core/Kit/engineering-process ownership.
- Explicit configuration contract with version, dataset path/tracking and
  independently selected persistent workflow path/tracking; no implicit defaults,
  disjoint resolved locations, safe adoption, no automatic data reconciliation.
- Framework-neutral read-only curator contract with five classifications and
  correspondence to Core's authoring guide.
- Immutable responsible-main-agent disposition contract, exact proposal approval,
  auditable inputs/context/recommendation, receipts, pending-publication recovery,
  reconsideration, and duplicate suppression.
- Exact persisted artifact digests are integrity/staleness bindings, never
  semantic-equality identifiers. Stable work-packet IDs and prior dispositions
  drive duplicate suppression; changed evidence/context permits reassessment and
  accumulated subordinate results may later support one significant milestone.
- Worked cases: subordinate acceptance, Current-only change, validated direction
  change, duplicate replay, and pending publication. Explain expected actions,
  authority, evidence, chronology, and forbidden promotion where appropriate.
- Document authoring sequence, admission, provenance, publication safeguards and
  future component verification obligations without implementing helpers.

## Boundaries

No helper, executable kit behavior, dataset creation, dogfooding, consumer pilot,
Core edits, or HERA edits. Consumer paths, roles, commands, policies, and document
structure must not become distributable dependencies. Local gauntlet instructions
and temporary engineering evidence are separate from distributable contracts.
No milestone is automatically justified by this component's acceptance.

## Verification and admission

Developer reads the pinned source, writes the documentation, verifies source
links and contract consistency, and records actual command evidence and remaining
assumptions under `dev/evidence/`. Verify installed Core against existing examples
and focused relevant tests; avoid pretending documentation scenarios are runnable
fixtures or claiming future helper safeguards have been implemented.

An independent critic reads source and deliverables without editing, and returns
evidence-backed `ACCEPT` or actionable `REJECT`. At most two repair submissions
are allowed before orchestrator escalation. Only accepted documents integrate.
The orchestrator stops after Component 1 acceptance and reports evidence and
assumptions. The remaining seven components stay deferred.

## Developer submission navigation

- [Core inventory and integration](../core-integration.md)
- [Configuration contract](../project-configuration.md)
- [Curator/disposition and publication workflow](../workflow-contract.md)
- [Five worked cases](../worked-cases.md)

The documents specify later component behavior. No helper, executable fixture,
dataset, consumer adapter, or runtime safeguard is implemented in Component 1.
Acceptance status and the independent review are recorded by the orchestrator;
this assignment is not itself an acceptance or a History milestone.
