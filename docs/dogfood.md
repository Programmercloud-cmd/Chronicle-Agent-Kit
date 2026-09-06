# This project’s Chronicle

The Kit is adopted through the public Component 6 process. This file is project-local
consumer guidance, outside the distributable allowlist.

- Configuration: `chronicle-kit.config.json` (format 1, repository-relative paths).
- Dataset: `chronicle/`, intentionally tracked.
- Persistent workflow: `.chronicle-workflow/`, independently intentionally tracked.
- Adopted consumer copy: `tools/chronicle-kit/`, 0.1.0-rc.1 review candidate, exact pin
  `dc469ff1d861bf4ccf7c39e6ac6fa3a264f27c919a55925706dbc616bc6bcb6c`.
- Exact metadata is retained under `.chronicle-workflow/pins/`; context snapshots bind it.
- Host instructions: `AGENTS.md` references the copied fragment/role and explicit config.

No files were staged or committed and no ignore policy was changed. Tracked means
intended durable versioning, not a claim that an automatic commit occurred. Preserve
all workflow decisions/receipts between sessions. Review these files through the
project’s normal source-control process; do not discard or regenerate them.

```sh
node tools/chronicle-kit/scripts/audit-distribution.mjs tools/chronicle-kit
chronicle validate chronicle
chronicle serve chronicle --host 127.0.0.1 --port 4317
```

The dataset ID remains Core’s initialized `chronicle`; its title was intentionally
updated to Chronicle Agent Kit through a guarded proposal. Core guidance and evidence
.gitattributes remain intact. All records use public Core v0.2.1 fields and public
Kit capture/prepare/apply; no example/test-only authoring API maintains real data.

The single root KIT-001 states contemporaneous verification of the accumulated
accepted baseline. Its occurrence is sourced from the recorded present observation;
no earlier component/aggregate acceptance timestamp was reconstructed. Components
1–6 and the correction remain subordinate evidence, not six History nodes. Later
operational facts change Current only. The pending pilot roadmap item is not a
future milestone or authorization to begin consumer integration.

Use the copied summary/recommendation and publication references for new work. Reuse
unchanged verified decisions. Once a later legitimate publication changes the full
live state, direct replay of an older receipt conservatively needs reconciliation;
review that receipt as bound historical context for a new packet rather than forcing
it against changed data. Never remove receipts/locks or invent new IDs to bypass it.

The real packet, proposals, author dispositions, publication receipts and selected
sources live under the configured workflow. Local execution/UI/critic evidence is
under dev/evidence/component-7, not runtime functionality. Selected earlier development
reports are evidence inputs only; copied runtime behavior never imports dev/ or Core
source. Source provenance paths remain truthful to this machine.
