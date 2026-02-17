# Codex Task 0091 - FIX: Unblock client-web build (strict TypeScript) + implement fixes

**Date:** 2026-02-17
**Primary contract:** `AGENTS.md` (repo root)

## 0) Metadata (frozen)

* **Task ID:** 0091
* **Area:** `packages/client-web` build + strict TS typing + UI wiring
* **Prereq:** Tasks 0086–0089 completed; `pnpm -r test` passes
* **Risk:** Low-medium (UI-only code + typings; must not change game rules)

## 1) Context (frozen)

After switching client-web to use the canonical `@balance-control/game` entrypoints, `pnpm -C packages/client-web build` fails with strict TypeScript errors:

* Nullability guard missing in `ActionPanel` (`vm.political.placeInfluenceForSelected` possibly `null`)
* Resort key typing mismatch in `HexBoard` and `HexTilePackedSimulator` (`string | undefined` vs `ResortKey`)
* Stale/incorrect import from `@balance-control/game` in `src/game.ts`
* `data-component` not allowed by `svgProps` typing in `HexTileVisual` / `HexTileFrame`

These are **client-only** issues and must be fixed without changing engine authority.

## 2) Goal (frozen)

* Make `pnpm -C packages/client-web build` succeed under strict TypeScript.
* Keep runtime behavior unchanged except for:

  * preventing invalid UI actions (already implied by strict nullability)
  * fixing incorrect imports/wiring to the canonical API
  * allowing safe `data-*` attributes in SVG props typing

## 3) Non-goals (frozen)

* Do not change authoritative game rules, costs, legality computation, resolver logic, or move semantics.
* Do not relax TypeScript settings (no tsconfig weakening to “make it pass”).
* Do not introduce `any` or broad type assertions to silence errors.
* Do not compute legality/costs in the client.

## 4) Inputs (frozen)

* Build error output from: `pnpm -C packages/client-web build`
* Affected files (at minimum):

  * `packages/client-web/src/components/ActionPanel.tsx`
  * `packages/client-web/src/components/HexBoard.tsx`
  * `packages/client-web/src/dev/HexTilePackedSimulator.tsx`
  * `packages/client-web/src/game.ts`
  * `packages/client-web/src/ui/tiles/HexTileVisual.tsx` (and the `HexTileFrame` typing it uses)

## 5) Outputs (frozen)

### A) Code changes (required)

#### A1) Fix nullability in ActionPanel (no semantic change)

* [ ] Update `ActionPanel.tsx` to handle `vm.political.placeInfluenceForSelected` being `null`/absent:

  * The relevant UI control must be disabled when no intent exists.
  * `onClick` must not dereference a possibly-null intent.
  * Use explicit narrowing (assign to a local const and branch), not a blind non-null assertion.

#### A2) Align resort typing (no `as ResortKey`, no `any`)

* [ ] Fix `HexBoard.tsx` resort typing mismatch.
* [ ] Fix `HexTilePackedSimulator.tsx` resort typing mismatch.
* Allowed approaches (pick one; must remain strict):

  1. **Type guard** based on an existing typed mapping (preferred):

     * If there is a `Record<ResortKey, …>` mapping (icons/meta), narrow with:

       * `if (resort && resort in RESORT_MAP) { ... }`
       * Ensure TypeScript narrows to `keyof typeof RESORT_MAP` (i.e., `ResortKey`) without an assertion.
  2. **Component API relaxation** (acceptable):

     * Make the rendering component that receives the resort accept `ResortKey | undefined | null`.
     * Render nothing / placeholder when absent.
* Prohibited: `resort as ResortKey`, `as any`, or widening `ResortKey` to `string`.

#### A3) Fix stale import / wiring in `src/game.ts`

* [ ] Update `packages/client-web/src/game.ts` to import from the current **public** `@balance-control/game` API only.
* [ ] Ensure the file uses the canonical entrypoint established by 0087/0088 (factory-based game construction if that is now the public pattern).
* Prohibited:

  * importing from internal/unstable deep paths
  * reintroducing duplicate game definitions in client-web
* **Conditional guard** (only if it appears in build output): if the build error mentions Node builtins (e.g., `node:crypto`), remove those imports from the client dependency graph by:

  * stopping re-exports of devtools-only modules into client imports, or
  * moving the import to a test-only location,
  * without changing engine logic.

#### A4) Allow `data-*` attributes in SVG props typing (no `any`)

* [ ] In the typing used by `HexTileFrame` / `HexTileVisual`, allow `data-*` attributes in `svgProps`.
* Must be strict, e.g.:

  * add a `DataAttrs` type like `{ [K in \`data-${string}`]?: string | number | boolean | undefined }`
  * and combine it with `React.SVGProps<...>` without using `any`.

### B) Verification (required)

* [ ] `pnpm -C packages/client-web build` succeeds.
* [ ] `pnpm -r test` succeeds (sanity regression check).
* [ ] No tsconfig strictness reductions were made.

### C) Documentation (conditional)

* [ ] If required by repo contract: add a short entry under **Unreleased** in `docs/changelog.md` noting “Fix client-web build under strict TypeScript” (UI typing/wiring only).

## 6) Constraints (frozen)

* **Do not** change engine gameplay behavior (rules, costs, legality).
* **Do not** relax TS settings or add broad suppressions.
* Keep changes localized to client-web and import wiring.
* No new dependencies unless absolutely necessary (this task should not need any).
* Avoid line churn; keep diffs reviewable.

## 7) Guardrails + Spec anchors (frozen)

### affected_guardrails

* GR-002 (Engine-only Rule Execution)
* GR-014 (UI Iconography Stability)

### spec_anchor_refs

* `docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json` (GR-002, GR-014)
* `docs/architecture/ARCH-01-ENGINE-CONTRACT.md` (client restrictions / engine authority)

## 8) Acceptance Criteria (frozen)

* [ ] `pnpm -C packages/client-web build` passes with strict TS.
* [ ] `pnpm -r test` passes.
* [ ] No tsconfig weakening, no `any`, no blind `as ResortKey` assertions.
* [ ] UI behavior unchanged except that invalid interactions are prevented by null-guarding.

## 9) PR Checklist (frozen)

* [ ] `pnpm -C packages/client-web build` passes
* [ ] `pnpm -r test` passes
* [ ] (If present) `pnpm lint` passes
* [ ] No engine/rules changes (UI-only)
* [ ] No tsconfig relaxations / no `any` / no unsafe assertions
* [ ] No temporary files committed
* [ ] `affected_guardrails` and `spec_anchor_refs` present
* [ ] `docs/changelog.md` updated under Unreleased if required by contract

## 15) Execution Log (append-only)

### Work Summary

*

### Commands Run

*

### Postflight Proof

* `pnpm -C packages/client-web build`:
* `pnpm -r test`:

---
