# ARCH-06 — UI INTERACTION CONTRACT
Version: 1.1
Status: Normative
Scope: Presentation Layer (Client)

Canonical machine-readable contract:
- `docs/architecture/ARCH-06-UI-INTERACTION-CONTRACT.v1.yaml`

UI Interaction Checklist (PR Gate):
- `docs/architecture/ARCH-06-UI-INTERACTION-CHECKLIST.md`

## 1. PURPOSE
Keep the UI presentation-only and bot-safe:
- UI must interact with the engine exclusively through `LegalIntent` objects.
- UI must enforce a consistent interaction pattern:
  action selection -> guided parameter selection -> preview -> explicit confirm -> commit.

## 2. INTERACTION SURFACES

### 2.1 BoardSurface
Responsibilities:
- Render tiles/tokens.
- Allow inspection selection (read-only).
- Guided parameter selection using engine-provided legal intents (valid targets only).
- Minimal preview overlay when a draft intent is ready.

Forbidden:
- Any move commit (except `pendingChoice.kind=selectTile` resolveChoice policy).
- Computing legality, costs, or majority.

### 2.2 ActionDock
Responsibilities:
- Action selection as a group list (only action types, not flattened intents).
- Guided step display (e.g. select source / destination / tile / variant).
- Show pinned parameters (e.g., pinned source).
- Show draft summary + consequences.
- Confirm/Cancel and Edit actions (dock-only).

Forbidden:
- Any direct engine commit path (no `dispatchIntent(...)` from components).
- Starting a new action while `draftReady` is active (no mixed sessions).

### 2.3 ModalHost
Responsibilities:
- PendingChoice resolution UI.
- Optional wizards/variant pickers (presentation-only; confirmation remains in the dock).

Rules:
- If `pendingChoice.kind !== selectTile`, ModalHost may be blocking (misclick-safe confirm).
- If `pendingChoice.kind === selectTile`, ModalHost must not block board-driven selection (may show a non-blocking hint or render nothing).

Forbidden:
- Normal draft confirmation modals (no `MoveConfirmationModal` for non-pendingChoice drafts).

### 2.4 Inspector
Responsibilities:
- Read-only details of the current selection.
- Additional read-only action status block:
  active action, current step, pinned params (e.g. pinned source).

## 3. COMMAND PATH
The ONLY allowed command path is:
1. `enumerateLegalIntents(...)` produces `LegalIntent[]`.
2. UI presents action types derived from these intents.
3. User interaction selects exactly one `LegalIntent` (draft).
4. UI shows minimal board preview + detailed dock summary.
5. User confirms explicitly in the dock.
6. `dispatchIntent(moves, intent)` invokes exactly one engine move.

No ad-hoc move construction is permitted in the client.

## 4. INTERACTION MODEL (NORMATIVE)
- Drafts are created only by selecting an engine-provided `LegalIntent`.
- No auto-commit is allowed for normal moves.
- Draft parameter changes are dock-only (Edit source/destination/variant).
- During `draftReady`, board clicks are inspect-only and must not change the draft.

Under-variants:
- Formalize/Convert under-variants are shown only after a valid tile was selected.

## 5. PENDING CHOICE (HARD GATE)
If `G.engine.pendingChoice` exists:
- UI enters Hard-Gate mode.
- Only `resolveChoice` is allowed (plus pan/zoom).
- Inspection clicks are disabled.

Policy:
- `kind === selectTile`: board-driven selection; clicking a valid choice target commits `resolveChoice` directly.
- otherwise: modal-driven; resolveChoice requires modal confirmation (misclick-safe).

Postcondition:
- After a successful `resolveChoice` dispatch, `G.engine.pendingChoice` MUST be `null`/`undefined` in the next state.

## 6. I18N (MINIMUM)
- Default locale: `en`
- Supported locales: `en`, `de`
- Required keys and default strings are defined in the YAML contract.
- Expansions may provide additional namespace-prefixed resources via package exports.

## 7. EXPANSION UI CONTRIBUTIONS
Expansions may contribute (via package exports only):
- Action groups/labels
- Variant selector UI (presentation-only)
- I18N resources (namespace-prefixed, deterministic merge)
- Read-only inspector panels

Forbidden:
- Client-side legality/cost computation
- Any direct engine commit path from UI components
