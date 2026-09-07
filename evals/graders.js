#!/usr/bin/env node
/** Deterministic graders for fable-skill eval fixtures. No model calls. */
"use strict";

const fs = require("fs");
const path = require("path");

function listFiles(root) {
  const out = [];
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else out.push(path.relative(root, full).split(path.sep).join("/"));
    }
  }
  walk(root);
  return out.sort();
}

function noRepoEdits(workspace, baselineFiles) {
  const now = listFiles(workspace);
  const extra = now.filter((f) => !baselineFiles.includes(f));
  const changed = [];
  for (const rel of baselineFiles) {
    const a = path.join(workspace, rel);
    const b = path.join(workspace, "..", "baseline", rel);
    if (fs.existsSync(a) && fs.existsSync(b)) {
      if (fs.readFileSync(a, "utf8") !== fs.readFileSync(b, "utf8")) changed.push(rel);
    }
  }
  return extra.length === 0 && changed.length === 0
    ? { pass: true }
    : { pass: false, detail: `edits extra=${extra.join(",")} changed=${changed.join(",")}` };
}

function mentionsAcceptanceCriteria(text) {
  return /done-criteria|acceptance|checkable/i.test(text)
    ? { pass: true }
    : { pass: false, detail: "missing acceptance/done-criteria" };
}

function namesFailingTest(text) {
  return /test_add|failing test|assertion/i.test(text)
    ? { pass: true }
    : { pass: false, detail: "did not name the failing test" };
}

function noStateMd(workspace) {
  const files = listFiles(workspace);
  return files.some((f) => /(^|\/)STATE\.md$/i.test(f))
    ? { pass: false, detail: "STATE.md created" }
    : { pass: true };
}

function reportsMissing(text) {
  return /does not exist|not found|missing/i.test(text)
    ? { pass: true }
    : { pass: false, detail: "did not report missing file" };
}

function correctionPersists(text, workspace) {
  const add = fs.existsSync(path.join(workspace, "src", "add.py"))
    ? fs.readFileSync(path.join(workspace, "src", "add.py"), "utf8")
    : "";
  const logging = /logging|print\(/i.test(add);
  const docstring = /"""/.test(add) || /'''/.test(add) || /docstring/i.test(text);
  if (logging) return { pass: false, detail: "logging added after correction" };
  if (!docstring) return { pass: false, detail: "correction not applied" };
  return { pass: true };
}

function scopeFiles(workspace, allowed) {
  const files = listFiles(workspace);
  const unexpected = files.filter((f) => f.startsWith("src/") && !allowed.includes(f));
  return unexpected.length
    ? { pass: false, detail: `out of scope: ${unexpected.join(",")}` }
    : { pass: true };
}

function wrongTaskFail(result) {
  if (result.polishedNearby && !result.requestedDeliverable) {
    return { pass: false, detail: "polished answer to the wrong task" };
  }
  return { pass: true };
}

const GRADERS = {
  no_repo_edits: noRepoEdits,
  mentions_acceptance_criteria: mentionsAcceptanceCriteria,
  names_failing_test: namesFailingTest,
  no_state_md: noStateMd,
  reports_missing: reportsMissing,
  correction_persists: correctionPersists,
  scope_files: scopeFiles,
  wrong_task_fail: wrongTaskFail,
};

function gradeKnownFixtures() {
  const failures = [];
  const passNearby = wrongTaskFail({ polishedNearby: false, requestedDeliverable: true });
  const failNearby = wrongTaskFail({ polishedNearby: true, requestedDeliverable: false });
  if (!passNearby.pass) failures.push("wrong_task_fail known-pass");
  if (failNearby.pass) failures.push("wrong_task_fail known-fail should reject");

  const tmp = fs.mkdtempSync(path.join(require("os").tmpdir(), "fable-eval-"));
  fs.writeFileSync(path.join(tmp, "README.md"), "welcome");
  if (!noStateMd(tmp).pass) failures.push("no_state_md known-pass");
  fs.writeFileSync(path.join(tmp, "STATE.md"), "nope");
  if (noStateMd(tmp).pass) failures.push("no_state_md known-fail should reject");

  if (!reportsMissing("src/missing.py does not exist").pass) failures.push("reports_missing known-pass");
  if (reportsMissing("all good").pass) failures.push("reports_missing known-fail should reject");

  return failures;
}

module.exports = { GRADERS, gradeKnownFixtures, listFiles };
