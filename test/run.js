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
const REFS_DIR = path.join(ROOT, "skill", "references");
const {
  TARGETS,
  compactMarkdown,
  mergedMarkdown,
  contentSizes,
  findDuplicateInstalls,
  parseArgs,
} = require(CLI);

const ESSENTIAL_POLICIES = [
  { name: "task contract", re: /task contract/i },
  { name: "action modes", re: /answer \| review \| diagnose \| plan \| implement \| monitor/ },
  { name: "plan-only", re: /plan:.*no implementation/i },
  { name: "diagnose-only", re: /diagnose.*no silent/i },
  { name: "tier LIGHT", re: /\bLIGHT\b/ },
  { name: "tier STANDARD", re: /\bSTANDARD\b/ },
  { name: "tier FULL", re: /\bFULL\b/ },
  { name: "de-escalation", re: /De-escalate/i },
  { name: "transient retry", re: /Transient/ },
  { name: "deterministic stop", re: /Deterministic/ },
  { name: "hard limit", re: /Hard (host )?limit/i },
  { name: "evidence", re: /would differ if the claim were false/i },
];

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
    error: result.error ? result.error.message : "",
  };
}

function failDetail(result) {
  const bits = [
    result.stdout && `STDOUT:\n${result.stdout}`,
    result.stderr && `STDERR:\n${result.stderr}`,
    result.error && `ERROR:\n${result.error}`,
    `status=${result.status}`,
  ].filter(Boolean);
  return bits.join("\n");
}

function runOk(cwd, args = [], opts = {}) {
  const result = run(cwd, args, opts);
  if (result.status !== 0) {
    throw new Error(
      `Command failed (${result.status}): node ${path.basename(opts.cli || CLI)} ${args.join(" ")}\n` +
      failDetail(result)
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

const referenceNames = () =>
  fs.readdirSync(REFS_DIR).filter((f) => f.endsWith(".md")).sort();

function parseFrontmatter(md) {
  const match = md.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) return null;
  const fields = {};
  for (const line of match[1].split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    fields[line.slice(0, idx).trim()] = line.slice(idx + 1).trim().replace(/^"|"$/g, "");
  }
  return fields;
}

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
  const before = fs.readFileSync(agents, "utf8");
  check("stale-content fixture uses live compact text", before.includes("Do not act on assumption"));
  const mutated = before.replace("Do not act on assumption", "STALE-OLD-CONTENT");
  check("stale-content mutation applied", mutated.includes("STALE-OLD-CONTENT") && !mutated.includes("Do not act on assumption"));
  fs.writeFileSync(agents, mutated);
  runOk(dir, ["agents"]);
  const updated = fs.readFileSync(agents, "utf8");
  check("managed block updates on re-install", !updated.includes("STALE-OLD-CONTENT") && updated.includes("Do not act on assumption"));

  fs.writeFileSync(agents, "# My own project rules\nkeep me\n\n" + fs.readFileSync(agents, "utf8"));
  runOk(dir, ["agents"]);
  const after = fs.readFileSync(agents, "utf8");
  check("user content preserved", after.includes("keep me") && countBlocks(agents) === 1);

  const crlfDir = freshDir();
  const crlfAgents = path.join(crlfDir, "AGENTS.md");
  fs.writeFileSync(crlfAgents, "# keep-crlf\r\n\r\n");
  runOk(crlfDir, ["agents"]);
  const crlfAfter = fs.readFileSync(crlfAgents, "utf8");
  check("CRLF surrounding content preserved", crlfAfter.includes("keep-crlf") && countBlocks(crlfAgents) === 1);

  const dupDir = freshDir();
  const dupAgents = path.join(dupDir, "AGENTS.md");
  fs.writeFileSync(
    dupAgents,
    "<!-- BEGIN fable-skill (managed - do not edit inside) -->\nfirst\n<!-- END fable-skill -->\n\n" +
    "<!-- BEGIN fable-skill (managed - do not edit inside) -->\nsecond\n<!-- END fable-skill -->\n"
  );
  runOk(dupDir, ["agents"]);
  check("duplicate managed markers collapse to one", countBlocks(path.join(dupDir, "AGENTS.md")) === 1);

  const dryDir = freshDir();
  const dry = runOk(dryDir, ["cursor", "--dry-run"]);
  check("dry-run reports destination", /dry-run/.test(dry));
  check("dry-run writes nothing", !fs.existsSync(path.join(dryDir, ".cursor")));
}

// --- 2. compact default, full merge, content policy -----------------------
{
  const dir = freshDir();
  runOk(dir, ["cursor"]);
  const compactLen = fs.statSync(path.join(dir, ".cursor", "rules", "fable-skill.mdc")).size;
  runOk(dir, ["cursor", "--full"]);
  const fullLen = fs.statSync(path.join(dir, ".cursor", "rules", "fable-skill.mdc")).size;
  check("compact default is much smaller than --full", compactLen < fullLen / 2, `${compactLen} vs ${fullLen}`);

  const sizes = contentSizes();
  check("sizes report compact bytes", sizes.compactBytes > 0 && sizes.mergedBytes > sizes.compactBytes);
  console.log(`  · measured core ${sizes.coreBytes} B (~${sizes.coreTokens4} tok/4), compact ${sizes.compactBytes} B (~${sizes.compactTokens4}), full ${sizes.mergedBytes} B (~${sizes.mergedTokens4})`);

  const refs = referenceNames();
  check("full merge contains all reference modules", refs.every((m) => mergedMarkdown().includes(`<!-- ${m} -->`)), refs.join(", "));
  check("full merge rewrites module paths to section refs", !/references\/[a-z]+\.md/.test(mergedMarkdown()));

  const compact = compactMarkdown();
  check("compact has no unresolved reference files", !/references\/[a-z]+\.md/.test(compact));
  for (const policy of ESSENTIAL_POLICIES) {
    check(`compact has ${policy.name}`, policy.re.test(compact));
    check(`full merge has ${policy.name}`, policy.re.test(mergedMarkdown()));
  }

  const fm = parseFrontmatter(fs.readFileSync(SKILL_MD, "utf8"));
  check("SKILL.md frontmatter has name", fm && fm.name === "fable-skill");
  check("SKILL.md description length <= 1024", fm && fm.description.length <= 1024, fm && String(fm.description.length));
}

// --- 3. folder targets copy the complete skill ----------------------------
{
  const dir = freshDir();
  runOk(dir, ["claude"]);
  const refs = fs.readdirSync(path.join(dir, ".claude", "skills", "fable-skill", "references")).filter((f) => f.endsWith(".md"));
  const expected = referenceNames();
  check("claude folder has all reference modules", refs.length === expected.length, refs.join(", "));
  check("dynamic reference list matches disk", expected.length >= 10, expected.join(", "));
}

// --- 4. usage/list/doctor CLI contract ------------------------------------
{
  const dir = freshDir();
  const noArgs = run(dir);
  check("no args prints usage", noArgs.status === 0 && noArgs.stdout.includes("Usage:"), failDetail(noArgs));

  const help = run(dir, ["help"]);
  check("help prints usage", help.status === 0 && help.stdout.includes("Usage:"), failDetail(help));

  const longHelp = run(dir, ["--help"]);
  check("--help prints usage", longHelp.status === 0 && longHelp.stdout.includes("Usage:"), failDetail(longHelp));
  check("help mentions doctor", /doctor/.test(longHelp.stdout));
  check("help does not promise 7k tokens", !/roughly 7k tokens/.test(longHelp.stdout));

  const list = run(dir, ["list"]);
  check("list prints supported agents", list.status === 0 && list.stdout.includes("Supported agents:") && list.stdout.includes("claude") && list.stdout.includes("codex-agents"), failDetail(list));

  const sizesOut = run(dir, ["sizes"]);
  check("sizes command reports bytes", sizesOut.status === 0 && /UTF-8 bytes/.test(sizesOut.stdout), failDetail(sizesOut));

  runOk(dir, ["cursor"]);
  runOk(dir, ["claude"]);
  const doctor = run(dir, ["doctor"]);
  check("doctor reports version and duplicates", doctor.status === 0 && /Version:/.test(doctor.stdout) && /cursor/.test(doctor.stdout) && /claude/.test(doctor.stdout), failDetail(doctor));
  const dups = findDuplicateInstalls(dir);
  check("duplicate scan finds folder and file installs", dups.some((h) => h.kind === "folder") && dups.some((h) => h.kind === "file"));
}

// --- 5. invalid option handling -------------------------------------------
{
  const dir = freshDir();
  const unknownFlag = run(dir, ["cursor", "--bogus"]);
  check("unknown option exits non-zero", unknownFlag.status === 1, failDetail(unknownFlag));
  check("unknown option explains the problem", /Unknown option/.test(unknownFlag.stderr), unknownFlag.stderr);

  const conflictingScope = run(dir, ["cursor", "--project", "--global"]);
  check("conflicting scope flags exit non-zero", conflictingScope.status === 1, failDetail(conflictingScope));
  check("conflicting scope flags explain the problem", /Choose exactly one of --project or --global/.test(conflictingScope.stderr), conflictingScope.stderr);

  const unsupported = run(dir, ["cursor", "--global"]);
  check("unsupported global scope exits non-zero", unsupported.status === 1, failDetail(unsupported));
  check("unsupported scope names the allowed flag", /does not support --global/.test(unsupported.stderr), unsupported.stderr);
}

// --- 6. broken packaged content gets explicit diagnostics -----------------
{
  const fixture = freshDir();
  copyDir(ROOT, fixture);
  const fixtureCli = path.join(fixture, "bin", "cli.js");

  fs.rmSync(path.join(fixture, "skill", "SKILL.md"));
  const missingSkill = run(freshDir(), ["cursor", "--full"], { cli: fixtureCli });
  check("missing SKILL.md exits non-zero", missingSkill.status === 1, failDetail(missingSkill));
  check("missing SKILL.md error is explicit", /missing skill\/SKILL\.md/.test(missingSkill.stderr), missingSkill.stderr);

  copyDir(ROOT, fixture);
  fs.rmSync(path.join(fixture, "skill", "references"), { recursive: true, force: true });
  const missingRefs = run(freshDir(), ["claude"], { cli: fixtureCli });
  check("missing references exits non-zero", missingRefs.status === 1, failDetail(missingRefs));
  check("missing references error is explicit", /missing skill\/references directory/.test(missingRefs.stderr), missingRefs.stderr);

  copyDir(ROOT, fixture);
  fs.rmSync(path.join(fixture, "skill", "COMPACT.md"));
  const missingCompact = run(freshDir(), ["cursor"], { cli: fixtureCli });
  check("missing COMPACT.md exits non-zero", missingCompact.status === 1, failDetail(missingCompact));
  check("missing COMPACT.md does not silently install full merge", /missing skill\/COMPACT\.md/.test(missingCompact.stderr), missingCompact.stderr);
}

// --- 7. unknown agent fails with exit code 1 ------------------------------
{
  const dir = freshDir();
  const result = run(dir, ["nonexistent-agent"]);
  check("unknown agent exits non-zero", result.status === 1, failDetail(result));
}

// --- 8. isolated global installation path ---------------------------------
{
  const fakeHome = freshDir();
  const prevHome = process.env.HOME;
  const prevUserProfile = process.env.USERPROFILE;
  try {
    const result = run(freshDir(), ["continue", "--global"], {
      env: { HOME: fakeHome, USERPROFILE: fakeHome },
    });
    check("isolated global install exits 0", result.status === 0, failDetail(result));
    const dest = path.join(fakeHome, ".continue", "rules", "fable-skill.md");
    check("isolated global install wrote under fake home", fs.existsSync(dest), dest);
    check("isolated global install did not use real home", !dest.startsWith(os.homedir()) || fakeHome === os.homedir());
  } finally {
    if (prevHome === undefined) delete process.env.HOME;
    else process.env.HOME = prevHome;
    if (prevUserProfile === undefined) delete process.env.USERPROFILE;
    else process.env.USERPROFILE = prevUserProfile;
  }
}

// --- 9. Hermes support and workflow guidance are present ------------------
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
  check("README has a 3-minute install section", /## 3-minute install/i.test(readme), "README missing 3-minute install section");
  check("README has a verify installation section", /## Verify installation/i.test(readme), "README missing verify installation section");
  check("README has an example usage section", /## Example usage/i.test(readme), "README missing example usage section");
  check("README includes agent-specific invoke guidance", /Claude Code\s*\|.*\/fable-skill|Hermes Agent\s*\|.*delegate_task|Cursor\s*\|.*always on/i.test(readme), "README missing agent-specific invocation guidance");
  check("README includes grounded install commands for key agents", /fable-skill claude --global/i.test(readme) && /fable-skill hermes --global/i.test(readme) && /fable-skill codex --global/i.test(readme) && /fable-skill cursor/i.test(readme) && /fable-skill gemini/i.test(readme) && /fable-skill openclaw --global/i.test(readme), "README missing practical install commands");
  check("README does not claim 60% latency cut", !/60%/.test(readme));
  check("README does not claim native skills are free", !/no per-request cost/i.test(readme));
  check("README module count is ten", /ten focused modules|10 focused modules|ten reference modules/i.test(readme), "README module count");
  check("README states performance is unmeasured", /unmeasured|not been measured|no behavioral benchmark/i.test(readme));

  check("SKILL.md mentions Hermes-native workflows", /Hermes/i.test(skill), "SKILL.md missing Hermes references");
  check("SKILL.md mentions Hermes todo tool or delegate_task", /todo tool|delegate_task|Hermes todo/i.test(skill), "SKILL.md missing Hermes-native workflow guidance");
  check("COMPACT.md mentions Hermes-native workflows", /Hermes|delegate_task|todo tool/i.test(compact), "COMPACT.md missing Hermes-native workflow guidance");
  check("SKILL.md has no 60% latency claim", !/60%/.test(skill));
  check("COMPACT.md has no 60% latency claim", !/60%/.test(compact));
}

// --- 10. parseArgs contract -----------------------------------------------
{
  const parsed = parseArgs(["cursor", "--dry-run", "--full"]);
  check("parseArgs keeps dry-run and full", parsed.opts.dryRun === true && parsed.opts.full === true);
}

console.log(failures ? `\n${failures} test(s) FAILED` : "\nAll tests passed");
process.exit(failures ? 1 : 0);
