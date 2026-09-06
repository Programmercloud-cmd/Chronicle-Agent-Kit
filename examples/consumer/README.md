# Fresh unrelated consumer: Lumen specimen index

The collection steward uses a specimen assistant to retain one label-trimming
observation. There is no prescribed engineering process or agent framework. This
synthetic exercise uses only the copied Kit, Node 22+ and installed Core v0.2.1.
Its local mode needs no Git and no Core source checkout. Keep its sandbox separate
from real project data. The script is teaching fixture construction, not an installer
or an alternate publication implementation.

From any directory, using an already verified Kit copy:

```sh
node <kit>/examples/consumer/exercise.mjs prepare <absent-synthetic-sandbox>
```

This explicitly initializes a fresh synthetic dataset and local configuration,
executes `" iris ".trim()`, captures its original report bytes through `capture`,
and prepares one unlinked engineering event through the real helper. It creates
no milestone or Current. `prepare` leaves the live dataset unchanged after evidence
acquisition. The full [input packet](first-packet.json) and retained recommendation
make the narrow significance assessment reviewable. The five
[source-neutral packets](producer-packets.json) show repeated established results
from different producers; all warrant NO_CHRONICLE_UPDATE under the same policy.

Inspect `settings/notes.json` and `decision-cabinet/example-state.json` for locations
and the unique disposition bundle. In that bundle read work-summary.md,
recommendation.md, context.json, request.json, proposal.json and proposal/review.json.
Review the proposed event bytes and Core diagnostics. Check that the context snapshot
binds the adopted release metadata. The recommendation does not authorize publication.

Only after that review, explicitly approve the synthetic proposal and apply:

```sh
node <kit>/examples/consumer/exercise.mjs approve <synthetic-sandbox>
node <kit>/examples/consumer/exercise.mjs apply <synthetic-sandbox>
chronicle validate <synthetic-sandbox>/specimen-ledger
```

`approve` exclusively records the collection steward's exact author disposition;
use it only for this teaching exercise. Real projects must use their own responsible
decision, the [disposition template](../../templates/disposition.json) and
[publication formats](../../docs/guarded-publication.md). The resulting dataset has
one evidence record/artifact and one subordinate event. The workflow receipt proves
successful publication, separately from approval.

Run the same `apply` command again: it verifies and returns the existing receipt
without duplicate records or workflow writes. Do not delete state to repeat the
exercise; select another absent sandbox. A missing or inconsistent receipt is a
reconciliation issue, never presumed success. The report supports only the selected
label, and its machine observation time is not a reconstructed historical timestamp.

For a dry classification, supply one producer packet, the role and linked policies
to a read-only human/agent. Compare its single primary classification and rationale
against the repeated-result rule. No producer's title grants promotion authority.
