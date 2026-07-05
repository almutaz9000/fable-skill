# Structured reasoning — thinking like Fable

Fable's answers look smarter because it spends its effort *before* acting, in structured
reasoning, instead of after acting, in damage control. These patterns replicate that on any
model. Use them explicitly — write the reasoning out; do not just "keep it in mind".

## 1. Hypothesis tree (for debugging and mysteries)

Never chase the first plausible cause. Build the tree first:

```
Symptom: <exact observed behavior, verbatim error>
Hypotheses (ranked by prior probability × cheapness to test):
  H1: <cause> — test: <cheapest observation that would confirm/kill it>
  H2: <cause> — test: <...>
  H3: <cause> — test: <...>
```

Rules:
- Always generate at least 3 hypotheses before testing any. The bug is disproportionately
  often the one a hasty run never lists.
- Test the cheapest-to-check first, not the most likely.
- A test must be able to FALSIFY the hypothesis. "Add a log and see" is only valid if you
  state beforehand what output confirms vs. kills the hypothesis.
- When all hypotheses die, the symptom description is wrong: re-observe the symptom itself
  (is the error what you think it is? is the code you're reading the code that runs?).

## 2. Decision rubric (for design choices and tradeoffs)

When choosing between approaches, never argue in prose alone — it hides thumb-on-scale
reasoning. Score it:

```
Criteria (weighted): correctness risk (×3), blast radius (×2), effort (×1), reversibility (×2)
Option A: ... | scores: 2,3,3,3 → weighted 19
Option B: ... | scores: 3,1,2,1 → weighted 15
Decision: A, because ... (one sentence)
```

Pick 3–5 criteria that actually matter for this decision. State the winner AND the losing
option's one redeeming quality — if you can't name one, you strawmanned it; redo.

## 3. Self-consistency check (for high-stakes answers)

Before committing to a nontrivial factual or analytical answer, derive it a second way:
- A calculation: recompute via a different route or sanity-check magnitude.
- A code claim: confirm from a second location (call site AND definition; test AND impl).
- A recommendation: argue the opposite for two sentences. If the counterargument is strong,
  say so in the answer instead of hiding it.

## 4. Assumption ledger (for anything ambiguous)

Fable rarely gets burned by hidden assumptions because it lists them:

```
Assuming: (a) user means the prod config, (b) Node 18+, (c) backwards compat not required.
Cheapest to verify: (a) — checking now. (b),(c) — proceeding, flagged in final answer.
```

Verify the cheap ones immediately; carry the rest visibly into the final message. Never let
an assumption be load-bearing AND silent at the same time.

## 5. Altitude control

When stuck, deliberately change altitude instead of grinding:
- **Zoom in**: build the minimal reproduction. Strip everything until the failure is 10 lines.
- **Zoom out**: re-read the original request. Is this subgoal even necessary? Is there a
  boring, direct route you dismissed early?
- **Zoom sideways**: how does the codebase already solve a problem shaped like this? Copy
  the existing idiom instead of inventing.

Trigger: 2 failed attempts at the same subgoal = mandatory altitude change.

## 6. Pre-mortem (before large or risky changes)

One paragraph before executing: "It is one week later and this change caused an incident.
What was it?" The top answer becomes an explicit check in your verification step.

## 7. Effort calibration

Match reasoning depth to stakes, in both directions:
- Trivial and reversible → act directly; heavy process here is waste.
- Ambiguous, destructive, or expensive to redo → full patterns above.
Fable's hallmark is not maximum effort everywhere; it is never spending effort where the
answer is obvious, and never skipping it where it isn't.
