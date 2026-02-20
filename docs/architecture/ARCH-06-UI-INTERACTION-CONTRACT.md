# ARCH-06 — UI INTERACTION CONTRACT
Version: 1.0
Status: Normative
Scope: Presentation Layer (Client)

## 1. PURPOSE
Ensure the UI remains a presentation-only layer that interacts with the engine exclusively through `LegalIntent` objects.
Guarantee consistent interaction patterns (select -> review -> commit) and "bot-safe" execution paths.

## 2. INTERACTION SURFACES

### 2.1 BoardSurface
- Represents the spatial hex board.
- Responsibilities:
  - Rendering tiles and tokens.
  - Selecting tiles for inspection.
  - Proposing spatial intents (e.g., `placeTile`, `moveInfluence`).

### 2.2 ActionDock
- Represents the contextual control panel (bottom of screen).
- Responsibilities:
  - Displaying non-spatial intents (e.g., `formalizeInfluence`, `convertResources`).
  - Confirming proposed intents from the BoardSurface.
  - Displaying current turn/stage status.

### 2.3 ModalHost
- Represents the blocking interaction layer.
- Responsibilities:
  - Displaying `PendingChoiceModal` (mandatory resolution).
  - Displaying `MoveConfirmationModal` (high-risk move review).

### 2.4 Inspector
- Represents the detail panel for selected objects.
- Responsibilities:
  - Displaying attributes of the `selectedTileId`.
  - Non-interactive (read-only view of state).

## 3. COMMAND PATH
The ONLY allowed path for state-changing commands is:
1. `enumerateLegalIntents(...)` produces `LegalIntent[]`.
2. UI presents these intents on appropriate surfaces.
3. User interaction selects exactly one `LegalIntent`.
4. `dispatchIntent(moves, intent)` invokes the engine move.

No ad-hoc move construction is permitted in the client.

## 4. INTERACTION STATE MACHINE
The `InteractionController` manages the following transitions:
- `IDLE` -> `SELECT_TILE` -> `INSPECTING`
- `IDLE` -> `PROPOSE_INTENT` -> `CONFIRMING` -> `COMMITTING`
- `ANY` -> `PENDING_CHOICE` (forced by engine state)

## 5. RESTRICTIONS
- Client MUST NOT compute legality. Use `intent.moveType` visibility.
- Client MUST NOT compute costs. Display `intent.payload.extraResourceIds` as-is.
- Client MUST NOT compute majority. Use `selectTileController(tileId, G)`.
- If `G.engine.pendingChoice` exists, all surfaces EXCEPT `ModalHost` (ResolveChoice) MUST be non-interactive.
