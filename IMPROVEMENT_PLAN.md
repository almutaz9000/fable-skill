# Fable Skill: review and selectable improvement plan

Date: 2026-09-07. Repository reviewed at commit `9d91b11`, version `2.0.0`.

Status: proposal only. No skill, installer, or test implementation changes have been made. The user will select improvements before implementation.

This file is also the implementation handoff for a future Codex session. Start with the execution checklist below; consult the detailed review and P1–P10 specifications as needed. Saving this plan does not approve implementing any proposal.

## Execution handoff: goals and objectives

| Goal | Objective | Verification of achievement |
|---|---|---|
| G1: Complete the intended task | Preserve requested deliverables, exclusions, corrections, and action boundaries. | Plan-only, diagnose-only, user-correction, and scope-drift evaluation cases pass. |
| G2: Reduce total execution cost | Remove unnecessary loading, searches, retries, reviews, and delegation. | Compare cost per accepted completion with no-Fable and current-Fable baselines; report quality alongside cost. |
| G3: Work across common models and hosts | Keep the core tool-neutral and provide explicit capability fallbacks. | Record installation, activation, and behavioral results separately for each tested model/host combination. |
| G4: Remain reliable and maintainable | Keep editions consistent, evidence current, and installer behavior tested. | Automated installer/content checks pass; behavioral checks cover selected policy changes; claims match measured results. |

## Execution handoff: approval and progress

The future implementer must fill approval from the user's actual instructions, not from the recommendations in this document. If the next session provides selected IDs, record them and proceed without asking again. If selection is absent, ask which IDs to implement before editing implementation files.

| Proposal | Approval: unselected / approved / deferred / rejected | Progress: not started / in progress / verified / blocked | Evidence or blocker |
|---|---|---|---|
| P1 | approved | verified | V1: task contract in SKILL.md and COMPACT.md; plan/diagnose/scope-trap cases in evals/cases.json. Behavioral V4 unmeasured. |
| P2 | approved | verified | V1: single tier policy; no first-surprise escalation; quotas replaced in core, compact, and references. |
| P3 | approved | verified | V1: recovery/budget rules in core, compact, execution. Markdown cannot enforce host budgets. |
| P4 | approved | verified | V1/V2: compact self-contained; full merge section refs; measured sizes core 6021 B (~1505 tok/4), compact 3539 B (~885), full 74789 B (~18697). Compact over 400–700 target; retained for essential policy parity. |
| P5 | deferred | not started | Not in approved set. |
| P6 | approved (tooling only) | verified | V1: evals/ harness, cases, graders. `node evals/run.js --grade-fixtures` passed. Paid comparisons not authorized; performance unmeasured. Baseline snapshot at %LOCALAPPDATA%/Temp/fable-skill-baseline-9d91b11. |
| P7 | deferred | not started | Not in approved set. Light recovery wording added where P3 required it. |
| P8 | deferred | not started | Not in approved set. Light checkpoint wording added where P1 required it. |
| P9 | approved | verified | V2: `node test/run.js` passed after stale-content, dynamic refs, compact independence, doctor/dry-run, duplicate markers, isolated HOME, missing COMPACT.md. |
| P10 | approved | verified | V1: README/CLI sizes and compatibility labels; 60% and free-skill claims removed; module count ten; performance stated unmeasured. |

### Start-of-session tasks

- [x] Read applicable repository instructions and this plan. Inspect `git status --short` and the current commit before changing files.
- [x] Check whether the repository has changed since reviewed commit `9d91b11`. Recheck affected findings; preserve unrelated user work.
- [x] Record approved IDs, the current task, and any explicit limits in the progress table. Do not treat cost targets or recommended items as approval.
- [x] Read only the implementation files needed for the current batch. Do not reread all references or repeat the external research unless an affected fact is stale or uncertain.
- [x] Run the existing `node test/run.js` once to establish the current installer baseline. If execution is unavailable, record the exact limitation; do not report a pass.
- [x] For P6, preserve the pre-change source as a baseline using an isolated snapshot or checkout. Do not rely on a working directory that will be modified during implementation.

### Tasks and verification by proposal

The detailed P1–P10 sections below define the intended behavior and tradeoffs. These checklists translate them into bounded implementation units. Proposed new paths are suggestions, not files that already exist.

#### P1 tasks — task alignment (G1)

- [ ] Define one compact task-contract format: outcome, deliverable, action mode, scope, corrections, acceptance criteria.
- [ ] Add consistent alignment rules to the core and compact edition; update planning, context, and verification references.
- [ ] Define how user steering refines or replaces the task, and when material ambiguity requires clarification.
- [ ] Add cases for plan-only, diagnose-only, a mid-task correction, and an attractive unrelated improvement.
- [ ] Verify that plan/diagnosis runs make no implementation edits, corrections persist, and all requested deliverables remain covered.

#### P2 tasks — proportional effort (G2, G4)

- [ ] Define a single tier-selection policy and remove conflicting step-count requirements.
- [ ] Replace first-surprise escalation with evidence-based escalation and de-escalation.
- [ ] Replace fixed hypothesis/query/limitation quotas with conditional guidance in all affected editions and references.
- [ ] Replace mandatory extensive written reasoning with concise decisions, rationale, and evidence.
- [ ] Verify simple failures, clear four-step work, and a risky one-file change receive proportionate treatment. Search for leftover contradictory rules and review each match.

#### P3 tasks — recovery and budgets (G2)

- [ ] Define when another action is justified by an unresolved requirement and expected new evidence.
- [ ] Distinguish transient retries from repeated deterministic failures; bound recovery attempts.
- [ ] Specify hard-limit handling, soft-estimate reassessment, and unavailable-capability reporting.
- [ ] Apply shared accounting to workers where the host supports it; specify observable fallbacks otherwise.
- [ ] Verify persistent failures stop with accurate incomplete status, valid transient retries remain possible, and completed tasks do not drift into optional work.

#### P4 tasks — prompt size and edition consistency (G2, G3, G4)

- [ ] After approved policy changes settle, reduce the core and add explicit module-routing conditions and paths.
- [ ] Make compact content self-contained; remove unavailable-file dependencies.
- [ ] Choose the smaller maintainable solution for consistency: shared generation blocks or explicit parity tests. Avoid building a general prompt framework.
- [ ] Resolve references within full merges and replace silent compact-to-full fallback with a clear diagnostic.
- [ ] Measure generated sizes; validate resource resolution and essential-policy parity; execute simple cases with only the standalone compact artifact available.

#### P5 tasks — host portability (G3)

- [ ] Define capability fallbacks without assuming specific tool names or access.
- [ ] Move host-specific workflow guidance out of the universal core and ensure the corresponding adapter delivers it.
- [ ] Verify current official host documentation before adding a native Gemini target; retain existing managed-document behavior as an explicit option.
- [ ] Record supported modes and verification levels in a compatibility table.
- [ ] Verify installation in fixtures and activation in available real hosts. Mark unavailable live checks as untested rather than extrapolating from file creation.

#### P6 tasks — behavioral evaluation (G1, G2, G3, G4)

- [ ] Create a small case manifest, for example `evals/cases.json`, with prompts, fixtures, expected outcomes, forbidden actions, and graders.
- [ ] Define run records with skill revision, model ID, host/version, settings, tools, timestamps, usage, output paths, and outcome.
- [ ] Implement isolated baseline/current/candidate execution where the environment permits it. Confirm no installed Fable leaks into the no-Fable arm.
- [ ] Start with a few smoke cases; add the task mix described later before making general performance claims.
- [ ] Validate deterministic graders using known pass and known fail fixtures, including a polished answer to the wrong task.
- [ ] Before model calls, present the concrete matrix and spending limit if not already authorized. Do not start the illustrative 216-run matrix automatically.
- [ ] Run authorized comparisons, include failed attempts in cost, and report per-task/per-model outcomes and limitations.
- [ ] Mark benchmark preparation separately from benchmark execution. A working runner without measured runs is not evidence of improved performance.

#### P7 tasks — economical delegation (G2)

- [ ] Add a delegation decision rule based on independence, workload, and total overhead.
- [ ] Extend worker assignments with boundaries, budget, stop conditions, and file ownership.
- [ ] Permit local repair of minor output defects and targeted retry of incorrect portions.
- [ ] Guard shared writes and cancel work made redundant by new evidence.
- [ ] Verify no worker is spawned for trivial work and compare substantial delegated work against a single-agent baseline where supported.

#### P8 tasks — durable task recovery (G1, G2)

- [ ] Define one small task-scoped checkpoint and reuse host/project tracking when available.
- [ ] Preserve accepted corrections, evidence/version pointers, failed approaches, and the next necessary action.
- [ ] Define milestone-based updates and evidence freshness checks; avoid automatic transcript collection.
- [ ] Define a handoff fallback for environments without persistent storage.
- [ ] Verify resumption with two distinct task fixtures, a changed source, and a user correction. Confirm the correct task resumes and completed work is not repeated unnecessarily.

#### P9 tasks — installer and content checks (G4)

- [ ] Repair the stale-content update fixture and assert that stale content exists before reinstalling.
- [ ] Check reference modules dynamically and include child-process error diagnostics.
- [ ] Add selected validation for metadata, resource paths, compact independence, parity, and content sizes.
- [ ] Cover managed markers, surrounding user content, line endings, unsupported scopes, and isolated global installation paths.
- [ ] If selected, add a small dry-run/doctor report with destination, version, install mode, and duplicate-install information.
- [ ] Run `node test/run.js`; prove targeted tests reject deliberately invalid fixtures. Keep all fixture operations isolated from real user configuration.

#### P10 tasks — accurate documentation (G4)

- [ ] Remove unsupported latency and model-performance promises.
- [ ] Update module counts, loading explanations, and content sizes from actual generated output.
- [ ] Align README and CLI help with the selected installation behavior and tested compatibility levels.
- [ ] Publish measured results only if P6 execution produced them; otherwise explicitly state performance is unmeasured.
- [ ] Verify every numerical or compatibility claim against a recorded measurement or current supporting source.

### Verification levels and completion rules

| Level | What it establishes | What it cannot establish |
|---|---|---|
| V1: Static review | Instructions are consistent; paths, metadata, and generated content satisfy checks. | That a model will follow the policy or become cheaper. |
| V2: Installer tests | Selected installation and update behaviors work in controlled fixtures. | That a real host discovers or activates the skill. |
| V3: Host smoke checks | A named host/version discovers, activates, and accesses the required resources. | General effectiveness across tasks or models. |
| V4: Behavioral comparisons | Tested configurations meet outcomes at observed cost and quality. | Universal gains outside the tested task and model distribution. |

- [ ] Complete relevant V1/V2 checks for each implementation batch; use V3 for host changes and V4 for behavioral performance claims.
- [ ] After edits, run `git diff --check` and review the changed files against approved IDs. Inspect new untracked files too; ordinary `git diff` does not include them.
- [ ] Record evidence as command/result or run-artifact path, with revision and material limitations. Do not mark behavior verified from a text-presence assertion.
- [ ] Once appropriate checks pass, stop retesting unless something relevant changes or a new concern emerges.
- [ ] End each session with approved IDs completed, unfinished tasks, verification results, and the next exact action. Update the progress table once per meaningful milestone.
- [ ] Do not install globally, publish, commit, or push merely because this plan exists. Follow the user's actual execution instructions for those actions.

### Copyable prompt for a future Codex session

```text
Use IMPROVEMENT_PLAN.md as the implementation specification.
Approved proposal IDs: [insert IDs].
Deferred/rejected IDs: [insert IDs, or state none].
Main models/hosts to support: [insert, or use portable defaults].
Authorized model-evaluation spending limit: [insert; if absent, prepare
evaluation tooling but ask before starting paid comparisons].

Read applicable repository instructions and the handoff checklist first.
Implement only approved items, using the dependency order in the plan.
Preserve existing user changes. Work in small, reviewable batches and run
appropriate checks. Reuse evidence and avoid unnecessary subagents or
repeated broad exploration. Record progress and verification evidence in
the plan. Distinguish implemented, statically checked, host-tested, and
behavior-benchmarked work. Do not claim cost savings without measurements.
If blocked, state the concrete blocker and next required action.
```

## Intended outcome

Help an agent complete the user's actual requested outcome with less total cost and unnecessary work. Preserve quality, scope, and user corrections across turns. Support common model families through a portable instruction core and explicitly tested host integrations.

Optimize cost per correctly completed task. A cheap answer to the wrong question is a failure. A longer run can be preferable when it prevents expensive rework. Exact savings and cross-model quality gains are currently unmeasured.

## Review scope and evidence

Reviewed `README.md`, `package.json`, `bin/cli.js`, `test/run.js`, both skill editions, and all ten reference modules. Inspected recent commits and repository status. Compared selected public skills and official documentation, linked below. This is a targeted comparison, not an exhaustive ranking of the skill ecosystem.

The repository was clean before the review. `node test/run.js` passed after rerunning outside the sandbox, which initially prevented its child process from starting. These tests exercise installer behavior and text presence; they do not execute representative user tasks through AI models. No paid model benchmark or live host compatibility matrix was run.

Measured sizes from the actual content builders:

| Content | UTF-8 bytes | Rough tokens at four bytes/token |
|---|---:|---:|
| Native `SKILL.md`, including frontmatter | 7,315 | 1,829 |
| Installed compact content, including footer | 5,772 | 1,443 |
| Installed full merge, including footer | 70,326 | 17,582 |

These are size estimates, not tokenizer measurements or billed usage. Host wrappers add content. Caching, repeated context, output, tools, retries, and subagents affect actual cost.

### Confirmed issues

1. **Tier rules conflict.** `skill/SKILL.md:22` permits STANDARD for up to five steps without written artifacts; `skill/references/planning.md:8` requires a written plan above three steps. LIGHT and FULL are named in the core but lack complete selection rules there. A host loading only the core gets less guidance than the README implies.
2. **Routine difficulty can inflate process.** `skill/SKILL.md:26` escalates on the first surprise. The circuit breaker also escalates routine search failures. Conversely, `execution.md` correctly treats fixable tool errors as normal. There is no corresponding de-escalation policy.
3. **Fixed counts create avoidable work.** Three hypotheses, three query angles, confidence labels for every conclusion, and three scientific limitations are prescribed across several modules regardless of the question. The reasoning module requests written reasoning and scored choices even where a short rationale would suffice.
4. **Goal preservation is present but incomplete.** Planning records a goal, execution limits unrelated edits, and verification checks the original question. However, there is no common task contract distinguishing review from implementation, preserving accepted corrections and exclusions, or checking whether an intermediate subgoal is still necessary.
5. **The circuit breaker does not bound spending.** Reconfiguring retries can continue indefinitely. The completion rule recognizes success or user-input blockers but does not clearly address unavailable capabilities, exhausted agreed budgets, or persistent external failures. No global accounting exists across workers.
6. **Compact installs have unresolved resource dependencies.** `COMPACT.md:38` directs agents to `references/orchestration.md`, and its module list names further files. Single-file installers write only the compact text, so those resources are not supplied by that installation. Full merges also retain file references despite embedding the modules.
7. **Cost claims are unsupported or stale.** The advertised full size is about 7k tokens; the repository's own four-byte estimate gives about 17.6k. The claimed 60% latency reduction has no benchmark in the repo. Native skills still incur metadata and activated-content costs; the README's “no per-request cost” wording is too strong. The module count says nine in one place but there are ten.
8. **Host installation is not model compatibility.** Twenty-seven target entries primarily demonstrate paths and file creation. Tool availability, activation, model behavior, context handling, and host permissions are not tested. Hermes-specific tool names appear in the shared core. Current Gemini CLI supports native skills, but this installer supplies Gemini with a managed `GEMINI.md` block.
9. **Tests include a false-positive update check.** `test/run.js:86` tries to replace `The Loop`, a string absent from the generated compact content. The subsequent test passes even though its stale-content fixture was never created. The “all reference modules” merge check checks only six module names. Child-process errors omit `result.error`, making sandbox failures difficult to diagnose.
10. **Several general rules overreach.** Argument independence alone does not make concurrent writes safe (`execution.md:11`). Rejecting a worker's entire result for a minor format issue invites avoidable retries. Reopening every source each session can repeat valid work. Research rules disallow inferred claims where clearly labeled inference is useful. Mandatory quotation of conflicting sources needs to respect source-use limits.

### What should be preserved

Evidence before success claims; minimal edits; investigation before a speculative fix; useful parallel reads; relevant source provenance; explicit acceptance criteria; durable recovery for long tasks; and the dependency-free installer. These are useful foundations. The proposed change is to make their application consistent and proportionate.

## Lessons from comparable work

| Source reviewed | Useful pattern | Adaptation for Fable |
|---|---|---|
| [Superpowers: systematic debugging](https://github.com/obra/superpowers/blob/main/skills/systematic-debugging/SKILL.md) | Gather evidence, state one specific hypothesis, test minimally, revisit the approach after failures. | Allow a single well-supported hypothesis first; expand alternatives when uncertainty warrants it. Retain root-cause evidence. |
| [Superpowers: verification before completion](https://github.com/obra/superpowers/blob/main/skills/verification-before-completion/SKILL.md) | Connect completion claims to fresh verification evidence. | Associate evidence with the relevant artifact/version. Reuse a valid check until something affecting it changes. |
| [Planning with Files](https://github.com/OthmanAdi/planning-with-files/blob/master/skills/planning-with-files/SKILL.md) | Persistent task state and explicit task selection prevent resuming the wrong work. | Use one small task-scoped checkpoint; keep hooks and frequent writes optional. Avoid imposing a multi-file planning system on short tasks. |
| [Anthropic skill creator](https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md) | Compare with baselines, record tokens and duration, evaluate outputs, and test triggering. | Compare no Fable, current Fable, and candidate Fable in isolated runs. Use provider-neutral records and evaluate user outcomes. |
| [Agent Skills specification](https://agentskills.io/specification) | Standard metadata, portable directories, and progressive loading. | Keep a small entry point, valid metadata, and explicit resource paths. Fable's 993-character description fits the 1,024-character limit but can be much more selective. |
| [Gemini CLI skills documentation](https://geminicli.com/docs/cli/using-agent-skills/) | Native skill directories and activation management are available. | Add native Gemini installation as a distinct tested option; retain managed-document compatibility. Treat Antigravity separately until verified. |

These sources demonstrate design patterns, not evidence that copying them will make Fable cheaper. [Anthropic's agent design guidance](https://www.anthropic.com/engineering/building-effective-agents) likewise recommends starting simply and introducing complexity when measurements justify it. Fable should apply that principle to itself.

## Selectable improvements

Effort below describes relative implementation complexity, not a time or cost promise. Benefits are hypotheses until evaluated. Every item is unapproved.

### P1 — Preserve the user's task explicitly

Priority: highest. Effort: medium. Files: core, compact, planning, context, verification.

Introduce a short task contract containing requested outcome, deliverable, scope boundaries, accepted constraints/corrections, action mode, and observable acceptance criteria. Keep it implicit for trivial work and persist it only when recovery is useful. Action modes should distinguish answer, review, diagnose, plan, implement, and monitor without imposing a long classification ceremony.

Check alignment before scope-changing work, after user steering, on resume, and before delivery. An update may refine an ongoing task or explicitly replace it; do not automatically discard earlier requirements. Preserve the user's priority when an agent-generated subgoal conflicts with it. Ask only when a material ambiguity cannot be resolved from the conversation.

Acceptance: plan-only tasks produce no implementation changes; diagnose-only tasks do not silently patch code; corrections survive continuation; unrelated opportunities do not expand scope. Include the current request as a regression case.

Risk: repeating the contract on every message would itself waste tokens. Keep routine tracking brief and internal.

### P2 — Make effort adaptive and resolve conflicting rules

Priority: highest. Effort: medium. Files: core, compact, reasoning, planning, analysis, research, writing, verification.

Define LIGHT, STANDARD, and FULL once, based on uncertainty, impact, reversibility, and coordination needs. File/step counts may be hints, not decisive thresholds. A routine missing file or wrong search term should cause local recovery. Escalate when new evidence changes risk or repeated attempts produce no progress; allow de-escalation when uncertainty is resolved.

Replace fixed quotas with conditional guidance. Try one evidence-backed hypothesis when sufficient; develop alternatives for ambiguous failures. Use enough source queries and limitations to cover the actual question. Request concise rationale and evidence rather than a transcript of internal reasoning. Run checks that substantiate the claim, preserving repository-required gates.

Acceptance: a simple failure does not automatically create STATE.md; a clear four-step task gets consistent treatment in both editions; a high-impact one-file change still receives appropriate scrutiny. Validate reduced calls and unchanged correctness on representative tasks.

Risk: excessive simplification can weaken difficult-task performance. Evaluate complex and high-impact cases separately.

### P3 — Add bounded recovery and practical cost controls

Priority: highest. Effort: medium. Files: core, execution, research, orchestration, context.

Before another search, retry, review, or delegation, identify the unresolved requirement it will address and the new evidence expected. Stop optional investigation when acceptance criteria have evidence and another action is unlikely to change the result. Distinguish deterministic failures from transient errors: a bounded retry of an unchanged request can be appropriate after a timeout or service recovery.

Honor explicit time, token, tool, or monetary limits where the host exposes them. Use observable action limits as a fallback; never invent remaining token balances or dollar usage. Share the budget across parent and workers. On an exhausted hard limit or unavailable capability, report completed work, remaining requirements, and the precise limitation without claiming success. A soft estimate should trigger reassessment, not abandonment of authorized work.

Acceptance: persistent failures cannot produce unlimited reformulated retries; successful work does not continue into optional polishing; budget-limited incomplete work is labeled accurately. Exact enforcement remains a host responsibility where markdown cannot enforce it.

Risk: aggressive caps can reduce success. Tune them from task outcomes, not an arbitrary universal number.

### P4 — Reduce loading cost and repair compact portability

Priority: highest. Effort: medium. Files: core, compact, references, content builders, tests.

Move detailed examples and domain procedures out of the common path. Give the core a precise dispatch table: trigger, resource path relative to the installed skill, and when to stop loading. Prefer one relevant module initially; load more only for identified needs. Avoid duplicated verification ladders and overlapping global rules.

Make the standalone compact edition genuinely self-contained, with no instructions to read absent files. Generate compact/full outputs from shared policy blocks or enforce explicit parity tests so essential rules cannot diverge. Full merges should convert module references to section references. Missing compact content should fail clearly instead of silently installing the full merge.

Initial design targets: approximately 500–900 tokens for the native core and 400–700 for standalone compact, excluding host wrappers. These are proposed targets; retain more text if evaluation shows it is needed. Report tokenizer-specific measurements when available.

Acceptance: each installed reference resolves; compact works in isolation; optional modules remain unloaded for simple cases; both editions retain task boundaries, recovery rules, and evidence standards.

Dependencies: finalize P1–P3 policy before compressing. Risk: shortening text without behavioral comparison can make it ambiguous.

### P5 — Separate universal policy from host capabilities

Priority: high. Effort: medium–large. Files: core, installer, new adapter documentation, README, tests.

Keep universal instructions independent of named tools, providers, and operating systems. Define capability fallbacks: native task tracking or a brief plan; persistent files or a compact handoff; parallel execution or sequential work; browsing or an explicit evidence limitation. Lack of a tool must not trigger invented calls.

Move Hermes-specific guidance into its adapter. Add and validate a native Gemini target without silently changing existing users' install mode. Record host version, load behavior, reference access, and tested model combinations. Verify other target paths against first-party documentation before upgrading their compatibility status.

Use three compatibility labels: install-tested, activation-tested, and behavior-evaluated. An instruction-only model may use the protocol, but cannot verify external state without tools. A skill cannot switch models, grant permissions, force caching, or guarantee persistence unless its host provides those capabilities.

Acceptance: representative hosts discover and activate the installed skill; missing-tool scenarios degrade gracefully; Linux/macOS/Windows examples use appropriate paths and commands; model-family claims name the tested harness and configuration.

Risk: maintaining every adapter is ongoing work. Begin with the user's actual hosts and label others accurately.

### P6 — Build evaluations of outcomes and cost

Priority: highest; measurement foundation. Effort: large. New files: evaluation cases, runner/adapters, graders, run schema, benchmark report tooling. Existing installer tests remain separate.

Compare three arms in clean sessions with equivalent repository snapshots, tools, permissions, and host instructions: no Fable; current Fable; selected candidate. Ensure globally installed Fable or inherited conversation context cannot contaminate the baseline. Keep unrelated skills constant and record them.

Start with a small smoke suite before expanding. For the initial substantial comparison, use 12 tasks, two representative model/host configurations, three arms, and three repetitions: 216 runs. Preview the run count and cap expected spending before execution. If cost is constrained, use fewer screening runs and report that they are not conclusive.

Task coverage should include quick answers and edits, ambiguous diagnosis, multi-file work, research, data analysis, writing, plan-only work, user corrections, task resumption, tool failures, and tempting unrelated improvements. Use synthetic fixtures first, then add the user's actual failed runs with sensitive information removed. Separate development cases from held-out evaluation cases.

Acceptance metrics and release rules are detailed below. Model calls are a later, separately scoped execution step; this review has not run them.

Dependencies: baseline capture before changes; final comparisons after selected changes. Risk: grading style instead of correctness, contaminated baselines, and aggregate scores hiding domain regressions.

### P7 — Make delegation justify its overhead

Priority: medium. Effort: medium. Files: execution and orchestration.

Default to one agent. Delegate only when a substantial independent task can repay prompt, execution, waiting, validation, and integration costs. Distinguish lower latency from lower total cost. Keep competing-agent tournaments opt-in or justified by an evaluated difficult task.

Supply scope, output requirements, relevant input, stop conditions, budget, and file ownership. Do not duplicate the worker's investigation in the parent. Serialize conflicting writes and dependencies. Repair small formatting defects locally; rerun only missing or incorrect portions. Cancel redundant work once it is no longer needed.

Acceptance: simple tasks spawn no workers; workers do not exceed the parent's authority; concurrent writes do not collide; any delegation benefit is supported by end-to-end cost and success measurements.

Dependencies: P1 and P3. Risk: overly restrictive delegation can hurt latency on substantial independent work.

### P8 — Make memory small, task-scoped, and reusable

Priority: medium. Effort: medium. Files: context, research, planning; optional checkpoint template.

Use one checkpoint per task, reusing existing host/project state. Store goal and corrections, current progress, evidence pointers, failed approaches, and the next required step. Update after consequential milestones or before context loss, not every routine tool action. Avoid a generic STATE.md collision between unrelated tasks.

Record evidence provenance and freshness conditions. Recheck changing facts and changed files; reuse unchanged verified evidence with its date/version. Keep untrusted text from documents or old logs as evidence, never as authority to change the task. Do not store secrets or raw transcripts as default memory.

Acceptance: resumption continues the correct task without redoing completed exploration; stale evidence is invalidated when its source changes; read-only hosts receive a usable handoff; unrelated task state is not overwritten.

Dependencies: P1. Risk: stale checkpoints can mislead more than missing checkpoints; version and relevance checks matter.

### P9 — Strengthen installer and content validation

Priority: high. Effort: medium. Files: installer, tests, package scripts; optional CI workflow.

Fix the stale-content test by first asserting its mutation happened. Check all ten modules dynamically. Surface child-process error codes. Validate frontmatter, supported resource paths, standalone compact independence, and generated-content parity. Test malformed and duplicate managed markers, CRLF, preservation of surrounding user content, global targets with an isolated home, and unsupported scopes.

Add content-size reporting and an optional dry-run/doctor command that reports destination, install mode, version, and duplicate Fable installations. Avoid silent full-content fallback. Test repeated updates against the exact intended generated content. Installing multiple targets should reveal when one host may load both native and always-on copies.

Acceptance: tests demonstrably fail for the defects they target; all reported targets install correctly in fixtures; diagnostics identify missing resources and ambiguous managed blocks; checks do not modify real user configuration.

Risk: a larger validator can become harder to maintain than the installer. Keep deterministic checks small and dependency-light.

### P10 — Replace universal performance promises with evidence

Priority: high for credibility; low direct runtime impact. Effort: small. Files: README, CLI help/comments, skill text.

Remove the unmeasured 60% speed claim and unsupported claims that particular model sizes benefit most. Correct full-content size and module count. Explain discovery metadata, activation, resource loading, caching, and billed usage without implying native skills are free.

Publish benchmark configuration and limitations when results exist. Document recommended install modes and tested capability levels. State that model quality and host behavior remain relevant even with a portable skill.

Acceptance: quantitative performance claims have reproducible measurements; estimates are labeled; compatibility claims distinguish file installation from successful task behavior.

Dependencies: P6 for new performance claims; corrections can stand alone.

## Evaluation and decision criteria

The primary measure is:

`cost per accepted completion = total cost of all attempts / number of accepted completions`

Include failed attempts and retries in the numerator. If no attempt succeeds, mark the measure undefined/unacceptable rather than zero. Use actual provider usage where available, separating input, cached input, output, and tool charges to avoid double counting. Record child-agent usage too. For local models or subscription hosts without per-run billing, report tokens, elapsed time, and available compute measures; do not invent dollar costs.

Also report strict completion rate, scope violations, user interventions, false completion claims, median and tail latency, repeated actions, unnecessary artifacts, and trigger precision/recall. Acceptance requires the requested deliverable and all task-critical constraints; completing a nearby task fails even if the output is polished.

Prefer deterministic grading for files, outputs, invariants, and commands. Use blinded rubrics and human review for subjective writing and intent alignment. Do not let the same agent both execute a task and serve as its only evaluator. Keep infrastructure failures visible and apply a predefined treatment across all arms.

Suggested release targets, to be agreed before benchmarking:

- No observed unauthorized scope changes or false success claims on mandatory regression cases.
- Lower cost per accepted completion on the user's weighted task mix; a 20% reduction is a useful initial ambition, not a promised result.
- No material completion-quality regression. For a larger evaluation, predefine a non-inferiority margin, for example five percentage points, and inspect confidence intervals rather than declaring success from a tiny sample.
- Report per-domain and per-model results; aggregate gains must not hide serious failures in the user's core tasks.
- Fewer unnecessary reads, retries, planning artifacts, and interventions on simple tasks, with adequate verification preserved on difficult tasks.

For portability, hold the host constant when testing model effects where possible. Otherwise report a model-plus-host result, not a model-only conclusion. Cover at least two providers initially; extend to a capable open-weight model and additional hosts after the screening results justify the cost. Pin actual model IDs and settings at execution time.

## Implementation order after selection

1. Freeze the existing version and prepare selected baseline cases (P6). Repair misleading validation first where selected (P9).
2. Implement the approved task-alignment, effort, and recovery policies (P1–P3) as one coherent policy change.
3. Produce smaller, consistent install editions (P4).
4. Add selected host adapters, delegation rules, and recovery behavior (P5, P7, P8).
5. Run selected comparisons, reject regressions, and retain only changes that improve the relevant tradeoff (P6).
6. Publish accurate documentation and measured compatibility/results (P10).

Each implementation batch should have a reviewable diff and its own validation. Do not bundle optional features merely because another item was selected. If a selected item depends on a rejected item, narrow it or surface the concrete dependency before implementation.

Recommended first selection: P1, P2, P3, P4, P6, P9, P10. Add P5 early when using multiple hosts. Defer P7 and P8 unless delegation or long-session drift is common in actual runs.

Avoid automatic global self-modification, adding every domain workflow to the core, mandatory multi-agent execution, and promises of universal gains. A small protocol plus measured optional modules is the proposed direction.

To select: list the IDs to apply, defer, or reject. Optionally name the main models/hosts and share representative cases where an agent pursued the wrong outcome; those will shape the evaluation mix.
