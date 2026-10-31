#!/usr/bin/env node
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const README = path.join(ROOT, "README.md");

function parsePackFiles(packOutput) {
  const parsed = typeof packOutput === "string" ? JSON.parse(packOutput) : packOutput;
  let pack;
  if (Array.isArray(parsed)) pack = parsed[0];
  else if (parsed && Array.isArray(parsed.files)) pack = parsed;
  else if (parsed && typeof parsed === "object") pack = Object.values(parsed).find((entry) => entry && Array.isArray(entry.files));
  if (!pack || !Array.isArray(pack.files)) throw new Error("npm pack output has no files list");
  return new Set(pack.files.map((entry) => entry.path).filter((entry) => typeof entry === "string"));
}

function findMissingReadmeLinks(markdown, packedFiles) {
  const files = packedFiles instanceof Set ? packedFiles : new Set(packedFiles || []);
  const missing = new Set();
  const re = /!?\[[^\]]*\]\(([^)]+)\)/g;
  let match;
  while ((match = re.exec(String(markdown)))) {
    let target = match[1].trim().replace(/^<|>$/g, "").split(/\s+/, 1)[0];
    if (!target || /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(target)) continue;
    target = target.split(/[?#]/, 1)[0].replace(/^\.\//, "");
    if (!target) continue;
    let normalized = path.posix.normalize(target);
    while (normalized.endsWith("/")) normalized = normalized.slice(0, -1);
    if (normalized === ".." || normalized.startsWith("../")) continue;
    const included = files.has(normalized) || Array.from(files).some((file) => file.startsWith(`${normalized}/`));
    if (!included) missing.add(normalized);
  }
  return Array.from(missing).sort();
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || ROOT,
    env: options.env || process.env,
    encoding: "utf8",
    stdio: "pipe",
  });
  if (result.error) throw new Error(`${command} could not start: ${result.error.message}`);
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed (${result.status}): ${(result.stderr || result.stdout || "").trim()}`);
  }
  return result.stdout || "";
}

function npmInvocation(args, env = process.env, platform = process.platform, nodeExecPath = process.execPath) {
  if (env.npm_execpath) return [nodeExecPath, [env.npm_execpath, ...args]];
  if (platform === "win32") {
    throw new Error("Invoke this smoke with `npm run smoke:package` so npm can provide npm_execpath on Windows.");
  }
  return ["npm", args];
}

function runNpm(args, options = {}) {
  const [command, commandArgs] = npmInvocation(args);
  return run(command, commandArgs, options);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function main() {
  const packFiles = parsePackFiles(runNpm(["pack", "--dry-run", "--json"]));
  const missingLinks = findMissingReadmeLinks(fs.readFileSync(README, "utf8"), packFiles);
  assert(missingLinks.length === 0, `README links point outside the npm tarball: ${missingLinks.join(", ")}`);
  assert(packFiles.has("CHANGELOG.md"), "npm tarball is missing CHANGELOG.md, linked from README.md");
  assert(packFiles.has("docs/ARCHITECTURE_REVIEW.md"), "npm tarball is missing docs/ARCHITECTURE_REVIEW.md, linked from README.md");
  assert(!Array.from(packFiles).some((file) => file.startsWith("scripts/")), "developer smoke scripts must not ship in the published tarball");
  assert(!packFiles.has("test/behavioral-eval.json"), "live-eval fixtures must not ship in the published tarball");

  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "fable-package-smoke-"));
  try {
    const filename = runNpm(["pack", "--silent", "--pack-destination", temp]).trim().split(/\r?\n/).pop();
    const tarball = path.join(temp, filename);
    assert(fs.existsSync(tarball), `npm pack did not create ${filename}`);

    const workspace = path.join(temp, "workspace");
    fs.mkdirSync(workspace, { recursive: true });
    runNpm(["install", "--prefix", workspace, "--ignore-scripts", "--no-audit", "--no-fund", "--package-lock=false", "--cache", path.join(temp, "npm-cache"), tarball], { cwd: temp });
    const packageName = require(path.join(ROOT, "package.json")).name;
    const packedCli = path.join(workspace, "node_modules", packageName, "bin", "cli.js");
    assert(fs.existsSync(packedCli), "npm install did not place the packed CLI in node_modules");
    run(process.execPath, [packedCli, "list"], { cwd: temp });

    const project = path.join(temp, "consumer-project");
    fs.mkdirSync(project, { recursive: true });
    run(process.execPath, [packedCli, "claude"], { cwd: project });
    const projectSkill = path.join(project, ".claude", "skills", "fable-skill");
    assert(fs.existsSync(path.join(projectSkill, "SKILL.md")), "packed Claude install omitted SKILL.md");
    const sourceRefs = fs.readdirSync(path.join(ROOT, "fable-skill", "references")).filter((name) => name.endsWith(".md")).length;
    const packedRefs = fs.readdirSync(path.join(projectSkill, "references")).filter((name) => name.endsWith(".md")).length;
    assert(packedRefs === sourceRefs, `packed install has ${packedRefs}/${sourceRefs} reference modules`);

    const hermesHome = path.join(temp, "hermes-home");
    const hermesEnv = { ...process.env, HERMES_HOME: hermesHome };
    run(process.execPath, [packedCli, "hermes", "--global"], { cwd: temp, env: hermesEnv });
    const hermesSkill = path.join(hermesHome, "skills", "fable-skill");
    assert(fs.existsSync(path.join(hermesSkill, "SKILL.md")), "packed Hermes install omitted SKILL.md");
    assert(fs.readdirSync(path.join(hermesSkill, "references")).filter((name) => name.endsWith(".md")).length === sourceRefs,
      "packed Hermes install omitted reference modules");

    console.log(`Package smoke passed: README links resolve; tarball installs in Claude and Hermes (${sourceRefs} references).`);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

module.exports = { findMissingReadmeLinks, npmInvocation, parsePackFiles };
if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`Package smoke failed: ${error.message}`);
    process.exit(1);
  }
}
