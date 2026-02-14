# Codex Task 0037 — CORE Ruleset Migration: v1.0.26 → v1.1.0 (Docs + Contracts Alignment)

Date: 2026-02-14
Style: Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)

Primary contract: AGENTS.md (repo root)

Key anchors (ASCII only to avoid encoding drift):
- Determinism: AGENTS 0.2
- Rules anchoring & no drift: AGENTS 0.1, 0.5, 0.6
- Canonical effect resolver: AGENTS 3.5
- Production order: AGENTS 3.6
- Start Committee immunity: AGENTS 3.7
- Tests + golden replays + hashing: AGENTS 5.1-5.3

## Goal
Make CORE-01 v1.1.0 the single canonical rules reference in repo docs/contracts, while keeping v1.0.26 as legacy reference.
Ensure all rule anchoring is ID-based and never heading-based.

## Inputs
- /docs/rules/000-core.md (CORE-01 v1.1.0)
- /docs/rules/legacy/000-core-v1.0.26.md
- /docs/rules/rules_migration_map.yaml (if present; otherwise create as described below)
- docs/architecture/ARCH-01-ENGINE-CONTRACT.md
- docs/architecture/ARCH-02-STATE-SHAPE.md
- docs/architecture/ARCH-03-MEASURE-CPU.md
- docs/architecture/ARCH-04-LLM-BOT-CONTRACT.md

## Outputs
1) Update AGENTS.md:
   - Replace any "requires CORE-01 v1.0.xx" mentions with "requires CORE-01 v1.1.0".
   - Add explicit note:
     - Rule IDs are canonical anchors.
     - Headings are not anchors.
     - Code/tests MUST cite rule IDs when referencing spec behavior.

2) Add docs/rules/README.md:
   - Canonical vs legacy rules
   - How rule IDs are used in code comments/tests
   - "No drift" policy: code references IDs only
   - How to update rules safely (never renumber IDs)

3) Ensure legacy placement:
   - Put v1.0.26 under docs/rules/legacy/
   - Ensure canonical file remains /docs/rules/000-core.md

4) Add or update docs/rules/rules_migration_map.yaml:
   - Map: old_version -> new_version
   - Optional: list of renamed/merged sections as non-normative commentary
   - IMPORTANT: Do not invent semantics; only document mapping.

5) Update docs/PR_TASK_LIST.md:
   - Add Task 0037 entry and status placeholder

6) Update CHANGELOG.md:
   - Under "Unreleased": mention ruleset/docs migrated to CORE-01 v1.1.0 as canonical
   - Mention that legacy v1.0.26 remains available for audit/comparison

## Constraints
- No semantics changes. This task is docs/contracts migration only.
- Keep any "Key anchors" blocks ASCII-only (avoid encoding drift).
- Do not touch engine logic except where strictly needed to update version labels in comments/metadata.

## Invariants
- Engine is authoritative; client does not decide legality/costs/majority.
- State remains zone-based and JSON-serializable.

## Acceptance
- pnpm -r test passes.
- AGENTS.md and docs clearly declare CORE-01 v1.1.0 as canonical.
- No remaining doc references claiming CORE requires v1.0.xx unless explicitly justified.

## PR Checklist
- [ ] Updated AGENTS.md
- [ ] Added docs/rules/README.md
- [ ] Ensured docs/rules/legacy/ contains v1.0.26
- [ ] Added/updated rules_migration_map.yaml
- [ ] Updated docs/PR_TASK_LIST.md
- [ ] Updated CHANGELOG.md
- [ ] CI green
