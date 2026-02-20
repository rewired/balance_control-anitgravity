# S01 — Repo Scan & Ground Truth

## Purpose
Create an objective, reproducible view of “what depends on what” before refactors.

## Use when
- Starting a split / extraction (CORE, packs, expansions).
- Unsure where a symbol is referenced.
- A task says “do not miss any hidden coupling”.

## Inputs
- Workspace root.
- Target package(s) and symbols.

## Output
- A short report (Markdown) with:
  - Dependency graph summary (packages + key files)
  - Hotspots (circular deps, cross-package imports)
  - “Do-not-touch” areas for this task (scope guard)

## Steps
1. **TypeScript graph**
   - Run `pnpm -w -r exec -- tsc -b --verbose` (or `pnpm -w test` if CI is fast) to ensure the baseline is green.
2. **Ripgrep pass**
   - `rg -n "SYMBOL|path/to/file|@balance-control/" packages docs`
   - Capture the top 20 matches that show real coupling.
3. **Export surface pass**
   - Open each involved `package.json` + `src/index.ts` and list:
     - exported entrypoints
     - who imports them
4. **Write the report**
   - Keep it factual: file paths + 1-line reasons.

## Guardrails
- Do not refactor while scanning.
- Do not “guess” dependencies. If you can’t prove it from the repo, label it “unknown”.

## Template (paste into your task notes)
- Baseline: ✅ build/tests green (command + short output)
- Key imports:
  - fileA.ts imports packageB (reason)
  - fileC.ts imports fileD (reason)
- Risk list:
  - circular: ...
  - hidden integration tests: ...
