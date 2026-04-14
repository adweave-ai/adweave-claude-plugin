---
name: setup
description: Use when the user runs `/adweave:setup`, says "set up adweave", "connect my brand", "re-setup", "switch brands", or when the AdWeave plugin needs first-run configuration (missing `${CLAUDE_PLUGIN_DATA}/config.json` or `setup_complete: false`). Handles OAuth / API-token auth, brand selection, workspace detection, and optional foundation scaffolding.
user-invocable: true
disable-model-invocation: false
allowed-tools:
  - mcp__adweave-meta-ads__tool_list_brands
  - mcp__adweave-meta-ads__tool_set_brand_context
  - mcp__adweave-meta-ads__tool_get_brand_profile
  - mcp__adweave-meta-ads__tool_get_adweave_methodology
  - Read
  - Write
---

# AdWeave Setup

First-run configuration for the AdWeave plugin. Connects to the AdWeave MCP, selects an active brand, and optionally scaffolds the local `foundation/` folder from templates served by the MCP.

## Load the procedure before acting

**Before doing anything else, call `get_adweave_methodology("skills/setup-procedure")`** and follow the steps in the returned document exactly. The procedure covers auth verification, brand picker logic, `config.json` persistence, foundation detection, and the foundation-template scaffold.

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

Write `${CLAUDE_PLUGIN_DATA}/config.json`:

```json
{
  "active_brand_slug": "<selected_slug>",
  "last_setup_at": "<ISO8601>",
  "setup_complete": true,
  "workspace_path": "<cwd or userConfig override>"
}
```

And a marker file at `${CLAUDE_PLUGIN_DATA}/setup_complete` (empty is fine — presence is what matters for the SessionStart hook).

## Idempotency

This skill is safe to re-run. It overwrites `config.json` and re-checks brand selection. The foundation scaffold step offers to skip if `foundation/` is already populated.

## Error handling

- `list_brands` non-auth error → print the raw error and point the user to `status.adweave.ai`.
- `set_brand_context` failure → brand slug mismatch or lost access; refresh via `list_brands` and retry.
- File-write failure in the CWD → tell the user the path tried and ask for a different `workspace_path`.
