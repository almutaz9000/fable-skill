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
const crypto = require("crypto");

const ROOT = path.join(__dirname, "..");
const SKILL_DIR = path.join(ROOT, "fable-skill");
const PACKAGE_VERSION = require(path.join(ROOT, "package.json")).version;
const INSTALL_MANIFEST = ".fable-skill-manifest.json";

function resolveHome() {
  return os.homedir();
}

function resolveHermesHome() {
  if (process.env.HERMES_HOME) return process.env.HERMES_HOME;
  if (process.platform === "win32") {
    const localAppData = process.env.LOCALAPPDATA;
    if (localAppData) return path.join(localAppData, "hermes");
    return path.join(os.homedir(), "AppData", "Local", "hermes");
  }
  return path.join(os.homedir(), ".hermes");
}

function resolveOpenClawStateDir() {
  return process.env.OPENCLAW_STATE_DIR || path.join(resolveHome(), ".openclaw");
}

// ---------------------------------------------------------------------------
// Content builders
// ---------------------------------------------------------------------------

/** Skill content never changes within one process; read and assemble it once. */
function memo(fn) {
  let value, cached = false;
  return () => {
    if (!cached) {
      value = fn();
      cached = true;
    }
    return value;
  };
}

function requireSkillFile(name) {
  const file = path.join(SKILL_DIR, name);
  if (!fs.existsSync(file)) {
    throw new Error(`fable-skill installation is incomplete: missing fable-skill/${name}`);
  }
  return file;
}

function requireReferencesDir() {
  const dir = path.join(SKILL_DIR, "references");
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    throw new Error("fable-skill installation is incomplete: missing fable-skill/references directory");
  }
  return dir;
}

const readSkillMd = memo(() => fs.readFileSync(requireSkillFile("SKILL.md"), "utf8"));

function stripFrontmatter(md) {
  return md.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
}

const referenceFiles = memo(() => {
  const dir = requireReferencesDir();
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((f) => ({ name: f, content: fs.readFileSync(path.join(dir, f), "utf8") }));
});

const FOOTER =
  "\n\n---\n\n*Installed by [fable-skill](https://github.com/almutaz9000/fable-skill). Re-run `npx fable-skill` to update.*\n";

/** Full merge: SKILL.md + every reference module (roughly 18k estimated tokens). */
const mergedMarkdown = memo(() => {
  const parts = [stripFrontmatter(readSkillMd()).trim()];
  for (const ref of referenceFiles()) {
    parts.push(`\n\n---\n\n<!-- ${ref.name} -->\n\n${ref.content.trim()}`);
  }
  parts.push(FOOTER);
  return parts.join("");
});

/**
 * Compact edition (roughly 2k tokens) — the default for single-file rules
 * targets, where the content is injected into EVERY request and token cost
 * matters. Agents with native skill folders load references on demand and
 * get the full skill instead.
 */
const compactMarkdown = memo(() => {
  const compact = path.join(SKILL_DIR, "COMPACT.md");
  if (!fs.existsSync(compact)) return mergedMarkdown();
  return fs.readFileSync(requireSkillFile("COMPACT.md"), "utf8").trim() + FOOTER;
});

/** Write a file through a sibling temporary path, then atomically replace it. */
function atomicWriteFileSync(destFile, content) {
  fs.mkdirSync(path.dirname(destFile), { recursive: true });
  const temp = path.join(
    path.dirname(destFile),
    `.${path.basename(destFile)}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
  try {
    fs.writeFileSync(temp, content);
    if (fs.existsSync(destFile)) {
      fs.chmodSync(temp, fs.statSync(destFile).mode);
    }
    fs.renameSync(temp, destFile);
  } finally {
    fs.rmSync(temp, { force: true });
  }
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function manifestPathKey(relativePath) {
  return relativePath.split(path.sep).join("/");
}

function validateManifestPath(relativePath) {
  if (
    typeof relativePath !== "string" ||
    !relativePath ||
    path.isAbsolute(relativePath) ||
    relativePath.split(/[\\/]/).includes("..")
  ) {
    throw new Error(`invalid path in ${INSTALL_MANIFEST}: ${relativePath}`);
  }
}

function readInstallManifest(destDir) {
  const file = path.join(destDir, INSTALL_MANIFEST);
  if (!fs.existsSync(file)) return null;
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    throw new Error(`cannot update ${destDir}: invalid ${INSTALL_MANIFEST}: ${error.message}`);
  }
  if (!manifest || manifest.format !== 1 || !manifest.files || typeof manifest.files !== "object") {
    throw new Error(`cannot update ${destDir}: unsupported ${INSTALL_MANIFEST}`);
  }
  for (const [relativePath, hash] of Object.entries(manifest.files)) {
    validateManifestPath(relativePath);
    if (!/^[a-f0-9]{64}$/.test(hash)) {
      throw new Error(`cannot update ${destDir}: invalid hash for ${relativePath}`);
    }
  }
  return manifest;
}

function walkInstalledFiles(root, visit, relativeDir = "") {
  const dir = path.join(root, relativeDir);
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const relativePath = path.join(relativeDir, entry.name);
    const source = path.join(root, relativePath);
    const stat = fs.lstatSync(source);
    if (stat.isSymbolicLink()) {
      throw new Error(`cannot safely update ${root}: symbolic link found at ${relativePath}`);
    }
    if (stat.isDirectory()) walkInstalledFiles(root, visit, relativePath);
    else if (stat.isFile()) visit(relativePath, source);
    else throw new Error(`cannot safely update ${root}: unsupported entry at ${relativePath}`);
  }
}

function writeStagedSkill(staged) {
  const managed = {};
  fs.mkdirSync(path.join(staged, "references"), { recursive: true });
  fs.copyFileSync(requireSkillFile("SKILL.md"), path.join(staged, "SKILL.md"));
  managed["SKILL.md"] = sha256File(path.join(staged, "SKILL.md"));
  for (const ref of referenceFiles()) {
    const relativePath = path.join("references", ref.name);
    const dest = path.join(staged, relativePath);
    fs.writeFileSync(dest, ref.content);
    managed[manifestPathKey(relativePath)] = sha256File(dest);
  }
  fs.writeFileSync(
    path.join(staged, INSTALL_MANIFEST),
    JSON.stringify({ format: 1, package: "fable-skill", version: PACKAGE_VERSION, files: managed }, null, 2) + "\n"
  );
  return managed;
}

/** Replace managed files atomically while preserving user-added files. */
function copySkillFolder(destDir) {
  requireReferencesDir();
  const parent = path.dirname(destDir);
  fs.mkdirSync(parent, { recursive: true });
  const nonce = `${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const staged = path.join(parent, `.${path.basename(destDir)}.tmp-${nonce}`);
  const backup = path.join(parent, `.${path.basename(destDir)}.bak-${nonce}`);
  let keepLegacyBackup = false;

  try {
    const currentManaged = writeStagedSkill(staged);
    const oldManifest = fs.existsSync(destDir) ? readInstallManifest(destDir) : null;

    if (fs.existsSync(destDir)) {
      if (oldManifest) {
        for (const [relativePath, expectedHash] of Object.entries(oldManifest.files)) {
          const existingFile = path.join(destDir, ...relativePath.split("/"));
          if (!fs.existsSync(existingFile)) continue;
          if (!fs.statSync(existingFile).isFile() || sha256File(existingFile) !== expectedHash) {
            throw new Error(
              `cannot update ${destDir}: locally modified managed file ${relativePath}; ` +
              "move or revert it before reinstalling"
            );
          }
        }
      } else {
        // Pre-manifest installs may contain edited managed files. Keep a complete
        // sibling backup so the one-time migration is reversible.
        keepLegacyBackup = true;
      }

      walkInstalledFiles(destDir, (relativePath, source) => {
        const key = manifestPathKey(relativePath);
        if (key === INSTALL_MANIFEST) return;
        if (oldManifest && Object.prototype.hasOwnProperty.call(oldManifest.files, key)) return;
        if (Object.prototype.hasOwnProperty.call(currentManaged, key)) {
          if (!oldManifest) return;
          throw new Error(
            `cannot update ${destDir}: user file ${relativePath} conflicts with a newly managed file`
          );
        }
        const target = path.join(staged, relativePath);
        if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
          throw new Error(`cannot preserve ${relativePath}: path conflicts with a managed directory`);
        }
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.copyFileSync(source, target);
      });
    }

    if (!fs.existsSync(destDir)) {
      fs.renameSync(staged, destDir);
      return { legacyBackup: null };
    }

    fs.renameSync(destDir, backup);
    try {
      fs.renameSync(staged, destDir);
    } catch (error) {
      fs.renameSync(backup, destDir);
      throw error;
    }

    if (keepLegacyBackup) {
      return { legacyBackup: backup };
    }
    try {
      fs.rmSync(backup, { recursive: true, force: true });
    } catch (error) {
      console.warn(`  ! installed successfully; old backup remains at ${backup}: ${error.message}`);
    }
    return { legacyBackup: null };
  } finally {
    fs.rmSync(staged, { recursive: true, force: true });
  }
}

function writeMerged(destFile, opts = {}) {
  let body = opts.full ? mergedMarkdown() : compactMarkdown();
  if (opts.header) body = opts.header + "\n" + body;
  atomicWriteFileSync(destFile, body);
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
  const beginCount = existing.split(BEGIN).length - 1;
  const endCount = existing.split(END).length - 1;
  if (beginCount !== endCount || beginCount > 1) {
    throw new Error(
      `cannot safely update ${destFile}: expected zero or one balanced fable-skill marker pair`
    );
  }
  if (beginCount === 1) {
    const re = new RegExp(`${escapeRegExp(BEGIN)}[\\s\\S]*?${escapeRegExp(END)}\\n?`);
    if (!re.test(existing)) {
      throw new Error(`cannot safely update ${destFile}: malformed fable-skill managed block`);
    }
    existing = existing.replace(re, block);
  } else {
    existing = existing ? existing.replace(/\s*$/, "\n\n") + block : block;
  }
  atomicWriteFileSync(destFile, existing);
}

function removeManagedBlock(destFile) {
  if (!fs.existsSync(destFile)) return;
  const BEGIN = "<!-- BEGIN fable-skill (managed - do not edit inside) -->";
  const END = "<!-- END fable-skill -->";
  const existing = fs.readFileSync(destFile, "utf8");
  const beginCount = existing.split(BEGIN).length - 1;
  const endCount = existing.split(END).length - 1;
  if (beginCount === 0 && endCount === 0) return;
  if (beginCount !== 1 || endCount !== 1) {
    throw new Error(
      `cannot safely migrate ${destFile}: expected one balanced fable-skill marker pair`
    );
  }
  const re = new RegExp(`${escapeRegExp(BEGIN)}[\\s\\S]*?${escapeRegExp(END)}\\n?`);
  if (!re.test(existing)) {
    throw new Error(`cannot safely migrate ${destFile}: malformed fable-skill managed block`);
  }
  atomicWriteFileSync(destFile, existing.replace(re, "").replace(/\s*$/, "\n"));
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
    global: () => path.join(resolveHome(), ".claude", "skills", "fable-skill"),
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
    global: () => path.join(resolveHome(), "Documents", "Cline", "Rules", "fable-skill.md"),
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
    global: () => path.join(resolveHome(), ".agents", "skills", "fable-skill"),
    project: (cwd) => path.join(cwd, ".agents", "skills", "fable-skill"),
  },
  "codex-agents": {
    label: "OpenAI Codex (AGENTS.md, older CLIs)",
    kind: "managed",
    global: () => path.join(resolveHome(), ".codex", "AGENTS.md"),
    project: (cwd) => path.join(cwd, "AGENTS.md"),
  },
  gemini: {
    label: "Gemini CLI (native skill)",
    kind: "folder",
    global: () => path.join(resolveHome(), ".gemini", "skills", "fable-skill"),
    project: (cwd) => path.join(cwd, ".gemini", "skills", "fable-skill"),
  },
  "gemini-context": {
    label: "Gemini CLI legacy always-on context",
    kind: "managed",
    includeInAll: false,
    global: () => path.join(resolveHome(), ".gemini", "GEMINI.md"),
    project: (cwd) => path.join(cwd, "GEMINI.md"),
  },
  antigravity: {
    label: "Google Antigravity 2.0 / IDE (native skill)",
    kind: "folder",
    global: () => path.join(resolveHome(), ".gemini", "config", "skills", "fable-skill"),
    project: (cwd) => path.join(cwd, ".agents", "skills", "fable-skill"),
  },
  "antigravity-cli": {
    label: "Google Antigravity CLI (native skill)",
    kind: "folder",
    global: () => path.join(resolveHome(), ".gemini", "antigravity-cli", "skills", "fable-skill"),
    project: (cwd) => path.join(cwd, ".agents", "skills", "fable-skill"),
  },
  amp: {
    label: "Amp (Sourcegraph)",
    kind: "managed",
    project: (cwd) => path.join(cwd, "AGENTS.md"),
  },
  openclaw: {
    label: "OpenClaw / ClawBot",
    kind: "folder",
    global: () => path.join(resolveOpenClawStateDir(), "skills", "fable-skill"),
    project: (cwd) => path.join(cwd, "skills", "fable-skill"),
  },
  hermes: {
      label: "Hermes Agent",
      kind: "folder",
      global: () => path.join(resolveHermesHome(), "skills", "fable-skill"),
      project: (cwd) => path.join(cwd, ".hermes", "skills", "fable-skill"),
    },
  aider: {
    label: "Aider",
    kind: "managed",
    project: (cwd) => path.join(cwd, "CONVENTIONS.md"),
  },
  continue: {
    label: "Continue.dev",
    kind: "file",
    global: () => path.join(resolveHome(), ".continue", "rules", "fable-skill.md"),
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
    global: () => path.join(resolveHome(), ".qwen", "QWEN.md"),
    project: (cwd) => path.join(cwd, "QWEN.md"),
  },
  opencode: {
    label: "OpenCode",
    kind: "managed",
    global: () => path.join(resolveHome(), ".config", "opencode", "AGENTS.md"),
    project: (cwd) => path.join(cwd, "AGENTS.md"),
  },
  goose: {
    label: "Goose (Block)",
    kind: "managed",
    project: (cwd) => path.join(cwd, ".goosehints"),
  },
  crush: {
    label: "Crush (Charm) — runs GPT, Gemini, Qwen, GLM, local models",
    kind: "managed",
    project: (cwd) => path.join(cwd, "CRUSH.md"),
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
    label: "AGENTS.md standard (Codex, Amp, Jules, Zed, Factory Droid, Kimi CLI, Grok CLI, and others)",
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
  let folderResult = null;

  if (t.kind === "folder") folderResult = copySkillFolder(dest);
  else if (t.kind === "file") writeMerged(dest, { header: t.header, full: opts.full });
  else upsertManagedBlock(dest, "fable-skill — agentic operating discipline", opts);

  // v2.1 installed Gemini as an always-on GEMINI.md block. The native skill
  // is installed first, so failed staging cannot erase the working legacy copy.
  if (name === "gemini") {
    const legacy = TARGETS["gemini-context"];
    const legacyResolver = scope === "global" ? legacy.global : legacy.project;
    try {
      removeManagedBlock(legacyResolver(cwd));
    } catch (error) {
      console.warn(`  ! native Gemini skill installed, but legacy context cleanup failed: ${error.message}`);
    }
  }

  console.log(`  ✔ ${t.label.padEnd(28)} → ${dest}`);
  if (folderResult && folderResult.legacyBackup) {
    console.warn(`  ! pre-manifest install backed up at ${folderResult.legacyBackup}`);
  }
}

function printUsage() {
  console.log(`
fable-skill — Fable-class operating discipline for any coding agent

Usage:
  npx fable-skill <agent> [--project | --global]
  npx fable-skill all [--project | --global]
  npx fable-skill prompt [--full] [--stdout]   # plain system prompt for ANY model
  npx fable-skill list

Agents: ${Object.keys(TARGETS).join(", ")}

No harness? \`prompt\` writes FABLE-SKILL-PROMPT.md (or prints with --stdout) to paste
into any model's system prompt: Ollama/LM Studio/OpenWebUI (gemma, qwen, kimi, glm,
llama, deepseek, ...), or Grok / ChatGPT / Gemini custom instructions.

Scope:
  --project   install into the current directory's agent config (default)
  --global    install into the user-level config (where the agent supports it)

Depth (single-file targets only; skill-folder targets always get the full skill):
  (default)   compact edition, roughly 2k tokens — safe for always-on rules files
  --full      full skill with all reference modules, roughly 18k tokens per request

Examples:
  npx fable-skill claude --global     # Claude Code, all projects
  npx fable-skill hermes --global     # Hermes Agent skill folder
  npx fable-skill cursor              # Cursor rules in this repo
  npx fable-skill agents              # AGENTS.md block (Codex, Amp, Jules, ...)
  npx fable-skill all                 # every project-level target at once
`);
}

function parseArgs(argv) {
  const positionals = [];
  let scope = "project";
  let scopeFlag = null;
  let full = false;
  let stdout = false;
  let help = false;

  for (const arg of argv) {
    if (arg === "--project" || arg === "--global") {
      if (scopeFlag) {
        throw new Error("Choose exactly one of --project or --global.");
      }
      scopeFlag = arg;
      scope = arg.slice(2);
      continue;
    }
    if (arg === "--full") {
      full = true;
      continue;
    }
    if (arg === "--stdout") {
      stdout = true;
      continue;
    }
    if (arg === "--help") {
      help = true;
      continue;
    }
    if (arg.startsWith("--")) {
      throw new Error(`Unknown option: ${arg}`);
    }
    positionals.push(arg);
  }

  if (help) {
    if (scopeFlag || full || stdout || positionals.length > 0) {
      throw new Error("--help does not accept commands or other options.");
    }
    return { command: "help", scope, opts: { full: false, stdout: false } };
  }
  if (positionals.length > 1) {
    throw new Error(`Expected one command, received: ${positionals.join(", ")}`);
  }

  const command = positionals[0] || null;
  if (!command) {
    if (scopeFlag || full || stdout) throw new Error("Options require a command.");
    return { command: null, scope, opts: { full, stdout } };
  }

  if (command === "help") {
    if (scopeFlag || full || stdout) throw new Error("help does not accept options.");
  } else if (command === "list") {
    if (scopeFlag || full || stdout) throw new Error("list does not accept scope, --full, or --stdout.");
  } else if (command === "prompt") {
    if (scopeFlag) throw new Error("prompt does not accept --project or --global.");
  } else if (command === "all") {
    if (stdout) throw new Error("--stdout is only valid with prompt.");
  } else {
    const target = TARGETS[command];
    if (!target) throw new Error(`Unknown agent "${command}". Run: npx fable-skill list`);
    if (stdout) throw new Error("--stdout is only valid with prompt.");
    if (full && target.kind === "folder") {
      throw new Error(`${command} is a native skill-folder target and does not accept --full.`);
    }
    const resolver = scope === "global" ? target.global : target.project;
    if (!resolver) {
      const supported = target.global ? "--global" : "--project";
      throw new Error(`${command} does not support --${scope}. Use ${supported}.`);
    }
  }

  return { command, scope, opts: { full, stdout } };
}

function main() {
  let parsed;
  try {
    parsed = parseArgs(process.argv.slice(2));
  } catch (e) {
    console.error(e.message);
    process.exitCode = 1;
    return;
  }

  const { command, scope, opts } = parsed;
  const cwd = process.cwd();

  if (!command || command === "help") {
    printUsage();
    return;
  }

  // Universal escape hatch for models without a supported native harness.
  if (command === "prompt") {
    const body = opts.full ? mergedMarkdown() : compactMarkdown();
    if (opts.stdout) {
      process.stdout.write(body + "\n");
      return;
    }
    const dest = path.join(cwd, "FABLE-SKILL-PROMPT.md");
    atomicWriteFileSync(dest, body + "\n");
    console.log(`
  ✔ system prompt written → ${dest}

  Paste it into any model's system prompt or custom instructions:
    - Ollama:      SYSTEM block of a Modelfile (gemma, qwen, kimi, glm, llama, deepseek, ...)
    - LM Studio / OpenWebUI / Jan:  the system prompt field
    - Grok / ChatGPT / Gemini:     custom instructions
  Or pipe it:  npx fable-skill prompt --stdout
`);
    return;
  }

  if (command === "list") {
    console.log("\nSupported agents:\n");
    for (const [key, t] of Object.entries(TARGETS)) {
      const scopes = [t.project && "project", t.global && "global"].filter(Boolean).join(", ");
      console.log(`  ${key.padEnd(18)} ${t.label.padEnd(55)} [${scopes}]`);
    }
    console.log("");
    return;
  }

  const list = command === "all"
    ? Object.keys(TARGETS).filter((key) =>
        TARGETS[key].includeInAll !== false &&
        (scope === "global" ? TARGETS[key].global : TARGETS[key].project)
      )
    : [command];

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

module.exports = {
  TARGETS,
  installTarget,
  mergedMarkdown,
  compactMarkdown,
  parseArgs,
  requireSkillFile,
  requireReferencesDir,
  resolveHermesHome,
  resolveOpenClawStateDir,
};
