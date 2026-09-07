# Evaluation harness (preparation only)

This directory prepares outcome-and-cost comparisons. It does **not** run paid
model calls. A working runner without measured runs is not evidence of improved
performance.

Authorized in the current change: tooling, cases, graders, and run schema.
Not authorized: the illustrative 216-run matrix or any paid comparison.

## Arms

Compare three arms in clean sessions with equivalent repository snapshots,
tools, permissions, and host instructions:

| Arm | Meaning |
|---|---|
| `no-fable` | Host instructions only. Globally installed Fable must not leak in. |
| `current-fable` | Snapshot of commit `9d91b11` (frozen at `C:/Users/Mohammedal/AppData/Local/Temp/fable-skill-baseline-9d91b11` on the authoring machine, or a git worktree of that commit). |
| `candidate-fable` | This working tree. |

## Run record schema

Each run writes one JSON object:

```json
{
  "run_id": "string",
  "case_id": "string",
  "arm": "no-fable | current-fable | candidate-fable",
  "skill_revision": "git sha or 'none'",
  "model_id": "provider/model",
  "host": "name",
  "host_version": "string or untested",
  "settings": {},
  "tools": [],
  "started_at": "ISO-8601",
  "ended_at": "ISO-8601",
  "usage": {
    "input_tokens": null,
    "cached_input_tokens": null,
    "output_tokens": null,
    "tool_calls": null,
    "elapsed_ms": null,
    "usd": null
  },
  "output_path": "evals/runs/<run_id>/",
  "outcome": "accepted | rejected | incomplete | infrastructure_failure",
  "grader_results": [],
  "notes": "Performance unmeasured until authorized execution."
}
```

Never invent dollar costs. If the host does not expose usage, leave fields null.

## Graders

Deterministic graders live in `evals/graders.js`. They grade files and
invariants, not style. Known-pass and known-fail fixtures in
`evals/fixtures/` must keep passing.

Primary metric after authorized execution:

`cost per accepted completion = total cost of all attempts / accepted completions`

Failed attempts stay in the numerator. If none succeed, the measure is
undefined, not zero.

## Commands

```bash
node evals/run.js --list
node evals/run.js --grade-fixtures
node evals/run.js --sizes
```

`--execute` is refused unless `FABLE_EVAL_EXECUTE=1` and a spending limit is
set. That path is intentionally unimplemented in this preparation change.
