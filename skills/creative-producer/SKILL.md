---
name: creative-producer
description: >-
  Use when the user says "produce the creatives", "generate image
  prompts", "finish the batch", "make the overlays", "produce ads", or
  after /adweave:daily-batch has written today's batch file. Produces
  two deliverables per creative - an image generation prompt (for
  Grok / Flux / Midjourney) and a text overlay spec (for the user's
  editor). The user generates, composites, uploads to Supabase, then
  runs /adweave:meta-ad-launch.
allowed-tools:
  - mcp__adweave__tool_get_brand_profile
  - mcp__adweave__tool_get_current_brand_context
  - mcp__adweave__tool_list_brands
  - mcp__adweave__tool_set_brand_context
  - mcp__adweave__tool_get_adweave_methodology
  - Read
  - Write
---

# AdWeave Creative Producer

Turns creative briefs (daily batches, or direct user instructions) into production-ready prompts and overlay specs. The user generates base images, composites overlays, uploads to Supabase, and hands URLs back to `/adweave:meta-ad-launch`.

## Load methodology BEFORE producing

The image and overlay discipline only works if the rules are in context. Load them first:

```
get_adweave_methodology("prologue,copy-rules,image-generation-guide,meta-safe-zones,skills/creative-producer-procedure")
```

Parse by `## <name>` headers. Then:

1. Execute the **prologue** (6-step brand-context check).
2. Execute the **skills/creative-producer-procedure** (the 8-step production flow). It references `image-generation-guide`, `meta-safe-zones`, and `copy-rules` — use the sections already loaded.

## The two-deliverable pattern (don't skip)

Every creative produces TWO things, never merged:

1. **Image generation prompt** — text-free base image, always ends with *"No text. No words. No logos."* Always specifies negative-space bands for overlays.
2. **Text overlay spec** — explicit text, typography, colors, position, sized to the safe zones from `meta-safe-zones`. Colors and fonts pulled from the loaded brand profile.

AI image generators render text poorly. Baking copy into a prompt produces garbled letters. Always separate.

## Input discovery

Priority order for finding the creative direction:

1. Most recent `{workspace_path}/daily-batches/<YYYY-MM-DD>-*.md`
2. `{workspace_path}/ad-creatives/copy/master-plan.md` rows with `Status = Pending`
3. Direct user instructions

If none exist, abort: *"Run `/adweave:daily-batch` first, or describe what you want produced."*

## Output

Print each creative's copy package + image prompt + overlay spec to chat. Offer to persist to `{workspace_path}/ad-creatives/copy/prompts-<YYYY-MM-DD>.md`. Hand off to `/adweave:meta-ad-launch` once the user returns with Supabase URLs.
