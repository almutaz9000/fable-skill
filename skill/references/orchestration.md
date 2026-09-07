# Orchestration — parallel multi-agent delegation and adaptive improvement

Complex tasks decompose into workstreams that can run concurrently, each with its own
domain, depth, and tool requirements. Fable's orchestration discipline makes the
orchestrating model a coordinator, not a bottleneck: it fans work out to specialized
subagents, evaluates their outputs against explicit acceptance criteria, and improves
each agent's configuration in response to what it learns — not just retrying, but
reconfiguring before the next attempt.

## When to orchestrate

Spawn subagents when a subtask meets all three conditions:

- **Self-contained**: it has a clear input and a clear expected output format.
- **Independent**: it does not need your accumulated conversation context to start.
- **Substantial or domain-specific**: it is either time-consuming enough to run in
  parallel, or it requires a different domain or tool set than the current workstream.

Do NOT delegate:
- Judgment calls that require the user's intent or the full conversation context.
- Design decisions you will have to redo if the subagent misunderstands them.
- Tasks so small that writing a complete delegation prompt costs more than doing them.

The test: can the subtask be specified fully in a single self-contained prompt? If not,
it is not ready to delegate.

## Subagent configuration template

Every delegation prompt must be self-sufficient — the subagent starts cold. Use this
template; omit sections only if genuinely not applicable:

```
ROLE:        <one sentence describing the subagent's persona and expertise>
             Example: "You are a specialist in distributed systems literature search."

DOMAIN:      <CODE | PLAN | ANALYSIS | REPORT | SCIENCE | SEARCH>
TIER:        <LIGHT | STANDARD | FULL>

GOAL:        <one sentence — what must be produced>

DONE MEANS:  <checkable criteria, at least two>
  - [ ] <criterion 1 — specific and falsifiable>
  - [ ] <criterion 2>

INPUT:       <what is provided to the subagent — files, data, context summary>

CONSTRAINTS: <what must be true about the output — format, scope, length, exclusions>
BUDGET:      <shared parent limit if the host exposes one; else "not observable">
STOP IF:     <hard stop conditions, including redundant work after new evidence>
OWNERSHIP:   <files or paths this worker may write; do not overlap writers>

OUTPUT FORMAT:
  <exact structure the orchestrator expects back — section headings, schema, format>
  This must match what the integration step requires. Ambiguity here causes integration
  failures that look like subagent failures.

WHERE TO START: <specific file, URL, query, or entry point — not "look around">

RETURN TO ORCHESTRATOR IF: <conditions under which the subagent must stop and escalate
  rather than guess — missing data, conflicting requirements, scope expansion>
```

Never delegate with a vague goal and no output format. The orchestrator's job is to
make the subagent's success deterministic before the subagent starts.

## Orchestration patterns

### Fan-out (parallel independent workstreams)

Use when: multiple subtasks can start simultaneously and their outputs will be integrated
later. All tasks receive their prompts in one batch.

```
Orchestrator
  ├── Subagent A: domain SEARCH — gather prior art on X
  ├── Subagent B: domain CODE — implement module Y
  └── Subagent C: domain ANALYSIS — benchmark alternative Z
         ↓ (all run in parallel)
Orchestrator: integrate A + B + C into final output
```

Rules:
- Define the integration protocol before spawning: exactly how will outputs A, B, C
  combine? Ambiguity in the integration step is the most common fan-out failure mode.
- If A's output is required as input to B, they are NOT independent — use a pipeline.
- Each subagent's output format must be specified to be compatible with the integration
  step; do not let subagents choose their own format.

### Pipeline (sequential dependent workstreams)

Use when: each stage's output is a required input to the next stage.

```
Subagent A: SEARCH — returns structured findings
     ↓ (orchestrator validates A's output before proceeding)
Subagent B: ANALYSIS — receives A's findings as input
     ↓ (orchestrator validates B's output)
Subagent C: REPORT — synthesizes A + B into document
```

Rules:
- Validate each stage's output against its acceptance criteria BEFORE passing it to the
  next stage. Propagating bad output through a pipeline amplifies the error at each step.
- If stage N fails, do NOT proceed to stage N+1 and patch later. Fix stage N first.
- The orchestrator holds the pipeline state. Each subagent only sees its immediate input,
  not the full pipeline history.

### Tournament (multiple agents, one winner)

Use when: the problem has a clear quality criterion but no obvious best approach —
competing subagents explore different strategies and the orchestrator selects the best
output.

```
Orchestrator: same goal → Subagent A (approach 1), Subagent B (approach 2) [parallel]
     ↓
Orchestrator: evaluate both outputs against acceptance criteria → select winner
     ↓ (optional)
Orchestrator: brief winning approach → losing approach as a follow-up specialization
```

Use for: alternative algorithm implementations, competing research framings, different
analytical approaches to the same data. Do not use for tasks with a single correct answer
— it is wasteful there.

### Adaptive retry (reconfigure on failure)

Use when: a subagent's output fails acceptance criteria and the failure reveals something
about what the configuration got wrong.

This is NOT the same as "retry with the same prompt." The rule is: **the configuration
must change before the next attempt**. See the Adaptive Reconfiguration Protocol below.

## Output acceptance criteria

Before spawning any subagent, define acceptance criteria in the delegation prompt. After
receiving output, evaluate against these criteria explicitly:

```
Acceptance check for subagent [name]:
  [PASS/FAIL] Criterion 1 — <evidence>
  [PASS/FAIL] Criterion 2 — <evidence>
  [PASS/FAIL] Criterion 3 — <evidence>

Overall: ACCEPTED / REJECTED (reason: ...)
```

An output is accepted when all *material* criteria pass. Repair small formatting defects
locally. Rerun only missing or incorrect portions. Do not reject an entire result for a
minor format issue. Do not proceed with an output that fails a material criterion without
documenting the tradeoff.

## Adaptive reconfiguration protocol

When a subagent's output is rejected, diagnose the failure category before reconfiguring:

| Failure category | Symptoms | Reconfiguration |
|---|---|---|
| **Wrong scope** | Output addresses the wrong question or a narrower/broader one than intended | Rewrite the GOAL and DONE MEANS; add explicit scope boundaries |
| **Wrong depth** | Output is too shallow (skips evidence) or too deep (buries the point) | Adjust TIER; add depth instruction ("cite primary sources") or scope constraint ("summarize in 300 words") |
| **Wrong format** | Output structure doesn't match what integration requires | Rewrite OUTPUT FORMAT section with an explicit schema or example |
| **Missing input** | Subagent made assumptions about data that was absent | Add the missing data to INPUT; or make the assumption explicit in CONSTRAINTS |
| **Wrong domain** | Subagent applied coding reasoning to a research task, or vice versa | Change DOMAIN and ROLE; add domain-specific instructions from the relevant reference module |
| **Capability gap** | The subagent correctly executed the instructions but the instructions were impossible for any subagent to fulfill | Decompose further; the task is not atomic — split it before re-delegating |

After diagnosing, update the configuration. Log the diagnosis:

```
Attempt 1 — REJECTED: output was too shallow (SEARCH tier instead of FULL)
  Root cause: TIER was set to STANDARD but task required literature synthesis across
              12+ sources — that is a FULL-tier research task.
  Change: TIER → FULL; added "cite each claim with source and page number" to CONSTRAINTS;
          added acceptance criterion "each claim traceable to a specific source".

Attempt 2 — ACCEPTED.
```

Two failed attempts at the same subagent configuration mandate a diagnosis log entry.
Retrying without changing the configuration is banned. After two reconfigurations with no
progress, stop that worker, report incomplete status, and do not keep reformulating the
same request.

## Multi-agent state tracking

For orchestration involving three or more subagents or spanning multiple turns, maintain
a ORCHESTRATION_STATE section in STATE.md (or the platform's scratchpad):

```markdown
## Orchestration state

Pattern: fan-out / pipeline / tournament / adaptive-retry
Integration protocol: <how outputs will be combined>

| Agent ID | Domain | Tier | Status | Output location | Acceptance | Notes |
|---|---|---|---|---|---|---|
| search-1 | SEARCH | FULL | ACCEPTED | §3 of scratch | All criteria pass | |
| code-1   | CODE   | STANDARD | REJECTED (attempt 1) | — | Format wrong | Reconfiguring |
| code-1   | CODE   | STANDARD | IN FLIGHT (attempt 2) | — | — | Added schema |
| analysis-1 | ANALYSIS | FULL | PENDING | — | — | Waiting on search-1 |

Next action: <what the orchestrator does next>
```

Update this table after every subagent completion or rejection. The orchestrator must
know at a glance: which agents are running, which are done, which are blocked, and what
the integration plan is.

## Integration protocol

Integration is the step the orchestration plan must specify before any subagent starts.
Write it as a concrete procedure:

```
Integration plan:
  1. Take search-1 output (structured findings list) and pass to analysis-1 as INPUT.
  2. Take analysis-1 output (scored comparison table) and insert into report §3.
  3. Take code-1 output (implementation + test results) and insert into report §4.
  4. Run consistency pass: numbers in §3 and §4 must refer to the same implementation.
  5. Write executive summary from the merged §3+§4.
```

Never start subagents when the integration plan is "I'll figure it out when outputs come
back." An unclear integration plan means the output formats are wrong, which means the
subagents will need to be re-run.

## Orchestration self-review (before declaring the overall task done)

Before the final answer:
- [ ] Every subagent's output was accepted against its criteria (not just "looked okay").
- [ ] The integration protocol was followed, not improvised.
- [ ] Any reconfiguration attempts are logged with a diagnosis.
- [ ] The integrated output satisfies the ORIGINAL goal's done-criteria, not just each
     subagent's local criteria (local success does not guarantee global success).
- [ ] No subagent output was used in the final answer that failed its acceptance criteria
     without the tradeoff being documented and surfaced to the user.
