# fable-skill

**Fable-model operating discipline for any AI coding agent.**

One skill that upgrades how your agent *works* — not what it knows. It enforces the working
discipline that separates top-tier agentic models from ordinary runs: explore before planning,
plan before acting, verify every change with evidence, debug at root cause instead of retrying
blindly, persist state across long tasks, and self-review before declaring done.

Install it once with `npx`, natively, into whichever agent you use:

| | | | |
|---|---|---|---|
| Claude Code | Cursor | GitHub Copilot | OpenAI Codex |
| Gemini CLI / Antigravity | Windsurf | Cline | Roo Code |
| Amp | OpenClaw / ClawBot | Aider | Continue.dev |
| Zed | JetBrains Junie | Kiro (AWS) | Trae |
| Qwen Code | OpenCode | Goose | Warp |
| Kilo Code | Augment | OpenHands | Replit Agent |
| any AGENTS.md agent | claude.ai (zip) | | |

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

# See every supported agent and where it installs
npx github:almutaz9000/fable-skill list
```

No dependencies, no build step, Node ≥ 16. The installer is idempotent — re-run it any time
to update; shared files like `AGENTS.md` are edited only between managed markers, so your own
content is never touched.

### Token cost: compact by default

Single-file rules targets (Cursor, Copilot, `AGENTS.md`, and the like) inject their content
into **every** request, so they get the **compact edition** (roughly 2k tokens) — the full
discipline distilled into one document. Agents with native skill folders (Claude Code, Codex,
OpenClaw) load reference modules on demand, so they get the complete skill at no per-request
cost. If you want the full version (roughly 7k tokens) in a rules file anyway, opt in with
`--full`:

```bash
npx github:almutaz9000/fable-skill agents --full
```

## How to use it

Once installed, the skill activates two ways:

- **Explicitly** — type `/fable-skill` in Claude Code, `$fable-skill` in Codex (or browse
  `/skills`). Rules-file agents (Cursor, Copilot, AGENTS.md, …) have it always on, so
  there is nothing to invoke.
- **Automatically** — skill-native agents match your prompt against the skill description
  and load it when the task fits: debugging, multi-file changes, refactors, research,
  analysis, writing, scientific work, search, and long-running or multi-agent tasks.

You don't need special prompt phrasing — the skill adapts to the task. But the examples
below show what it changes in each case.

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
carries the rest flagged into the final answer — no silent load-bearing guesses.

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

The skill is plain markdown — a core protocol plus nine focused modules. Agents with native
skill support (Claude Code, OpenClaw) get the folder as-is and load modules on demand; agents
with a single rules file get everything merged into one document in their native format.

| Module | What it enforces |
|---|---|
| [`SKILL.md`](skill/SKILL.md) | The Fable Loop: understand → explore → plan → act → verify → iterate → review, plus the two-axis calibration gate (Tier × Domain) and non-negotiable rules |
| [`COMPACT.md`](skill/COMPACT.md) | The whole discipline distilled to roughly 2k tokens — what single-file rules targets install by default |
| [`reasoning.md`](skill/references/reasoning.md) | Hypothesis trees, decision rubrics, self-consistency checks, assumption ledgers, argument mapping, confidence calibration, altitude control |
| [`planning.md`](skill/references/planning.md) | Checkable done-criteria, domain-specific plan templates (CODE, RESEARCH, ANALYSIS, REPORT, SCIENCE, ORCHESTRATION), decomposition heuristics, replanning rules |
| [`execution.md`](skill/references/execution.md) | Parallel tool batching, wide-fan exploration, subagent delegation, minimal-diff editing discipline |
| [`verification.md`](skill/references/verification.md) | The evidence standard ("it should work" is banned), a five-rung code verification ladder, full verification ladders for RESEARCH, WRITING, and ANALYSIS |
| [`context.md`](skill/references/context.md) | STATE.md pattern so long tasks survive context compaction and session breaks |
| [`communication.md`](skill/references/communication.md) | Outcome-first reporting, output format by domain, honesty rules, readability over compression |
| [`research.md`](skill/references/research.md) | Source evaluation rubric, multi-source synthesis, query strategy, provenance rule, conflict surfacing |
| [`analysis.md`](skill/references/analysis.md) | Analytical loop, uncertainty accounting with confidence labels, assumption audit, data integrity checks, counter-analysis |
| [`writing.md`](skill/references/writing.md) | Report and scientific paper protocols, citation standard, tone calibration, consistency pass, writing verification ladder |
| [`orchestration.md`](skill/references/orchestration.md) | Multi-agent spawning, delegation templates, output acceptance criteria, adaptive reconfiguration protocol, orchestration patterns (fan-out, pipeline, tournament) |

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
| Aider | `aider` | `./CONVENTIONS.md` (managed block; load with `--read CONVENTIONS.md`) |
| Continue.dev | `continue --global` / `continue` | `~/.continue/rules/` or `.continue/rules/` |
| Zed | `zed` | `./.rules` (managed block) |
| JetBrains Junie | `junie` | `.junie/guidelines.md` (managed block) |
| Kiro (AWS) | `kiro` | `.kiro/steering/fable-skill.md` |
| Trae | `trae` | `.trae/rules/fable-skill.md` |
| Qwen Code | `qwen --global` / `qwen` | `~/.qwen/QWEN.md` or `./QWEN.md` (managed block) |
| OpenCode | `opencode --global` / `opencode` | `~/.config/opencode/AGENTS.md` or `./AGENTS.md` (managed block) |
| Goose (Block) | `goose` | `./.goosehints` (managed block) |
| Warp | `warp` | `./WARP.md` (managed block) |
| Kilo Code | `kilo` | `.kilocode/rules/fable-skill.md` |
| Augment Code | `augment` | `.augment/rules/fable-skill.md` |
| OpenHands | `openhands` | `.openhands/microagents/repo.md` (managed block) |
| Replit Agent | `replit` | `./replit.md` (managed block) |
| AGENTS.md standard | `agents` | `./AGENTS.md` (managed block) |

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
- **Never claim without evidence** — every "it works" must cite output that would differ if it didn't.
- **Never retry verbatim** — two failures at the same subgoal force a change of hypothesis or altitude.
- **Never lose state** — long tasks keep a STATE.md that survives context compaction.
- **Never skip the review** — a hostile self-review gates every "done".

Expect the biggest gains on process-heavy work: debugging, refactors, migrations, research,
multi-step automation.

## Repo layout

```
fable-skill/
├── skill/                 # the skill itself (canonical source, plain markdown)
│   ├── SKILL.md           # the Fable Loop + two-axis calibration gate
│   ├── COMPACT.md         # ~2k-token compact edition for single-file rules targets
│   └── references/
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
