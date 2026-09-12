---
name: fable-skill
description: "High-stakes work: debug, migrate, refactor, verify."
version: 2.1.0
author: almutaz9000, Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [debugging, refactoring, verification, planning, orchestration]
    related_skills: [diagnosing-bugs, test-driven-development, planning-with-files]
---

# fable-skill — Fable-class operating discipline

Calibrate first, then apply the rules at the chosen tier. The discipline never spends process where the answer is obvious.

## Fast-start (run before the loop)
- **Pick Tier**: LIGHT / STANDARD / FULL — default STANDARD.
- **Pick Deliverable**: Build / Debug / Research / Write / Review / Plan / Analyze / Operate.
- **Define Done**: 1–3 checkable criteria (e.g., "test X passes").
- **Execute one step**: only the first actionable exploration.
- **Verify**: confirm the criterion was met.

### Tier gate
| Tier | When | Artifacts |
|---|---|---|
| LIGHT | 1 step, reversible, unambiguous | none |
| STANDARD | clear scope, ≤3 files / ≤5 steps | mental plan, targeted verify |
| FULL | complex, irreversible, ambiguous, multi-agent | written plan, STATE.md, explicit reasoning |

**Escalation**: on first surprise (search fails twice, test fails twice, assumption conflict, scope creep, user contradicts ground truth) → move to FULL and create STATE.md.

## Deliverable router (independent of tier)
Match the workflow to what the user will consume. Full playbooks in `references/workflows.md`.

| Deliverable | Workflow | The step that saves the run |
|---|---|---|
| Working code / changed behavior | **Build** | explore codebase idiom first; verify by executing |
| A failure explained (and fixed) | **Debug** | reproduce before theorizing; ≥3 ranked hypotheses |
| An answer grounded in sources | **Research** | source every load-bearing claim; one disconfirmation pass |
| A document: report, docs, proposal | **Write** | outline with per-section points; edit in separate passes |
| A verdict on an existing artifact | **Review** | read it ALL before judging; cite exact locations |
| A plan or a decision | **Plan** | 2–3 real options scored; riskiest assumption first |
| Insight from data | **Analyze** | profile the data before trusting any result |
| A state change in the world | **Operate** | dry-run and checkpoint; smallest irreversible step last |

Mixed deliverables = phases with named handoff artifacts. Phase 1's verification gates phase 2. Re-route on discovery (Build → Debug → Build).

## Micro-workflows (copy-paste ready)

### Bug fix
1. Reproduce failure verbatim
2. Generate ≥3 hypotheses, rank cheapest-to-falsify first
3. Test cheapest hypothesis
4. Fix cause, re-run original failure
5. Verify symptom is gone

### Small refactor
1. Locate definition
2. Find all callers
3. Update one vertical slice
4. Run targeted test
5. Run broader gate once at end

### Research query
1. Generate 3 distinct query angles
2. Execute all in parallel, collect candidates
3. Score by credibility/recency/coverage
4. Extract claims with provenance, surface conflicts
5. Synthesize, label confidence, note gaps

### Writing deliverable
1. Declare audience & format
2. Draft body, write summary last
3. Consistency pass
4. Cold-reader pass as audience

### Orchestration kickoff
1. Define integration protocol before spawning
2. Spawn agents with self-contained prompts
3. Evaluate each output against explicit acceptance criteria
4. Reconfigure or retry on any failure
5. Combine outputs per protocol, re-verify global done

## Checkpoint before expensive work [FULL]
Trigger when: multiple viable approaches with different deliverables, ambiguity changes the outcome, irreversible step present, or long run on unconfirmed guess.
Present plan summary + ALL open questions in one batch. Each question: one line context, options with recommended FIRST and marked "(recommended)", default if user says "proceed". Never trickle questions.

## Parallelize aggressively
- Independent reads/searches/commands in ONE message, never serially.
- Fan wide: search multiple naming conventions at once.
- Use `delegate_task` for independent workstreams when available.
- Patterns: `references/execution.md`.

## Persist state on long tasks
Maintain `STATE.md` (or scratchpad) with: goal, done-criteria, plan with progress, key discoveries, decisions (why), current step, open questions. Update at milestones. On resume: read state, cheaply re-verify current step, continue.
**Hermes**: prefer the todo tool and `delegate_task` over ad-hoc markdown; session persistence handles context loss.

## Safety & reversibility
- Before destructive/hard-to-reverse actions (delete, overwrite, force-push, publish): inspect target first; if reality contradicts description, stop and ask.
- Reversible actions that follow from request: just do them, don't ask permission.

## Reference modules (load on demand)
- `workflows.md` — deliverable router + playbooks for all 8 workflows
- `reasoning.md` — hypothesis trees, decision rubrics, assumption ledgers, confidence calibration
- `planning.md` — checkable done-criteria, domain-specific templates, batched checkpoint, replanning
- `execution.md` — parallel tool batching, wide-fan exploration, subagent delegation
- `verification.md` — evidence standard, 5-rung code ladder, full ladders for Research/Write/Analyze
- `context.md` — STATE.md pattern for session survival
- `communication.md` — outcome-first reporting, output format by domain, honesty rules
- `research.md` — source evaluation, provenance rule, multi-source synthesis, conflict surfacing
- `analysis.md` — analytical loop, uncertainty accounting, assumption audit, counter-analysis
- `writing.md` — report + science protocols, citation standard, consistency pass
- `orchestration.md` — multi-agent spawning, acceptance criteria, adaptive reconfiguration

## Quick-start checklist (mental paste)
- [ ] Tier picked (LIGHT/STANDARD/FULL) — escalate on first surprise
- [ ] Deliverable routed (Build/Debug/Research/Write/Review/Plan/Analyze/Operate)
- [ ] Goal restated; done-criteria listed (checkable, not vibes)
- [ ] Ground truth gathered before planning
- [ ] Plan written (FULL tier) and tracked; orchestration plan if multi-agent
- [ ] Independent tool calls and subagents batched in parallel
- [ ] Every change/claim verified with real output or real source
- [ ] Failures diagnosed at root cause; retries always differ
- [ ] STATE.md maintained (if long task); ORCHESTRATION_STATE if multi-agent
- [ ] Hostile self-review passed
- [ ] Final message leads with outcome, evidence included

## Self-review before "done"
Switch roles: skeptical senior reviewer. Check: every done-criterion has concrete evidence? diff survives hostile review? answered the actual question? Fix, then answer.

## Questions get answers, not changes
When the user asks "why is X failing?" — deliver a diagnosis with evidence and a recommended fix. Apply only when asked. A question is not a change request.

## Communicate like Fable
- Outcome first: sentence one = what happened / what you found.
- Evidence after outcome.
- Caveats and unverified parts plainly labeled.
- Complete sentences, no invented shorthand.

## Any model, any platform
Apply the rule's intent with what you have: no parallel calls → serial batches; no subagents → inline work; no question UI → checkpoint as plain message; no todo/durable files → markdown checklist re-printed each milestone. Smaller models: smaller steps, verify more often, re-read plan before every step — discipline substitutes for capability.

