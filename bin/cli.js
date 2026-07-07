#!/usr/bin/env node
/**
 * fable-skill installer
 *
 * Installs the fable-skill agentic operating discipline into the native
 * rules/skills location of any supported coding agent.
 *
 *   npx fable-skill <agent> [--project | --global]
 *   npx fable-skill all --project
 *   npx fable-skill list
 */

"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");

const ROOT = path.join(__dirname, "..");
const SKILL_DIR = path.join(ROOT, "skill");
const HOME = os.homedir();

// ---------------------------------------------------------------------------
// Content builders
// ---------------------------------------------------------------------------

function readSkillMd() {
  return fs.readFileSync(path.join(SKILL_DIR, "SKILL.md"), "utf8");
}

function stripFrontmatter(md) {
  return md.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
}

function referenceFiles() {
  const dir = path.join(SKILL_DIR, "references");
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((f) => ({ name: f, content: fs.readFileSync(path.join(dir, f), "utf8") }));
}

const FOOTER =
  "\n\n---\n\n*Installed by [fable-skill](https://github.com/almutaz9000/fable-skill). Re-run `npx fable-skill` to update.*\n";

/** Full merge: SKILL.md + every reference module (~7k tokens). */
function mergedMarkdown() {
  const parts = [stripFrontmatter(readSkillMd()).trim()];
  for (const ref of referenceFiles()) {
    parts.push(`\n\n---\n\n<!-- ${ref.name} -->\n\n${ref.content.trim()}`);
  }
  parts.push(FOOTER);
  return parts.join("");
}

/**
 * Compact edition (~2k tokens) — the default for single-file rules targets,
 * where the content is injected into EVERY request and token cost matters.
 * Agents with native skill folders load references on demand and get the
 * full skill instead.
 */
function compactMarkdown() {
  const compact = path.join(SKILL_DIR, "COMPACT.md");
  if (!fs.existsSync(compact)) return mergedMarkdown();
  return fs.readFileSync(compact, "utf8").trim() + FOOTER;
}

/** Copy the skill folder verbatim (SKILL.md + references/) into destDir. */
function copySkillFolder(destDir) {
  fs.mkdirSync(path.join(destDir, "references"), { recursive: true });
  fs.copyFileSync(path.join(SKILL_DIR, "SKILL.md"), path.join(destDir, "SKILL.md"));
  for (const ref of referenceFiles()) {
    fs.writeFileSync(path.join(destDir, "references", ref.name), ref.content);
  }
}

function writeMerged(destFile, opts = {}) {
  fs.mkdirSync(path.dirname(destFile), { recursive: true });
  let body = opts.full ? mergedMarkdown() : compactMarkdown();
  if (opts.header) body = opts.header + "\n" + body;
  fs.writeFileSync(destFile, body);
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Append to a shared file (AGENTS.md etc.) between managed markers, idempotently. */
function upsertManagedBlock(destFile, title, opts = {}) {
  const BEGIN = "<!-- BEGIN fable-skill (managed - do not edit inside) -->";
  const END = "<!-- END fable-skill -->";
  const body = opts.full ? mergedMarkdown() : compactMarkdown();
  const block = `${BEGIN}\n\n# ${title}\n\n${body}\n${END}\n`;
  fs.mkdirSync(path.dirname(destFile), { recursive: true });
  let existing = "";
  if (fs.existsSync(destFile)) existing = fs.readFileSync(destFile, "utf8");
  if (existing.includes(BEGIN)) {
    const re = new RegExp(`${escapeRegExp(BEGIN)}[\\s\\S]*?${escapeRegExp(END)}\\n?`);
    existing = existing.replace(re, block);
  } else {
    existing = existing ? existing.replace(/\s*$/, "\n\n") + block : block;
  }
  fs.writeFileSync(destFile, existing);
}

// ---------------------------------------------------------------------------
// Agent targets
// ---------------------------------------------------------------------------
// kind: "folder"  -> native multi-file skill folder (copySkillFolder)
//       "file"    -> dedicated single rules file (writeMerged)
//       "managed" -> shared file appended between markers (upsertManagedBlock)

const TARGETS = {
  claude: {
    label: "Claude Code (also claude.ai via zip)",
    kind: "folder",
    global: () => path.join(HOME, ".claude", "skills", "fable-skill"),
    project: (cwd) => path.join(cwd, ".claude", "skills", "fable-skill"),
  },
  cursor: {
    label: "Cursor",
    kind: "file",
    project: (cwd) => path.join(cwd, ".cursor", "rules", "fable-skill.mdc"),
    header:
      "---\ndescription: Fable-class agentic operating discipline (plan, verify, iterate)\nalwaysApply: true\n---\n",
  },
  copilot: {
    label: "GitHub Copilot",
    kind: "file",
    project: (cwd) => path.join(cwd, ".github", "instructions", "fable-skill.instructions.md"),
    header: "---\napplyTo: \"**\"\n---\n",
  },
  windsurf: {
    label: "Windsurf (Cascade)",
    kind: "file",
    project: (cwd) => path.join(cwd, ".windsurf", "rules", "fable-skill.md"),
    header: "---\ntrigger: always_on\n---\n",
  },
  cline: {
    label: "Cline",
    kind: "file",
    global: () => path.join(HOME, "Documents", "Cline", "Rules", "fable-skill.md"),
    project: (cwd) => path.join(cwd, ".clinerules", "fable-skill.md"),
  },
  roo: {
    label: "Roo Code",
    kind: "file",
    project: (cwd) => path.join(cwd, ".roo", "rules", "fable-skill.md"),
  },
  codex: {
    label: "OpenAI Codex (native skill)",
    kind: "folder",
    global: () => path.join(HOME, ".agents", "skills", "fable-skill"),
    project: (cwd) => path.join(cwd, ".agents", "skills", "fable-skill"),
  },
  "codex-agents": {
    label: "OpenAI Codex (AGENTS.md, older CLIs)",
    kind: "managed",
    global: () => path.join(HOME, ".codex", "AGENTS.md"),
    project: (cwd) => path.join(cwd, "AGENTS.md"),
  },
  gemini: {
    label: "Gemini CLI / Antigravity",
    kind: "managed",
    global: () => path.join(HOME, ".gemini", "GEMINI.md"),
    project: (cwd) => path.join(cwd, "GEMINI.md"),
  },
  amp: {
    label: "Amp (Sourcegraph)",
    kind: "managed",
    project: (cwd) => path.join(cwd, "AGENTS.md"),
  },
  openclaw: {
    label: "OpenClaw / ClawBot",
    kind: "folder",
    global: () => path.join(HOME, ".openclaw", "skills", "fable-skill"),
    project: (cwd) => path.join(cwd, "skills", "fable-skill"),
  },
  aider: {
    label: "Aider",
    kind: "managed",
    project: (cwd) => path.join(cwd, "CONVENTIONS.md"),
  },
  continue: {
    label: "Continue.dev",
    kind: "file",
    global: () => path.join(HOME, ".continue", "rules", "fable-skill.md"),
    project: (cwd) => path.join(cwd, ".continue", "rules", "fable-skill.md"),
  },
  zed: {
    label: "Zed",
    kind: "managed",
    project: (cwd) => path.join(cwd, ".rules"),
  },
  junie: {
    label: "JetBrains Junie",
    kind: "managed",
    project: (cwd) => path.join(cwd, ".junie", "guidelines.md"),
  },
  kiro: {
    label: "Kiro (AWS)",
    kind: "file",
    project: (cwd) => path.join(cwd, ".kiro", "steering", "fable-skill.md"),
  },
  trae: {
    label: "Trae",
    kind: "file",
    project: (cwd) => path.join(cwd, ".trae", "rules", "fable-skill.md"),
  },
  qwen: {
    label: "Qwen Code",
    kind: "managed",
    global: () => path.join(HOME, ".qwen", "QWEN.md"),
    project: (cwd) => path.join(cwd, "QWEN.md"),
  },
  opencode: {
    label: "OpenCode",
    kind: "managed",
    global: () => path.join(HOME, ".config", "opencode", "AGENTS.md"),
    project: (cwd) => path.join(cwd, "AGENTS.md"),
  },
  goose: {
    label: "Goose (Block)",
    kind: "managed",
    project: (cwd) => path.join(cwd, ".goosehints"),
  },
  warp: {
    label: "Warp",
    kind: "managed",
    project: (cwd) => path.join(cwd, "WARP.md"),
  },
  kilo: {
    label: "Kilo Code",
    kind: "file",
    project: (cwd) => path.join(cwd, ".kilocode", "rules", "fable-skill.md"),
  },
  augment: {
    label: "Augment Code",
    kind: "file",
    project: (cwd) => path.join(cwd, ".augment", "rules", "fable-skill.md"),
  },
  openhands: {
    label: "OpenHands",
    kind: "managed",
    project: (cwd) => path.join(cwd, ".openhands", "microagents", "repo.md"),
  },
  replit: {
    label: "Replit Agent",
    kind: "managed",
    project: (cwd) => path.join(cwd, "replit.md"),
  },
  agents: {
    label: "AGENTS.md standard (Codex, Amp, Jules, Zed, Factory, and others)",
    kind: "managed",
    project: (cwd) => path.join(cwd, "AGENTS.md"),
  },
};

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function installTarget(name, scope, cwd, opts = {}) {
  const t = TARGETS[name];
  if (!t) throw new Error(`Unknown agent "${name}". Run: npx fable-skill list`);

  const resolver = scope === "global" ? t.global : t.project;
  if (!resolver) {
    const has = t.global ? "--global" : "--project";
    throw new Error(`${name} does not support --${scope}. Use ${has}.`);
  }
  const dest = resolver(cwd);

  if (t.kind === "folder") copySkillFolder(dest);
  else if (t.kind === "file") writeMerged(dest, { header: t.header, full: opts.full });
  else upsertManagedBlock(dest, "fable-skill — agentic operating discipline", opts);

  console.log(`  ✔ ${t.label.padEnd(28)} → ${dest}`);
}

function usage() {
  console.log(`
fable-skill — Fable-class operating discipline for any coding agent

Usage:
  npx fable-skill <agent> [--project | --global]
  npx fable-skill all [--project | --global]
  npx fable-skill list

Agents: ${Object.keys(TARGETS).join(", ")}

Scope:
  --project   install into the current directory's agent config (default)
  --global    install into the user-level config (where the agent supports it)

Depth (single-file targets only; skill-folder targets always get the full skill):
  (default)   compact edition, ~2k tokens — safe for always-on rules files
  --full      full skill with all reference modules, ~7k tokens per request

Examples:
  npx fable-skill claude --global     # Claude Code, all projects
  npx fable-skill cursor              # Cursor rules in this repo
  npx fable-skill agents              # AGENTS.md block (Codex, Amp, Jules, ...)
  npx fable-skill all                 # every project-level target at once
`);
}

function main() {
  const args = process.argv.slice(2);
  const scope = args.includes("--global") ? "global" : "project";
  const opts = { full: args.includes("--full") };
  const names = args.filter((a) => !a.startsWith("--"));
  const cwd = process.cwd();

  if (names.length === 0 || names[0] === "help") return usage();

  if (names[0] === "list") {
    console.log("\nSupported agents:\n");
    for (const [key, t] of Object.entries(TARGETS)) {
      const scopes = [t.project && "project", t.global && "global"].filter(Boolean).join(", ");
      console.log(`  ${key.padEnd(10)} ${t.label.padEnd(55)} [${scopes}]`);
    }
    console.log("");
    return;
  }

  const list = names[0] === "all"
    ? Object.keys(TARGETS).filter((k) => (scope === "global" ? TARGETS[k].global : TARGETS[k].project))
    : names;

  console.log(`\nInstalling fable-skill (${scope} scope${opts.full ? ", full depth" : ""}):\n`);
  let failed = 0;
  for (const name of list) {
    try {
      installTarget(name, scope, cwd, opts);
    } catch (e) {
      failed++;
      console.error(`  ✘ ${name}: ${e.message}`);
    }
  }
  console.log(`\nDone.${failed ? ` ${failed} target(s) failed.` : ""}\n`);
  if (failed) process.exitCode = 1;
}

if (require.main === module) main();

module.exports = { TARGETS, installTarget, mergedMarkdown, compactMarkdown };
