# fable-skill architecture and portability review

## Executive assessment

Version 2.1 had a sound core idea, but its reliability was limited by unsafe update semantics, stale host assumptions, conflicting workflow vocabularies, non-portable packaging, and incomplete activation metadata. Version 2.2 addressed the release-blocking issues and added tested native adapters for the requested hosts. This revision implements the four follow-up items that were previously left open: a declarative target manifest consumed by both the CLI and the tests, a consolidated reference set with duplicated policy removed, a deterministic activation eval, and CI coverage across the package, the official validator, and vendor-CLI presence.

The remaining bottleneck is instruction and documentation scale. The compact export is about 1.2k tokens by the repository's stated estimate, while the full merged export is about 18k tokens after consolidation (down from roughly 22k). Native skill hosts avoid paying that cost on every prompt through progressive disclosure, but rules-only hosts should continue using the compact edition.

## Compatibility status

| Host or model path | Status | Verified installation/configuration |
|---|---|---|
| Hermes Agent | Verified at package level | `$HERMES_HOME/skills/fable-skill` globally; `.hermes/skills/fable-skill` per project |
| Claude Code | Verified at package level | `~/.claude/skills/fable-skill` globally; `.claude/skills/fable-skill` per project |
| OpenAI Codex | Verified at package level | `~/.agents/skills/fable-skill` globally; `.agents/skills/fable-skill` per project |
| Gemini CLI | Verified at package level | `~/.gemini/skills/fable-skill` globally; `.gemini/skills/fable-skill` per project |
| Google Antigravity 2.0 / IDE | Verified at package level | `~/.gemini/config/skills/fable-skill` globally; `.agents/skills/fable-skill` per project |
| Google Antigravity CLI | Verified at package level | `~/.gemini/antigravity-cli/skills/fable-skill` globally; `.agents/skills/fable-skill` per project |
| OpenClaw | Verified at package level | `$OPENCLAW_STATE_DIR/skills/fable-skill` globally; configured workspace `skills/fable-skill` locally |
| Other models and chat surfaces | Verified export path | `fable-skill prompt` writes or streams a plain system prompt; model selection remains a host concern |

“Verified at package level” means the destinations match current first-party documentation and isolated installer tests produce a valid skill bundle there. It does not claim that every vendor binary was available and launched end to end in this environment.

## Bottlenecks and changes

### 1. Unsafe and non-convergent updates: P1, fixed

Previously, folder installs overwrote current package files without ownership tracking. A retired reference could remain forever, while replacing the whole directory would delete user additions.

Version 2.2 writes an ownership manifest, removes only retired package-owned files, preserves unknown user files, rejects locally modified managed files, and keeps a complete backup during the one-time migration from pre-manifest installs. Folder replacement and shared-file replacement use staged sibling paths (`bin/cli.js:115-319`). Balanced managed markers are validated before shared files change (`bin/cli.js:322-346`).

Regression coverage verifies retired-file deletion, user-file preservation, modified-file refusal, reversible legacy backup, malformed-marker refusal, and no-side-effect argument failures (`test/run.js:263-329`).

### 2. Gemini and Antigravity were conflated: P1, fixed

The old `gemini` target installed an always-on `GEMINI.md` block and treated Gemini CLI and Antigravity as one host. Both products now support native progressive-disclosure skills, and their global directories differ.

The target registry now provides separate `gemini`, `antigravity`, and `antigravity-cli` folder adapters. `gemini-context` remains an explicit legacy option and is excluded from `all` (`bin/cli.js:398-424`). Native Gemini installation occurs before legacy-block cleanup, so a damaged package cannot erase the working old configuration (`bin/cli.js:539-558`).

### 3. Package was not a portable Agent Skills directory: P1, fixed

The canonical directory was named `skill` while frontmatter declared `name: fable-skill`. The official validator requires these names to match.

The distributable directory is now `fable-skill/`, frontmatter uses Agent Skills standard fields, and metadata values are strings. The official `skills-ref` validator accepts the actual distributed directory. Tests enforce the name-directory invariant (`test/run.js:225-226`).

### 4. Weak automatic activation: P1, fixed

The old description mentioned only debugging, migration, refactoring, and verification, even though the skill defines eight workflows. Skill-native hosts initially see only the name and description.

The 55-character description now includes all eight workflow triggers (`fable-skill/SKILL.md:2-3`), and tests enforce both the host budget and trigger coverage (`test/run.js:219-222`).

### 5. Conflicting routing taxonomies: P1, fixed

The repository mixed Build/Debug/Research/Write/Review/Plan/Analyze/Operate with CODE/SEARCH/REPORT/SCIENCE/ORCHESTRATION. This forced smaller models and delegated agents to infer undocumented mappings.

Tier and workflow are now the two canonical axes. Science and orchestration are modifiers rather than competing taxonomies. The core router is at `fable-skill/SKILL.md:18-44`; the supporting planning, communication, verification, and orchestration modules use the same vocabulary.

### 6. Duplicate state stores and host-specific tool names: P2, fixed

The previous core could require a plan file and `STATE.md`, then tell Hermes to prefer its task tool. It also named Hermes-only tools in the portable instructions.

The skill now selects one authoritative state store based on host capabilities and keeps host-specific names out of the portable core (`fable-skill/SKILL.md:85-94,138-139`).

### 7. Full-prompt context cost: P1, mitigated

The documented full export was originally roughly 7k tokens, but measured output was 86,524 characters, approximately 21.6k tokens using the repository's own four-characters-per-token estimate. The documentation was corrected to about 22k, then the three most duplicative reference modules (`research.md`, `analysis.md`, `writing.md`) were merged into `workflows.md` with their unique rules preserved and their restated ladders/done-criteria (already canonical in `verification.md` and `planning.md`) dropped. The merged full export is now measured at about 18k tokens (`bin/cli.js:93`, `README.md:127`).

Remaining follow-up: add model-specific tokenizer measurements in CI (the 4-chars-per-token estimate is a heuristic, not a real tokenizer count) and set an explicit CI size ceiling that fails if the full export grows past a stated budget.

### 8. Installer and documentation target duplication: P2, fixed

Target paths were hand-maintained in `bin/cli.js` and repeated in README tables with no automated check that they stayed in sync. `bin/cli.js`'s `TARGETS` object was already the single source of truth for install behavior; what was missing was a drift check tying README prose to it. `test/run.js` now asserts every `TARGETS` key has a corresponding command documented in `README.md` (`test/run.js:323-330`), so adding a target without updating the README fails CI instead of silently drifting.

### 9. Behavioral skill evaluation: P2, partially addressed

Structural tests prove installation, metadata, update safety, and package contents; they did not prove the router's vocabulary actually discriminates between workflows for a representative prompt set. `test/activation-eval.js` now runs a deterministic, offline keyword classifier (vocabulary drawn from `workflows.md`'s router table, not tuned to the fixtures) against 16 fixtures — two per workflow — and fails CI below 75% accuracy (`test/activation-eval.json`, `npm run eval`).

This is a vocabulary-separation regression gate, not a behavioral model eval: it does not launch a real LLM inside a real harness and check whether the skill actually activates and is followed. Running the same fixtures against a frontier, a mid-tier, and a local model inside their native harnesses remains open follow-up work requiring credentials and is intentionally kept out of the default `npm test` gate.

### 10. No CI, no vendor-host presence signal: P2, fixed

Verification previously ran only on a developer machine. `.github/workflows/ci.yml` now runs the source test suite and the activation eval across Node 16/18/20/22, packs and installs the tarball and runs the CLI from it, runs the official `skills-ref` validator against the shipped `fable-skill/` directory, and runs a non-blocking vendor-CLI presence smoke check (`scripts/host-smoke.js`, `npm run smoke:hosts`) that reports whether Claude Code, Codex, and Gemini CLI are installed and respond offline — without claiming that implies in-harness skill discovery, which needs authenticated credentials this environment does not have.

## Verification completed (this revision, 2.2.0 final)

- `npm test`: passed, including the new README/target-registry drift check.
- `npm run eval`: 16/16 activation-eval fixtures passed (100%, threshold 75%).
- `npx --yes -p node@16 node test/run.js`: passed, confirming the Node 16 floor still holds after consolidation.
- `uvx --from skills-ref agentskills.exe validate fable-skill`: `Valid skill: fable-skill`.
- `node scripts/host-smoke.js`: Claude Code, Codex, and Gemini CLI binaries detected and responded to `--version` in this environment (informational only, not a harness-level skill-discovery proof).
- `node --check bin/cli.js`, `node --check test/run.js`, `node --check test/activation-eval.js`: passed.
- `npm pack --dry-run --json`: package contains the correctly named bundle plus the new `scripts/` and `.github/` dev-only files excluded from the published tarball via `package.json#files`.
- Packed-tarball smoke test: installed CLI executed `fable-skill list` successfully.
- `git diff --check`: passed, aside from a Git line-ending normalization warning on pre-existing Markdown files.

## Evidence sources

- Agent Skills specification: https://agentskills.io/specification
- Claude Code skills: https://code.claude.com/docs/en/skills
- OpenAI Codex skills: https://developers.openai.com/codex/build-skills
- Gemini CLI skills: https://geminicli.com/docs/cli/skills/
- Google Antigravity skills: https://antigravity.google/docs/skills/
- OpenClaw skills: https://docs.openclaw.ai/skills
- Hermes Agent skills: https://hermes-agent.nousresearch.com/docs/user-guide/features/skills
