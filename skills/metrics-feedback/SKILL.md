---
name: metrics-feedback
description: >-
  Use when the user says "analyze results", "pull metrics", "how are ads
  doing", "kill/scale decisions", "weekly review", uploads performance
  screenshots, or asks for ad performance analysis. Pulls last-7-day
  insights, surfaces kill/scale/iterate decisions, and after user
  confirmation calls update_ad / update_adset / update_campaign to
  pause losers or scale winners.
allowed-tools:
  - mcp__adweave__tool_get_brand_profile
  - mcp__adweave__tool_get_current_brand_context
  - mcp__adweave__tool_list_brands
  - mcp__adweave__tool_set_brand_context
  - mcp__adweave__tool_bulk_get_insights
  - mcp__adweave__tool_get_insights
  - mcp__adweave__tool_get_campaigns
  - mcp__adweave__tool_get_ads
  - mcp__adweave__tool_update_ad
  - mcp__adweave__tool_update_adset
  - mcp__adweave__tool_update_campaign
  - mcp__adweave__tool_get_adweave_methodology
  - Read
  - Write
---

# AdWeave Metrics Feedback Loop

Turns raw Meta performance data into kill / scale / iterate decisions. User confirms every write.

## Load methodology

```
get_adweave_methodology("prologue,skills/metrics-feedback-procedure")
```

Execute the **prologue** (6-step brand-context check) first. Then execute the **skills/metrics-feedback-procedure** — pull insights at the requested scope, compute decision signals, correlate with `testing/tracker.md`, present kill/scale/hold/iterate decisions to the user, execute confirmed actions via `update_ad` / `update_adset` / `update_campaign`, update the tracker and learning log.

## Non-negotiable rules

- **Confirm every write.** No autonomous pauses / scales, ever. Show exact IDs, current status, proposed status, and budget before any `update_*` call.
- **Pause, never delete.** Historical data matters — even for losers.
- **Never scale an adset-level budget under CBO.** The adset has no budget. Scale at campaign level.
- **Don't suggest ITERATE for a creative with less than $20 spend.** Not enough data to diagnose.
- **Pull conversion context from the brand profile** — `pixel_id` and linked events drive how `actions` / `action_values` are interpreted.

## Workspace files updated

- `testing/tracker.md` — append today's decisions (killed / scaled / held) with affected IDs and new status/budget values
- `testing/learning-log.md` — one or two sentences about what was learned this cycle
