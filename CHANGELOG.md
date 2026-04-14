# Changelog

All notable changes to the adweave Claude Code plugin are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning: [SemVer](https://semver.org/).

## [1.0.0-dev] — unreleased

Initial release.

### Added

- `adweave:setup` — OAuth / API-token auth, brand selection, optional foundation scaffold
- `adweave:daily-batch` — 7-step daily creative brief generation, rooted in verbatim user language
- `adweave:creative-producer` — two-deliverable output per creative: image-gen prompt + text overlay spec
- `adweave:meta-ad-launch` — CBO campaign launch with inline Meta API critical rules; PAUSED default for review
- `adweave:metrics-feedback` — kill / scale / iterate decisions from last-7-day insights, user-confirmed writes
- `adweave:competitor-research` — Meta Ad Library intelligence via AdWeave MCP
- `SessionStart` hook for setup-check banner
- CI validator + GitHub Action enforcing frontmatter, size budgets, version-bump discipline on shippable releases

### Architecture

- **Thin plugin + MCP-served methodology.** Skill bodies are short orchestrators (~40-80 lines). The opinionated methodology (copy rules, argumentation framework, belief system, image-gen guide, per-skill procedures, foundation templates) lives on the AdWeave MCP server and loads at runtime via `get_adweave_methodology`. Plugin distributable under MIT; methodology stays in service.
- **Brand scoping.** All Meta write operations default to the active brand's primary ad account. `list_brands` + `set_brand_context` manage the session-level brand pointer.
