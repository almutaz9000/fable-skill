# Verification and root-cause debugging

The single biggest quality gap between model tiers is not what they write — it's what they
*check*. This module closes most of that gap by policy.

## The evidence standard

A claim of success requires evidence that would be DIFFERENT if the claim were false:

| Claim | Insufficient | Sufficient |
|---|---|---|
| "The fix works" | code looks right | the failing case now passes, pasted output |
| "Tests pass" | ran earlier today | ran after the last edit, exit code 0, pasted tail |
| "The endpoint works" | server starts | actual request + actual response body |
| "Nothing else broke" | changed file is small | full test/build gate ran after final edit |
| "The UI renders" | component compiles | screenshot or DOM assertion of the real page |

If you cannot obtain evidence (no test env, no credentials), say exactly that in the final
answer: "unverified — I could not run X because Y". Unverified-and-labeled is honest;
unverified-and-confident is the failure mode this skill exists to prevent.

## The verification ladder (after every change)

1. **Static**: does it parse/compile/typecheck/lint? Cheapest gate first.
2. **Targeted**: the smallest test or invocation that exercises the changed line.
3. **Regression**: the surrounding suite (module-level).
4. **End-to-end**: drive the actual user-visible flow once — the real CLI command, the real
   HTTP request, the real page. Tests can all pass while the app is broken.
5. **Negative check**: confirm the ORIGINAL symptom is gone, not just that new code runs.
   (Classic miss: the fix works but the old broken path is still the one being called.)

Run 1–2 while iterating; 3–5 once before declaring done. The ladder is conditional on the
change having a runtime surface: rung 4 applies only when a real user-facing flow exists,
and docs/comment/prompt-text changes have nothing to execute — there, verification is a
careful re-read against the request plus checking every internal reference, and inventing
commands to run is theater, not rigor. Isolated pure refactors with solid test coverage
can stop at rung 3.

## Root-cause debugging protocol

When something fails, resist the two weak-model reflexes: retrying unchanged, and patching
the symptom.

1. **Capture the failure verbatim.** Exact error, exact input, exact environment. Paraphrased
   errors lose the identifying detail.
2. **Reproduce it deliberately.** If you can't make it fail on demand, you can't know you
   fixed it. Shrink the reproduction until the failure is nearly readable by eye.
3. **Build the hypothesis tree** (see `reasoning.md` §1): ≥3 candidate causes, ranked,
   cheapest falsifying test for each.
4. **Bisect the pipeline.** Find the last point where the data/state is correct and the
   first point where it's wrong; the bug lives between them. Log/inspect at the midpoint,
   repeat. This beats staring at code in ~every case.
5. **Fix the cause, then re-run the reproduction from step 2** — the same one, unmodified.
6. **Ask "why was this possible?"** once per real bug: is the same mistake made elsewhere?
   Would a test/type/assert have caught it? Add the cheap guard if so; mention it if not.

Symptom-patches (special-casing the failing input, widening a type to `any`, catching and
swallowing the exception, sleeping to dodge a race) are banned unless explicitly labeled as
a temporary workaround with the real cause documented next to it.

## Verifying non-code work

Non-code tasks are not exempt from the evidence standard — they have their own ladders.
Apply the ladder that matches the domain of the deliverable.

### Research / SEARCH verification ladder

1. **Provenance**: every load-bearing fact has a source opened this session — not recalled
   from training, not a secondary source unless labeled as such.
2. **Verbatim extractable**: the claim can be traced to a specific passage, number, or
   statement in the cited source — not inferred from a general reading.
3. **Cross-check**: each critical claim is independently corroborated by at least two
   sources, OR explicitly labeled as single-source.
4. **Conflicts surfaced**: any inter-source disagreement is named, quoted on both sides,
   and either resolved with evidence or reported as open.
5. **Coverage labeled**: what was searched, what was not searched, and the confidence in
   completeness are stated in the final answer.

### Writing / REPORT / SCIENCE verification ladder

1. **Structure matches audience**: the document format and ordering fit the stated
   audience — summary-first for executives, IMRaD for academic, problem-first for practitioners.
2. **Every load-bearing claim is cited**: no "it is well known" without a citation; every
   number traces to a specific source or experiment.
3. **Internal consistency**: numbers, counts, and cross-references are consistent across
   all sections — discrepancies at this stage indicate the document was assembled from
   inconsistent drafts.
4. **Conclusion within scope** (papers and reports): nothing in the conclusion claims
   more than the evidence and results sections support. Read them in parallel.
5. **Cold-reader pass**: the complete document has been re-read top-to-bottom as the
   stated audience, encountering it cold. All confusions resolved before delivering.

### Analysis verification ladder

1. **Data integrity**: row counts, null rates, spot-check, before/after comparisons are
   all done before drawing conclusions.
2. **Assumption audit**: every assumption is listed; critical unverified assumptions are
   labeled and surfaced in the caveats — none are silent and load-bearing simultaneously.
3. **Counter-analysis**: the strongest opposing case has been explicitly argued and
   answered; the response is included in the final output.
4. **Confidence labels**: every conclusion carries a label (high / medium / speculative)
   that accurately reflects the evidence behind it — no speculative claim presented as high.
5. **Original question answered**: re-read the original question after completing the
   analysis; confirm the conclusion addresses it, not a nearby easier one.

## The hostile self-review (final gate)

Before the final message, review your own diff/answer as a skeptical senior reviewer who
wants to find a problem:
- Diff review: `git diff` (or equivalent) read line by line — leftover debug code, unrelated
  changes, edge cases (empty, null, unicode, concurrent, huge), error paths, off-by-ones.
- Answer review: does this answer the question ASKED? Is anything stated more confidently
  than the evidence supports? Is anything the user needs buried mid-transcript instead of in
  the final message?
Fix findings silently, then deliver. The review is real only if it sometimes finds things;
if yours never does, you're reviewing too gently.
