---
name: daily-batch
description: >-
  Use when the user says "daily batch", "today's ads", "generate
  creatives", "what should I test today", "morning marketing", "new
  angle", or similar daily-iteration requests. Runs the 7-step Daily
  Creative Engine: load foundation, pull live performance, mine
  verbatim language, select avatar x angle, generate 3-5 creative
  concepts, quality-gate, write batch file, hand off to
  creative-producer.
allowed-tools:
  - mcp__adweave__tool_get_brand_profile
  - mcp__adweave__tool_get_current_brand_context
  - mcp__adweave__tool_list_brands
  - mcp__adweave__tool_set_brand_context
  - mcp__adweave__tool_get_campaigns
  - mcp__adweave__tool_get_insights
  - mcp__adweave__tool_bulk_get_insights
  - mcp__adweave__tool_get_adweave_methodology
  - mcp__adweave__tool_get_avatars
  - mcp__adweave__tool_get_offer_brief
  - mcp__adweave__tool_get_beliefs
  - mcp__adweave__tool_get_research_notes
  - Read
  - Write
---

# AdWeave Daily Creative Engine

Produces today's creative brief from the intersection of (a) the brand's foundation docs, (b) live Meta performance, (c) verbatim language mined from whatever raw input the user brings.

## Load methodology BEFORE reasoning

Before writing a single word of copy, load the methodology bundle. Do NOT skip this — copy produced without these rules in context will fail the quality gate.

```
get_adweave_methodology("prologue,saas-context,two-phase-belief-system,argumentation-framework,copy-rules,skills/daily-batch-procedure")
```

Parse the returned document by its `## <name>` section headers. Then:

1. Execute the **prologue** (6-step brand-context check) first.
2. Execute the **skills/daily-batch-procedure** (the 7 mandatory steps) exactly. It references `saas-context`, `two-phase-belief-system`, `argumentation-framework`, and `copy-rules` — use the sections you already loaded.

## Non-negotiable inputs from the user's CWD

The procedure expects these foundation files in `{workspace_path}/foundation/`:

- `necessary-beliefs.md` (Phase 1 / Phase 2 split)
- `offer-brief.md`
- at least one `avatars/avatar-*.md`

If any is missing, abort with: *"Missing `foundation/<file>`. Run `/adweave:start` to scaffold."*

## Output

The procedure writes to `{workspace_path}/daily-batches/<YYYY-MM-DD>-<avatar>-<angle>.md` in the format defined there. It also updates `testing/tracker.md` and `testing/learning-log.md`.

## Hand off

After the batch saves, tell the user: *"Daily batch saved. Run `/adweave:creative-producer` to generate image prompts and overlay specs."*

## Quality gate discipline

Every creative in the batch must pass the full copy-rules checklist. Do not save the batch if any creative fails — iterate or kill individual creatives first. The procedure explicitly calls out the "free"-word scrub, Phase 1 belief coverage, concept diversity, mined-vs-invented ratio, and shame-dynamic check.
