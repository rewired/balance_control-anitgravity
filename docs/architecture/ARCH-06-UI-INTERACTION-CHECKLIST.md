# ARCH-06 — UI Interaction Checklist (PR Gate)
Status: Normative
Applies to: `packages/client-web`

This checklist is derived from:
- `docs/architecture/ARCH-06-UI-INTERACTION-CONTRACT.v1.yaml`

## 1) No Auto-Commit
- [ ] There is no UI path that calls `moves.*` directly from components.
- [ ] There is no UI path that calls `dispatchIntent(...)` directly from components.
- [ ] All normal moves require explicit confirm in ActionDock.
- [ ] Ghost tile placement does NOT commit immediately (draft -> confirm).
- [ ] Pass/Skip tile placement does NOT commit immediately (draft -> confirm).
- [ ] “Other/More actions” does NOT commit immediately (draft -> confirm).

## 2) Single Commit Path
- [ ] Normal commit occurs ONLY via `useGameInteractionController.confirmDraft()` (one move).
- [ ] PendingChoice commit occurs ONLY via `useGameInteractionController.resolveChoice(...)` (one move).
- [ ] No other code path can commit a move.

## 3) LegalIntents-Only
- [ ] UI uses `enumerateLegalIntents(...)` as the single source of truth for legality.
- [ ] UI never constructs a move payload ad-hoc (must select an existing `LegalIntent`).
- [ ] If a selected draft intent is no longer legal, Confirm is disabled and only Cancel is offered.

## 4) Draft/Preview/Confirm Semantics
- [ ] Draft parameters are editable ONLY via ActionDock (Edit source/destination/variant).
- [ ] While `draftReady` (preview active), board clicks are inspect-only and must not change draft params.
- [ ] Cancel resets the entire action session (active action, step, pinned params, variant, draft intent, preview overlay).
- [ ] Selection/Inspector state is preserved on Cancel.

## 5) Guided Parameter Selection
- [ ] In parameter selection steps, only valid targets can advance the flow.
- [ ] Clicking invalid tiles performs Inspect only (no parameter changes).
- [ ] Under-variants (Formalize/Convert variants) are shown ONLY after a valid tile was selected.
- [ ] Variant lists are deterministically ordered (stable grouping + canonical payload).

## 6) PendingChoice Hard-Gate
- [ ] When `pendingChoice` exists, normal action selection and drafting are disabled (Hard-Gate).
- [ ] During Hard-Gate, inspect clicks are disabled; pan/zoom remains allowed.
- [ ] If `pendingChoice.kind === selectTile`, selection is board-driven and NOT blocked by a modal overlay.
- [ ] If `pendingChoice.kind !== selectTile`, modal confirmation is misclick-safe and commits exactly one `resolveChoice`.

## 7) Surfaces Responsibilities
- [ ] BoardSurface: render + inspect + guided selection + minimal preview only (no commit).
- [ ] ActionDock: group list + current action panel + confirm/cancel + edit only (no commit calls).
- [ ] ModalHost: pendingChoice + optional wizards; no normal draft confirmation modal.
- [ ] Inspector: read-only; shows Active action / Step / Pinned params.

## 8) Determinism & Boundaries
- [ ] No changes break deterministic replays (no new RNG, no time-based logic).
- [ ] No cross-imports to source files outside package exports (client-web only uses package exports).
- [ ] Expansion UI contributions are consumed via package exports only (no deep imports).

## 9) I18N
- [ ] New UI strings use i18n keys (no hardcoded user-facing strings in components).
- [ ] Required keys exist in both `en` and `de`, with `en` as default and fallback.
- [ ] Expansion strings are namespace-prefixed and merged deterministically.

## 10) Visual/UX Minimums
- [ ] Valid targets are visually distinguished (highlight).
- [ ] Destination step uses a subtle player-color bloom (if applicable).
- [ ] Preview is minimal on the board; detailed consequences appear in the dock.
- [ ] While preview is active, the dock shows ONLY the Current Action Panel (no action group list).
