---
name: meta-ad-launch
description: >-
  Use when the user says "launch ads", "push live", "create campaign",
  "deploy batch", "upload creatives", or provides Supabase URLs for
  finished creatives ready to ship. Creates a CBO campaign, ad set, and
  1-5 ads on Meta - all PAUSED by default for user review in Ads Manager
  before activation.
allowed-tools:
  - mcp__adweave-meta-ads__tool_get_brand_profile
  - mcp__adweave-meta-ads__tool_get_current_brand_context
  - mcp__adweave-meta-ads__tool_list_brands
  - mcp__adweave-meta-ads__tool_set_brand_context
  - mcp__adweave-meta-ads__tool_get_account_pages
  - mcp__adweave-meta-ads__tool_get_instagram_accounts
  - mcp__adweave-meta-ads__tool_create_campaign
  - mcp__adweave-meta-ads__tool_create_adset
  - mcp__adweave-meta-ads__tool_upload_ad_image
  - mcp__adweave-meta-ads__tool_create_ad_creative
  - mcp__adweave-meta-ads__tool_create_carousel_ad_creative
  - mcp__adweave-meta-ads__tool_create_ad
  - mcp__adweave-meta-ads__tool_search_interests
  - mcp__adweave-meta-ads__tool_search_geo_locations
  - mcp__adweave-meta-ads__tool_get_adweave_methodology
  - Read
  - Write
---

# AdWeave Meta Ad Launch

Ships finished creatives as a paused campaign ready for the user to review in Ads Manager and activate.

## CRITICAL META API RULES — read before every write

These rules are public Meta API knowledge. Baked into this skill (not the MCP) so they survive in context under the 5k-per-skill compaction re-attach budget. Violating them causes errors, rejected campaigns, wasted spend, or silent failures.

**1. Budgets in cents (integer strings).** `$5/day = "500"`, `$10 = "1000"`, `$50 = "5000"`. Applies to `daily_budget`, `lifetime_budget`, `bid_amount`, `bid_cap`, `spend_cap`. Minimum daily budget is `"100"` ($1/day). Read values come back in cents; display converted to dollars.

**2. Always CBO (campaign-level budget).** Set `daily_budget` on `create_campaign`. Do NOT set any budget on `create_adset`. Do NOT pass `use_adset_level_budgets=true` (most accounts reject it with error 4834011). If the user says "$5 daily budget for that ad set", set `daily_budget="500"` on the **campaign** instead.

**3. Always set `bid_strategy="LOWEST_COST_WITHOUT_CAP"` on `create_campaign`.** Without this, Meta defaults to `LOWEST_COST_WITH_BID_CAP` which requires a `bid_cap` and causes adset creation to fail with error 1815857.

**4. Full-ad creation is a 3-step sequence.** `create_campaign` (with daily_budget + bid_strategy) → `create_adset` (targeting, destination_type, NO budget) → `create_ad` (with creative_id). If any step fails, report the error clearly and STOP. Do not retry with different parameters blindly.

**5. Default `status="PAUSED"` on all creates.** The user reviews everything in Ads Manager before activating. NEVER set `status="ACTIVE"` on creation without explicit user approval.

**6. Never `optimization_type="DEGREES_OF_FREEDOM"`** (DOF / FLEX / Advantage+ Creative). Breaks with certain page/IG combos and causes silent creative-not-serving bugs. Use simple creatives with one text variant per ad. If a concept has 3 text variants, create 3 separate creatives + 3 ads in the same ad set.

**7. `instagram_user_id` goes inside `object_story_spec`**, NOT as a top-level param. Pull `ig_user_id` from the loaded brand profile. Also accepts `instagram_actor_id` on older API versions — prefer `instagram_user_id`.

**8. Every ad needs `tracking_specs` with the brand's pixel.**

   ```json
   "tracking_specs": [
     {"action.type": ["offsite_conversion"], "fb_pixel": ["<profile.pixel_id>"]}
   ]
   ```

**9. Pause — don't delete.** Historical data matters. Use `update_ad(status="PAUSED")` / `update_adset` / `update_campaign`, never delete tools.

**10. Bulk operations: dry-run first.** For `bulk_update_*`: call with `dry_run=true`, show the user the diff, confirm, then call again with `dry_run=false`.

**11. Confirm before every write.** Show exact campaign/adset/ad IDs, budgets, status transitions. Wait for user "confirm" before executing.

## Load the opinionated sequence

Call:

```
get_adweave_methodology("prologue,skills/meta-ad-launch-procedure")
```

Execute the **prologue** (6-step brand-context check) first — it loads the brand profile (ad_account_ids, page_id, ig_user_id, pixel_id, landing_url) into memory. Then execute the **skills/meta-ad-launch-procedure** for the opinionated launch sequence: input gathering, identity resolution, targeting construction, confirmation copy, creative + ad creation patterns, tracker update.

## Never

- Never hardcode account IDs, page IDs, pixel IDs — pull from the brand profile loaded by the prologue.
- Never skip the user-confirmation step before a write.
- Never `status="ACTIVE"` on creation.
- Never delete ads / adsets / campaigns — pause them.
- Never use DOF / FLEX / Advantage+ Creative optimization types.
