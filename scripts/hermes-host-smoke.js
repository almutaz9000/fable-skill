#!/usr/bin/env node
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const CLI = path.join(ROOT, "bin", "cli.js");

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: options.cwd || ROOT,
    env: options.env || process.env,
    encoding: "utf8",
    stdio: "pipe",
  });
}

function main() {
  const hermesBin = process.env.FABLE_HERMES_BIN || "hermes";
  const version = run(hermesBin, ["--version"]);
  if (version.error && version.error.code === "ENOENT") {
    console.log("Hermes host discovery smoke skipped: set FABLE_HERMES_BIN to an installed Hermes CLI.");
    return 0;
  }
  if (version.error || version.status !== 0) {
    throw new Error(`Hermes CLI probe failed: ${(version.stderr || version.error?.message || "non-zero exit").trim()}`);
  }

  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), "fable-hermes-host-smoke-"));
  try {
    const env = { ...process.env, HERMES_HOME: tempHome };
    const install = run(process.execPath, [CLI, "hermes", "--global"], { cwd: tempHome, env });
    if (install.error || install.status !== 0) {
      throw new Error(`Hermes-target install failed: ${(install.stderr || install.error?.message || "non-zero exit").trim()}`);
    }

    const skillDir = path.join(tempHome, "skills", "fable-skill");
    if (!fs.existsSync(path.join(skillDir, "SKILL.md"))) {
      throw new Error("Installer did not create HERMES_HOME/skills/fable-skill/SKILL.md");
    }
    const listed = run(hermesBin, ["skills", "list"], { cwd: tempHome, env });
    if (listed.error || listed.status !== 0) {
      throw new Error(`Hermes skills list failed: ${(listed.stderr || listed.error?.message || "non-zero exit").trim()}`);
    }
    if (!/fable-skill/.test(listed.stdout) || !/enabled/.test(listed.stdout)) {
      throw new Error("Installed Fable skill was not shown as enabled by `hermes skills list`.");
    }

    const sourceRefs = fs.readdirSync(path.join(ROOT, "fable-skill", "references")).filter((name) => name.endsWith(".md")).length;
    const installedRefs = fs.readdirSync(path.join(skillDir, "references")).filter((name) => name.endsWith(".md")).length;
    if (installedRefs !== sourceRefs) throw new Error(`Hermes sees ${installedRefs}/${sourceRefs} reference files installed.`);
    console.log(`Hermes host discovery passed (${String(version.stdout || version.stderr).trim()}, skill enabled, ${installedRefs} references).`);
    return 0;
  } finally {
    fs.rmSync(tempHome, { recursive: true, force: true });
  }
}

if (require.main === module) {
  try {
    process.exitCode = main();
  } catch (error) {
    console.error(`Hermes host discovery failed: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { main };
