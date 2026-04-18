---
name: setup
description: >-
  Use when the user runs /adweave:setup, says "set up adweave", "connect
  my brand", "re-setup", "switch brands", or when the AdWeave plugin
  needs first-run configuration. Handles OAuth or API-token auth, brand
  selection, workspace detection, and optional foundation scaffolding.
user-invocable: true
disable-model-invocation: false
allowed-tools:
  - mcp__adweave-meta-ads__tool_list_brands
  - mcp__adweave-meta-ads__tool_set_brand_context
  - mcp__adweave-meta-ads__tool_get_brand_profile
  - mcp__adweave-meta-ads__tool_get_adweave_methodology
  - mcp__adweave-meta-ads__tool_get_avatars
  - mcp__adweave-meta-ads__tool_get_offer_brief
  - mcp__adweave-meta-ads__tool_get_beliefs
  - Read
  - Write
---

# AdWeave Setup

First-run configuration for the AdWeave plugin. Connects to the AdWeave MCP, selects an active brand, and optionally scaffolds the local `foundation/` folder from templates served by the MCP.

## Load the procedure before acting

**Before doing anything else, call `get_adweave_methodology("skills/setup-procedure")`** and follow the steps in the returned document exactly. The procedure covers auth verification, brand picker logic (persisted server-side via `set_brand_context`), backend foundation readiness check, and optional foundation-template scaffold.

If the user opts into scaffolding `./foundation/`, fetch each template file from the MCP:

```
get_adweave_methodology("foundation-template/readme")
get_adweave_methodology("foundation-template/avatar-template")
get_adweave_methodology("foundation-template/necessary-beliefs")
get_adweave_methodology("foundation-template/offer-brief")
get_adweave_methodology("foundation-template/research-doc")
```

Write each to the user's `./foundation/` directory, preserving filenames exactly (note `avatar-TEMPLATE.md` goes to `avatars/avatar-TEMPLATE.md` per the plan). Do not invent content — use what the MCP returns verbatim.

## Auth handshake

- Call `list_brands`. If it succeeds, auth is working — continue.
- On 401 / "authorization required": guide the user through OAuth (browser prompt) OR tell them to set the `api_token` userConfig value to an `aw_...` token from `adweave.ai/api-tokens`, then retry.

## Persisted state

Active brand is persisted server-side by `set_brand_context` (writes to `mcp_brand_sessions` keyed on user_id). Every skill reads it via `get_current_brand_context` at invocation time. **Do not write a local `config.json` or `setup_complete` marker** — those were removed 2026-04-18 because the local cache was duplicative and failed in sandboxed environments like Cowork.

## Idempotency

This skill is safe to re-run. `set_brand_context` upserts the user's active-brand row. The foundation scaffold step offers to skip if `foundation/` is already populated.

## Error handling

- `list_brands` non-auth error → print the raw error and point the user to `status.adweave.ai`.
- `set_brand_context` failure → brand slug mismatch or lost access; refresh via `list_brands` and retry.
