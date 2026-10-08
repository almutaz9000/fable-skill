#!/usr/bin/env node
/**
 * Non-blocking vendor-CLI smoke check.
 *
 * Confirms whether official agent-host binaries are installed and respond to
 * an offline --version/--help call. This does NOT prove the host discovered
 * or loaded the fable-skill package — that requires an authenticated,
 * credentialed run inside each vendor's real harness, which this script
 * deliberately does not attempt. Always exits 0: a missing binary is
 * "not installed here", not a failure of this package.
 *
 * Usage: npm run smoke:hosts
 */
"use strict";

const { spawnSync } = require("child_process");

const CHECKS = [
  { host: "Claude Code", bin: "claude", args: ["--version"] },
  { host: "OpenAI Codex", bin: "codex", args: ["--version"] },
  { host: "Gemini CLI", bin: "gemini", args: ["--version"] },
];

console.log("fable-skill vendor-host smoke check (offline, non-blocking)\n");

for (const { host, bin, args } of CHECKS) {
  const result = spawnSync(bin, args, { encoding: "utf8", shell: process.platform === "win32" });
  if (result.error) {
    console.log(`  - ${host.padEnd(16)} (${bin}): not installed — ${result.error.code || result.error.message}`);
    continue;
  }
  const version = (result.stdout || result.stderr || "").trim().split("\n")[0];
  console.log(`  ✔ ${host.padEnd(16)} (${bin}): ${version || "responded with exit " + result.status}`);
}

console.log(
  "\nNote: this only confirms the binary is installed and responds offline.\n" +
  "It does not verify skill discovery inside the vendor harness, which requires\n" +
  "an authenticated session and is out of scope for CI without credentials."
);
process.exit(0);
