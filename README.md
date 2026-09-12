# fable-skill

**Fable-model operating discipline for any AI coding agent.**

One skill that upgrades how your agent *works* — not what it knows. It enforces the working
discipline that separates top-tier agentic models from ordinary runs: explore before planning,
plan before acting, verify every change with evidence, debug at root cause instead of retrying
blindly, persist state across long tasks, and self-review before declaring done.

It also **routes the workflow to the task**: before acting, the agent classifies what the
user will actually consume — working code, a diagnosed failure, a sourced answer, a report,
a review verdict, a plan, a data insight, or a changed system — and runs the matching
playbook (build, debug, research, write, review, plan, analyze, operate). Verification for a
report means fact/structure/reader edit passes; for a data analysis it means row counts and
magnitude checks; for a deploy it means dry-runs and rollback plans — not one code-shaped
process forced onto everything.

Install it once with `npx`, natively, into whichever agent you use:

| | | | |
|---|---|---|---|
| Claude Code | Cursor | GitHub Copilot | OpenAI Codex |
| Gemini CLI / Antigravity | Windsurf | Cline | Roo Code |
| Amp | OpenClaw / ClawBot | Hermes Agent | Aider |
| Continue.dev | Zed | JetBrains Junie | Kiro (AWS) |
| Trae | Qwen Code | OpenCode | Goose |
| Warp | Kilo Code | Augment | OpenHands |
| Replit Agent | Crush (Charm) | any AGENTS.md agent | claude.ai (zip) |
| **any model via system prompt** |  |  |  |

And it is **model-agnostic by design**: the same discipline runs on frontier models and on
free or local ones — Gemma, Qwen, Kimi K2, GLM (Z.ai), Llama, DeepSeek, Claude Haiku, Grok,
GPT — with built-in fallbacks when a platform lacks parallel tool calls, subagents, or a
question UI. For models with no coding harness at all, `npx fable-skill prompt` exports the
whole discipline as a plain system prompt.

## Quick start

```bash
# Claude Code, available in every project
npx github:almutaz9000/fable-skill claude --global

# OpenAI Codex, native skill available in every project (~/.agents/skills/)
npx github:almutaz9000/fable-skill codex --global

# Cursor rules for the current repo
npx github:almutaz9000/fable-skill cursor

# AGENTS.md block — picked up by Codex, Amp, Jules, Zed, Factory, and others
npx github:almutaz9000/fable-skill agents

# Everything at once for the current repo
npx github:almutaz9000/fable-skill all

# Plain system prompt for ANY model (Ollama, LM Studio, Grok, ChatGPT, ...)
npx github:almutaz9000/fable-skill prompt

# See every supported agent and where it installs
npx github:almutaz9000/fable-skill list
```

No dependencies, no build step, Node ≥ 16. The installer is idempotent — re-run it any time
to update; shared files like `AGENTS.md` are edited only between managed markers, so your own
content is never touched.

## 3-minute install

Step 1: pick the agent you actually use.
Step 2: run one command.
Step 3: verify the file or folder exists.
Step 4: try one example prompt from the section below.

```bash
# Claude Code: native skill for every project
npx github:almutaz9000/fable-skill claude --global

# Hermes Agent: native skill for every project
npx github:almutaz9000/fable-skill hermes --global

# OpenAI Codex: native skill for every project
npx github:almutaz9000/fable-skill codex --global

# Cursor: always-on rules file for the current repo
npx github:almutaz9000/fable-skill cursor

# Gemini CLI / Antigravity: managed GEMINI.md block
npx github:almutaz9000/fable-skill gemini --global

# OpenClaw / ClawBot: native skill for every project
npx github:almutaz9000/fable-skill openclaw --global
```

If you want to see every supported target and install path first:

```bash
npx github:almutaz9000/fable-skill list
```

### Best-fit install paths for the most common agents

| Agent | Best install command | Why this is the default |
|---|---|---|
| Claude Code | `npx github:almutaz9000/fable-skill claude --global` | Native skill folder, loads references on demand |
| Hermes Agent | `npx github:almutaz9000/fable-skill hermes --global` | Native skill folder, best for todo/delegate_task workflows |
| OpenAI Codex | `npx github:almutaz9000/fable-skill codex --global` | Native skill folder, progressive disclosure |
| Cursor | `npx github:almutaz9000/fable-skill cursor` | Repo-local always-on rules file |
| Gemini CLI / Antigravity | `npx github:almutaz9000/fable-skill gemini --global` | Managed `GEMINI.md` block for broad CLI coverage |
| OpenClaw / ClawBot | `npx github:almutaz9000/fable-skill openclaw --global` | Native skill folder, low token overhead |

### Token cost: compact by default

Single-file rules targets (Cursor, Copilot, `AGENTS.md`, `GEMINI.md`, and the like) inject
their content into **every** request, so they get the **compact edition** (roughly 2k
tokens) — the full discipline distilled into one document. Agents with native skill folders
(Claude Code, Codex, OpenClaw, Hermes Agent) load reference modules on demand, so they get
the complete skill at no per-request cost. If you want the full version (roughly 7k tokens)
in a rules file anyway, opt in with `--full`:

```bash
npx github:almutaz9000/fable-skill agents --full
```

## Verify installation

Use the check that matches your agent after running the installer.

| Agent | What to verify | Expected result |
|---|---|---|
| Claude Code | `~/.claude/skills/fable-skill/` or `.claude/skills/fable-skill/` exists | `SKILL.md` and `references/` are present |
| Hermes Agent | `~/.hermes/skills/fable-skill/` or `./.hermes/skills/fable-skill/` exists | `SKILL.md` and `references/` are present |
| OpenAI Codex | `~/.agents/skills/fable-skill/` or `.agents/skills/fable-skill/` exists | `SKILL.md` and `references/` are present |
| OpenClaw / ClawBot | `~/.openclaw/skills/fable-skill/` or `./skills/fable-skill/` exists | `SKILL.md` and `references/` are present |
| Cursor | `.cursor/rules/fable-skill.mdc` exists | rules file contains fable-skill content |
| Gemini CLI / Antigravity | `~/.gemini/GEMINI.md` or `./GEMINI.md` exists | managed fable-skill block is present |

If the file or folder is missing, re-run the same install command. The installer is safe to
run repeatedly.

## How to invoke after install

| Agent | How to use it after install | What to expect |
|---|---|---|
| Claude Code | Invoke `/fable-skill` or let it auto-load on matching tasks | Native skill loads references only when needed |
| Hermes Agent | Let it auto-match, or explicitly ask to use fable-skill; pair with `todo` and `delegate_task` on larger jobs | Native skill plus Hermes tools gives the best workflow fit |
| OpenAI Codex | Invoke `$fable-skill` or browse `/skills` | Native skill auto-selects on matching prompts |
| Cursor | Nothing extra — it is always on in that repo | Rules file shapes every request in the repo |
| Gemini CLI / Antigravity | Nothing extra after install; the managed `GEMINI.md` block stays active | Good for broad CLI usage without native skill folders |
| OpenClaw / ClawBot | Use the native skill if the host exposes skill selection, or just start a matching task | Native skill folder keeps token cost low |

## Example usage

These are practical first prompts you can paste right after installation.

### Claude Code
- `/fable-skill debug why the login endpoint started returning 500 after the last deploy and verify the fix with real output`
- `/fable-skill migrate config loading from JSON files to environment variables safely and show the final verification results`

### Hermes Agent
- `Use fable-skill to investigate why checkout conversion dropped last week. Track the work with todo and delegate data collection and code inspection separately if helpful.`
- `Use fable-skill to refactor the reporting pipeline safely. Keep a tracked plan and verify each major step with real output.`

### OpenAI Codex
- `$fable-skill find the root cause of the flaky auth test and prove the fix by rerunning the failing case`
- `$fable-skill compare three approaches for caching this endpoint and recommend one with trade-offs`

### Cursor
- `Use the fable-skill workflow to debug the API timeout. Read the code first, form multiple hypotheses, then verify the final fix.`
- `Refactor this module with fable-skill discipline: small diffs, real tests, and no unverifiable claims.`

### Gemini CLI / Antigravity
- `Analyze this repo with fable-skill discipline and produce a concrete migration plan with checkable milestones.`
- `Use fable-skill to research current RAG approaches, compare them with citations, and surface disagreements between sources.`

### OpenClaw / ClawBot
- `Use fable-skill to trace why the worker crashes under load and verify the fix with a targeted reproduction.`
- `Use fable-skill to plan and execute a safe multi-file refactor, then summarize the evidence that it worked.`

## How it works

Once installed, the skill activates two ways:

- **Explicitly** — type `/fable-skill` in Claude Code, `$fable-skill` in Codex (or browse
  `/skills`) when the host supports explicit skill invocation.
- **Automatically** — skill-native agents match your prompt against the skill description
  and load it when the task fits: debugging, multi-file changes, refactors, research,
  analysis, writing, scientific work, search, and long-running or multi-agent tasks.
- **Always on** — rules-file agents such as Cursor and managed-document hosts such as
  Gemini CLI / Antigravity apply the installed text without an extra invocation step.

You do not need special prompt phrasing. The practical examples above are just the fastest way
to confirm the install worked and the workflow feels right.

### Two-axis calibration

Every task is calibrated on two axes before any work begins:

**Tier** (how much process overhead):

| Tier | When | What it means |
|---|---|---|
| **LIGHT** | Single-step, reversible, unambiguous | Act directly; verify the one change; no plan, no state file |
| **STANDARD** | Clear scope, low blast radius | The loop without written artifacts; targeted verification at the end |
| **FULL** | Complex, irreversible, ambiguous, long, multi-agent | Written plan, explicit reasoning, state persistence, full verification |

**Domain** (which protocol to apply):

| Domain | Trigger | Core discipline |
|---|---|---|
| **CODE** | implement, fix, debug, refactor | Explore → plan → act → verify with real output |
| **PLAN** | plan, roadmap, strategy | Checkable done-criteria, riskiest-assumption-first decomposition |
| **ANALYSIS** | analyze, compare, evaluate | Analytical loop, confidence labels, counter-analysis |
| **REPORT** | report, write, document | Audience-first structure, citation standard, cold-reader pass |
| **SCIENCE** | paper, experiment, literature | Full paper protocol, reproducibility standard, mandatory limitations |
| **SEARCH** | find, search, survey | Source evaluation rubric, provenance rule, conflict surfacing |
| **ORCHESTRATE** | parallel agents, delegate, coordinate | Subagent configuration, acceptance criteria, adaptive reconfiguration |

The tier and domain are independent. A FULL × SCIENCE task uses the full paper protocol with explicit written plans. A LIGHT × SEARCH task is a quick lookup with a citation.

### Example: debugging a failure

> Users report the login endpoint started returning 500 after yesterday's deploy.
> Find the root cause and fix it.

Without the skill, a typical agent grabs the first plausible cause and patches it. With it,
the agent must capture the exact error, reproduce it on demand, rank **at least three
hypotheses** before testing any, bisect to where good state turns bad, fix the cause (not
the symptom), and re-run the original failing case to prove the symptom is gone. Symptom
patches like swallowing the exception are explicitly banned.

### Example: multi-file refactor or migration

> Migrate our config loading from JSON files to environment variables across the app.

This hits the FULL tier: the agent writes a plan with checkable done-criteria before
touching code, fronts the riskiest assumption (is there a consumer that can't take env
vars?), works in vertical slices so the app builds after each step, and runs the broad
test gate once at the end — pasting real output, not "should work now".

### Example: long or multi-session task

> Build out the reporting module — we'll work on this over the next few days.

The agent maintains a `STATE.md` (goal, plan with progress, key discoveries, decisions
made and why) so the work survives context compaction and session breaks. Resuming later,
it reads the state file first instead of re-deriving everything.

### Example: ambiguous request

> Something feels slow about the dashboard, can you improve it?

Instead of guessing, the agent turns "slow" into a checkable criterion (measure first,
then a target), lists its assumptions visibly, verifies the cheap ones immediately, and
carries the rest flagged into the final answer — no silent load-bearing guesses. And when
the direction genuinely forks (is "improve" a quick win or a rewrite? which page matters?),
it pauses once **before** the long work: the plan plus all open questions in a single
batch, each with a recommended option marked and a default, so one reply — even just
"proceed" — sets the whole run on the right track. You never come back to an hour of work
you didn't want.

### Example: non-code work (research, analysis, writing)

> Analyze last quarter's churn data and write a one-page summary for the leadership team.

The router splits this into two phases with a verified handoff. **Analyze**: profile the
data before trusting it (nulls, duplicates, units, coverage), log every exclusion with its
row-count impact, sanity-check magnitudes, and treat any surprising number as a pipeline bug
until a bug hunt fails to find one. Only then **Write**: outline with each section's point
as a full sentence, draft conclusion-first for the stated audience, then three separate edit
passes — accuracy (every figure re-checked against the analysis), structure, and a cold
read as the intended reader. The same routing covers document review (read it all before
judging, cite exact locations, label defect vs. preference) and planning (2–3 scored
options, riskiest assumption first, pre-mortem).

### Example: a question is not a change request

> Why did the nightly export job fail last night?

The deliverable here is a **diagnosis**, not a patch. The agent investigates properly
(captures the exact error, reproduces it, ranks hypotheses), reports the root cause with
evidence, and names the fix it would recommend — then stops. The edit happens when you say
so. Without this rule, agents routinely answer "why is X broken?" by rewriting X — work
you never asked for.

### Example: trivial task (the skill stays out of the way)

> Fix the typo in the welcome banner.

This is the LIGHT tier: no plan file, no hypothesis tree, no ceremony. The agent makes the
edit, verifies that one change, and reports plainly. The calibration gate exists precisely
so small tasks stay fast.

### Example: research and literature search

> Survey the current state of retrieval-augmented generation — what approaches exist,
> how do they compare, and what are the open problems?

Domain: SEARCH, Tier: FULL. The agent generates at least three distinct query angles in
one batch (not one query at a time), evaluates each source against a credibility/recency
rubric, builds a claim map tracing each key finding to its source, surfaces any conflicts
between sources with both sides quoted, and labels confidence levels throughout. Every
load-bearing claim in the output cites a source actually opened in the session — training
recall is not a citation.

### Example: data analysis

> Our checkout funnel conversion dropped 12% last week. Find out why.

Domain: ANALYSIS, Tier: FULL. The agent runs data integrity checks first (row counts, null
rates, before/after comparison using the same measurement definition), generates at least
three hypotheses before testing any, builds an assumption audit marking which are verified
and which are carried, runs the counter-analysis (argues the strongest case against the
primary conclusion), and labels every conclusion with a confidence level. "The data shows
X" is used only for directly observed facts; "this suggests Y" for inferences; "one
possible explanation" for speculation.

### Example: writing a technical report

> Write an executive briefing on whether we should migrate our auth service to OAuth 2.1.

Domain: REPORT, Tier: FULL. The agent declares the audience (executive, non-technical)
and the key question before writing a single word, drafts the supporting body first, writes
the executive summary last (answer upfront, conclusion stated directly), runs a full
consistency pass (numbers match across all sections), then re-reads the complete document
as an executive encountering it cold and resolves any confusion before delivering. The
deliverable is a document artifact, not prose in the chat window.

### Example: scientific writing

> Write the methodology and results sections for our LLM evaluation paper.

Domain: SCIENCE, Tier: FULL. The agent writes the methodology to the reproducibility
standard (enough detail for an independent researcher to replicate), reports results with
uncertainty ranges and distinguishes results from interpretations, writes a limitations
section with at least three named limitations, and ensures the conclusion section claims
nothing beyond what the results support. Every number traces to a specific experiment or
dataset. "Future work" is not a substitute for a limitation.

### Example: complex parallel task with multiple agents

> Benchmark five alternative database schemas for our new analytics service: gather
> performance literature, implement a prototype of the two best candidates, run load
> tests, and produce a recommendation report.

Domain: ORCHESTRATE, Tier: FULL. The agent writes an integration protocol before spawning
any subagents (exactly how outputs will combine), then fans out in parallel: a SEARCH
agent surveys performance literature, a CODE agent implements both candidates once the
survey is done, and an ANALYSIS agent interprets load test results. Each subagent receives
a self-sufficient prompt with role, domain, tier, done-criteria, input, constraints, and
the exact output format the integration step requires. Every output is evaluated against
explicit acceptance criteria — partial passes are rejections. If an agent's output is
rejected, the failure category is diagnosed (wrong scope, depth, format, domain, or
capability gap), the configuration is updated, and the agent is re-run differently. The
orchestrating agent does not write the final report until every subagent's output has been
accepted and the integrated result satisfies the original goal's done-criteria.

### When to use it — and when not to

**Reach for fable-skill when the cost of a wrong or sloppy run is high:**

| Situation | Why it helps |
|---|---|
| Debugging anything non-obvious | Forces hypothesis ranking and bisection instead of guess-and-patch |
| Changes spanning several files | Written plan, vertical slices, one real verification gate |
| Refactors and migrations | Riskiest-assumption-first ordering; scope creep gets surfaced, not absorbed |
| Irreversible actions (deletes, deploys, force-pushes) | Inspect-target-first rule and explicit confirmation gates |
| Work spanning many turns or sessions | STATE.md survives context loss |
| Vague or underspecified goals | Assumption ledger + checkable done-criteria before code |
| Research and synthesis from sources | Every load-bearing claim sourced; one deliberate disconfirmation pass; disagreements surfaced, not averaged |
| Writing reports, docs, proposals | Inputs gathered before drafting; per-section points; accuracy → structure → reader edit passes |
| Reviewing or editing documents | Whole artifact read before judging; findings cited by location; defect separated from preference |
| Data analysis | Data profiled first; exclusions logged with row counts; surprising results treated as bugs until proven |
| Smaller/faster models doing agentic work | The discipline compensates for weaker default process — this is where gains are largest |

**Skip it (or let the LIGHT tier no-op) when:**

- One-line edits, typo fixes, formatting — process would cost more than a retry.
- Pure Q&A about code or concepts — there's nothing to plan or verify.
- Docs-only tweaks — a careful re-read is the whole verification.
- Brainstorming and open-ended ideation — the protocol optimizes execution, not divergence.
- You deliberately want a quick-and-dirty draft over a verified result — say so in the
  prompt ("skip verification, just sketch it") and the skill's own effort-calibration rule
  will honor it.

The rule of thumb baked into the skill itself: **process weight must scale with the cost
of being wrong.** If a mistake costs one cheap retry, act; if it costs an afternoon or a
production incident, the full protocol pays for itself.

## What's in the skill

The skill is plain markdown — a core protocol plus eleven focused modules. Agents with native
skill support (Claude Code, OpenClaw, Hermes Agent) get the folder as-is and load modules on demand; agents

with a single rules file get everything merged into one document in their native format.

| Module | What it enforces |
|---|---|
| [`SKILL.md`](skill/SKILL.md) | The Fable Loop: understand → explore → plan → act → verify → iterate → review, plus the two-axis calibration gate (Tier × Domain) and non-negotiable rules |
| [`COMPACT.md`](skill/COMPACT.md) | The whole discipline distilled to roughly 2k tokens — what single-file rules targets install by default |
| [`workflows.md`](skill/references/workflows.md) | Deliverable-based routing: build, debug, research, write, review/edit, plan, analyze, operate — each with its own explore/verify shape and banned failure modes |
| [`reasoning.md`](skill/references/reasoning.md) | Hypothesis trees, decision rubrics, self-consistency checks, assumption ledgers, argument mapping, confidence calibration, altitude control |
| [`planning.md`](skill/references/planning.md) | Checkable done-criteria, domain-specific plan templates (CODE, RESEARCH, ANALYSIS, REPORT, SCIENCE, ORCHESTRATION), the batched approval checkpoint (plan + all questions in one reply, recommendation marked), decomposition heuristics, replanning rules |

| [`execution.md`](skill/references/execution.md) | Parallel tool batching, wide-fan exploration, subagent delegation, minimal-diff editing discipline |
| [`verification.md`](skill/references/verification.md) | The evidence standard ("it should work" is banned), a five-rung code verification ladder, full verification ladders for RESEARCH, WRITING, and ANALYSIS |
| [`context.md`](skill/references/context.md) | STATE.md pattern so long tasks survive context compaction and session breaks |
| [`communication.md`](skill/references/communication.md) | Outcome-first reporting, output format by domain, honesty rules, readability over compression |
| [`research.md`](skill/references/research.md) | Source evaluation rubric, multi-source synthesis, query strategy, provenance rule, conflict surfacing |
| [`analysis.md`](skill/references/analysis.md) | Analytical loop, uncertainty accounting with confidence labels, assumption audit, data integrity checks, counter-analysis |
| [`writing.md`](skill/references/writing.md) | Report and scientific paper protocols, citation standard, tone calibration, consistency pass, writing verification ladder |
| [`orchestration.md`](skill/references/orchestration.md) | Multi-agent spawning, delegation templates, output acceptance criteria, adaptive reconfiguration protocol, orchestration patterns (fan-out, pipeline, tournament) |

## Any model — including free and local ones

The skill targets **harnesses**, but what it upgrades is the **model inside them** — and it
works on all of them, three ways:

1. **Pick any model inside a supported harness.** The install is the same regardless of
   which model the harness runs: Claude Haiku in Claude Code; Gemini Flash in Gemini CLI;
   free/local models (Gemma, Qwen, Kimi K2, GLM, Llama, DeepSeek via Ollama or an
   OpenAI-compatible endpoint) in Aider, Cline, Continue.dev, OpenCode, Crush, Goose, or
   Kilo Code; GPT models in Codex and Copilot; Grok via AGENTS.md-compatible CLIs.

2. **No harness? Export a system prompt.** `npx fable-skill prompt` writes
   `FABLE-SKILL-PROMPT.md` (add `--stdout` to pipe, `--full` for the complete edition) —
   paste it into an Ollama Modelfile `SYSTEM` block, the LM Studio / OpenWebUI / Jan system
   prompt field, or Grok / ChatGPT / Gemini custom instructions.

3. **Capability fallbacks are built in.** The skill never assumes Claude-specific features.
   If the platform lacks parallel tool calls, subagents, a question/approval UI, a todo
   tool, or durable files, the skill states the fallback (serial batches, inline work,
   checkpoint as a plain message, plan as a re-printed markdown checklist) — so a bare
   chat model can still run the full discipline.

Smaller models benefit the most: the skill explicitly instructs them to take smaller steps,
verify more often, and re-read the plan before every step — process compensating for
capability, which is exactly where the model-tier quality gap lives.

## Per-agent install locations

| Agent | Command | Installs to |
|---|---|---|
| Claude Code | `claude --global` / `claude` | `~/.claude/skills/fable-skill/` or `.claude/skills/fable-skill/` |
| Cursor | `cursor` | `.cursor/rules/fable-skill.mdc` (always-apply rule) |
| GitHub Copilot | `copilot` | `.github/instructions/fable-skill.instructions.md` |
| Windsurf | `windsurf` | `.windsurf/rules/fable-skill.md` (always-on) |
| Cline | `cline --global` / `cline` | `~/Documents/Cline/Rules/` or `.clinerules/` |
| Roo Code | `roo` | `.roo/rules/fable-skill.md` |
| OpenAI Codex ≥ 0.50 | `codex --global` / `codex` | `~/.agents/skills/fable-skill/` or `.agents/skills/fable-skill/` (native skill, loads on demand) |
| OpenAI Codex (older) | `codex-agents --global` / `codex-agents` | `~/.codex/AGENTS.md` or `./AGENTS.md` (managed block) |
| Gemini CLI / Antigravity | `gemini --global` / `gemini` | `~/.gemini/GEMINI.md` or `./GEMINI.md` (managed block) |
| Amp | `amp` | `./AGENTS.md` (managed block) |
| OpenClaw / ClawBot | `openclaw --global` / `openclaw` | `~/.openclaw/skills/fable-skill/` or `./skills/fable-skill/` |
| Hermes Agent | `hermes --global` / `hermes` | `~/.hermes/skills/fable-skill/` or `./.hermes/skills/fable-skill/` |
| Aider | `aider` | `./CONVENTIONS.md` (managed block; load with `--read CONVENTIONS.md`) |
| Continue.dev | `continue --global` / `continue` | `~/.continue/rules/` or `.continue/rules/` |
| Zed | `zed` | `./.rules` (managed block) |
| JetBrains Junie | `junie` | `.junie/guidelines.md` (managed block) |
| Kiro (AWS) | `kiro` | `.kiro/steering/fable-skill.md` |
| Trae | `trae` | `.trae/rules/fable-skill.md` |
| Qwen Code | `qwen --global` / `qwen` | `~/.qwen/QWEN.md` or `./QWEN.md` (managed block) |
| OpenCode | `opencode --global` / `opencode` | `~/.config/opencode/AGENTS.md` or `./AGENTS.md` (managed block) |
| Goose (Block) | `goose` | `./.goosehints` (managed block) |
| Crush (Charm) | `crush` | `./CRUSH.md` (managed block) |
| Warp | `warp` | `./WARP.md` (managed block) |
| Kilo Code | `kilo` | `.kilocode/rules/fable-skill.md` |
| Augment Code | `augment` | `.augment/rules/fable-skill.md` |
| OpenHands | `openhands` | `.openhands/microagents/repo.md` (managed block) |
| Replit Agent | `replit` | `./replit.md` (managed block) |
| AGENTS.md standard | `agents` | `./AGENTS.md` (managed block; Codex, Amp, Jules, Zed, Factory Droid, Kimi CLI, Grok CLI, ...) |
| **Any model** (Ollama, LM Studio, OpenWebUI, Grok, ChatGPT, ...) | `prompt` | `./FABLE-SKILL-PROMPT.md` — paste as system prompt / custom instructions |

**claude.ai:** zip the [`skill/`](skill/) folder (it must contain `SKILL.md` at its root) and
upload it under **Settings → Capabilities → Skills**.

**Using it in Codex:** after `npx github:almutaz9000/fable-skill codex --global`, invoke it
explicitly with `$fable-skill` (or browse `/skills`), or just start a complex task — Codex
auto-selects skills whose description matches the prompt. Codex skills use progressive
disclosure, so the skill costs almost nothing until it triggers.

**Any agent not listed:** copy [`skill/`](skill/) into wherever your agent reads instructions,
or paste the merged output of `SKILL.md` + `references/*.md` into its system prompt / rules file.

## What it does (and honestly, what it doesn't)

A skill is instructions, not weights. It cannot transfer raw model intelligence. What it *can*
transfer is process — and in agentic work, process failures (acting on unread code, claiming
success without running anything, retrying the same fix, losing state mid-task) account for a
large share of the quality gap between model tiers. This skill closes those by policy:

- **Never act on assumption** — read the code, run the command, get ground truth first.
- **Never burn a long run on a guess** — before expensive or divergent work, one batched checkpoint: the plan plus every open question in a single reply, recommended option marked, defaults stated, misunderstandings surfaced before the work, not after.
- **Never claim without evidence** — every "it works" must cite output that would differ if it didn't.
- **Never retry verbatim** — two failures at the same subgoal force a change of hypothesis or altitude.
- **Never lose state** — long tasks keep a STATE.md that survives context compaction.
- **Never skip the review** — a hostile self-review gates every "done".
- **Never fix what was only asked about** — a question ("why is this failing?") gets a
  diagnosis with evidence and a recommended fix; edits start only when requested.

Expect the biggest gains on process-heavy work: debugging, refactors, migrations, research,
report writing, data analysis, multi-step automation.

### What it can't do

Setting expectations honestly, because a skill that overpromises gets uninstalled:

- **It can't add intelligence.** The skill transfers Fable's *process*, not its judgment.
  A mid-tier model under the skill runs the right procedure — ranks hypotheses, verifies
  with evidence, checkpoints before long work — but picking the *right* hypothesis or the
  *right* architecture is still bounded by the model. On hard design judgment, a frontier
  model without the skill beats a mid-tier model with it.
- **It can't verify without a way to verify.** No test environment, no credentials, no
  runtime → the skill's guarantee degrades from "verified" to "honestly labeled
  unverified". The model says "unverified because X" instead of bluffing — that's the
  floor, and it's deliberate.
- **It can't force obedience on very small models.** Sub-~7B models follow long rule sets
  unreliably. The compact edition (~2k tokens) helps, and the built-in fallbacks keep the
  rules followable on bare harnesses, but the skill's floor is the model's
  instruction-following ability, not zero.

**Where the gains land, by model tier:** mid-tier paid models (Haiku, Gemini Flash,
GPT-mini class, Kimi K2, GLM) gain the most — strong enough to obey the rules, and their
default process is exactly where they cut corners (claiming success without running
anything, retrying verbatim, losing state). Frontier models gain *consistency* — they do
most of this usually; the skill makes it every time, and the approval checkpoint isn't a
default anywhere. Small free models gain direction and honesty but keep their ceiling.

For Hermes Agent specifically, prefer Hermes-native workflows when available: use the todo tool instead of inventing a plan file for medium tasks, use `delegate_task` for parallel sub-workstreams, and rely on Hermes skill folders and session persistence instead of stuffing everything into always-on rules text.

Across models, this skill is designed to help most of the common coding and agentic models that can follow structured instructions and use tools reliably. It improves process rather than raw intelligence, so stronger models will still reason better, but smaller and cheaper models often benefit the most from the explicit workflow discipline.

## Repo layout

```
fable-skill/
├── skill/                 # the skill itself (canonical source, plain markdown)
│   ├── SKILL.md           # the Fable Loop + two-axis calibration gate
│   ├── COMPACT.md         # ~2k-token compact edition for single-file rules targets
│   └── references/
│       ├── workflows.md
│       ├── reasoning.md      # hypothesis trees, argument mapping, confidence calibration
│       ├── planning.md       # plan templates for all 7 domains
│       ├── execution.md      # parallel tool use, subagent delegation
│       ├── verification.md   # evidence standard + verification ladders for all domains
│       ├── context.md        # STATE.md pattern for long tasks
│       ├── communication.md  # outcome-first reporting, output format by domain
│       ├── research.md       # source evaluation, provenance rule, synthesis protocol
│       ├── analysis.md       # analytical loop, confidence labels, counter-analysis
│       ├── writing.md        # report + science paper protocols, consistency pass
│       └── orchestration.md  # multi-agent spawning, acceptance criteria, adaptive reconfiguration

├── bin/cli.js             # zero-dependency npx installer
└── package.json
```

## Contributing

Improvements to the discipline itself (sharper rules, better protocols, new agent targets for
the installer) are welcome — open an issue or PR. Keep rules falsifiable and behavioral:
"never X without Y" beats "try to be careful".

## License

[MIT](LICENSE)
