#!/usr/bin/env node
/**
 * Deterministic, offline activation eval.
 *
 * This is NOT a live-model eval — it is a cheap regression gate that proves
 * the workflow vocabulary in fable-skill/references/workflows.md stays
 * distinguishing enough for a trivial keyword classifier to route a fixed
 * fixture set correctly. If this drops, the router's wording probably became
 * ambiguous for weaker models too. Real cross-model behavioral evals (running
 * actual LLMs against these fixtures) are tracked as follow-up work and
 * should live in CI as a separate, credentialed, non-blocking job.
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const FIXTURES = JSON.parse(fs.readFileSync(path.join(ROOT, "test", "activation-eval.json"), "utf8"));

// Keyword sets intentionally mirror the deliverable language in
// fable-skill/references/workflows.md's router table, not the fixture
// prompts themselves, so this measures vocabulary separation, not overfitting.
const KEYWORDS = {
  debug: ["root cause", "bug", "failing", "failed", "returning 500", "broke", "crash", "why it", "no one knows why", "nobody knows why"],
  operate: ["deploy", "roll back", "rollback", "production", "migration against the live", "run the bulk", "send the", "publish"],
  analyze: ["dropped", "conversion", "funnel", "churn", "dataset", "profile this", "find out why from the data"],
  research: ["survey", "compare approaches", "citations", "literature", "official documentation says", "research"],
  write: ["write an", "briefing", "draft the", "methodology", "proposal", "executive"],
  review: ["review this", "verdict", "ready to ship", "pull request", "critique"],
  plan: ["should we use", "recommendation", "project plan", "plan for", "give me a recommendation"],
  build: ["implement", "add pagination", "add ", "retry wrapper", "endpoint", "feature"],
};

function classify(prompt) {
  const lower = prompt.toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const [workflow, words] of Object.entries(KEYWORDS)) {
    const score = words.reduce((acc, w) => acc + (lower.includes(w) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      best = workflow;
    }
  }
  return best;
}

let correct = 0;
for (const { prompt, workflow } of FIXTURES) {
  const predicted = classify(prompt);
  const ok = predicted === workflow;
  if (ok) correct++;
  console.log(`  ${ok ? "✔" : "✘"} expected=${workflow.padEnd(8)} predicted=${String(predicted).padEnd(8)} "${prompt}"`);
}

const total = FIXTURES.length;
const accuracy = correct / total;
const THRESHOLD = 0.75;
console.log(`\nActivation eval: ${correct}/${total} (${(accuracy * 100).toFixed(0)}%), threshold ${THRESHOLD * 100}%`);

if (accuracy < THRESHOLD) {
  console.error(`FAILED: router vocabulary is not distinguishing enough (need >= ${THRESHOLD * 100}%)`);
  process.exit(1);
}
console.log("PASSED");
