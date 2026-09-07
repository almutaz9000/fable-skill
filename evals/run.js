#!/usr/bin/env node
/**
 * Evaluation runner (preparation only).
 * Lists cases, grades fixtures, and reports content sizes.
 * Does not call models.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { gradeKnownFixtures } = require("./graders");
const { contentSizes } = require("../bin/cli.js");

const CASES = path.join(__dirname, "cases.json");

function loadCases() {
  return JSON.parse(fs.readFileSync(CASES, "utf8"));
}

function listCases() {
  const manifest = loadCases();
  console.log(`Eval status: ${manifest.status}`);
  console.log(`Arms: ${manifest.arms.join(", ")}`);
  console.log(`Cases: ${manifest.cases.length}`);
  for (const c of manifest.cases) {
    console.log(`  ${c.id.padEnd(28)} ${c.domain.padEnd(8)} graders=${c.graders.join(",")}`);
  }
  console.log("Paid execution is not authorized from this command.");
}

function gradeFixtures() {
  const failures = gradeKnownFixtures();
  if (failures.length) {
    console.error("Fixture grader failures:");
    for (const f of failures) console.error(`  ✘ ${f}`);
    process.exitCode = 1;
    return;
  }
  console.log("Known-pass and known-fail grader fixtures passed.");
}

function printSizes() {
  const sizes = contentSizes();
  console.log(JSON.stringify({ status: "unmeasured_behavior", content_sizes: sizes }, null, 2));
}

function main() {
  const arg = process.argv[2] || "--list";
  if (arg === "--list") return listCases();
  if (arg === "--grade-fixtures") return gradeFixtures();
  if (arg === "--sizes") return printSizes();
  if (arg === "--execute") {
    console.error("Refused: model execution is not authorized. Set a spending limit in a later session.");
    process.exitCode = 1;
    return;
  }
  console.error(`Unknown option ${arg}. Use --list | --grade-fixtures | --sizes`);
  process.exitCode = 1;
}

if (require.main === module) main();
