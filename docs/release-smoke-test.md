# Release Smoke Test

Run this checklist before tagging any release of the adweave plugin. Targets the current dev MCP by default; swap `.mcp.json` to prod before the final test for a release.

## Prerequisites

- AdWeave MCP server running with the latest code (including `tool_get_adweave_methodology` registered — check via `tools/list` on the endpoint)
- At least one brand seeded in the target MCP environment's DB (IGDetective is the default dev seed)
- Valid `aw_...` API token for a user who owns or belongs to that brand's organization
- Empty test workspace (NOT the plugin repo itself) — e.g., `mkdir ~/tmp/adweave-smoke && cd ~/tmp/adweave-smoke`

## Launch

From the test workspace, launch Claude Code with the plugin loaded from disk:

```bash
claude --plugin-dir ~/repos/adweave-claude-plugin
```

If using an `aw_` token instead of OAuth, export it via the `api_token` userConfig prompt (Claude Code will ask on first install).

## Checklist

### Setup flow
- [ ] SessionStart hook prints *"AdWeave plugin detected but setup incomplete. Run /adweave:setup to connect."*
- [ ] `/adweave:setup` runs without errors
- [ ] Auth handshake succeeds (OAuth flow OR api_token accepted)
- [ ] Brand picker lists the expected brand(s) from `list_brands`
- [ ] `set_brand_context` succeeds; active brand confirmed in chat
- [ ] `get_brand_profile` returns a profile with `ad_account_ids`, `page_id`, `ig_user_id`, `pixel_id`, `landing_url`
- [ ] Foundation scaffold offered; accepting copies all 5 template files from MCP into `./foundation/`
- [ ] `${CLAUDE_PLUGIN_DATA}/config.json` written with `setup_complete: true`
- [ ] Restart Claude Code → SessionStart hook prints *"AdWeave active. Brand: <slug>."*

### Methodology loading
- [ ] A skill's first call is `get_adweave_methodology(...)` with the expected bundle — observe tool-call log
- [ ] The returned content matches the content checked into `mcp/resources/` in the adweave monorepo

### competitor-research
- [ ] `/adweave:competitor-research` prompts for a competitor if `profile.competitors[]` is empty; otherwise uses the list
- [ ] `get_competitor_intelligence` returns data
- [ ] Report written to `./competitor-analysis/<competitor>-<YYYY-MM-DD>.md` in the structured format

### daily-batch
- [ ] Fill in the scaffolded `./foundation/` with minimum viable content (one avatar, one belief, one-line offer brief)
- [ ] `/adweave:daily-batch` loads the 6-item methodology bundle
- [ ] Pulls last-7-day insights
- [ ] Mines verbatim language (Step 4 of procedure)
- [ ] Generates 3-5 creative concepts, each with Phase 1 belief tagged
- [ ] Runs the copy-rules checklist (no "free" word, verbatim language, shame dynamic where applicable)
- [ ] Writes batch file to `./daily-batches/<YYYY-MM-DD>-<avatar>-<angle>.md`
- [ ] Updates `./testing/tracker.md`

### creative-producer
- [ ] `/adweave:creative-producer` finds the most recent batch file
- [ ] Loads image-generation-guide + meta-safe-zones + copy-rules bundle
- [ ] Prints image-gen prompts with "No text. No words. No logos." in each
- [ ] Prints text overlay specs using `profile.brand_colors.*` and `profile.fonts.*`
- [ ] Offers to persist prompts to `./ad-creatives/copy/prompts-<YYYY-MM-DD>.md`

### meta-ad-launch
- [ ] Provide test Supabase URLs + copy
- [ ] Confirmation screen shows budget in dollars + cents, campaign name, targeting summary, status=PAUSED
- [ ] On "confirm": `create_campaign` with CBO + LOWEST_COST_WITHOUT_CAP
- [ ] `create_adset` with NO budget, proper targeting, Advantage+ flag if requested
- [ ] `upload_ad_image` + `create_ad_creative` with `instagram_user_id` inside `object_story_spec`
- [ ] `create_ad` with `tracking_specs` including the brand's pixel
- [ ] All objects default to PAUSED
- [ ] Ads Manager URL printed; IDs appended to tracker

### metrics-feedback
- [ ] `/adweave:metrics-feedback` pulls bulk_get_insights
- [ ] Computes kill/scale/hold/iterate per the thresholds
- [ ] Presents decisions before any write; waits for user confirmation
- [ ] On "kill N": calls `update_ad(status=PAUSED)` (never delete)
- [ ] On "scale N": calls `update_campaign(daily_budget=...)` (never adset-level)
- [ ] Tracker + learning log updated

### Multi-brand and session
- [ ] "switch to brand X" mid-session → `set_brand_context` called, profile re-loaded, subsequent tools use new brand's account
- [ ] Invalid brand slug in switch → error message surfaced cleanly

### Edge cases
- [ ] Session expired (force by invalidating token) → every skill surfaces *"Your AdWeave session has expired. Run /adweave:setup to re-authenticate."*
- [ ] `get_adweave_methodology("nonsense")` → graceful error; skill stops with a clear message
- [ ] Foundation missing when `/adweave:daily-batch` runs → clear abort with "Run /adweave:setup"

## File any failures

Create GitHub issues in `adweave-ai/adweave-claude-plugin` tagged `v1-blocker` or `v1-nice-to-have`. Block the release on every `v1-blocker`.
