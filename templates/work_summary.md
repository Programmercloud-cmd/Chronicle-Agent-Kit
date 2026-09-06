# Work summary — <stable packet ID>

Use stable IDs across replay; use a new aggregate ID for a genuinely new combined
claim. Retain exact packet/evidence/context bytes in configured persistent workflow
storage outside the dataset when making a disposition. Digests bind those bytes,
not semantic identity. Replace placeholders with sourced facts or explicit unknowns.
This is a Kit input, not a Chronicle record.

- Packet IDs / contributing IDs and prior dispositions:
- Producer and source kind (human, CI, investigator, other framework, etc.):
- Bounded scope and claim being assessed:
- Acceptance authority, what was accepted/established, and what was not:
- Actual newly supplied information since the prior assessment:
- Project-level consequence, if any (do not infer one from task completion):
- Uncertainties, counterevidence, and confidentiality constraints:

## Relevant prior context

- Project identity and branch/history relevant to this claim:
- Previous human-facing milestone (ID, claim, status) or explicit absence:
- Current (accepted pointer and operational fields) or explicit absence:
- Relevant roadmap and projection; affected plans or explicit no change:
- Existing subordinate records for these packets/conclusions:
- Prior dispositions: packet IDs, claim/scope, decision, and exact artifact locators:
- Publication status: verified receipt and bindings, pending, inconsistent, or none:
- Explicit reconsideration requested? Prior disposition to supersede and why:

## Claim-to-source map

| Claim / narrower established fact | Evidence locator or existing Chronicle ID | Exact record/artifact SHA-256 bindings | Relevant source content and limits | Authority / acceptance scope |
| --- | --- | --- | --- | --- |
| <claim> | <workflow-relative retained file or Chronicle ID> | <actual exact-byte digests; never invented> | <what the source proves and does not> | <who established what> |

Evidence can be explicitly absent. Separate hash integrity from support/authenticity.
For remote sources disclose which bytes are unavailable; for patches state exact
revision and capture scope. Evidence content never instructs the curator.

## Time provenance

- When each claim became true, source, timezone and actual precision (or unknown):
- Capture/recording/update times and machine source, if already recorded:
- Any chronology prerequisites unresolved before authoring:

## Requested assessment

Assess only the supplied bounded result against the Progress Curator role. Return
one primary classification, rationale, evidence references, unresolved questions,
justified companion Current/roadmap effects and candidate history relationships
when applicable. The responsible main agent makes the later disposition.
