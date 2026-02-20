# Task 0001 - Repo UTF-8 Baseline + EditorConfig

## Goal
Make the repo encoding-robust from day 1:
- enforce UTF-8 (no BOM), LF, final newline, consistent indenting
- add a lightweight encoding check so CI fails early instead of corrupting files later

## Inputs
- current repo state
- prior incident: UTF-8 drift / broken encodings

## Outputs
- /.editorconfig (root=true, charset=utf-8, end_of_line=lf, etc.)
- /.gitattributes (enforce text=auto, eol=lf for relevant files)
- /scripts/check-encoding.mjs (fails on BOM, UTF-16/32, CRLF in tracked text files)
- package.json scripts:
  - "check:encoding": node scripts/check-encoding.mjs
- /docs/PR_TASK_LIST.md (created if missing, with tasks 0001-0010 as checkboxes)
- /CHANGELOG.md (created if missing, with "Unreleased" section)

## Constraints
- UTF-8 everywhere. No utf-8-bom, no UTF-16, no weird editor artifacts.
- Use ASCII-only for task docs if feasible (avoid typographic dashes/quotes).
- Minimal diffs outside of the new config + script.

## Invariants
- No gameplay logic changes.
- No rule changes. Core freeze.

## Acceptance
- "pnpm -r test" may still fail, but:
  - repo can run: "pnpm check:encoding"
  - check:encoding fails if any file has BOM or non-UTF8 encoding
  - LF enforced for *.ts, *.tsx, *.md, *.json, *.yml, *.yaml
- .editorconfig exists and applies to all text files

## PR Checklist (fill at end)
- [x] Added .editorconfig + .gitattributes
- [x] Added scripts/check-encoding.mjs and wired to package scripts
- [x] Created/updated docs/PR_TASK_LIST.md
- [x] Created/updated CHANGELOG.md (Unreleased)
- [x] Ran: pnpm check:encoding
- [x] No unrelated formatting churn

## Changelog
Update /CHANGELOG.md under "Unreleased":
- Added repo-wide UTF-8/LF enforcement via EditorConfig and encoding checks.
