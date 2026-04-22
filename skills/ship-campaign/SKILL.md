---
name: ship-campaign
description: >-
  Use when the user says "ship a campaign", "launch a campaign from
  scratch", "go end-to-end", "take this from idea to Meta", or similar
  one-shot requests to go from a bare "avatar × angle" all the way to
  a PAUSED campaign on Meta in a single flow. Chains daily-batch →
  creative-producer → meta-ad-launch with one confirm gate before Meta
  writes and best-effort partial-failure handling. Reuses an existing
  today's batch file if one already matches the requested avatar+angle.
allowed-tools:
  - mcp__adweave__tool_get_brand_profile
  - mcp__adweave__tool_get_current_brand_context
  - mcp__adweave__tool_list_brands
  - mcp__adweave__tool_set_brand_context
  - mcp__adweave__tool_get_adweave_methodology
  - mcp__adweave__tool_get_avatars
  - mcp__adweave__tool_get_offer_brief
  - mcp__adweave__tool_get_beliefs
  - mcp__adweave__tool_get_research_notes
  - mcp__adweave__tool_get_campaigns
  - mcp__adweave__tool_bulk_get_insights
  - mcp__adweave__tool_get_account_pages
  - mcp__adweave__tool_get_instagram_accounts
  - mcp__adweave__tool_search_interests
  - mcp__adweave__tool_search_behaviors
  - mcp__adweave__tool_search_geo_locations
  - mcp__adweave__tool_generate_static_ad
  - mcp__adweave__tool_upload_ad_image
  - mcp__adweave__tool_create_ad_creative
  - mcp__adweave__tool_batch_upload_and_create_creatives
  - mcp__adweave__tool_create_campaign
  - mcp__adweave__tool_create_adset
  - mcp__adweave__tool_create_ad
  - Read
  - Write
---

# AdWeave Ship Campaign

Chains the three AdWeave workflow skills into one slash command: daily batch strategy → creative production (image generation + Supabase upload) → Meta launch. One confirm gate before any Meta write. Best-effort partial-failure handling — one bad image or one failed ad never aborts the batch.

## Load the umbrella procedure

```
get_adweave_methodology("prologue,skills/ship-campaign-procedure")
```

1. Execute the **prologue** (6-step brand-context check) first. Load `profile` into memory — you need `ad_account_ids[0]`, `page_id`, `ig_user_id`, `pixel_id`, `landing_url`. If any are missing, abort and point the user at `adweave.ai/brands/<slug>/edit`.
2. Execute the **skills/ship-campaign-procedure** end-to-end. It handles input collection, batch resume detection, creative generation, launch-plan assembly, confirm gate, Meta writes, and the final report.

## The flow in one breath

1. **Kickoff** — parse any free-text arg (`/adweave:ship-campaign marcus platform-villain $5/day US women 25-44`), prefill an input form, ask the user to confirm/fill the rest in **one** interaction.
2. **Batch detect/produce** — glob `daily-batches/<today>-<avatar_slug>-<angle_slug>.md`. Exists → reuse. Missing → run the daily-batch procedure inline with avatar+angle fixed.
3. **Generate 5 creatives** — follow `skills/creative-producer-procedure` Steps 2–6. Call `tool_generate_static_ad` once per composed single-prompt creative. Per-call failures log-and-continue; zero succeed → abort with GEMINI_API_KEY hint.
4. **Assemble launch plan** in memory (campaign/adset names, targeting spec, link URL with UTMs, pixel promoted_object).
5. **Confirm gate** — print a structured block (batch name, generated URLs with ✓/✗ per creative, campaign/adset/ads plan) and wait for the literal word `confirm`. Tweaks re-print and re-wait. Anything else cancels.
6. **Meta writes** — sequence: `create_campaign` → `create_adset` → `batch_upload_and_create_creatives` (one call for the N upload+creative pairs) → `create_ad` × N. Per-item failures log and continue.
7. **Final report** — campaign ID, adset ID, all ad IDs, Ads Manager deeplink, per-stage failure list. Append one row per successful ad to `testing/tracker.md`.

## Critical Meta API rules (inherited from meta-ad-launch)

The launch stage must honor the Meta API rules documented in `/adweave:meta-ad-launch`'s SKILL.md:

- **Budgets in cents** as integer strings (`$5/day = "500"`).
- **Always CBO** — `daily_budget` on the campaign; never on the adset.
- **Always `bid_strategy="LOWEST_COST_WITHOUT_CAP"`** on the campaign.
- **Default `status="PAUSED"`** on every create. User activates in Ads Manager.
- **Never `optimization_type="DEGREES_OF_FREEDOM"`**. One text variant per ad; if a concept has N text variants, create N creatives + N ads (ship-campaign ships one variant per creative by default).
- **`instagram_user_id` inside `object_story_spec`**, not top-level.
- **Every ad needs `tracking_specs`** with the brand pixel.
- **Pause — don't delete.**
- **No write without `confirm`**.

If you're fuzzy on any of these, load `skills/meta-ad-launch-procedure` for the fully-annotated version before the Meta writes in Step 6.

## Never

- Never write to Meta without the literal `confirm` token at the gate.
- Never hardcode account / page / pixel IDs. Pull from `profile`.
- Never auto-retry a partial-success as if it were a full failure. A batch of 4-of-5 ads is a valid outcome.
- Never log failures to `testing/tracker.md`. The chat report is the authoritative failure record.
- Never rollback a partially-launched campaign. User cleans up in Ads Manager if desired.
- Never skip the resume check — if today's batch file for the same avatar+angle already exists, reuse it.

## Handoff

After Step 7 prints the final report, the skill's job is done. The user reviews in Ads Manager, activates when satisfied, and tracks results via `/adweave:metrics-feedback` after a few days of data.
