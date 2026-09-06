# Component 6 correction — explicit stable release metadata

Resolve only the release BLOCKED verdict: the shipped auditor admits only review
candidates. No capture/publication/curator/Core/consumer behavior changes. Add a
small strict version/status check in the existing auditor, public lifecycle text,
and focused tests. Preserve every current allowlist path and other audit check.

Version syntax is SemVer 2.0.0: MAJOR.MINOR.PATCH, optional prerelease and build
identifiers. Numeric core/prerelease identifiers have no leading zeros. Existing
rc.1 and synthetic upgrade build suffixes remain valid. No coercion, v prefix,
whitespace, malformed separators, missing numeric components or unknown status.
Only review-candidate and stable are allowed. Review-candidate permits prerelease
or final versions; stable requires a final version (build metadata is permitted
and does not create a prerelease). These are artifact declarations, not signature,
authority, remote publication, or evidence of having passed a review.

Manual transitions: new reviewed candidate iterations are new artifacts; a frozen
prerelease/review-candidate may become its same-core final/stable version, or a
final-version/review-candidate may become same-version/stable. Promotion preserves
all 29 payload bytes/file-map/content digest, changing only release version/status.
Retain exact earlier metadata; never rewrite adopted pins or historical approvals.
After stable acceptance, any payload change requires a separately reviewed new
candidate, not silent editing/demotion of the old stable artifact. The read-only
single-artifact auditor validates allowed states, not transition history or human
authority. Manual comparison/tests/critic establish those conditions; no new command.

Two boundaries must be explicit: correcting auditor/docs necessarily changes two
allowlisted files and their pin relative to accepted rc.1. Root metadata becomes
0.1.0/review-candidate after this correction, distinguishing its new exact metadata
and content pin from rc.1. Once independently accepted, freeze that corrected candidate;
its promotion to 0.1.0/stable changes status only and all 29 payload files stay exact.
No claim that the correction itself leaves original rc.1 payload bytes unchanged.

Developer submission -> executable tests -> independent read-only critic, at most
two repairs -> ACCEPT/block. Then resume, not restart, release verification: fresh
complete regressions, stable clean consumer with actual no-Git/local and Git/tracked,
Core dogfood/HERA validation, payload audit/checksums and final independent release
critic. No tags/push/publication; no automatic updates to adopted Kit copies/datasets.
Record engineering evidence. Read-only Progress Curator assesses significance before
any Chronicle update; do not promote engineering acceptance automatically.
