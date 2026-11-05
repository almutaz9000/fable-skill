# Changelog

All notable changes to fable-skill are documented here. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions match `package.json`.

This file starts at 2.2.0. Earlier versions are reconstructed from commit history for
reference, not from original release notes (none were kept before this file existed).

## [Unreleased]

### Added
- CI regression guard that keeps the full merged skill prompt at or below 20k estimated
  tokens (using the repository's documented four-characters-per-token heuristic).

## [2.3.0] - 2026-11-05

### Added
- **Monitor** — a 9th deliverable workflow for recurring checks and ongoing watches (CI
  babysitting, polling a deploy, checking in on a schedule), distinct from the one-shot
  Operate workflow. Covers: defining a stop condition before the first tick, preferring the
  host's scheduler/trigger over a busy-wait, matching cadence to what's actually being
  awaited, and classifying each tick as noop vs. non-noop so recurring runs stay legible
  instead of spamming the user. Added to `SKILL.md`, `COMPACT.md`, `references/workflows.md`
  (router row + full section), `references/planning.md` (plan template),
  `references/communication.md` (reporting rule + output format), `references/verification.md`
  (evidence rule — "nothing changed" is still a checked claim), and `references/execution.md`
  (scheduler-over-busy-wait for session-spanning waits).
- An explicit **Iterate** step in `SKILL.md`'s Fast-start, naming the loop-back to Plan/Act on
  an unmet done-criterion — the cycle was already named "the Loop" in `workflows.md` but the
  core Fast-start skipped straight from Verify to nothing.
- Two Monitor fixtures in `test/activation-eval.json` / `test/activation-eval.js` (18/18 passing).

### Changed
- Full merged single-file export re-measured at ~19k estimated tokens (was ~18k) after the
  Monitor additions; `README.md`, `bin/cli.js`, and `test/run.js`'s size check updated to match.

## [2.2.0] - 2026-10-08

### Added
- Native adapters for Google Antigravity 2.0/IDE and Google Antigravity CLI as distinct
  targets (previously conflated with Gemini CLI).
- Ownership-manifest-based folder updates: safe, convergent reinstalls that preserve
  user-added files, refuse to overwrite locally modified managed files, and keep a
  reversible backup when migrating a pre-2.2 install.
- `npm run eval` — a deterministic, offline activation eval (`test/activation-eval.{js,json}`)
  that checks the router's workflow vocabulary stays distinguishing across 16 fixtures
  spanning all 8 workflows.
- `.github/workflows/ci.yml` — Node 16/18/20/22 test matrix, packed-tarball install smoke
  test, official Agent Skills (`skills-ref`) validator, and a non-blocking vendor-CLI
  presence check.
- `scripts/host-smoke.js` (`npm run smoke:hosts`) — informational, non-blocking check for
  whether Claude Code, Codex, and Gemini CLI binaries are installed locally.
- README/installer drift check in `test/run.js`: fails if any `TARGETS` key in `bin/cli.js`
  lacks a documented install command in `README.md`.
- `docs/ARCHITECTURE_REVIEW.md` — full bottleneck-by-bottleneck writeup with evidence
  sources and verification log.
- CI badge and a Contributing-section pointer to `npm test` / `npm run eval` / CI.

### Changed
- Renamed the canonical distributable bundle from `skill/` to `fable-skill/` so the
  directory name matches the Agent Skills spec's frontmatter `name` field; the package now
  passes the official `skills-ref` validator against the exact shipped directory.
- Unified the workflow vocabulary on Build/Debug/Research/Write/Review/Plan/Analyze/Operate
  everywhere (SKILL.md, every reference module, README, installer), replacing an older
  competing CODE/SEARCH/REPORT/SCIENCE taxonomy.
- Tightened the skill's activation `description` to name all 8 workflows within the
  60-character budget hosts use for auto-activation.
- Merged `references/research.md`, `references/analysis.md`, and `references/writing.md`
  into `references/workflows.md`, keeping their unique rubrics (source evaluation table,
  conflict-type classification, data-integrity checklist, tone-calibration table,
  science-paper table) and dropping ladders/done-criteria already canonical in
  `verification.md`/`planning.md`. Reference module count: 11 → 8.
- Full merged single-file export measured at ~18k estimated tokens, down from ~22k.

### Fixed
- Gemini CLI and Google Antigravity were previously treated as one host; they now have
  separate adapters with correct, independently verified global install paths.

## [2.1.0] - prior to CHANGELOG

- Fixed the Windows Hermes global install path.
- Enforced the 60-character activation-description budget.
- De-duplicated repeated content in `SKILL.md`.

## [2.0.0] - "Fable5"

- Introduced multi-domain discipline with parallel multi-agent orchestration
  (`references/orchestration.md`).
- Added the `research.md`, `analysis.md`, and `writing.md` reference modules (later merged
  back into `workflows.md` in 2.2.0).

## [1.7.0]

- "Questions get answers, not changes" rule: a question is not an implicit change request.
- Added honest capability-limit guidance to the README.

## [1.6.0]

- Model-agnostic capability fallbacks (no parallel tool calls / no subagents / no question
  UI) and a universal system-prompt export (`npx fable-skill prompt`).
- Added the Crush (Charm) installer target.

## [1.5.0]

- Workflow routing by deliverable (the original Build/Debug/Research/Write/Review/Plan/
  Analyze/Operate router).
- Batched user-approval checkpoints (plan + all open questions in one message).

## [1.4.0]

- Risk-gated tier calibration (LIGHT/STANDARD/FULL) and conditional verification.
- Memoized the installer's content builders.

## [1.3.0]

- Upgraded the OpenAI Codex target to native skills.

## [1.2.0]

- Fixed managed-block update idempotency.
- Added the compact edition and the first test suite.

## [1.1.0]

- Added 14 more agent/installer targets.

## [1.0.0]

- Initial release.
