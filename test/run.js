#!/usr/bin/env node
/** Zero-dependency test suite: node test/run.js */
"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFileSync } = require("child_process");

const CLI = path.join(__dirname, "..", "bin", "cli.js");
const { TARGETS, compactMarkdown, mergedMarkdown } = require(CLI);

let failures = 0;
function check(name, cond, detail) {
  if (cond) console.log(`  ✔ ${name}`);
  else {
    failures++;
    console.error(`  ✘ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function run(cwd, ...args) {
  return execFileSync(process.execPath, [CLI, ...args], { cwd, encoding: "utf8" });
}

function freshDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "fable-skill-test-"));
}

const countBlocks = (file) =>
  (fs.readFileSync(file, "utf8").match(/BEGIN fable-skill/g) || []).length;

// --- 1. every project-scope target installs -------------------------------
{
  const dir = freshDir();
  run(dir, "all");
  for (const [name, t] of Object.entries(TARGETS)) {
    if (!t.project) continue;
    const dest = t.project(dir);
    const marker = t.kind === "folder" ? path.join(dest, "SKILL.md") : dest;
    check(`installs: ${name}`, fs.existsSync(marker), `missing ${marker}`);
  }

  // --- 2. managed blocks are idempotent (no duplication) ------------------
  run(dir, "all");
  for (const f of ["AGENTS.md", "GEMINI.md", "CONVENTIONS.md", ".rules", ".goosehints", "WARP.md", "replit.md"]) {
    check(`idempotent: ${f}`, countBlocks(path.join(dir, f)) === 1, `expected 1 block`);
  }

  // --- 3. managed blocks UPDATE on re-install (regression: escaped regex) --
  const agents = path.join(dir, "AGENTS.md");
  fs.writeFileSync(agents, fs.readFileSync(agents, "utf8").replace("The Loop", "STALE-OLD-CONTENT"));
  run(dir, "agents");
  check("managed block updates on re-install", !fs.readFileSync(agents, "utf8").includes("STALE-OLD-CONTENT"));

  // --- 4. user content outside the block survives -------------------------
  fs.writeFileSync(agents, "# My own project rules\nkeep me\n\n" + fs.readFileSync(agents, "utf8"));
  run(dir, "agents");
  const after = fs.readFileSync(agents, "utf8");
  check("user content preserved", after.includes("keep me") && countBlocks(agents) === 1);
}

// --- 5. compact is the default; --full opts in ----------------------------
{
  const dir = freshDir();
  run(dir, "cursor");
  const compactLen = fs.statSync(path.join(dir, ".cursor", "rules", "fable-skill.mdc")).size;
  run(dir, "cursor", "--full");
  const fullLen = fs.statSync(path.join(dir, ".cursor", "rules", "fable-skill.mdc")).size;
  check("compact default is much smaller than --full", compactLen < fullLen / 2, `${compactLen} vs ${fullLen}`);
  // ~4 bytes/token for English markdown; guards the "roughly 2k tokens" README claim
  check("compact roughly 2k tokens (est. < 3k at 4 bytes/token)", compactLen / 4 < 3000, `${compactLen} bytes ≈ ${Math.round(compactLen / 4)} tokens`);
  check("full merge contains all reference modules", ["workflows.md", "reasoning.md", "planning.md", "execution.md", "verification.md", "context.md", "communication.md"].every((m) => mergedMarkdown().includes(`<!-- ${m} -->`)));
  check("compact edition routes workflows by deliverable", compactMarkdown().includes("Route by deliverable"));
  check("compact edition includes the approval checkpoint", compactMarkdown().includes("Checkpoint before expensive work"));
  check("compact edition separates questions from change requests", compactMarkdown().includes("not a change request"));
}

// --- 6. folder targets copy the complete skill ----------------------------
{
  const dir = freshDir();
  run(dir, "claude");
  const refs = fs.readdirSync(path.join(dir, ".claude", "skills", "fable-skill", "references"));
  check("claude folder has all 7 references", refs.length === 7, refs.join(","));
}

// --- 7. prompt command: universal system-prompt export ---------------------
{
  const dir = freshDir();
  run(dir, "prompt");
  const dest = path.join(dir, "FABLE-SKILL-PROMPT.md");
  check("prompt writes FABLE-SKILL-PROMPT.md", fs.existsSync(dest));
  check("prompt file has no managed markers", !fs.readFileSync(dest, "utf8").includes("BEGIN fable-skill"));
  const out = run(dir, "prompt", "--stdout");
  check("prompt --stdout prints the compact skill", out.includes("Route by deliverable"));
  const full = run(dir, "prompt", "--stdout", "--full");
  check("prompt --stdout --full includes reference modules", full.includes("<!-- workflows.md -->"));
}

// --- 8. unknown agent fails with exit code 1 ------------------------------
{
  const dir = freshDir();
  let code = 0;
  try {
    run(dir, "nonexistent-agent");
  } catch (e) {
    code = e.status;
  }
  check("unknown agent exits non-zero", code === 1);
}

console.log(failures ? `\n${failures} test(s) FAILED` : "\nAll tests passed");
process.exit(failures ? 1 : 0);
