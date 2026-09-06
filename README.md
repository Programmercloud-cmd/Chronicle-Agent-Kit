# Chronicle Agent Kit

A copyable authoring kit for Chronicle Core **v0.2.1**. The read-only Progress
Curator assesses significance; the responsible human or main agent decides;
the helper captures exact evidence and publishes explicitly approved proposals.

Start with [adoption and manual upgrades](docs/adoption.md). This package requires
Node 22+ on a POSIX filesystem and an independently installed, trusted Chronicle
Core v0.2.1 CLI. Git 2.34+ is needed only for tracked locations or Git diff capture.
A Core source checkout, agent framework, and engineering review process are optional.

- [Mergeable host guidance](AGENTS.fragment.md) and [curator role](agents/progress_curator.md)
- [Configuration](docs/project-configuration.md) and [workflow contract](docs/workflow-contract.md)
- [Evidence capture](docs/evidence-capture.md) and [prepare/apply reference](docs/guarded-publication.md)
- [Authoring recipes](examples/README.md) and [fresh consumer exercise](examples/consumer/README.md)
- [Release metadata and payload audit](docs/distribution.md)

Every project explicitly selects dataset and persistent workflow locations and their
independent tracking policies. No path or tracking choice is a default. Local mode
does not query Git or guarantee exclusion; the project manages source-control exposure.

Stable packet IDs and prior dispositions govern duplicates. Digests bind exact
persisted bytes for integrity and staleness; they do not establish semantic equality,
authenticity, claim relevance or milestone significance. Core owns record validation.
