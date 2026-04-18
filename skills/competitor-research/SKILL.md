---
name: competitor-research
description: >-
  Use when the user asks for competitor research, competitor analysis,
  wants to see what competitors are running on Meta, mentions a
  competitor URL or Instagram handle, says "analyze <competitor>", or
  requests an Ad Library scan. Writes a structured report to
  ./competitor-analysis/.
allowed-tools:
  - mcp__adweave__tool_get_competitor_intelligence
  - mcp__adweave__tool_get_brand_profile
  - mcp__adweave__tool_get_current_brand_context
  - mcp__adweave__tool_list_brands
  - mcp__adweave__tool_set_brand_context
  - mcp__adweave__tool_get_adweave_methodology
  - Read
  - Write
---

# AdWeave Competitor Research

Pulls active / recently-run Meta ads from a competitor via the AdWeave Ad Library pipeline and writes a structured report locally.

## Load methodology before acting

1. Load the prologue and the full procedure in one call:

   ```
   get_adweave_methodology("prologue,skills/competitor-research-procedure")
   ```

2. Execute the 6-step prologue (brand-context check) from the returned `prologue` section.

3. Then execute the competitor-research procedure from the `skills/competitor-research-procedure` section exactly — target discovery, MCP pull, local report write, handoff.

## Tool used

The core call is `get_competitor_intelligence` (by URL, handle, or Meta Page name). Everything else is orchestration around it.

## Output

Reports land at `./competitor-analysis/<competitor-slug>-<YYYY-MM-DD>.md` in the structured format defined by the procedure. After writing, summarize the three most important findings back to the user and offer to feed them into the next `/adweave:daily-batch` run.
