#!/usr/bin/env node
"use strict";

/* Opt-in real-model smoke eval for Hermes. No live request is made without --live. */
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const SKILL_SOURCE = path.join(ROOT, "fable-skill");
const FIXTURES = JSON.parse(fs.readFileSync(path.join(ROOT, "test", "behavioral-eval.json"), "utf8"));
const { resolveHermesHome } = require(path.join(ROOT, "bin", "cli.js"));

function parseCliArgs(argv) {
  const options = {
    live: false,
    checkOnly: false,
    provider: "",
    model: "",
    hermesBin: process.env.FABLE_HERMES_BIN || "hermes",
    limit: 3,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--live") options.live = true;
    else if (arg === "--check-only") options.checkOnly = true;
    else if (arg === "--help" || arg === "-h") options.help = true;
    else if (["--provider", "--model", "--hermes-bin", "--limit"].includes(arg)) {
      const value = argv[++i];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${arg}`);
      if (arg === "--provider") options.provider = value;
      if (arg === "--model") options.model = value;
      if (arg === "--hermes-bin") options.hermesBin = value;
      if (arg === "--limit") {
        options.limit = Number(value);
        if (!Number.isInteger(options.limit) || options.limit < 1) throw new Error("--limit must be a positive integer");
      }
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  if (options.live && options.checkOnly) throw new Error("Choose either --live or --check-only, not both");
  return options;
}

function parseModelResponse(text) {
  const source = String(text || "").trim();
  const candidates = [];
  const fence = /```(?:json)?\s*([\s\S]*?)```/gi;
  let match;
  while ((match = fence.exec(source))) candidates.push(match[1].trim());
  candidates.push(source);
  const first = source.indexOf("{");
  const last = source.lastIndexOf("}");
  if (first >= 0 && last > first) candidates.push(source.slice(first, last + 1));
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
    } catch (_) {
      // Try the next candidate representation.
    }
  }
  return null;
}

function gradeBehavior(fixture, response) {
  const errors = [];
  if (!response || typeof response !== "object") return { passed: false, errors: ["response was not a JSON object"] };
  const workflow = String(response.workflow || "").trim().toLowerCase();
  const tier = String(response.tier || "").trim().toUpperCase();
  if (workflow !== String(fixture.expectedWorkflow || "").toLowerCase()) {
    errors.push(`workflow expected ${fixture.expectedWorkflow}, received ${response.workflow || "<missing>"}`);
  }
  const acceptedTiers = (fixture.acceptableTiers || [fixture.expectedTier])
    .filter(Boolean)
    .map((value) => String(value).trim().toUpperCase());
  if (!acceptedTiers.includes(tier)) {
    errors.push(`tier expected ${acceptedTiers.join(" or ") || "<unspecified>"}, received ${response.tier || "<missing>"}`);
  }
  if (fixture.minHypotheses && (!Array.isArray(response.hypotheses) || response.hypotheses.length < fixture.minHypotheses)) {
    errors.push(`expected at least ${fixture.minHypotheses} ranked hypotheses`);
  }
  const evidence = [response.first_step, response.verification, response.questions, response.hypotheses, response.notes]
    .flatMap((value) => Array.isArray(value) ? value : [value])
    .filter((value) => typeof value === "string")
    .join(" ")
    .toLowerCase();
  for (const requirement of fixture.requiredTerms || []) {
    const alternatives = Array.isArray(requirement) ? requirement : [requirement];
    if (!alternatives.some((term) => evidence.includes(String(term).toLowerCase()))) {
      errors.push(`missing expected evidence: ${alternatives.join(" / ")}`);
    }
  }
  return { passed: errors.length === 0, errors };
}

function finiteUsageValue(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function noToolsInvoked(usage) {
  if (!usage || usage.tool_call_count === null || usage.tool_call_count === undefined) return null;
  return usage.tool_call_count === 0;
}

function tokenUsageDelta(control, fable) {
  const before = control && control.total_input_tokens;
  const after = fable && fable.total_input_tokens;
  return Number.isFinite(before) && Number.isFinite(after) ? after - before : null;
}

function extractSessionId(output) {
  const match = String(output || "").match(/(?:^|\n)session_id:\s*([A-Za-z0-9._-]+)/);
  return match ? match[1] : null;
}

function usageRecord(record, skillName) {
  const systemPrompt = String(record.system_prompt || "");
  const uncachedInput = finiteUsageValue(record.input_tokens);
  const cacheRead = finiteUsageValue(record.cache_read_tokens);
  const cacheWrite = finiteUsageValue(record.cache_write_tokens);
  const inputParts = [uncachedInput, cacheRead, cacheWrite];
  const totalInput = inputParts.some((value) => value !== null)
    ? inputParts.reduce((sum, value) => sum + (value || 0), 0)
    : null;
  return {
    model: record.model || null,
    provider: record.billing_provider || record.provider || null,
    input_tokens: totalInput,
    total_input_tokens: totalInput,
    uncached_input_tokens: uncachedInput,
    cache_read_tokens: cacheRead,
    cache_write_tokens: cacheWrite,
    output_tokens: finiteUsageValue(record.output_tokens),
    tool_call_count: finiteUsageValue(record.tool_call_count),
    system_prompt_hash: record.system_prompt_hash || null,
    system_prompt_marker_present: Boolean(skillName && (systemPrompt.includes(skillName) || systemPrompt.includes("Fable-class operating discipline"))),
  };
}

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: options.cwd || ROOT,
    env: options.env || process.env,
    encoding: "utf8",
    stdio: "pipe",
    timeout: options.timeout || 120_000,
  });
}

function requireOk(result, label) {
  if (result.error || result.status !== 0) {
    const reason = result.error ? result.error.message : `exit ${result.status}`;
    throw new Error(`${label} failed (${reason})`);
  }
}

function copyTree(source, destination) {
  fs.mkdirSync(destination, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    const from = path.join(source, entry.name);
    const to = path.join(destination, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Refusing symlink in skill source: ${entry.name}`);
    if (entry.isDirectory()) copyTree(from, to);
    else if (entry.isFile()) fs.copyFileSync(from, to);
  }
}

function cleanupTemporaryResources(tempSkill, cwd) {
  if (tempSkill && tempSkill.skillDir && fs.existsSync(tempSkill.skillDir)) {
    fs.rmSync(tempSkill.skillDir, { recursive: true, force: true });
  }
  if (cwd && fs.existsSync(cwd)) fs.rmSync(cwd, { recursive: true, force: true });
}

function registerTemporaryCleanup(cleanup) {
  let cleaned = false;
  const cleanOnce = () => {
    if (cleaned) return;
    cleaned = true;
    cleanup();
  };
  const onSignal = (signal) => {
    cleanOnce();
    process.exit(signal === "SIGINT" ? 130 : 143);
  };
  const onSigint = () => onSignal("SIGINT");
  const onSigterm = () => onSignal("SIGTERM");
  process.once("exit", cleanOnce);
  process.once("SIGINT", onSigint);
  process.once("SIGTERM", onSigterm);
  return () => {
    process.removeListener("exit", cleanOnce);
    process.removeListener("SIGINT", onSigint);
    process.removeListener("SIGTERM", onSigterm);
  };
}

function installTemporarySkill(hermesHome) {
  const skillsRoot = path.join(hermesHome, "skills");
  fs.mkdirSync(skillsRoot, { recursive: true });
  let skillName = "";
  let skillDir = "";
  for (let attempt = 0; attempt < 5; attempt++) {
    skillName = `fbl-${crypto.randomBytes(4).toString("hex")}`;
    skillDir = path.join(skillsRoot, skillName);
    try {
      fs.mkdirSync(skillDir);
      break;
    } catch (error) {
      if (error.code !== "EEXIST" || attempt === 4) throw error;
    }
  }
  try {
    copyTree(SKILL_SOURCE, skillDir);
    const skillFile = path.join(skillDir, "SKILL.md");
    const original = fs.readFileSync(skillFile, "utf8");
    const renamed = original.replace(/^name:\s*["']?fable-skill["']?\s*$/m, `name: ${skillName}`);
    if (renamed === original) throw new Error("Could not safely rename the temporary skill frontmatter");
    fs.writeFileSync(skillFile, renamed, "utf8");
    return { skillDir, skillName };
  } catch (error) {
    fs.rmSync(skillDir, { recursive: true, force: true });
    throw error;
  }
}

function exportSession(hermesBin, sessionId, env, cwd) {
  const result = run(hermesBin, ["sessions", "export", "--format", "jsonl", "--session-id", sessionId, "--redact", "-"], { cwd, env });
  requireOk(result, "Hermes session export");
  for (const line of (result.stdout || "").split(/\r?\n/)) {
    try {
      const record = JSON.parse(line);
      if (record && record.id === sessionId) return record;
    } catch (_) {
      // Ignore non-JSON lines from CLI wrappers.
    }
  }
  throw new Error(`Hermes did not export session metadata for ${sessionId}`);
}

function buildChatArgs({ provider, model, prompt, skillName }) {
  const args = [
    "chat", "-q", prompt, "-Q", "--max-turns", "1", "--run-budget", "90",
    "--toolsets", "", "--provider", provider, "-m", model,
    "--source", "tool",
  ];
  if (skillName) args.push("--skills", skillName);
  return args;
}

function chatOnce({ hermesBin, provider, model, prompt, skillName, hermesHome, cwd }) {
  const args = buildChatArgs({ provider, model, prompt, skillName });
  const env = { ...process.env, HERMES_HOME: hermesHome };
  const result = run(hermesBin, args, { cwd, env, timeout: 120_000 });
  requireOk(result, "Hermes chat eval");
  const output = `${result.stdout || ""}\n${result.stderr || ""}`;
  const sessionId = extractSessionId(output);
  if (!sessionId) throw new Error("Hermes chat finished without a session_id marker");
  const record = exportSession(hermesBin, sessionId, env, cwd);
  return {
    session_id: sessionId,
    response: String(result.stdout || "").replace(/\n?session_id:\s*[A-Za-z0-9._-]+\s*$/, "").trim(),
    usage: usageRecord(record, skillName),
  };
}

function usageProbePrompt() {
  return [
    "Return only this JSON object and no other text:",
    '{"workflow":"Build","tier":"LIGHT","first_step":"Correct the typo","verification":"Check the corrected heading"}',
  ].join("\n");
}

function fixturePrompt(task) {
  return [
    "Triage the user task using the guidance available in this session.",
    "Do not call tools, browse, edit files, or perform the task.",
    "Return only one JSON object with keys workflow, tier, first_step, verification, questions, hypotheses.",
    "workflow must be one of Build, Debug, Research, Write, Review, Plan, Analyze, Operate.",
    "tier must be LIGHT, STANDARD, or FULL.",
    `User task: ${task.prompt}`,
  ].join("\n");
}

function runHostDiscovery(options, tempSkill, hermesHome, cwd) {
  const env = { ...process.env, HERMES_HOME: hermesHome };
  const listed = run(options.hermesBin, ["skills", "list"], { cwd, env });
  requireOk(listed, "Hermes skills list");
  if (!listed.stdout.includes(tempSkill.skillName)) throw new Error("Hermes did not discover the temporary Fable skill");
  return { status: "passed", skill_name: tempSkill.skillName };
}

function runLive(options) {
  const hermesHome = resolveHermesHome();
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "fable-live-eval-cwd-"));
  let tempSkill = null;
  const cleanup = () => cleanupTemporaryResources(tempSkill, cwd);
  const unregisterCleanup = registerTemporaryCleanup(cleanup);
  try {
    tempSkill = installTemporarySkill(hermesHome);
    const discovery = runHostDiscovery(options, tempSkill, hermesHome, cwd);
    const probePrompt = usageProbePrompt();
    const control = chatOnce({
      hermesBin: options.hermesBin, provider: options.provider, model: options.model,
      prompt: probePrompt, skillName: null, hermesHome, cwd,
    });
    const fableProbe = chatOnce({
      hermesBin: options.hermesBin, provider: options.provider, model: options.model,
      prompt: probePrompt, skillName: tempSkill.skillName, hermesHome, cwd,
    });
    if (control.usage.system_prompt_hash && fableProbe.usage.system_prompt_hash && control.usage.system_prompt_hash !== fableProbe.usage.system_prompt_hash) {
      throw new Error("Baseline and Fable probe did not share the same base system-prompt hash");
    }
    const skillDelta = tokenUsageDelta(control.usage, fableProbe.usage);
    const probeToolChecks = [noToolsInvoked(control.usage), noToolsInvoked(fableProbe.usage)];
    if (probeToolChecks.some((check) => check === false)) {
      throw new Error("The token probe unexpectedly invoked tools; the no-tools check failed");
    }
    const probesNoToolsVerified = probeToolChecks.every((check) => check === true);
    if (skillDelta === null || skillDelta <= 0) {
      throw new Error("The provider did not report a positive input-token delta for the explicit Fable preload");
    }

    const cases = [];
    for (const fixture of FIXTURES.slice(0, options.limit)) {
      const runResult = chatOnce({
        hermesBin: options.hermesBin, provider: options.provider, model: options.model,
        prompt: fixturePrompt(fixture), skillName: tempSkill.skillName, hermesHome, cwd,
      });
      const parsed = parseModelResponse(runResult.response);
      const score = gradeBehavior(fixture, parsed);
      const checks = {
        skill_preload_requested: true,
        provider_usage_reported: runResult.usage.input_tokens !== null,
        no_tools_invoked: noToolsInvoked(runResult.usage),
      };
      cases.push({
        id: fixture.id,
        expected_workflow: fixture.expectedWorkflow,
        expected_tier: fixture.expectedTier,
        acceptable_tiers: fixture.acceptableTiers || [fixture.expectedTier],
        returned_workflow: parsed && parsed.workflow || null,
        returned_tier: parsed && parsed.tier || null,
        hypotheses: parsed && Array.isArray(parsed.hypotheses) ? parsed.hypotheses : null,
        first_step: parsed && parsed.first_step || null,
        verification: parsed && parsed.verification || null,
        passed: score.passed && checks.provider_usage_reported && checks.no_tools_invoked === true,
        rubric_errors: score.errors,
        checks,
        usage: runResult.usage,
      });
    }

    const report = {
      host: "hermes",
      provider: options.provider,
      model: options.model,
      status: cases.every((item) => item.passed) && probesNoToolsVerified ? "passed" : "needs_review",
      skill_discovery: discovery,
      skill_activation_evidence: {
        explicit_preload_name: tempSkill.skillName,
        base_system_prompt_hash_match: Boolean(control.usage.system_prompt_hash && control.usage.system_prompt_hash === fableProbe.usage.system_prompt_hash),
        provider_input_tokens_increased: skillDelta > 0,
        prompt_marker_visible_in_export: fableProbe.usage.system_prompt_marker_present,
        no_tools_verified_for_token_probes: probesNoToolsVerified,
        token_probe_tool_call_counts: [control.usage.tool_call_count, fableProbe.usage.tool_call_count],
        interpretation: "The CLI skill list and explicit --skills preload verify activation; provider token delta measures the added context. Hermes session export may not preserve the preloaded block in system_prompt text.",
      },
      token_usage: {
        measurement: "provider-reported session input_tokens; no tokenizer mapping guessed",
        control_input_tokens: control.usage.input_tokens,
        with_skill_input_tokens: fableProbe.usage.input_tokens,
        fable_input_token_delta: tokenUsageDelta(control.usage, fableProbe.usage),
        control_model_reported_output_tokens: control.usage.output_tokens,
        fable_model_reported_output_tokens: fableProbe.usage.output_tokens,
      },
      cases,
      caveat: "Small smoke eval, not a quality certification; results are model/provider-specific and live calls consume subscription usage.",
    };
    return report;
  } finally {
    unregisterCleanup();
    cleanup();
  }
}

function main(argv = process.argv.slice(2)) {
  let options;
  try {
    options = parseCliArgs(argv);
  } catch (error) {
    console.error(`Live eval argument error: ${error.message}`);
    return 2;
  }
  if (options.help) {
    console.log("Usage: node scripts/live-eval.js --live --provider <provider> --model <model> [--limit N] [--hermes-bin PATH]");
    console.log("       node scripts/live-eval.js --check-only [--hermes-bin PATH]");
    console.log("Live eval makes provider requests; check-only verifies Hermes skill discovery without a model call.");
    return 0;
  }
  if (options.checkOnly) {
    const hermesHome = fs.mkdtempSync(path.join(os.tmpdir(), "fable-live-check-home-"));
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "fable-live-check-cwd-"));
    let tempSkill = null;
    const cleanup = () => {
      cleanupTemporaryResources(tempSkill, cwd);
      fs.rmSync(hermesHome, { recursive: true, force: true });
    };
    const unregisterCleanup = registerTemporaryCleanup(cleanup);
    try {
      tempSkill = installTemporarySkill(hermesHome);
      const report = runHostDiscovery(options, tempSkill, hermesHome, cwd);
      console.log(JSON.stringify(report, null, 2));
      return 0;
    } catch (error) {
      console.error(`Hermes skill discovery check failed: ${error.message}`);
      return 1;
    } finally {
      unregisterCleanup();
      cleanup();
    }
  }
  if (!options.live) {
    console.error("Refusing live model calls without --live. This eval uses provider usage allowance.");
    return 2;
  }
  if (!options.provider || !options.model) {
    console.error("Both --provider and --model are required for a live eval.");
    return 2;
  }
  if (options.limit > FIXTURES.length) {
    console.error(`--limit cannot exceed ${FIXTURES.length} fixtures.`);
    return 2;
  }
  try {
    const report = runLive(options);
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
    return report.status === "passed" ? 0 : 1;
  } catch (error) {
    console.error(`Live eval stopped: ${error.message}`);
    return 1;
  }
}

module.exports = { buildChatArgs, cleanupTemporaryResources, extractSessionId, gradeBehavior, main, noToolsInvoked, parseCliArgs, parseModelResponse, tokenUsageDelta, usageRecord };
if (require.main === module) process.exitCode = main();
