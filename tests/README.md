# Component 2 verification

Run dependency-free checks with Node.js:

```sh
node --test tests/component-2.test.mjs
```

`fixtures/curator/cases.json` has 33 synthetic cases with separately addressable
`input` and `expected` objects. Every source file is explicitly synthetic and its
exact bytes, SHA-256, and source text are included for assessing support, not for
pretending authenticity. The expected section defines classification, permitted
companions, forbidden classifications, workflow handling, and rationale.

For an actual read-only curator exercise, supply the role, its linked policies,
`fixtures/curator/response-format.json`, and only `{id, input}` from each case.
Do **not** supply expected outcomes, evaluator source, sequence expectations, or
this README's answer totals to the assessor. An external runner can perform this
extraction; the test tooling intentionally supplies no classifier or authoring
helper. Store the actual model/human responses and invocation provenance under
local engineering evidence, then run:

```sh
node tests/evaluate-curator.mjs dev/evidence/component-2/actual-response.json
```

The evaluator checks all cases appear exactly once, exactly one expected/allowed
classification, forbidden outcomes, known evidence IDs, questions where necessary,
companion restrictions, supported history IDs/branch actions, and distinct workflow
handling. It does not establish that rationale is truthful, that permitted companions
are complete, or that the assessor remained read-only. A reviewer must inspect
actual responses for claim support, admission restraint, topology/authority and
pending/replay handling and check invocation provenance. Hand-authored expected
answers and keyword classifiers are not evidence of curator behavior.

Fixtures cover 14 no-update, 7 engineering-event, 1 Current-only, 7 milestone-candidate,
and 4 direction/branch results. Four producer kinds (human, CI, investigator, other
framework) supply facts without requiring a gauntlet. Only the deliberately scoped
intermediate-review case mentions developer/critic acceptance. Sequence checks model
repeated iterations, accumulated promotion, replay, pending and reconsideration.
No fixture promotes a milestone automatically.

Prior-context fixtures explicitly keep roadmap projection anchors aligned with
their accepted Current pointers, including after successful publication. History
cases with operational deltas state the changed fields and preserve the prior
accepted pointer until a writer has the appropriate accepted anchor. A significant
abandoned-approach case explicitly changes no Current field: historical significance
alone does not justify a companion or a freshness-only update. Mechanical checks
guard those input/expectation boundaries; reviewers still assess companion scope.

[Disposition scenarios](../examples/curator/disposition-scenarios.json) are readable
state projections, not valid decision bundles or fake success receipts. Full
persisted artifact/disposition semantics remain in Component 1. Component 2 does
not test a not-yet-implemented capture or publication helper, and these synthetic
inputs are not Core datasets. Core validation and authoring recipes remain later
components.
