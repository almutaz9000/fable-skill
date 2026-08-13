#!/usr/bin/env node
/** Zero-dependency test suite: node test/run.js */
"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawnSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const CLI = path.join(ROOT, "bin", "cli.js");
const SKILL_MD = path.join(ROOT, "skill", "SKILL.md");
const COMPACT_MD = path.join(ROOT, "skill", "COMPACT.md");
const README_MD = path.join(ROOT, "README.md");
const { TARGETS, compactMarkdown, mergedMarkdown } = require(CLI);

let failures = 0;
function check(name, cond, detail) {
  if (cond) console.log(`  ✔ ${name}`);
  else {
    failures++;
    console.error(`  ✘ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function run(cwd, args = [], opts = {}) {
  const result = spawnSync(process.execPath, [opts.cli || CLI, ...args], {
    cwd,
    encoding: "utf8",
    stdio: "pipe",
    env: { ...process.env, ...opts.env },
  });
  return {
    status: result.status,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
  };
}

function runOk(cwd, args = [], opts = {}) {
  const result = run(cwd, args, opts);
  if (result.status !== 0) {
    throw new Error(
      `Command failed (${result.status}): node ${path.basename(opts.cli || CLI)} ${args.join(" ")}\n` +
      `STDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`
    );
  }
  return result.stdout;
}

function freshDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "fable-skill-test-"));
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

const countBlocks = (file) =>
  (fs.readFileSync(file, "utf8").match(/BEGIN fable-skill/g) || []).length;

// --- 1. every project-scope target installs -------------------------------
{
  const dir = freshDir();
  runOk(dir, ["all"]);
  for (const [name, t] of Object.entries(TARGETS)) {
    if (!t.project) continue;
    const dest = t.project(dir);
    const marker = t.kind === "folder" ? path.join(dest, "SKILL.md") : dest;
    check(`installs: ${name}`, fs.existsSync(marker), `missing ${marker}`);
  }

  runOk(dir, ["all"]);
  for (const f of ["AGENTS.md", "GEMINI.md", "CONVENTIONS.md", ".rules", ".goosehints", "WARP.md", "replit.md"]) {
    check(`idempotent: ${f}`, countBlocks(path.join(dir, f)) === 1, `expected 1 block`);
  }

  const agents = path.join(dir, "AGENTS.md");
  fs.writeFileSync(agents, fs.readFileSync(agents, "utf8").replace("The Loop", "STALE-OLD-CONTENT"));
  runOk(dir, ["agents"]);
  check("managed block updates on re-install", !fs.readFileSync(agents, "utf8").includes("STALE-OLD-CONTENT"));

  fs.writeFileSync(agents, "# My own project rules\nkeep me\n\n" + fs.readFileSync(agents, "utf8"));
  runOk(dir, ["agents"]);
  const after = fs.readFileSync(agents, "utf8");
  check("user content preserved", after.includes("keep me") && countBlocks(agents) === 1);
}

// --- 5. compact is the default; --full opts in ----------------------------
{
  const dir = freshDir();
  runOk(dir, ["cursor"]);
  const compactLen = fs.statSync(path.join(dir, ".cursor", "rules", "fable-skill.mdc")).size;
  runOk(dir, ["cursor", "--full"]);
  const fullLen = fs.statSync(path.join(dir, ".cursor", "rules", "fable-skill.mdc")).size;
  check("compact default is much smaller than --full", compactLen < fullLen / 2, `${compactLen} vs ${fullLen}`);
  check("compact roughly 2k tokens (est. < 3k at 4 bytes/token)", compactLen / 4 < 3000, `${compactLen} bytes ≈ ${Math.round(compactLen / 4)} tokens`);
  check("full merge contains all reference modules", ["reasoning.md", "planning.md", "execution.md", "verification.md", "context.md", "communication.md"].every((m) => mergedMarkdown().includes(`<!-- ${m} -->`)));
}

// --- 6. folder targets copy the complete skill ----------------------------
{
  const dir = freshDir();
  runOk(dir, ["claude"]);
  const refs = fs.readdirSync(path.join(dir, ".claude", "skills", "fable-skill", "references"));
  check("claude folder has all 10 references", refs.length === 10, refs.join(","));
}

// --- 7. usage/list CLI contract -------------------------------------------
{
  const dir = freshDir();
  const noArgs = run(dir);
  check("no args prints usage", noArgs.status === 0 && noArgs.stdout.includes("Usage:"), noArgs.stdout || noArgs.stderr);

  const help = run(dir, ["help"]);
  check("help prints usage", help.status === 0 && help.stdout.includes("Usage:"), help.stdout || help.stderr);

  const longHelp = run(dir, ["--help"]);
  check("--help prints usage", longHelp.status === 0 && longHelp.stdout.includes("Usage:"), longHelp.stdout || longHelp.stderr);

  const list = run(dir, ["list"]);
  check("list prints supported agents", list.status === 0 && list.stdout.includes("Supported agents:") && list.stdout.includes("claude") && list.stdout.includes("codex-agents"), list.stdout || list.stderr);
}

// --- 8. invalid option handling -------------------------------------------
{
  const dir = freshDir();
  const unknownFlag = run(dir, ["cursor", "--bogus"]);
  check("unknown option exits non-zero", unknownFlag.status === 1, unknownFlag.stdout || unknownFlag.stderr);
  check("unknown option explains the problem", /Unknown option/.test(unknownFlag.stderr), unknownFlag.stderr);

  const conflictingScope = run(dir, ["cursor", "--project", "--global"]);
  check("conflicting scope flags exit non-zero", conflictingScope.status === 1, conflictingScope.stdout || conflictingScope.stderr);
  check("conflicting scope flags explain the problem", /Choose exactly one of --project or --global/.test(conflictingScope.stderr), conflictingScope.stderr);
}

// --- 9. broken packaged content gets explicit diagnostics -----------------
{
  const fixture = freshDir();
  copyDir(ROOT, fixture);
  const fixtureCli = path.join(fixture, "bin", "cli.js");

  fs.rmSync(path.join(fixture, "skill", "SKILL.md"));
  const missingSkill = run(freshDir(), ["cursor", "--full"], { cli: fixtureCli });
  check("missing SKILL.md exits non-zero", missingSkill.status === 1, missingSkill.stdout || missingSkill.stderr);
  check("missing SKILL.md error is explicit", /missing skill\/SKILL\.md/.test(missingSkill.stderr), missingSkill.stderr);

  copyDir(ROOT, fixture);
  fs.rmSync(path.join(fixture, "skill", "references"), { recursive: true, force: true });
  const missingRefs = run(freshDir(), ["claude"], { cli: fixtureCli });
  check("missing references exits non-zero", missingRefs.status === 1, missingRefs.stdout || missingRefs.stderr);
  check("missing references error is explicit", /missing skill\/references directory/.test(missingRefs.stderr), missingRefs.stderr);
}

// --- 10. unknown agent fails with exit code 1 -----------------------------
{
  const dir = freshDir();
  const result = run(dir, ["nonexistent-agent"]);
  check("unknown agent exits non-zero", result.status === 1, result.stdout || result.stderr);
}

// --- 11. Hermes support and workflow guidance are present -----------------
{
  const skill = fs.readFileSync(SKILL_MD, "utf8");
  const compact = fs.readFileSync(COMPACT_MD, "utf8");
  const readme = fs.readFileSync(README_MD, "utf8");

  check("Hermes target exists in installer", Object.prototype.hasOwnProperty.call(TARGETS, "hermes"), Object.keys(TARGETS).join(", "));
  if (TARGETS.hermes) {
    check("Hermes is a folder target", TARGETS.hermes.kind === "folder", TARGETS.hermes.kind);
  }

  check("README support matrix mentions Hermes", /Hermes/i.test(readme), "README missing Hermes");
  check("README install table mentions Hermes", /\| Hermes /i.test(readme) || /Hermes Agent/i.test(readme), "README install table missing Hermes");
  check("README discusses common-model suitability", /smaller\/faster models|common models|most of the common models|quality gap between model tiers/i.test(readme), "README missing model-suitability guidance");

  check("SKILL.md mentions Hermes-native workflows", /Hermes/i.test(skill), "SKILL.md missing Hermes references");
  check("SKILL.md mentions Hermes todo tool or delegate_task", /todo tool|delegate_task|Hermes todo/i.test(skill), "SKILL.md missing Hermes-native workflow guidance");
  check("COMPACT.md mentions Hermes-native workflows", /Hermes|delegate_task|todo tool/i.test(compact), "COMPACT.md missing Hermes-native workflow guidance");
}

console.log(failures ? `\n${failures} test(s) FAILED` : "\nAll tests passed");
process.exit(failures ? 1 : 0);
