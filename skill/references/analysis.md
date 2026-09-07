# Analysis — reasoning from evidence like Fable

Analysis fails when conclusions run ahead of evidence. Fable's analysis discipline makes
every inferential step explicit, every assumption visible, and load-bearing conclusions labeled
with the confidence it actually deserves.

## The analytical loop

Run this in order; do not skip to synthesis:

```
1. QUESTION   — state the question precisely; vague questions produce vague analysis
2. DATA       — gather evidence (read files, run queries, open sources) before forming views
3. HYPOTHESES — start with one evidence-backed explanation; add alternatives when ambiguous
4. TEST       — identify what data would confirm vs. falsify the active hypothesis
5. SYNTHESIZE — integrate what the evidence supports; discard what it doesn't
6. CONFIDENCE — label load-bearing conclusions when uncertainty would change the action
```

Never short-circuit from DATA directly to CONCLUSION when the pattern is ambiguous. A
simple, well-supported reading does not need three competing hypotheses.

## Uncertainty accounting (hard rule)

Every load-bearing conclusion that could change the user's action must carry a confidence
label. Trivial observed facts do not need a label.

| Label | Meaning |
|---|---|
| **High** | Multiple independent evidence sources agree; no significant counter-evidence found |
| **Medium** | One strong source, or multiple sources with meaningful caveats or gaps |
| **Speculative** | Extrapolation, inference, or assumption not directly supported by examined data |

Write the label in the output: "The migration increased latency by ~40ms (High confidence —
reproduced in 3 environments)." Never state a speculative conclusion as if it were high-confidence.

Distinguish these in the exact words you use:
- "The data shows X" — only for directly observed facts.
- "This suggests Y" — for inferences one step from data.
- "One possible explanation is Z" — for speculative hypotheses.

## Assumption audit

Before finalizing any analysis:

```
Assumptions made (mark each):
  [verified]  X is the production config, not the staging one — confirmed by reading env file
  [carried]   The sample is representative of the full population — unverified, flagged in answer
  [critical]  The time-series is complete with no gaps — unverified; if wrong, conclusion changes
```

Any assumption marked [critical] that is unverified must appear in the caveats section of
the final answer. Never let a critical assumption be silent and load-bearing simultaneously.

## Data integrity checks (before analysis)

Run these before drawing any conclusions from data:

- **Row counts in vs. out**: if a transformation or join changed row counts, explain why.
- **Null / missing value rates**: check before and after; unexpected nulls usually signal a
  join error or upstream data quality issue, not a feature.
- **Spot-check by hand**: trace one representative record end-to-end through every
  transformation. If the result surprises you, the pipeline is suspect.
- **Before-and-after comparison**: for change-impact analysis, verify the baseline is
  measured the same way as the post-change metric — apples-to-apples, not apples-to-oranges.
- **Outlier inspection**: identify and explain outliers before including or excluding them.
  "I excluded outliers" is not analysis; "I excluded values >3σ because they represent known
  data entry errors confirmed in field X" is.

## Counter-analysis (before final answer)

Before delivering a contested or high-impact analysis conclusion, run the adversarial pass:

1. State the strongest case AGAINST your conclusion in 2–3 sentences.
2. Identify the evidence or data that would most directly undermine your conclusion.
3. Check whether you have that evidence, and if so, whether it does undermine it.
   - If it does hold: revise the conclusion or lower the confidence label.
   - If it doesn't hold: state why in the answer (this makes the conclusion more credible,
     not less).

Skipping the counter-analysis is the single most common source of overconfident analysis.

## Analysis verification ladder (before declaring done)

1. **Data integrity**: row counts, null rates, spot-check, before/after comparison — all done.
2. **Assumption audit**: every assumption is listed; critical ones are labeled and surfaced.
3. **Counter-analysis**: the strongest opposing case has been explicitly argued and answered.
4. **Confidence labels**: load-bearing conclusions carry an explicit confidence label, and
   the label matches the evidence — no "high" claims on speculative inferences.
5. **Original question answered**: the conclusion addresses the question as asked, including
   action mode and exclusions, not a nearby easier question. Confirm by re-reading step 1
   after step 5.

## Done-criteria for analysis tasks

Checkable examples:
- "Load-bearing conclusions in the summary are labeled with a confidence level" — checkable.
- "The counter-analysis section names the strongest opposing case" — checkable.
- "Every assumption in the assumption audit section is marked verified or carried" — checkable.
- "The analysis is insightful" — not checkable.
