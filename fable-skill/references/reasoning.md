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

## 2. Decision rubric (for design choices, trade-offs, and non-technical decisions)

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

For non-technical decisions (depth vs. breadth in research, formality vs. accessibility
in writing, precision vs. completeness in analysis), use criteria that fit the domain:

```
Criteria for writing trade-off: audience fit (×3), credibility (×2), scope feasibility (×1)
Option A — deep dive on two studies: audience fit 3, credibility 3, feasibility 2 → weighted 17
Option B — broad survey of eight: audience fit 2, credibility 2, feasibility 3 → weighted 13
Decision: A, because the stated audience (practitioners) needs actionable depth, not breadth.
```

The same rule applies: score it, name the trade-off, commit to one with one sentence.

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

## 8. Argument mapping (for writing and analytical tasks)

Before writing a conclusion or recommendation, map the argument structure:

```
Main claim: <the conclusion you intend to state>
Sub-claims (load-bearing):
  SC1: <claim that directly supports the main claim> — evidence: <source/data>
  SC2: <claim that directly supports the main claim> — evidence: <source/data>
  SC3: <claim needed to connect SC1/SC2 to the main claim> — evidence: <source/data>
Weakest link: SC? — <why this is the least supported sub-claim>
```

Rules:
- A claim is only as strong as its weakest load-bearing sub-claim. If SC3 is speculative,
  the main claim is speculative regardless of how strong SC1 and SC2 are.
- If a sub-claim has no evidence, either find evidence, lower the claim's confidence level,
  or remove the sub-claim and revise the main claim accordingly.
- Sub-claims that are not load-bearing (supporting color, examples, context) do not need
  to be mapped — but must not be cited as if they were evidence.

Use this before any significant written conclusion, recommendation, or analytical summary.
For `reasoning.md` §1 (hypothesis trees in debugging), the mapping is over causes, not
claims — but the same weakest-link principle applies.

## 9. Confidence calibration

Before stating any conclusion in a final answer, assign an explicit confidence label:

| Label | When to use |
|---|---|
| **High** | Multiple independent sources agree; argument mapping shows all load-bearing sub-claims have evidence; no significant counter-evidence found |
| **Medium** | Single strong source, OR multiple sources with meaningful gaps, OR one unverified load-bearing sub-claim |
| **Speculative** | Extrapolation or inference not directly grounded in examined evidence; load-bearing sub-claim has no source |

Write the label inline: "The cache invalidation bug is the root cause (High confidence —
reproduced in three environments with logs pasted above)."

Rules:
- Never present a speculative conclusion as medium or high. The label must reflect the
  actual state of the evidence, not how confident you feel.
- When the label is Medium or Speculative, state what would upgrade it to the next level:
  "Medium — would become High if a second independent study confirmed the same effect size."
- Apply this to factual claims, analytical conclusions, and design recommendations alike.
  Debugging hypotheses are speculative until tested; a root cause is high-confidence only
  after the reproduction test passes with the fix applied.
