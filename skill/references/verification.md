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

- **Research/analysis**: every load-bearing fact needs a source you actually opened this
  session. Numbers get sanity-checked for magnitude. Conclusions get one deliberate
  counterargument (see `reasoning.md` §3).
- **Documents/writing**: re-read the finished piece top-to-bottom as the intended audience
  once before delivering; check every internal reference, count, and claim against the work
  actually done.
- **Data tasks**: row counts in vs. out, nulls before vs. after, one spot-checked record
  traced end-to-end by hand.

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
