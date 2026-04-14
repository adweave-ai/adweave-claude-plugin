# adweave

Opinionated B2C SaaS / DTC marketing workflow for Meta Ads, powered by the [AdWeave MCP server](https://adweave.ai).

## What this plugin does

- `/adweave:setup` — one-time auth + brand selection + workspace scaffold
- `/adweave:daily-batch` — generate today's creative brief (3-5 ads rooted in verbatim user language)
- `/adweave:creative-producer` — image prompts + text overlay specs for image generators + editors
- `/adweave:meta-ad-launch` — ship a CBO campaign to Meta (PAUSED for review)
- `/adweave:metrics-feedback` — kill / scale / iterate analysis from last-7-day performance
- `/adweave:competitor-research` — pull competitor ads from Meta Ad Library via AdWeave

## Requirements

- An [AdWeave account](https://adweave.ai/signup). The plugin won't function without it — all skills call the hosted AdWeave MCP.
- A connected Meta Ads account (via AdWeave's web dashboard).
- At least one brand configured (at [adweave.ai/brands](https://adweave.ai/brands)).

## Install

```bash
# Beta channel (latest main)
/plugin marketplace add adweave-ai/adweave-claude-plugin
/plugin install adweave@adweave-beta

# Stable channel (recommended for most users)
/plugin marketplace add adweave-ai/adweave-plugins-stable
/plugin install adweave@adweave-stable
```

## First-run

```
/adweave:setup
```

This will:

1. Prompt OAuth (or use an `api_token` if you set the userConfig value)
2. Let you pick an active brand
3. Offer to scaffold `./foundation/` with templates you fill in

Once done, you're ready for `/adweave:daily-batch`.

## Data flow

| State | Location |
|---|---|
| Brand identity (accounts, pixels, pages, colors) | Cloud (AdWeave DB via MCP) |
| Marketing methodology (copy rules, belief system, templates) | AdWeave MCP server (auth-gated, loaded per-skill at runtime) |
| Avatars, beliefs, offer brief | Local `./foundation/` markdown |
| Daily batches, tracker | Local `./daily-batches/`, `./testing/` |
| Creative assets | User's Supabase (URL-based handoff to Meta) |
| Active brand pointer | `${CLAUDE_PLUGIN_DATA}/config.json` |

The plugin itself is a thin orchestration layer — skills load AdWeave's opinionated methodology on demand from the MCP (via the `get_adweave_methodology` tool). This keeps the plugin distributable under MIT while the methodology stays in AdWeave's service.

## Known v1 limitations

- Meta only. TikTok / Google Ads coming in later versions.
- Bring your own foundation markdown (`/adweave:setup` scaffolds templates; auto-generation from existing Meta + chat data is v2).
- No telemetry — no usage stats collected.
- Single-session brand context (parallel Claude Code sessions get distinct server-side sessions).

## Docs

- [AdWeave Docs](https://adweave.ai/docs)
- [Claude Code Plugin docs](https://code.claude.com/docs/en/plugins)

## License

MIT
