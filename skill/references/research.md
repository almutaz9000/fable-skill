# Research and search — finding ground truth like Fable

A research task is only as good as its provenance. Fable's research discipline closes the
gap between "I recall reading…" and "the source says, and I can show you."

## The provenance rule (hard rule)

Every load-bearing fact in a research output must cite a source you actually opened this
session — not recalled from training, not "commonly known". If you cannot cite a real
source, label the claim explicitly: "unverified — sourced from prior knowledge, not
confirmed this session." Clearly labeled inference is allowed; unlabeled inference is not.

## Query strategy

- **Fan first**: before reading anything, generate enough distinct query angles to cover
  the actual question (synonyms, subfields, opposing terms, author names, dataset names).
  Send independent queries in one batch, not one at a time. One well-aimed query is enough
  for a narrow factual lookup.
- **Breadth-first, then depth**: first pass locates which sources are likely most relevant;
  second pass reads the 2–4 best deeply. Don't read a long document fully on first contact
  — scan the abstract, conclusion, and headings first.
- **Timebox exploration**: if N queries in the same direction yield no new claims, change
  the strategy — search for the error message, the dataset name, the author, the date range,
  or the counter-argument instead of more synonyms.
- **Primary over secondary**: always prefer the original paper, specification, or dataset
  over summaries, blog posts, and secondhand accounts. When only a secondary source is
  available, label it as such.

## Source evaluation rubric

Score each source before relying on it:

| Dimension | Strong | Weak |
|---|---|---|
| Credibility | Peer-reviewed, official spec, primary data | Blog, social media, anonymous |
| Recency | Appropriate for field pace (weeks for fast-moving, years for stable) | Outdated for the claim |
| Relevance | Directly addresses the specific claim | Tangentially related |
| Consensus | Corroborated by independent sources | Single outlier, pre-print only |

A source with one "Weak" rating can still be used but must be labeled. A source with two
or more "Weak" ratings must not be cited as authoritative — use it to generate hypotheses,
not conclusions.

## Multi-source synthesis protocol

1. **Map claims**: for each key claim in your answer, list which source(s) support it and
   which, if any, contradict it. Do this before writing the synthesis.
2. **Flag conflicts explicitly**: when two credible sources disagree, surface both sides
   with quotes. Do not silently pick the one that fits your hypothesis.
3. **Distinguish corroboration from repetition**: two sources that both cite a third source
   count as one data point, not two. Real corroboration requires independent derivation.
4. **Coverage gap**: before declaring the research done, name what you did NOT find and
   whether the gap is likely due to absence of evidence or absence of search.

## Conflicting sources

When credible sources conflict:
- Quote both sides when source-use limits allow; otherwise summarize with pointers to the
  passages. Do not blow a citation or excerpt budget to satisfy a quotation quota.
- State the nature of the conflict: methodological, definitional, temporal, or
  interpretive — the category predicts how to resolve it.
- Do not resolve a conflict you can't resolve with evidence: report it as open and let
  the user decide, or flag it explicitly in the final answer.

## Research verification ladder (before declaring done)

1. **Provenance check**: every load-bearing fact has a source opened this session.
2. **Verbatim extractable or clearly labeled inference**: the claim traces to a specific
   passage, number, or statement, or is labeled as inference from those passages.
3. **Cross-check**: each critical claim is corroborated by at least one independent
   source, OR labeled as single-source.
4. **Conflicts surfaced**: any inter-source conflict is named and either quoted within
   source-use limits or summarized with pointers, not averaged away.
5. **Coverage labeled**: what was searched and what was not is stated; confidence in
   completeness is explicit ("comprehensive for the stated scope" vs.
   "preliminary — deeper search may change conclusions").

## Done-criteria for research tasks

Done-criteria must be checkable, not vibes:
- "Every claim in sections 2–4 is traceable to a source in the references list" — checkable.
- "The research is thorough" — not checkable.
- "No credible source contradicting the main conclusion was found, or the contradiction
  is documented in section 5" — checkable.
