#!/usr/bin/env node
/** Zero-dependency test suite: node test/run.js */
"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const CLI = path.resolve(ROOT, "bin", "cli.js");
const SKILL_MD = path.join(ROOT, "fable-skill", "SKILL.md");
const COMPACT_MD = path.join(ROOT, "fable-skill", "COMPACT.md");
const README_MD = path.join(ROOT, "README.md");
const { TARGETS, compactMarkdown, mergedMarkdown, resolveHermesHome } = require(CLI);
const { findMissingReadmeLinks, parsePackFiles, npmInvocation } = require(path.join(ROOT, "scripts", "package-smoke.js"));
const { extractSessionId, gradeBehavior, parseModelResponse, tokenUsageDelta, parseCliArgs, usageRecord, buildChatArgs, cleanupTemporaryResources, noToolsInvoked } = require(path.join(ROOT, "scripts", "live-eval.js"));

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
    if (!t.project || t.includeInAll === false) continue;
    const dest = t.project(dir);
    const marker = t.kind === "folder" ? path.join(dest, "SKILL.md") : dest;
    check(`installs: ${name}`, fs.existsSync(marker), `missing ${marker}`);
  }

  runOk(dir, ["all"]);
  for (const f of ["AGENTS.md", "CONVENTIONS.md", ".rules", ".goosehints", "WARP.md", "replit.md"]) {
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
  check("compact is under 3k estimated tokens", compactLen / 4 < 3000, `${compactLen} bytes ≈ ${Math.round(compactLen / 4)} tokens`);
  check("full merge contains all reference modules", ["workflows.md", "reasoning.md", "planning.md", "execution.md", "verification.md", "context.md", "communication.md"].every((m) => mergedMarkdown().includes(`<!-- ${m} -->`)));
  check("compact edition routes workflows by deliverable", compactMarkdown().includes("Route by deliverable"));
  check("compact edition includes the approval checkpoint", compactMarkdown().includes("Checkpoint before expensive work"));
  check("compact edition separates questions from change requests", compactMarkdown().includes("not a change request"));
}

// --- 6. folder targets copy the complete skill ----------------------------
{
  const dir = freshDir();
  runOk(dir, ["claude"]);
  const refs = fs.readdirSync(path.join(dir, ".claude", "skills", "fable-skill", "references"));
  check("claude folder has all 8 references", refs.length === 8, refs.join(","));
}

// --- 7. prompt command: universal system-prompt export ---------------------
{
  const dir = freshDir();
  runOk(dir, ["prompt"]);
  const dest = path.join(dir, "FABLE-SKILL-PROMPT.md");
  check("prompt writes FABLE-SKILL-PROMPT.md", fs.existsSync(dest));
  check("prompt file has no managed markers", !fs.readFileSync(dest, "utf8").includes("BEGIN fable-skill"));
  const out = runOk(dir, ["prompt", "--stdout"]);
    check("prompt --stdout prints the compact skill", out.includes("Route by deliverable"));
    const full = runOk(dir, ["prompt", "--stdout", "--full"]);
    check("prompt --stdout --full includes reference modules", full.includes("<!-- workflows.md -->"));
  }

// --- 8. usage/list CLI contract -------------------------------------------

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

  const helpWithScope = run(dir, ["--help", "--global"]);
  check("--help rejects companion options", helpWithScope.status === 1 && /does not accept/.test(helpWithScope.stderr), helpWithScope.stderr);
  const helpWithCommand = run(dir, ["--help", "cursor"]);
  check("--help rejects companion commands", helpWithCommand.status === 1 && /does not accept/.test(helpWithCommand.stderr), helpWithCommand.stderr);
}

// --- 9. broken packaged content gets explicit diagnostics -----------------
{
  const fixture = freshDir();
  copyDir(ROOT, fixture);
  const fixtureCli = path.join(fixture, "bin", "cli.js");

  fs.rmSync(path.join(fixture, "fable-skill", "SKILL.md"));
  const missingSkill = run(freshDir(), ["cursor", "--full"], { cli: fixtureCli });
  check("missing SKILL.md exits non-zero", missingSkill.status === 1, missingSkill.stdout || missingSkill.stderr);
  check("missing SKILL.md error is explicit", /missing fable-skill\/SKILL\.md/.test(missingSkill.stderr), missingSkill.stderr);

  copyDir(ROOT, fixture);
  fs.rmSync(path.join(fixture, "fable-skill", "references"), { recursive: true, force: true });
  const missingRefs = run(freshDir(), ["claude"], { cli: fixtureCli });
  check("missing references exits non-zero", missingRefs.status === 1, missingRefs.stdout || missingRefs.stderr);
  check("missing references error is explicit", /missing fable-skill\/references directory/.test(missingRefs.stderr), missingRefs.stderr);

  const geminiDest = freshDir();
  const geminiMd = path.join(geminiDest, "GEMINI.md");
  runOk(geminiDest, ["gemini-context"]);
  const legacyBefore = fs.readFileSync(geminiMd, "utf8");
  const failedGeminiMigration = run(geminiDest, ["gemini"], { cli: fixtureCli });
  check("failed native Gemini install exits non-zero", failedGeminiMigration.status === 1, failedGeminiMigration.stdout || failedGeminiMigration.stderr);
  check("failed native Gemini install keeps legacy context", fs.readFileSync(geminiMd, "utf8") === legacyBefore);
}

// --- 10. unknown agent fails with exit code 1 -----------------------------
{
  const dir = freshDir();
  const result = run(dir, ["nonexistent-agent"]);
  check("unknown agent exits non-zero", result.status === 1, result.stdout || result.stderr);
}

// --- 11. named hosts, portable metadata, and safe upgrades -----------------
{
  const skill = fs.readFileSync(SKILL_MD, "utf8");
  const compact = fs.readFileSync(COMPACT_MD, "utf8");
  const readme = fs.readFileSync(README_MD, "utf8");
  const namedFolders = ["claude", "codex", "gemini", "antigravity", "antigravity-cli", "openclaw", "hermes"];

  for (const name of namedFolders) {
    check(`${name} target exists`, Object.prototype.hasOwnProperty.call(TARGETS, name), Object.keys(TARGETS).join(", "));
    if (TARGETS[name]) check(`${name} uses a native skill folder`, TARGETS[name].kind === "folder", TARGETS[name].kind);
  }

  check("README names every primary host", ["Hermes", "Claude Code", "OpenAI Codex", "Gemini CLI", "Google Antigravity", "OpenClaw"].every((name) => readme.includes(name)));
  check("README documents distinct Antigravity surfaces", /antigravity --global/i.test(readme) && /antigravity-cli --global/i.test(readme));
  check("README documents measured full prompt size", /about 18k tokens/i.test(readme));
  check("README has install, verification, and usage guidance", /## 3-minute install/i.test(readme) && /## Verify installation/i.test(readme) && /## Example usage/i.test(readme));

  const fm = skill.match(/^---[\s\S]*?---/)[0];
  const descMatch = fm.match(/description:\s*"([^"]+)"/);
  check("SKILL.md description exists", !!descMatch, "missing quoted description");
  if (descMatch) {
    check("SKILL.md description ≤60 chars", descMatch[1].length <= 60, `${descMatch[1].length} chars: ${descMatch[1]}`);
    check("description covers all workflow triggers", ["build", "debug", "research", "write", "review", "plan", "analyze", "operate"].every((word) => descMatch[1].toLowerCase().includes(word)), descMatch[1]);
  }
  check("frontmatter uses portable Agent Skills fields", !/^version:|^author:|^platforms:/m.test(fm), fm);
  const nameMatch = fm.match(/name:\s*([^\s]+)/);
  check("distributable directory matches Agent Skills name", !!nameMatch && path.basename(path.dirname(SKILL_MD)) === nameMatch[1], path.dirname(SKILL_MD));
  check("portable core has no host-specific tool names", !/delegate_task|todo tool|Hermes-native/i.test(skill + compact));
  check("compact edition has no dangling reference paths", !/references\//.test(compact));

  if (TARGETS.hermes) {
    const dest = TARGETS.hermes.global();
    check("Hermes global dest ends with skills/fable-skill", dest.endsWith(path.join("skills", "fable-skill")), dest);
  }
}

// --- 12. global installs are isolated and use verified host paths ----------
{
  const home = freshDir();
  const hermesHome = path.join(home, "hermes-profile");
  const openclawState = path.join(home, "openclaw-state");
  const env = {
    HOME: home,
    USERPROFILE: home,
    LOCALAPPDATA: path.join(home, "LocalAppData"),
    HERMES_HOME: hermesHome,
    OPENCLAW_STATE_DIR: openclawState,
  };
  const expected = {
    claude: path.join(home, ".claude", "skills", "fable-skill", "SKILL.md"),
    codex: path.join(home, ".agents", "skills", "fable-skill", "SKILL.md"),
    gemini: path.join(home, ".gemini", "skills", "fable-skill", "SKILL.md"),
    antigravity: path.join(home, ".gemini", "config", "skills", "fable-skill", "SKILL.md"),
    "antigravity-cli": path.join(home, ".gemini", "antigravity-cli", "skills", "fable-skill", "SKILL.md"),
    openclaw: path.join(openclawState, "skills", "fable-skill", "SKILL.md"),
    hermes: path.join(hermesHome, "skills", "fable-skill", "SKILL.md"),
  };
  for (const [name, dest] of Object.entries(expected)) {
    runOk(freshDir(), [name, "--global"], { env });
    check(`global path: ${name}`, fs.existsSync(dest), `missing ${dest}`);
  }
}

// --- 13. updates converge and invalid input has no side effects ------------
{
  const migrationDir = freshDir();
  const geminiMd = path.join(migrationDir, "GEMINI.md");
  fs.writeFileSync(geminiMd, "# User instructions\nkeep me\n\n");
  runOk(migrationDir, ["gemini-context"]);
  check("legacy Gemini context installs explicitly", countBlocks(geminiMd) === 1);
  runOk(migrationDir, ["gemini"]);
  const migratedGemini = fs.readFileSync(geminiMd, "utf8");
  check("native Gemini install removes the legacy managed block", countBlocks(geminiMd) === 0);
  check("Gemini migration preserves user context", migratedGemini.includes("keep me"));
  check("native Gemini skill exists after migration", fs.existsSync(path.join(migrationDir, ".gemini", "skills", "fable-skill", "SKILL.md")));

  const dir = freshDir();
  runOk(dir, ["claude"]);
  const skillDir = path.join(dir, ".claude", "skills", "fable-skill");
  const manifestFile = path.join(skillDir, ".fable-skill-manifest.json");
  const removed = path.join(skillDir, "references", "removed.md");
  const custom = path.join(skillDir, "references", "my-notes.md");
  fs.writeFileSync(removed, "retired package file\n");
  fs.writeFileSync(custom, "user-authored notes\n");
  const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
  manifest.files["references/removed.md"] = crypto.createHash("sha256").update(fs.readFileSync(removed)).digest("hex");
  fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + "\n");
  runOk(dir, ["claude"]);
  check("folder reinstall removes retired managed files", !fs.existsSync(removed), removed);
  check("folder reinstall preserves user-added files", fs.readFileSync(custom, "utf8") === "user-authored notes\n");

  fs.writeFileSync(path.join(skillDir, "SKILL.md"), "locally modified\n");
  const modifiedUpdate = run(dir, ["claude"]);
  check("folder reinstall refuses modified managed files", modifiedUpdate.status === 1 && /locally modified managed file/.test(modifiedUpdate.stderr), modifiedUpdate.stderr);
  check("refused update preserves local modification", fs.readFileSync(path.join(skillDir, "SKILL.md"), "utf8") === "locally modified\n");

  const legacyDir = freshDir();
  runOk(legacyDir, ["claude"]);
  const legacySkillDir = path.join(legacyDir, ".claude", "skills", "fable-skill");
  fs.rmSync(path.join(legacySkillDir, ".fable-skill-manifest.json"));
  fs.writeFileSync(path.join(legacySkillDir, "SKILL.md"), "legacy local edit\n");
  runOk(legacyDir, ["claude"]);
  const legacyParent = path.dirname(legacySkillDir);
  const legacyBackup = fs.readdirSync(legacyParent).find((name) => name.startsWith(".fable-skill.bak-"));
  check("pre-manifest update keeps a reversible backup", !!legacyBackup, legacyParent);
  if (legacyBackup) {
    check("pre-manifest backup preserves edited content", fs.readFileSync(path.join(legacyParent, legacyBackup, "SKILL.md"), "utf8") === "legacy local edit\n");
  }

  const invalidDir = freshDir();
  const invalid = run(invalidDir, ["cursor", "--stdout"]);
  check("invalid option combination exits non-zero", invalid.status === 1, invalid.stdout || invalid.stderr);
  check("invalid option combination writes nothing", !fs.existsSync(path.join(invalidDir, ".cursor")));

  const malformedDir = freshDir();
  const agents = path.join(malformedDir, "AGENTS.md");
  const malformed = "# Keep me\n<!-- BEGIN fable-skill (managed - do not edit inside) -->\ntruncated\n";
  fs.writeFileSync(agents, malformed);
  const result = run(malformedDir, ["agents"]);
  check("malformed managed markers fail", result.status === 1 && /balanced fable-skill marker pair/.test(result.stderr), result.stderr);
  check("malformed shared file remains unchanged", fs.readFileSync(agents, "utf8") === malformed);
}

// --- 14. installer target registry stays in sync with README docs --------
{
  const readme = fs.readFileSync(README_MD, "utf8");
  for (const key of Object.keys(TARGETS)) {
    const pattern = new RegExp("`" + key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "([ `]|$)");
    check(`README documents target command: ${key}`, pattern.test(readme), `no \`${key}\` command found in README.md`);
  }
}
// --- 15. full prompt size stays within the documented CI budget -------------
{
  const fullPrompt = mergedMarkdown();
  const maxEstimatedTokens = 20_000; // repository estimate: 4 characters per token
  const estimatedTokens = Math.ceil(fullPrompt.length / 4);
  const withinEstimatedBudget = (text, budget) => Math.ceil(text.length / 4) <= budget;
  const syntheticOverflow = "x".repeat((maxEstimatedTokens + 1) * 4);
  check(
    "full merged prompt stays below 20k estimated tokens",
    withinEstimatedBudget(fullPrompt, maxEstimatedTokens),
    `${fullPrompt.length} chars ≈ ${estimatedTokens} tokens; maximum ${maxEstimatedTokens}`
  );
  check(
    "prompt budget gate rejects a synthetic over-budget input",
    !withinEstimatedBudget(syntheticOverflow, maxEstimatedTokens)
  );
}

// --- 15. package-link and live-eval contracts ------------------------------
{
  const parsedFiles = parsePackFiles({ "fable-skill": { files: [{ path: "README.md" }, { path: "LICENSE" }] } });
  check("package audit accepts npm pack object output", parsedFiles.has("README.md") && parsedFiles.has("LICENSE"));
  const listFiles = parsePackFiles([{ files: [{ path: "README.md" }] }]);
  check("package audit accepts npm pack array output", listFiles.has("README.md"));
  const [nodeBin, npmCliArgs] = npmInvocation(["pack", "--json"], { npm_execpath: "C:/node/npm-cli.js" }, "win32", "C:/node.exe");
  check("package smoke launches npm through Node on Windows", nodeBin === "C:/node.exe" && npmCliArgs[0] === "C:/node/npm-cli.js" && npmCliArgs[1] === "pack");
  let windowsNpmFallbackRefused = false;
  try { npmInvocation(["pack"], {}, "win32", "C:/node.exe"); } catch (error) { windowsNpmFallbackRefused = /npm run smoke:package/.test(error.message); }
  check("package smoke gives Windows users the npm-run invocation when npm_execpath is absent", windowsNpmFallbackRefused);
  const sampleReadme = "[Architecture](docs/ARCHITECTURE_REVIEW.md) [Changelog](CHANGELOG.md) [CI](https://example.test/ci)";
  const missing = findMissingReadmeLinks(sampleReadme, new Set(["README.md", "LICENSE"]));
  check("package link audit detects README targets omitted from tarball", missing.includes("docs/ARCHITECTURE_REVIEW.md") && missing.includes("CHANGELOG.md"), missing.join(", "));
  const included = findMissingReadmeLinks(sampleReadme, new Set(["README.md", "LICENSE", "docs/ARCHITECTURE_REVIEW.md", "CHANGELOG.md"]));
  check("package link audit passes when local targets are packaged", included.length === 0, included.join(", "));

  const fixture = { expectedWorkflow: "debug", expectedTier: "FULL", requiredTerms: ["reproduce", ["hypothesis", "hypotheses"]] };
  const output = parseModelResponse('```json\\n{"workflow":"Debug","tier":"full","first_step":"Reproduce the failure and rank hypotheses","verification":"Rerun the original failing case"}\\n```');
  check("live-eval parses a fenced JSON response", !!output && output.workflow === "Debug");
  const grade = gradeBehavior(fixture, output);
  check("live-eval rubric accepts expected workflow/tier/evidence", grade.passed, (grade.errors || []).join(", "));
  const badGrade = gradeBehavior(fixture, { workflow: "Build", tier: "LIGHT", first_step: "Edit it", verification: "Done" });
  check("live-eval rubric rejects wrong route and missing verification markers", !badGrade.passed && badGrade.errors.length >= 2);
  const flexibleTier = gradeBehavior({ expectedWorkflow: "debug", expectedTier: "FULL", acceptableTiers: ["STANDARD", "FULL"] }, { workflow: "Debug", tier: "STANDARD", first_step: "Reproduce, rank hypotheses", verification: "Rerun and verify" });
  check("live-eval accepts explicitly calibrated alternative tiers", flexibleTier.passed);
  const hypothesisGrade = gradeBehavior({ expectedWorkflow: "debug", expectedTier: "FULL", minHypotheses: 3 }, { workflow: "Debug", tier: "FULL", hypotheses: ["A", "B", "C"] });
  check("live-eval can enforce a minimum hypothesis count", hypothesisGrade.passed);
  check("provider usage delta reports skill prompt overhead", tokenUsageDelta({ total_input_tokens: 120 }, { total_input_tokens: 177 }) === 57);
  check("provider usage delta includes cached input tokens", tokenUsageDelta({ total_input_tokens: 120 }, { total_input_tokens: 150 }) === 30);
  check("provider usage delta stays unknown when usage is absent", tokenUsageDelta({}, { total_input_tokens: null }) === null);
  const usage = usageRecord({ input_tokens: 20, cache_read_tokens: 100, cache_write_tokens: 10, output_tokens: 5, tool_call_count: 0 }, "fbl-test");
  check("live eval aggregates provider uncached/read/write input tokens", usage.total_input_tokens === 130 && usage.input_tokens === 130);
  check("no-tool check passes only when provider reports zero calls", noToolsInvoked({ tool_call_count: 0 }) === true && noToolsInvoked({ tool_call_count: 2 }) === false);
  check("no-tool check preserves missing telemetry as unknown", noToolsInvoked({ tool_call_count: null }) === null && noToolsInvoked({}) === null);
  check("session id parser extracts Hermes one-shot id", extractSessionId(["answer", "session_id: local-a1b2c3", ""].join(String.fromCharCode(10))) === "local-a1b2c3");
  const unconfirmed = parseCliArgs(["--provider", "openai-codex", "--model", "gpt-6-luna"]);
  check("live model evaluation refuses to call without explicit confirmation", unconfirmed.live === false);
  const discoveryOnly = parseCliArgs(["--check-only"]);
  check("Hermes discovery smoke can run without live model requests", discoveryOnly.checkOnly === true && discoveryOnly.live === false);
  const liveArgs = buildChatArgs({ provider: "p", model: "m", prompt: "synthetic", skillName: "fbl-test" });
  check("live eval passes an explicit empty toolset", liveArgs.includes("--toolsets") && liveArgs[liveArgs.indexOf("--toolsets") + 1] === "");
  const cleanupRoot = fs.mkdtempSync(path.join(os.tmpdir(), "fable-live-cleanup-test-"));
  const temporarySkill = { skillDir: path.join(cleanupRoot, "skills", "fbl-test") };
  const temporaryCwd = path.join(cleanupRoot, "cwd");
  fs.mkdirSync(temporarySkill.skillDir, { recursive: true });
  fs.mkdirSync(temporaryCwd, { recursive: true });
  cleanupTemporaryResources(temporarySkill, temporaryCwd);
  check("live eval cleanup removes its temporary skill and working directory",
    !fs.existsSync(temporarySkill.skillDir) && !fs.existsSync(temporaryCwd));
  fs.rmSync(cleanupRoot, { recursive: true, force: true });
  const noLive = spawnSync(process.execPath, [path.join(ROOT, "scripts", "live-eval.js"), "--provider", "openai-codex", "--model", "gpt-6-luna"], { encoding: "utf8" });
  check("live eval CLI exits before making requests without --live", noLive.status === 2 && /without --live/.test(noLive.stderr || ""));
}

console.log(failures ? `\n${failures} test(s) FAILED` : "\nAll tests passed");
process.exit(failures ? 1 : 0);
