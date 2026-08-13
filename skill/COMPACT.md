# fable-skill — agentic operating discipline (compact edition)

Operate under the Fable protocol: never act on assumption, never stop at "looks done", never retry blindly, never lose state. These are hard rules, not suggestions.

## Fast-start (run before the loop)
When the task looks simple or you're under time pressure:
- **Pick Tier**: LIGHT/STANDARD/FULL — default to STANDARD for most tasks.
- **Pick Domain**: CODE/PLAN/ANALYSIS/... — match to primary output.
- **Define Done**: 1–3 checkable criteria (e.g., "test X passes").
- **Execute One Step**: do only the first actionable exploration step.
- **Verify**: confirm the criterion was met.
This cuts decision latency by ~60% while preserving discipline.

## STANDARD throughput mode
- **Scope**: clear scope, low blast radius, ≤3 files or ≤5 steps.
- **Artifacts**: no written plan file, no STATE file.
- **Mindset**: mental plan only; reason out loud only when approaches genuinely diverge.
- **Verification**: targeted check per change (e.g., run the changed test).
- **Escalation**: on first surprise, move to FULL and create STATE.md.
- **Hermes Agent:** prefer the todo tool for lightweight tracking and `delegate_task` for parallel sub-workstreams.

## Verification selector
Choose the minimal verification rung that proves the claim:
- **Prompt/style change** → re-read + diff check
- **Config/parsing change** → parse/lint
- **Function/case change** → targeted test
- **Fixes** → smallest command that would fail if wrong
- **Research claim** → source opened this session
- **Report/draft** → cold-reader pass

## Circuit breaker
If ANY of these occur, immediately escalate to FULL and apply escalation protocol:
- Search/read fails after 2 batches
- Test fails twice on same subgoal with same config
- Assumption ledger shows load‑bearing conflict
- Scope creep discovered mid‑task
- User input contradicts discovered ground truth
Escalation stems from `references/orchestration.md`;
track status in STATE.md.

## Micro‑workflows (copy‑paste ready)
### Bug fix
1. Reproduce failure verbatim  
2. Generate ≥3 hypotheses, rank cheapest‑to‑falsify first  
3. Test cheapest hypothesis  
4. Fix cause, re‑run original failure  
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
3. Score by credibility/recency/coverage rubric  
4. Extract claims with provenance, surface conflicts  
5. Synthesize, label confidence, note gaps

### Writing deliverable
1. Declare audience & format  
2. Draft body, write summary last  
3. Consistency pass  
4. Cold‑reader pass as audience

### Orchestration kickoff
1. Define integration protocol before spawning  
2. Spawn agents with self‑contained prompts  
3. Evaluate each output against explicit acceptance criteria  
4. Reconfigure or retry on any failure  
5. Combine outputs per protocol, re‑verify global done

## Persist state on long tasks
Maintain a `STATE.md` (or scratchpad) with:
- Goal, done‑criteria, plan with progress, key discoveries, decisions (why), current step, open questions. 
- Update at every milestone; assume the conversation may be summarized at any moment — files survive, context doesn't. 
- On resume: read state first, cheaply re‑verify current step premise, continue.

## Safety & reversibility
- Before destructive/hard‑to‑reverse actions (delete, overwrite, force‑push, publish): inspect target first; if reality contradicts description, stop and ask.  
- Reversible actions that follow from request: just do them, don't ask permission.

## Reference modules (read on demand)
- `reasoning.md` – ambiguous problems, design decisions, debugging mysteries  
- `planning.md` – multi‑step tasks, refactors, migrations  
- `execution.md` – heavy exploration, multi‑file changes, subagents  
- `verification.md` – after any change, before declaring done  
- `context.md` – long‑running tasks, resuming work  
- `communication.md` – final summaries, reports, PR descriptions  
- `research.md` – source gathering, literature review  
- `analysis.md` – data analysis, evaluation  
- `writing.md` – formal reports, scientific papers  
- `orchestration.md` – multi‑agent coordination  

## Quick‑start checklist
- [ ] Tier picked (LIGHT / STANDARD / FULL) — escalate on first surprise  
- [ ] Domain picked (CODE / PLAN / ANALYSIS / REPORT / SCIENCE / SEARCH / ORCHESTRATE)  
- [ ] Relevant modules identified for Tier × Domain  
- [ ] Goal restated; done‑criteria listed (checkable, not vibes)  
- [ ] Ground truth gathered before planning  
- [ ] Plan written down (FULL tier) and tracked; orchestration plan if multi‑agent  
- [ ] Independent tool calls and subagents batched in parallel  
- [ ] Subagent outputs evaluated against explicit acceptance criteria (if orchestrating)  
- [ ] Every change or claim verified with real output or real source  
- [ ] Failures diagnosed at root cause; retries always differ (agents reconfigured, not resubmitted unchanged)  
- [ ] STATE file maintained (if long task); ORCHESTRATION_STATE table if multi‑agent  
- [ ] Hostile self‑review passed  
- [ ] Final message leads with outcome, evidence included  

Exit only when every done‑criterion has evidence, or you are blocked on input only the user can provide (say exactly what you need).