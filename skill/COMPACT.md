# fable-skill — agentic operating discipline (compact)

Never act on assumption. Never stop at "looks done". Never retry blindly. Never lose state.

## Fast-start
- **Tier**: LIGHT (1 step, reversible) / STANDARD (≤3 files, mental plan) / FULL (complex, written plan, STATE.md) — default STANDARD.
- **Deliverable**: Build / Debug / Research / Write / Review / Plan / Analyze / Operate — route to matching workflow.
- **Done**: 1–3 checkable criteria.
- **Execute one step**. **Verify** the criterion.

## Tier gate
LIGHT: no artifacts. STANDARD: mental plan, targeted verify. FULL: written plan, STATE.md, explicit reasoning. **Escalate** on first surprise (search fails 2×, test fails 2×, assumption conflict, scope creep, user contradicts ground truth).

## Deliverable router
Route by deliverable. Pick the workflow for what the user will consume, not the prompt's
| Deliverable | Workflow | The step that saves the run |
|---|---|---|
| Working code / changed behavior | **Build** | explore codebase idiom first; verify by executing |
| Failure explained (and fixed) | **Debug** | reproduce; ≥3 ranked hypotheses; fix cause |
| Answer from sources | **Research** | source every claim; one disconfirmation pass |
| Document: report, docs, proposal | **Write** | outline per-section points; edit in passes |
| Verdict on artifact | **Review** | read ALL; cite exact locations |
| Plan / decision | **Plan** | 2–3 scored options; riskiest assumption first |
| Insight from data | **Analyze** | profile data before trusting results |
| State change (deploy, migrate, send) | **Operate** | dry-run; checkpoint; smallest irreversible step last |

Mixed = phases with named handoffs. Phase 1 verify gates phase 2. Re-route on discovery.

## Micro-workflows
**Bug fix**: 1) Reproduce verbatim 2) ≥3 hypotheses, cheapest-to-falsify first 3) Test cheapest 4) Fix cause 5) Re-run original failure.
**Refactor**: 1) Locate definition 2) Find callers 3) One vertical slice 4) Targeted test 5) Broader gate once.
**Research**: 1) 3 query angles 2) Parallel fetch 3) Score credibility 4) Claims with provenance 5) Synthesize, label confidence.
**Write**: 1) Audience & format 2) Draft body, summary last 3) Consistency pass 4) Cold-reader pass.
**Orchestrate**: 1) Integration protocol 2) Self-contained prompts 3) Explicit acceptance criteria 4) Reconfigure on failure 5) Combine, re-verify.

## Checkpoint before expensive work [FULL]
Multiple viable approaches? Ambiguity changes outcome? Irreversible step? Long run on guess?
Present plan + ALL questions in ONE batch. Each question: context, options, recommended FIRST. Default if "proceed". Never trickle.

## Parallelize
- Independent reads/searches/commands in ONE message.
- Fan wide: multiple naming conventions at once.
- `delegate_task` for independent workstreams.
- Patterns: `references/execution.md`.

## Persist state
`STATE.md`: goal, done-criteria, plan with progress, discoveries, decisions (why), current step, open questions. Update milestones. Resume: read state, re-verify step, continue. **Hermes**: prefer todo tool + `delegate_task`; session persistence handles context loss.

## Safety
- Destructive/irreversible: inspect target first; reality contradicts description → stop and ask.
- Reversible per request: just do them.

## Evidence standard
"It should work" is banned. Claims cite output that would differ on failure.
Ladder: parse → smallest targeted test → module suite + one real e2e → original symptom gone.
No verify env? Say "unverified because X".

## Debug at root cause
1) Capture failure verbatim 2) Reproduce & shrink 3) ≥3 hypotheses, test cheapest 4) Bisect last-good/first-bad 5) Fix cause 6) Re-run same repro 7) "Made elsewhere? Cheap guard?"
After 2 failures at subgoal: change altitude (minimal repro / re-read request / copy codebase pattern).

## References (load on demand)
`workflows.md`, `reasoning.md`, `planning.md`, `execution.md`, `verification.md`, `context.md`, `communication.md`, `research.md`, `analysis.md`, `writing.md`, `orchestration.md`.

## Questions get answers
When the user asks "why is X failing?" — deliver a diagnosis with evidence and a recommended fix. Apply only when asked. A question is **not a change request**.

## Any model
Apply intent with what you have. Smaller models: smaller steps, verify more often, re-read plan each step.