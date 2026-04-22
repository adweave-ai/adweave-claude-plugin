# Changelog

All notable changes to the adweave Claude Code plugin are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning: [SemVer](https://semver.org/).

## [1.3.1] — 2026-04-21

### Fixed

- **`/adweave:creative-producer` SKILL.md updated to the single-prompt flow.** Previously it described the obsolete "two-deliverable pattern" (text-free base image + separate overlay spec) in its body prose, which conflicted with the new `skills/creative-producer-procedure` that the skill loads at runtime. The SKILL.md now describes the single baked-in-text prompt flow via `tool_generate_static_ad`, matching the procedure and the `image-generation-guide` methodology. `allowed-tools` narrowed to just what the skill actually uses (`tool_generate_static_ad` + methodology + brand-context tools).

## [1.3.0] — 2026-04-21

### Added

- **`/adweave:ship-campaign`** — new umbrella skill that chains `daily-batch` → `creative-producer` → `meta-ad-launch` into a single flow. Kickoff collects all inputs (avatar, angle, budget, targeting, objective) up front; the skill then runs autonomously through the three stages with one confirm gate before any Meta write. Reuses today's batch file if one already matches the requested avatar+angle. Best-effort partial-failure handling — one bad image or failed ad never aborts the batch.
- Per-skill size budget for `ship-campaign` (800 words) added to `scripts/validate.mjs`.

### Depends on

- MCP server tool `tool_batch_upload_and_create_creatives` (ships in the AdWeave MCP alongside this release) — used by the launch stage to collapse the per-ad upload+creative round-trip.
- MCP server procedure `skills/ship-campaign-procedure` — the step-by-step flow is served over `get_adweave_methodology`, keeping the SKILL.md thin.

### Migration

Reinstall the plugin to pick up the new skill. Nothing breaks if you don't — the existing three skills (`daily-batch`, `creative-producer`, `meta-ad-launch`) keep working standalone.

## [1.2.0] — 2026-04-18

### Changed

- **Renamed the first-run command from `/adweave:setup` to `/adweave:start`.** Better matches how users describe the action ("start"/"begin" beats the technical "setup"). Skill directory renamed `skills/setup` → `skills/start`; all prose references updated. The error messages surfaced by the MCP server (`_brand_scope`, `foundation`) also now point at `/adweave:start`.

### Migration

Reinstall the plugin to pick up the new skill name. Old `/adweave:setup` no longer resolves.

## [1.1.0] — 2026-04-18

### Changed

- **MCP connector renamed from `adweave-meta-ads` to `adweave`.** The server covers more than Meta Ads now (brand context, avatars, beliefs, offer brief, methodology library, competitor intel) — the narrow name was misleading. Tool prefixes change from `mcp__adweave-meta-ads__tool_*` to `mcp__adweave__tool_*` across all six skills. The MCP endpoint URL (`/meta-ads-mcp`) stays unchanged for backwards compat.
- All skill `allowed-tools` frontmatter updated to the new prefix.

### Migration

Anyone on a prior plugin version needs to reinstall (or update) to pick up the new tool prefixes — old SKILL.md files will reference tools that no longer exist under the old name.

## [1.0.1] — 2026-04-18

### Fixed

- Plugin display name now renders as "AdWeave" (with capital W) in host UIs. Previously Cowork's sidebar title-cased the slug `adweave` → `Adweave`. Added `displayName: "AdWeave"` to `plugin.json`.

## [1.0.0] — 2026-04-18

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
