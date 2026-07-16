# Workflow routing — match the process to the deliverable

The Loop (understand → explore → plan → act → verify → iterate → review) is universal, but
what each step *means* depends on what the user will actually consume. A run that applies
coding discipline to a research question — or worse, no discipline to a report — wastes the
protocol. Route first, then run the Loop in the chosen shape.

## The router

Classify by the **deliverable the user will consume**, not by the vocabulary of the prompt.
"Review our pipeline docs and fix the numbers" sounds like coding but its deliverables are a
review verdict plus corrected figures — that's Review + Analyze.

| Deliverable | Workflow | The step that saves the run |
|---|---|---|
| Working code / changed behavior | **Build** | explore the codebase's idiom before writing; verify by executing |
| A failure explained (and fixed) | **Debug** | reproduce before theorizing; ≥3 ranked hypotheses |
| An answer grounded in sources | **Research** | source every load-bearing claim; hunt disconfirmation once |
| A document: report, docs, proposal | **Write** | outline with per-section points before drafting; edit in separate passes |
| A verdict on an existing artifact | **Review** | read it ALL before judging; cite exact locations |
| A plan or a decision | **Plan** | 2–3 real options scored; riskiest assumption first |
| Insight from data | **Analyze** | profile the data before trusting any result from it |
| A state change in the world (deploy, migration, bulk edit, send) | **Operate** | dry-run and checkpoint; smallest irreversible step last |

Routing rules:
- **Mixed deliverables → phases.** "Analyze the survey data and write up findings" is
  Analyze producing a verified-findings artifact, then Write consuming it. Name the handoff
  artifact; phase 1's verification gates phase 2 — never draft prose around unverified numbers.
- **Re-route on discovery.** A Build task that hits an unexplained failure becomes Debug
  until the cause is known, then returns to Build. Say so when it happens.
- **Tier and shape are independent axes.** A LIGHT research question (one lookup) skips the
  ceremony but still cites its source; a FULL write-up gets the whole pipeline below.

## Build (coding — features, changes, refactors)

The Loop as written in SKILL.md is already this shape. The Build-specific emphases:
- Explore = the codebase's existing idiom, the callers of what you change, prior art to copy.
- Verify = the verification ladder (`verification.md`) — executing the change, never inspecting it.
- Prefer vertical slices (one case end-to-end) so there's a working checkpoint after each step.
- Banned: writing code before reading the target area; "done" from code inspection alone.

## Debug (diagnose a failure)

The deliverable is a **causal explanation with evidence** — the fix is a corollary. Full
protocol in `verification.md`; the shape: capture the failure verbatim → reproduce on demand
and shrink → ≥3 ranked hypotheses (`reasoning.md` §1) → bisect between last-good and
first-bad → fix the cause → re-run the original reproduction unmodified.
- Banned: patching a symptom whose cause you can't state; retrying anything verbatim.

## Research (questions answered from sources)

1. **UNDERSTAND** — turn the question into subquestions, and name the decision the answer
   feeds: "what will the reader do with this?" decides depth and cutoff.
2. **EXPLORE** — fan wide across *independent* sources (not one source quoted by five
   others). Prefer primary over secondary. Capture as you read: claim → source → confidence.
3. **PLAN** — set a stop criterion up front: saturation (two more sources add nothing new)
   or a timebox, not "when I feel done".
4. **ACT** — keep a notes artifact mapping each claim to its source; write it as you go,
   not from memory at the end.
5. **VERIFY** — every load-bearing claim has a source you actually opened this session;
   numbers sanity-checked for magnitude; volatile facts date-checked. Then one deliberate
   **disconfirmation pass**: search for evidence *against* your emerging conclusion. Finding
   none is evidence; not looking is negligence.
6. **REVIEW/REPORT** — findings first, each labeled by confidence (established / probable /
   single-source / contested). Where sources disagree, surface the disagreement — never
   average it away. Report what changes the reader's decision, not everything you found.
- Banned: citing from memory; treating one source as ground truth; burying a contested claim
  as if settled.

## Write (reports, documentation, proposals)

1. **UNDERSTAND** — audience, purpose (decide / learn / approve?), length and format
   constraints. State the one-sentence thesis before anything else; if you can't, you're
   still in Research.
2. **EXPLORE** — gather ALL inputs before drafting: the data, prior documents, the house
   template or an existing doc to copy the shape of. Drafting around missing inputs produces
   rewrites, not drafts.
3. **PLAN** — outline where each section's point is a full sentence ("Migration risk is
   concentrated in the auth module"), never a topic ("Risks"). A section whose point you
   can't state as a sentence gets cut or merged.
4. **ACT** — draft top-down, conclusion first (the reader should be able to stop after
   paragraph one and act correctly). One idea per paragraph. Don't polish sentences while
   the structure is unsettled.
5. **VERIFY** — three separate edit passes, in this order:
   - **Accuracy**: every number, name, claim, and quote checked against its source; internal
     consistency (totals add up, terminology stable, cross-references resolve).
   - **Structure**: does each section deliver its outlined point? Is the conclusion where the
     reader starts, not where they arrive exhausted?
   - **Reader**: read cold, top-to-bottom, as the intended audience; cut what doesn't serve
     them. One pass = one lens; simultaneous passes catch none of it well.
6. Deliver with open questions and unverified figures labeled, not silently smoothed over.
- Banned: drafting before inputs are gathered; burying the conclusion; sentence-polishing a
  broken structure; a number in the document with no checked source.

## Review & edit (documents, reports, code review)

The deliverable is a **verdict plus prioritized findings** — not a rewrite, unless asked.
1. **UNDERSTAND** — what standard applies (correctness? clarity? a spec? house style?) and
   who decides. Reviewing against an unstated standard produces noise.
2. **EXPLORE** — read the ENTIRE artifact before recording findings; early verdicts bias the
   rest of the read. Fetch the source of truth to check against (the spec, the data, the
   cited documents).
3. **ACT** — multiple passes, one lens each: factual correctness → logic and structure →
   clarity and style. Each finding gets a severity and an exact location (page, section,
   `file:line`).
4. **VERIFY** — re-check each finding against the artifact before reporting it (quote the
   offending text — misreadings die here). Explicitly separate **defects** ("this number
   contradicts table 3") from **preferences** ("I'd phrase this differently") and label them.
5. **Editing mode** (when asked to fix, not just judge) — preserve the author's voice; make
   the smallest change that fixes the problem; never change meaning silently; after edits,
   re-check everything the edit touches (totals, cross-references, flow into the next paragraph).
- Banned: verdicts before finishing the read; rewriting when asked to review; preference
  dressed as defect; a finding without a location.

## Plan & decide (strategy, project plans, decisions)

The deliverable is something **someone will execute or commit to**.
1. **UNDERSTAND** — the decision the plan serves, who executes it, and the real constraints
   (deadline, budget, skills, appetite for risk). A plan that ignores a stated constraint is
   wrong no matter how elegant.
2. **EXPLORE** — ground truth on the current state first; keep an assumption ledger
   (`reasoning.md` §4) for everything you couldn't verify.
3. **ACT** — generate 2–3 genuinely different options (if you can't name the losing option's
   redeeming quality, you strawmanned it); score them with a decision rubric
   (`reasoning.md` §2); build the winner into the plan format from `planning.md`:
   checkable milestones, riskiest assumption front-loaded, one owner per step.
4. **VERIFY** — run a pre-mortem ("it failed — what was it?") and turn the top answer into a
   mitigation step; check the plan against every stated constraint; test executability: could
   a cold reader start step 1 without asking you anything?
- Banned: single-option plans presented as inevitable; milestones that aren't checkable;
  effort estimates derived from optimism instead of the step list.

## Analyze (data analysis)

1. **UNDERSTAND** — the question the analysis answers and the decision it feeds. Define the
   metric *before* computing it — choosing the metric after seeing results is how numbers
   get tortured.
2. **EXPLORE** — profile before analyzing: shape, ranges, nulls, duplicates, units, time
   coverage, and whether the data can answer the question at all. Read the data dictionary
   if one exists.
3. **ACT** — build the pipeline in inspectable steps; keep raw data immutable; log every
   filter and exclusion with its reason and its row-count impact.
4. **VERIFY** — row counts in vs. out at every step; magnitudes sanity-checked against a
   known reference point; one record traced end-to-end by hand; key results re-checked under
   a reasonable alternative choice (different window, different aggregation) — a conclusion
   that flips is a fragile conclusion. **A surprising result is a pipeline bug until you've
   hunted for the bug and failed to find it.**
5. **REPORT** — finding first with effect size, not a tour of the method; observation
   separated from interpretation ("churn rose 12%" vs. "likely driven by the price change");
   exclusions and their impact stated. Charts come after the numbers are verified, never before.
- Banned: analyzing unprofiled data; silent exclusions; publishing a surprising number
  without a bug hunt; metric definitions chosen after seeing the results.

## Operate (deploys, migrations, bulk changes, publishing, sending)

The deliverable is a **changed world state**, often hard to reverse — safety dominates.
- Inspect the actual target immediately before acting; if it contradicts the description, stop.
- Dry-run where a dry-run exists; where none does, run the real action on one sample first
  and verify it before the batch.
- Checkpoint (backup, snapshot, branch) before the first irreversible step; name the
  rollback procedure before starting, not during the incident.
- Order steps so the irreversible one comes last and smallest; verify state after each stage
  against what you expected, not just "no error".
- Banned: batch-destructive operations without a verified sample; irreversible actions with
  no named rollback; declaring success from the absence of errors instead of the presence of
  the expected state.
