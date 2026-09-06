# The authoring sequence used by every case

1. **Packet and evidence.** Preserve a stable work-packet ID, what changed, prior
   Current/history/roadmap/dispositions, accountable acceptance scope, evidence
   references and limitations. Use [the work summary](../../templates/work_summary.md).
   A human, CI job, investigator or another agent framework can supply the packet.
   No engineering gauntlet is required for a consumer.
2. **Read-only recommendation.** Apply [the curator role](../../agents/progress_curator.md)
   and return exactly one primary classification, rationale, evidence support,
   questions, justified companion effects and historical relationships. This
   recommends; it never writes records or approves itself.
3. **Responsible-main-agent intent and prepared proposal.** Decide whether the
   claim merits authoring. If it does, write only the proposed existing Core-format
   records and explicit actions into a workflow bundle. Run `prepare` against
   the explicitly configured dataset. The main agent reviews the exact prepared
   bytes, Core result and every warning. Intent written before preparation is
   not the final approval.
4. **Bound disposition.** Only after successful preparation, exclusively create
   `disposition.json` with decision `author` and the exact persisted proposal,
   recommendation, input/evidence and context digests. The actor is the responsible
   `example-owner` in these teaching cases; a real consumer chooses its own
   accountable actor and scope. Use the [unchanged disposition contract](../../docs/workflow-contract.md).
5. **Guarded apply.** Apply the same bundle using the same explicit configuration.
   The helper rechecks live baseline, approved bytes, destination safety and
   shared writer guard. Only project, Current and roadmap are intentionally mutable.
6. **Final Core result and receipt.** Verify the live Core result and consistent
   `PUBLISHED` receipt. Approval alone is pending, never success. Missing or
   inconsistent success evidence requires reconciliation, not a blind retry.

The complete [prepare/apply encoding and commands](../../docs/guarded-publication.md)
are authoritative. A concrete invocation has this shape; obtain the actual bundle
UUID and request locator from the generated case's `steps/*.json` or your own
prepared work, not from an invented example identifier:

```sh
node scripts/chronicle-kit.mjs prepare --config /explicit/kit.json \
  --bundle "$BUNDLE_ID" --request "dispositions/$BUNDLE_ID/request.json"
# Review exact proposal and validation; responsible agent creates the disposition.
node scripts/chronicle-kit.mjs apply --config /explicit/kit.json --bundle "$BUNDLE_ID"
chronicle validate /explicit/dataset
```

For `no_update`, `defer` or `reject`, retain the recommendation and non-author
main-agent disposition outside Chronicle; no proposal or publication is needed.
For an unchanged replay, reuse the existing disposition and verified receipt.
Do not create a replacement no-update decision for a pending author disposition.
Changed bytes alone do not create new significance: hashes bind exact persisted
artifacts for integrity/staleness, while stable packet IDs and reviewed prior
claims/dispositions drive duplicate suppression.

## Reading a case's evidence

`case.json` is a teaching packet and the expected reviewed recommendation/decision,
not a Core record, approval or executable workflow bundle. `dataset/` is its
complete final Core fixture. The tests reconstruct actual packets and workflows
with newly generated IDs and machine times. In the resulting run directory:

- `sources/` contains exact original observations and stated scope;
- `review-store/dispositions/<id>/` contains summary, recommendation, exact context,
  request/payloads, staged proposal/Core output and immutable disposition;
- `review-store/receipts/` contains success receipts linked from `steps/*.json`;
- `final-core.json` and `result.json` identify the resulting state;
- replay and pending cases retain a separate assessment while preserving the
  original author disposition.

Fixture setup establishes explicit bounded prior claims using observed toy checks;
it does not manufacture a milestone just to create Current. Cases without an
accepted prior claim omit Current. Setup records are constructed as fixture input;
the scenario's new publication goes through real `prepare` and `apply`.

Occurrence time comes from a report's `observed_at`, sampled just after the actual
newly accepted toy check. Recording, capture and Current freshness use `now`.
When a later child needs a later instant, tests wait for the machine clock to
advance **before running the next acceptance**, with a timeout that fails rather
than altering chronology. Never copy these times or use capture time to fill an
unknown historical occurrence.
