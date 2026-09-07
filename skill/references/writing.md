# Writing — reports, scientific papers, and formal documents

A written deliverable is only done when a cold reader in the target audience can follow
it without confusion and trust its claims. Fable's writing discipline ensures every
document is structured for its reader, internally consistent, and honest about its limits.

## Step zero: audience and format declaration

Before writing a single word, declare:
1. **Audience**: who is the primary reader? (Examples: executive non-technical, senior
   engineer, academic peer reviewer, general practitioner in the field.)
2. **Format**: report, scientific paper, technical specification, executive summary,
   literature review, white paper — pick one and name it.
3. **Key question**: what is the single most important question this document answers?

These three shape every structural and tonal decision. If the audience or format changes
mid-task, restart from this step — do not patch a document written for the wrong reader.

## Report structure protocol

Write in this order (not necessarily final document order — the writing may work top-down
or section-by-section, but the decisions are made in this sequence):

1. **Key question** — one sentence stating what the report answers.
2. **Executive summary / answer upfront** — the conclusion stated directly, for readers
   who read only one section. Write this last but place it first.
3. **Supporting structure** — background, findings, analysis, in the order the reader
   needs to trust the conclusion.
4. **Evidence** — data, citations, examples — behind every load-bearing claim.
5. **Caveats and limitations** — what the report does NOT cover, where the data is thin,
   what would change the conclusion.

Never bury the conclusion. A reader who stops after the first two paragraphs must still
know what the document found and whether it's actionable.

## Scientific paper protocol

Required sections (non-negotiable):

| Section | Standard |
|---|---|
| **Contribution statement** | One paragraph: what does this work add that did not exist before? Be specific. |
| **Related work** | Position relative to prior work; cite what you are building on and what you are departing from. |
| **Methodology** | Reproducibility standard: enough detail that an independent researcher could replicate the result. If you cannot write it to this standard, the methodology is not ready to publish. |
| **Results** | Report what the data shows with uncertainty ranges; distinguish results from interpretations. |
| **Limitations** | Mandatory for claims that could be over-read. Name the limitations that actually bound the results. If none exist, say why. |
| **Conclusion** | Must not claim more than the results section supports. The conclusion is a synthesis, not a sales pitch. |

Hard rules:
- A conclusion may not introduce a claim not supported by a result in the Results section.
- Every number in the paper must trace to a specific experiment, dataset, or source.
- "Future work" is not a substitute for a limitation: if the current work does not address X,
  name it as a limitation; future work can then address it.

## Citation and sourcing standard

- Every load-bearing factual claim must have a citation to a source you actually examined.
- "It is well known that…" and "commonly accepted…" are not citations — they are the
  absence of a citation wearing a costume. Replace them.
- For quantitative claims: cite the specific study, dataset, or measurement that produced
  the number. Do not cite a secondary source that itself cites another source without
  checking the original.
- Cite in the format your audience expects; if unsure, use author-year inline with a full
  reference list.

## Tone calibration by audience

Pick at the start and hold it throughout the entire document:

| Audience | Tone | Vocabulary | Structure preference |
|---|---|---|---|
| Academic / peer review | Formal, precise, hedged where uncertain | Field-standard jargon acceptable | IMRaD or field convention |
| Technical practitioner | Direct, actionable, some jargon | Technical but plain English | Problem → solution → evidence |
| Executive / non-technical | Plain English, outcome-first | No jargon; spell out acronyms | Summary first, details optional |

Switching tone mid-document signals a confused audience model. If multiple audiences are
required, write separate summaries — do not compromise both by writing to neither.

## Consistency pass (before delivering)

Before delivering any formal document, run a consistency pass in this order:

1. **Internal cross-reference check**: every number, percentage, and claim in one section
   must match the corresponding number in every other section. Discrepancies at this stage
   are a sign the document was assembled from inconsistent drafts.
2. **Evidence audit**: pick every load-bearing claim and trace it to its cited source.
   If the source does not support the claim as stated, fix the claim or replace the source.
3. **Read as the audience**: read the complete document top-to-bottom as if you are the
   stated audience, encountering it cold. Mark anything that would confuse or mislead that
   reader. Fix before delivering.
4. **Conclusion vs. results check** (papers and reports): re-read the conclusion alongside
   the results. Flag any claim in the conclusion not grounded in the results. Remove or
   reframe it.

This pass is not optional and not a skim. The review is real only if it sometimes finds things.

## Writing verification ladder (before declaring done)

1. **Structure matches audience**: the document format and order fit the stated audience
   (summary first for executives; IMRaD for academic; problem-first for practitioners).
2. **Every load-bearing claim is cited**: no "it is well known" — every claim has a source
   or is explicitly labeled "author's assessment" / "unverified."
3. **Internal consistency**: numbers, counts, and references cross-checked — no discrepancy
   between sections.
4. **Conclusion within scope**: nothing in the conclusion exceeds what the evidence and
   results support.
5. **Cold-reader pass**: the complete document has been re-read top-to-bottom as the stated
   audience, and all confusions have been resolved.

## Done-criteria for writing tasks

Done-criteria must name the intended audience and a quality bar:
- "A senior engineer with no prior project context can follow the methodology section
  without asking clarifying questions" — checkable.
- "Every claim in the executive summary is supported by evidence in sections 2–4" — checkable.
- "The limitations section names the limitations that bound the claims" — checkable.
- "The document is well written" — not checkable.
