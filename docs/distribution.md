# Content-pinned distribution

`RELEASE.json` identifies an independently versioned artifact with an explicit
`review-candidate` or `stable` status. Neither status claims that a Git tag or remote
release exists, nor authenticates the artifact or its approval. Its `files` map is the exact sorted payload
allowlist (relative path → SHA-256). `content_sha256` is SHA-256 of UTF-8
`JSON.stringify(files) + "\n"`. Metadata itself is retained beside those files.
A consumer pins the independently reviewed content digest and version; an attacker
who can replace both metadata and payload can create a different internally consistent
artifact. This is an integrity identifier, not a signature or authenticity claim.

## Release identity and manual promotion

Versions use SemVer 2.0.0 syntax: `MAJOR.MINOR.PATCH`, optionally followed by
prerelease identifiers (`-rc.1`, `-alpha`, etc.) and build identifiers (`+build.1`).
Core numbers and numeric prerelease identifiers cannot have leading zeroes; build
identifiers may. Prefixes, whitespace, missing components, empty identifiers and
non-string versions are rejected. Build metadata does not turn a final version
into a prerelease. Unknown statuses fail closed.

| Version | review-candidate | stable |
| --- | --- | --- |
| Prerelease, such as `0.1.0-rc.1` | Allowed | Rejected |
| Final, such as `0.1.0` (with optional build metadata) | Allowed for review before promotion | Allowed |

A review-candidate declaration means review is pending or the artifact remains a
candidate. A stable declaration asserts responsible release acceptance; the auditor
checks its form and bytes, not whether that acceptance occurred. It is not permission
to tag, publish or install anything. Separately review authority and authenticity.

Allowed manual transitions are new candidate iterations, then promotion of a frozen
candidate to stable: remove its prerelease suffix while retaining the same core
version and optional build metadata, or promote an already-final candidate without
changing its version. Promotion changes only RELEASE.json version/status; every
allowlisted file, its hash, and the content pin must remain identical. Compare the
complete inventories and retain the exact earlier metadata and metadata checksum.
If payload bytes change, first assemble and independently accept a new candidate
with recomputed hashes; do not disguise source corrections as metadata-only promotion.
After stable acceptance, changed payloads require a new reviewed candidate, not
in-place editing or demotion of the old stable artifact. Never overwrite adopted
pins, workflow approvals or project data during this process.

The read-only auditor takes one artifact. It validates these allowed states and
all existing payload boundaries; it cannot attest to a transition's history or
approval. The responsible release review compares predecessor/successor bytes and
checks authority. No automatic promotion or migration operation is provided.

From a repository checkout, inspect the allowlist, then run:

```sh
node scripts/audit-distribution.mjs . --source
```

Manually copy **only** `RELEASE.json` and its listed files, preserving relative
paths, into an absent destination. Copy with normal file tools; no installer is
required. For example, this explicit Node command copies the selected allowlist:

```sh
node --input-type=module -e 'import fs from "node:fs";import path from "node:path";const [src,dst]=process.argv.slice(1);const m=JSON.parse(fs.readFileSync(path.join(src,"RELEASE.json")));fs.mkdirSync(dst);for(const p of ["RELEASE.json",...Object.keys(m.files)]){fs.mkdirSync(path.dirname(path.join(dst,p)),{recursive:true});fs.copyFileSync(path.join(src,p),path.join(dst,p),fs.constants.COPYFILE_EXCL);}' <source-kit> <absent-copy>
node <absent-copy>/scripts/audit-distribution.mjs <absent-copy>
```

Verify the source audit first and compare the reported pin with the independently
selected pin before copying. The copied-payload audit rejects extra files/directories,
missing files, symlinks, digest mismatches, broken Markdown links and detectable
private paths and credential patterns. The repository release audit separately
checks consumer-specific contamination before packaging. Source mode audits only the
allowlist: repository development state is deliberately excluded. The scanner is
a deterministic safeguard, not proof that every possible secret or personal datum
has been recognized; review the payload diff and confidentiality before release.

The payload includes supporting public docs and the small curator response format
because accepted role links require them. It excludes repository tests, engineering
contracts/reports, transient workflow state and archived machine-specific datasets.
Commands mentioning repository test suites in retained component reference documents
are source-maintainer verification history; the portable check is the shipped
consumer exercise. No source test or development directory is required to use it.

Retain the exact metadata under a pin-specific filename in persistent workflow
storage; bind it through an existing context snapshot. That shows which Kit artifact
governed the workflow without putting Kit metadata into Chronicle records. See
[adoption](adoption.md) for manual upgrades. The audit never rewrites metadata or files.
