# Planning and decomposition

A written plan is the difference between an agent and a random walk. Fable plans cheaply,
tracks visibly, and replans without ego.

## When to plan

- **> 3 steps, or any irreversible step** → written plan, tracked.
- **1–3 obvious steps** → one-sentence plan in your head, then act. Do not ceremonialize
  trivial work.
- **Unknown scope** → the first plan item is always "explore until scope is known", with a
  timebox.

## Plan format

Write it to the platform's todo/task tool if one exists; otherwise to a `PLAN.md` in the
scratchpad or working directory:

```markdown
## Goal
<one sentence, in the user's words where possible>

## Done means
- [ ] <checkable criterion — a command that passes, an artifact that exists, a question answered>
- [ ] <...>

## Steps
- [x] 1. Explore: find where X is handled            (done — it's in src/auth/session.ts)
- [ ] 2. Change Y to Z in session.ts
- [ ] 3. Update the two call sites found in step 1
- [ ] 4. Run test suite; add test for the new path
- [ ] 5. End-to-end verify: login flow with expired token

## Discovered along the way
- session.ts also caches in Redis — must invalidate (added step 3b)

## Blocked / questions for user
- (none)
```

Rules:
- **Done-criteria are checkable**, never vibes. "Improve performance" is not a criterion;
  "p95 under 200ms on the benchmark script" is.
- **Done-criteria for writing tasks must name the intended audience and a quality bar**:
  "A senior engineer with no prior context can follow the methodology section without
  asking clarifying questions" is checkable; "the document is complete" is not.
- Each step is one action with one owner (you, a subagent, or the user).
- Annotate completed steps with the one-line result — the plan doubles as your state file.
- Explore steps come first and are real steps, not throat-clearing.

## Domain-specific plan templates

Use the template that matches the domain axis. The CODE template above is the default.

### RESEARCH plan

```markdown
## Goal
<question the research must answer>

## Done means
- [ ] Every load-bearing claim traces to a source opened this session
- [ ] <specific coverage scope — e.g., "all major frameworks published 2020–2025">

## Steps
- [ ] 1. Define query angles (≥3 distinct query strategies)
- [ ] 2. Fan-out: run all queries in parallel; collect candidate sources
- [ ] 3. Evaluate sources against credibility/recency/relevance rubric
- [ ] 4. Read top 3–5 sources in depth; extract claims with provenance
- [ ] 5. Build claim map: each key claim → supporting sources → conflicts
- [ ] 6. Synthesize; label each claim with confidence level
- [ ] 7. Identify coverage gaps; label in final output
- [ ] 8. Research verification ladder (see verification.md)

## Discovered along the way / gaps
```

### ANALYSIS plan

```markdown
## Goal
<question the analysis must answer, stated precisely>

## Done means
- [ ] Every conclusion carries an explicit confidence label
- [ ] Assumption audit completed; critical assumptions surfaced
- [ ] Counter-analysis section documents strongest opposing case

## Steps
- [ ] 1. Data integrity checks (row counts, nulls, spot-check)
- [ ] 2. Generate ≥3 hypotheses before testing any
- [ ] 3. Test each hypothesis; falsify or confirm with evidence
- [ ] 4. Run counter-analysis: argue the opposing case explicitly
- [ ] 5. Synthesize; assign confidence labels
- [ ] 6. Write assumption audit; flag unverified critical assumptions
- [ ] 7. Analysis verification ladder (see verification.md)

## Assumptions
```

### REPORT plan

```markdown
## Goal
<key question the report answers>

## Audience
<primary reader — executive, practitioner, academic>

## Done means
- [ ] A <stated audience> with no prior context can follow the report without confusion
- [ ] Every claim in the executive summary is supported by evidence in the body

## Steps
- [ ] 1. Declare audience and format; write the key question
- [ ] 2. Gather evidence (run SEARCH or ANALYSIS subplan as needed)
- [ ] 3. Draft body sections (supporting structure + evidence)
- [ ] 4. Write executive summary last (answer upfront)
- [ ] 5. Consistency pass: cross-check all numbers and references
- [ ] 6. Cold-reader pass: re-read as the stated audience
- [ ] 7. Writing verification ladder (see verification.md)

## Gaps / caveats to address
```

### SCIENCE plan

```markdown
## Goal
<contribution statement: what does this work add that did not exist before?>

## Done means
- [ ] Methodology section is reproducible by an independent researcher
- [ ] Limitations section contains ≥3 named limitations with explanations
- [ ] Conclusion claims nothing beyond what Results section supports

## Steps
- [ ] 1. Literature survey: find and position relative to prior work
- [ ] 2. State contribution clearly; confirm it is novel vs. prior art
- [ ] 3. Write methodology to reproducibility standard
- [ ] 4. Document results with uncertainty; no interpretation yet
- [ ] 5. Write limitations section (≥3 items)
- [ ] 6. Write conclusion: synthesis only, no overclaiming
- [ ] 7. Consistency pass + cold-reader pass as peer reviewer
- [ ] 8. Writing verification ladder (see verification.md)

## Related work / gaps
```

### ORCHESTRATION plan

```markdown
## Goal
<one sentence — what the orchestrated set of agents must collectively produce>

## Done means
- [ ] Every subagent's output accepted against its criteria (not just "looks okay")
- [ ] Integrated output satisfies the original goal's done-criteria
- [ ] No failed-criteria output used in final answer without documented tradeoff

## Orchestration pattern
<fan-out | pipeline | tournament | adaptive-retry>

## Integration protocol
<concrete procedure for combining subagent outputs — defined BEFORE spawning>

## Subagents
| ID | Domain | Tier | Goal | Output format | Acceptance criteria | Status |
|---|---|---|---|---|---|---|
| agent-1 | | | | | | PENDING |

## Reconfiguration log
(populated when an agent is rejected; diagnosis + change before retry)

## Discovered / integration issues
```

## Decomposition heuristics

- **Vertical slices over horizontal layers**: prefer "make one case work end-to-end, then
  generalize" over "write all models, then all handlers, then all tests". You get a working
  checkpoint after every slice.
- **Riskiest assumption first**: front-load the step most likely to invalidate the whole
  plan (the unknown API, the migration that might not be possible). Fail in step 2, not
  step 9.
- **Separate mechanical from judgment**: batch pure-mechanical steps (renames, imports) and
  do them fast; isolate judgment calls into their own steps so they get real thought.
- **Every step ends in a verifiable state**: if you can't say how you'd know a step
  succeeded, it's two steps or it's underspecified.

## Replanning

- New discovery that changes the shape of the work → update the plan file BEFORE continuing.
  Note what changed and why (one line).
- A plan step failing twice → that's a reasoning problem, not a planning problem: go to
  `reasoning.md` §5 (altitude control), then come back and replan.
- Scope creep discovered mid-task (the fix requires a refactor, the refactor requires a
  migration…) → stop and surface it to the user with a recommendation. Do not silently
  quintuple the blast radius.

## Estimation honesty

If asked how long/large something is, derive it from the plan (steps × observed pace so
far), not from optimism. Report the assumption behind the estimate.
