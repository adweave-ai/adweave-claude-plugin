#!/usr/bin/env node
/**
 * SessionStart hook for the adweave plugin.
 *
 * Reads ${CLAUDE_PLUGIN_DATA}/config.json. If missing or setup_complete=false,
 * prints a one-line hint pointing the user at /adweave:setup. If setup is
 * complete, prints a one-line banner with the active brand slug.
 *
 * Output goes to stdout; Claude Code injects it as a SystemMessage.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dataDir = process.env.CLAUDE_PLUGIN_DATA;
if (!dataDir) {
  console.log('AdWeave plugin detected (CLAUDE_PLUGIN_DATA unset).');
  process.exit(0);
}

const configPath = join(dataDir, 'config.json');

if (!existsSync(configPath)) {
  console.log('AdWeave plugin detected but setup incomplete. Run `/adweave:setup` to connect.');
  process.exit(0);
}

try {
  const config = JSON.parse(readFileSync(configPath, 'utf-8'));
  if (!config.setup_complete) {
    console.log('AdWeave plugin detected but setup incomplete. Run `/adweave:setup` to connect.');
  } else {
    const workspace = config.workspace_path || process.cwd();
    console.log(`AdWeave active. Brand: ${config.active_brand_slug}. Workspace: ${workspace}.`);
  }
} catch (e) {
  console.log(`AdWeave plugin config unreadable (${e.message}). Run \`/adweave:setup\`.`);
}
