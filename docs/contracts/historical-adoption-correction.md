# Component 7 correction — historical adoption evidence

Scope: project-owned tests/fixtures and this corrective contract only. No distributed payload, historical dataset/evidence/adopted copy, accepted receipt, Core, or external consumer edits.

Historical adoption is an immutable observation of a particular release. Bind the original C7 baseline artifact, adopted rc.1 metadata, retained pin and captured release metadata to their original exact hashes and declared review-candidate state. Validate all adopted payload bytes through their historical manifest and the public distribution audit. Never compare old metadata with the evolving source release.

Current source is independently bound to the already accepted C6 correction: pin its immutable critic verdict and corrected candidate/stable metadata identities. A test-only expectation fixture names these historical and current states. Current source must match the exact accepted corrected payload; a temporary stable copy must pass the unchanged public audit. Only the documented metadata transition is allowed; meaningful historical/current differences are asserted explicitly, not normalized.

The old 7,957-file inventory remains immutable. For current-source preservation, resolve expectations through the exact independently accepted correction verdict: only explicitly reviewed replacements receive their approved hashes, all other baseline entries retain their original expectation. Every reviewed replacement/new file is checked; a metadata-only promotion uses its separately fixed stable metadata identity. This is a bounded test fixture, not a snapshot updater or permissive ignore list. Future accepted evolution requires separately reviewed fixture expectations with provenance. Do not derive approvals from current output.

Positive and adversarial tests must cover historical identity, current candidate/stable identity, meaningful differences, payload tampering, metadata repinning, unexpected source changes/deletions, altered baseline/acceptance evidence and rejected unknown states. Preserve existing C7 chronology, author bindings, Current/history, Core, replay and UI assertions. All other component suites remain unchanged.

Developer evidence → independent read-only critic → at most two repairs → ACCEPT. Only then resume fresh complete regressions, stable no-Git/tracked capture/publication/replay, audit, Core dogfood/HERA validation and payload comparison → final independent release verdict. Keep the existing Current-state classification; no milestone or automatic tag/publication.
