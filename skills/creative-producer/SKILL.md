---
name: creative-producer
description: >-
  Use when the user says "produce the creatives", "generate the images",
  "finish the batch", "produce ads", "make the creatives", or after
  /adweave:daily-batch has written today's batch file. Produces finished
  static ads via Nano Banana 2 — one composed prompt per creative with
  hook, body, CTA, logo, and proof baked in — and uploads each result
  to Supabase `ad-staging/ai-generated/YYYY-MM-DD/`. Returns signed URLs
  ready for /adweave:meta-ad-launch.
allowed-tools:
  - mcp__adweave__tool_get_brand_profile
  - mcp__adweave__tool_get_current_brand_context
  - mcp__adweave__tool_list_brands
  - mcp__adweave__tool_set_brand_context
  - mcp__adweave__tool_get_adweave_methodology
  - mcp__adweave__tool_generate_static_ad
  - Read
  - Write
---

# AdWeave Creative Producer

Turns creative briefs (daily batches, or direct user instructions) into finished static ads. For each creative, composes ONE prompt that includes both the scene direction AND the text overlays (hook, body, CTA, proof, logo), then calls the generator tool to produce + upload the finished image in a single shot.

## Load methodology BEFORE producing

The image and copy discipline only works if the rules are in context. Load them first:

```
get_adweave_methodology("prologue,copy-rules,image-generation-guide,meta-safe-zones,skills/creative-producer-procedure")
```

Parse by `## <name>` headers. Then:

1. Execute the **prologue** (6-step brand-context check).
2. Execute the **skills/creative-producer-procedure** (the 8-step production flow). It references `image-generation-guide`, `meta-safe-zones`, and `copy-rules` — use the sections already loaded.

## Single-prompt, baked-in text — no separate overlay step

Nano Banana 2 (`gemini-3.1-flash-image-preview`, served by the MCP's `tool_generate_static_ad`) renders text accurately — legible multi-line copy, brand-palette colors, consistent subjects. The older "text-free base image + composite overlays in Figma" workflow is obsolete. Each creative is ONE prompt that includes:

- Scene, lighting, mood, photography/art style.
- Top/middle/bottom text bands with exact copy, font family (from `profile.fonts`), pt size, and hex colors (from `profile.brand_colors`).
- Aspect ratio (`1:1`, `9:16`, `4:5`, or `16:9`).

See `image-generation-guide` for the full formula. NEVER split into "image prompt + overlay spec" — always one composed prompt per creative.

## Generate + upload via the tool

For each of the 3–5 creatives in the batch, call:

```
tool_generate_static_ad(
  prompt="<composed single prompt>",
  aspect_ratio="1:1",
  filename_hint="<short-kebab-slug>"
)
```

Returns `{success, url, path, filename, aspect_ratio}`. The `url` is a long-lived Supabase signed URL under `{orgId}/ad-staging/ai-generated/YYYY-MM-DD/`, which means:

- The file automatically shows up in the dashboard's Upload Creatives widget alongside manual uploads.
- The URL can be passed directly into `tool_upload_ad_image(image_url=<url>)` during `/adweave:meta-ad-launch` — no manual upload step.

Per-call failures (safety filter refusal, rate-limit, storage error) come back as `{error: "..."}`. Log them and continue with the next creative — don't abort the whole batch.

## Input discovery

Priority order for finding the creative direction:

1. Most recent `{workspace_path}/daily-batches/<YYYY-MM-DD>-*.md`
2. `{workspace_path}/ad-creatives/copy/master-plan.md` rows with `Status = Pending`
3. Direct user instructions

If none exist, abort: *"Run `/adweave:daily-batch` first, or describe what you want produced."*

## Output

For each creative, print `{copy_package, prompt, url, concept}` to chat. Offer to persist prompts + URLs to `{workspace_path}/ad-creatives/copy/prompts-<YYYY-MM-DD>.md` for future reference. Hand off to `/adweave:meta-ad-launch` once the user confirms the images look right — the URLs are already Supabase-hosted, no manual upload required.
