# Task 0125 - Web Client Interaction Improvements

## Goal
Improve the user interaction for "Move Influence" in the web client to handle the combinatorial explosion of possible moves and prevent confusion regarding "Pass" actions. The UI should guide the user through a Source -> Target -> Confirm flow instead of listing all permutations.

## Inputs
- User feedback: "Move Influence" list is unusable; "Pass" is confusing/illegal.
- Requirement: Source selection -> Target selection -> Server query (Intent lookup) -> Confirmation.
- Constraint: `GR-002` (Client computes nothing). The client must rely on `enumerateLegalIntents` from the engine.

## Outputs
1.  **Engine (`packages/game`)**:
    *   Enhance `LegalIntent` to optionally include `consequences` or `description` (e.g., "Ping Pong Penalty", "Resolves Hotspot").
    *   Ensure `enumerateMoveInfluence` populates this information.

2.  **Client (`packages/client-web`)**:
    *   Refactor `useIntentViewModel` to:
        *   Group `moveInfluence` intents by source.
        *   Filter `moveInfluence` out of the generic "More actions" list.
    *   Update `HexBoard` / `Board` interaction:
        *   **State**: Track `selectedSourceId`.
        *   **Interaction**:
            *   Click Own Influence (Source) -> Highlight valid Targets (based on intents).
            *   Click Target -> Show "Confirm Move" modal/panel with details.
    *   **ActionPanel**:
        *   Remove raw `moveInfluence` buttons.
        *   Ensure "Pass" (or similar) is NOT shown in `politicalAction` phase.

## Invariants
- **No Rule Drift**: The set of legal moves remains exactly as defined by the engine.
- **Client Dummy**: The client only displays what the engine returns.
- **Determinism**: No changes to game logic determinism.

## PR Checklist
- [x] Engine: `LegalIntent` type updated.
- [x] Engine: `enumerateMoveInfluence` provides readable context/consequences.
- [x] Client: `useIntentViewModel` groups moves.
- [x] Client: `HexBoard` implements Source -> Target selection.
- [x] Client: "Confirm Move" UI implemented (ActionPanel or Modal).
- [x] Client: "Pass" button removed/verified absent in Political Action.
- [x] Tests: Verify `enumerateLegalIntents` output structure.
- [x] Tests: Verify Client interaction (Playwright or unit tests if possible).

## Work Summary
- Enhanced `LegalIntent` interface in `packages/game` to support `consequences` (e.g. PingPong penalty).
- Updated `enumerateMoveInfluence` to populate consequences and prevent illegal source==target moves.
- Refactored `useIntentViewModel` in `packages/client-web` to separate `moveInfluence` intents from the main list.
- Implemented `MoveConfirmationModal` to show move details and consequences before execution.
- Updated `GameLayout`, `BoardViewport`, and `HexBoard` to support the Source -> Target -> Confirm interaction flow.
- Verified that "Pass" / "Skip placement" is not shown in the Political Action phase.
