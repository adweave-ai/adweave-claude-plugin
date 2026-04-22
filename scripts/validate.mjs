#!/usr/bin/env node
/**
 * Author-time validator for adweave-claude-plugin.
 *
 * Checks:
 *   1. Every skills/<name>/SKILL.md has required frontmatter (name, description)
 *   2. name frontmatter matches directory
 *   3. description starts with "Use when..."
 *   4. Skill body size under per-skill word budget (thin shells — body delegates
 *      methodology to the AdWeave MCP, so budgets are small)
 *   5. plugin.json version bumped when user-visible files changed vs HEAD~1
 *   6. CHANGELOG.md has an entry matching the current plugin.json version
 *   7. Skill names are kebab-case and unique
 *   8. Warn on hardcoded `mcp__<server>__tool_*` tool names in skill PROSE
 *      (frontmatter allowed-tools is fine and required)
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// Thin-shell budgets: the heavy methodology lives on the MCP, skills just
// orchestrate. Keep each SKILL.md tight so the 5k-per-skill re-attach budget
// post-compaction is safely under the ceiling.
const SKILL_BUDGETS_WORDS = {
  'start': 700,
  'daily-batch': 600,
  'metrics-feedback': 600,
  'meta-ad-launch': 1200, // baked-in Meta API public rules (latency-critical)
  'creative-producer': 600,
  'competitor-research': 500,
  'ship-campaign': 800, // umbrella over the above; still a thin shell
};

const errors = [];
const warnings = [];

function fail(msg) { errors.push(`ERROR: ${msg}`); }
function warn(msg) { warnings.push(`WARN:  ${msg}`); }

// --- Load plugin.json ---
const pluginJson = JSON.parse(readFileSync(join(ROOT, '.claude-plugin/plugin.json'), 'utf-8'));
const pluginVersion = pluginJson.version;
if (!pluginVersion) fail('plugin.json missing version');

// --- Enumerate skills ---
const skillsDir = join(ROOT, 'skills');
const skillNames = existsSync(skillsDir)
  ? readdirSync(skillsDir)
      .filter((n) => !n.startsWith('_'))
      .filter((n) => statSync(join(skillsDir, n)).isDirectory())
  : [];

const seenNames = new Set();
for (const name of skillNames) {
  if (!/^[a-z0-9-]+$/.test(name)) fail(`Skill name "${name}" is not kebab-case`);
  if (seenNames.has(name)) fail(`Duplicate skill name "${name}"`);
  seenNames.add(name);

  const skillPath = join(skillsDir, name, 'SKILL.md');
  if (!existsSync(skillPath)) {
    fail(`Missing SKILL.md in skills/${name}/`);
    continue;
  }

  const raw = readFileSync(skillPath, 'utf-8');
  const { data: fm, content: body } = matter(raw);

  if (!fm.name) fail(`skills/${name}/SKILL.md missing frontmatter.name`);
  if (fm.name !== name) fail(`skills/${name}/SKILL.md name mismatch: fm="${fm.name}" dir="${name}"`);
  if (!fm.description) fail(`skills/${name}/SKILL.md missing frontmatter.description`);
  if (fm.description && !/^use when/i.test(fm.description.trim())) {
    warn(`skills/${name}/SKILL.md description should start with "Use when..." (got: "${fm.description.slice(0, 60)}...")`);
  }

  const wordCount = body.split(/\s+/).filter(Boolean).length;
  const budget = SKILL_BUDGETS_WORDS[name] ?? 800;
  if (wordCount > budget) {
    fail(`skills/${name}/SKILL.md exceeds size budget: ${wordCount} words > ${budget} (methodology belongs on the MCP server, loaded via get_adweave_methodology)`);
  }

  const hardcoded = body.match(/`mcp__[\w-]+__tool_[\w]+`/g);
  if (hardcoded) {
    warn(`skills/${name}/SKILL.md uses fully-qualified tool names in prose (prefer bare, e.g., \`get_campaigns\` not \`mcp__adweave__tool_get_campaigns\`): ${hardcoded.slice(0, 2).join(', ')}`);
  }
}

// --- Version-bump check vs HEAD~1 ---
// Only enforced when the current version is a shippable release (no `-dev`
// suffix). Dev iteration can keep bumping content freely; once we tag a
// release (1.0.0), the next user-visible change must bump the version.
if (!pluginVersion.endsWith('-dev')) {
  try {
    const changed = execSync('git diff --name-only HEAD~1 HEAD', { cwd: ROOT, encoding: 'utf-8' })
      .split('\n')
      .filter(Boolean);

    const userVisible = changed.filter((f) =>
      f.startsWith('skills/') ||
      f.startsWith('hooks/') ||
      f === '.mcp.json' ||
      f === '.claude-plugin/plugin.json'
    );

    if (userVisible.length > 0) {
      const prevPlugin = execSync('git show HEAD~1:.claude-plugin/plugin.json', { cwd: ROOT, encoding: 'utf-8' });
      const prevVersion = JSON.parse(prevPlugin).version;
      if (prevVersion === pluginVersion) {
        fail(`User-visible files changed (${userVisible.length}) but plugin.json version unchanged (${pluginVersion}). Bump the version.`);
      }
    }
  } catch (e) {
    warn(`Could not run git diff check: ${e.message}`);
  }
}

// --- CHANGELOG entry check ---
const changelogPath = join(ROOT, 'CHANGELOG.md');
if (existsSync(changelogPath)) {
  const changelog = readFileSync(changelogPath, 'utf-8');
  if (!changelog.includes(pluginVersion)) {
    fail(`CHANGELOG.md has no entry for version ${pluginVersion}`);
  }
} else {
  warn('CHANGELOG.md missing');
}

for (const w of warnings) console.log(w);
for (const e of errors) console.error(e);

if (errors.length > 0) {
  console.error(`\nvalidate.mjs: ${errors.length} error(s), ${warnings.length} warning(s)`);
  process.exit(1);
}
console.log(`\nvalidate.mjs: OK (${warnings.length} warning(s))`);
