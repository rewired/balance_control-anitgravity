# Task 0011 - UTF-8 Cleanup: Remove UTF-16 Artifacts + Harden Encoding Guard

## Goal
Eliminate any non-UTF-8 files inside the repo (especially UTF-16/32 and BOM artifacts),
and prevent them from reappearing via generated test outputs.

## Inputs
- Task 0001 introduced encoding guard and .editorconfig
- Current repo contains at least one non-UTF-8 artifact:
  - packages/game/test_output_2.txt (UTF-16LE with BOM)

## Outputs
- Remove packages/game/test_output_2.txt from the repository (or convert to UTF-8 and ensure it is not generated again).
- Add/extend .gitignore to prevent accidental commit of generated test output artifacts:
  - packages/**/test_output*.txt
  - packages/**/tmp/**
  - (keep it minimal and targeted)
- If tests generate artifacts, redirect them to a temp directory ignored by git.
- Ensure scripts/check-encoding.mjs detects:
  - UTF-16/32 encodings
  - BOM presence (UTF-8 BOM and others)
  - CRLF in tracked text files
- Ensure pnpm check:encoding passes on a clean working tree.

## Constraints
- Do not change gameplay logic.
- Do not reformat unrelated files.
- Keep diffs minimal and focused.
- ASCII only in markdown files if feasible.

## Invariants
- Encoding policy remains: UTF-8 (no BOM), LF, final newline.

## Acceptance
- No tracked file in the repo is UTF-16/UTF-32.
- pnpm check:encoding succeeds.
- Running tests (if they create outputs) does not create new tracked artifacts.
- docs/PR_TASK_LIST.md: Task 0011 is checked.
- CHANGELOG.md updated under Unreleased.

## PR Checklist (fill at end)
- [ ] Removed or converted UTF-16 artifacts (test_output_2.txt)
- [ ] Added minimal .gitignore rules for generated test outputs
- [ ] pnpm check:encoding passes
- [ ] Updated CHANGELOG.md (Unreleased)
- [ ] Updated docs/PR_TASK_LIST.md (checked Task 0011)
- [ ] No unrelated formatting churn

## Changelog
Update /CHANGELOG.md under "Unreleased":
- Fixed encoding drift by removing non-UTF-8 artifacts and hardening guardrails.
