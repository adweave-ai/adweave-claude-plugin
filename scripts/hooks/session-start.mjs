#!/usr/bin/env node
/**
 * SessionStart hook for the adweave plugin.
 *
 * Prints a one-line banner pointing the user at /adweave:setup.
 * The active brand is persisted server-side (mcp_brand_sessions) and
 * resolved at skill-invocation time via `get_current_brand_context`, so
 * this hook does NOT attempt to display it — hooks run without MCP auth
 * and can't query the server. A local cache was tried historically but
 * failed in sandboxed environments (e.g., Cowork), so it's gone.
 *
 * Output goes to stdout; Claude Code injects it as a SystemMessage.
 */

console.log(
  'AdWeave plugin loaded. Run `/adweave:setup` to pick a brand, or invoke any `/adweave:*` skill directly — your active brand is remembered server-side.',
);
