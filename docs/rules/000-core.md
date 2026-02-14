# BALANCE // CONTROL

# CORE-01 Simulation Specification (Atomic, Deterministic)

Version: 01
Scope: Core Rules v1.0.24 only with variants (no expansions)

---

# SECTION INDEX

CORE-01-00 State Model (Declarative)
CORE-01-01 Foundations
CORE-01-02 Components
CORE-01-03 Setup
CORE-01-04 Turn Structure
CORE-01-05 Control
CORE-01-06 Effects
CORE-01-07 Round Structure
CORE-01-08 Restrictions
CORE-01-09 End Game
CORE-01-10 Rule Hierarchy
VAR-01 Variants
ADD56-01 5–6 Player Add-On

---

# CORE-01-00 STATE MODEL (Declarative)

CORE-01-00-01 Every game object exists in exactly one zone at any time.
CORE-01-00-02 Zones are containers; moving an object means transferring it between zones.
CORE-01-00-02A PersonalSupply Partition: PersonalSupply is a per-player zone: for each player P, there exists exactly one distinct PersonalSupply[P].
Any Resource object in PersonalSupply[P] is treated as belonging to player P for all payments and effects.
CORE-01-00-03 Influence zones are: PersonalSupply, Board.
CORE-01-00-03A Influence Tile Attachment Invariant: Each Influence object in Board is attached to exactly one Tile in Board (‘on that Tile’). An Influence object in PersonalSupply is unattached.
CORE-01-00-04 Resource zones are: PersonalSupply, Bank, Noise.
CORE-01-00-04A Bank Supply Invariant: The Bank is an unlimited source and sink for Resources. Whenever a rule instructs moving N Resources of a resort from Bank to another zone, the engine MUST create those N Resource objects in Bank (if not already represented) and then move them. Bank availability never restricts production or legality
CORE-01-00-05 Tile zones are: DrawPile, Board, DiscardFaceUp.
CORE-01-00-06 No object may exist in multiple zones simultaneously.
CORE-01-00-07 The board uses a topology parameter that defines adjacency between Tiles.
CORE-01-00-08 Any rule that references adjacency uses the current topology’s adjacency definition.
CORE-01-00-09 A topology attachment must be defined before game start.
CORE-01-00-10 The topology attachment specifies how adjacency between Tiles is determined.
CORE-01-00-11 The topology attachment does not modify any other rule.
CORE-01-00-12 Expansion-specific zones: If an expansion introduces additional zones (e.g., Measure zones), those zones exist separately per expansion.
Zones introduced by different expansions never share objects unless a rule explicitly defines cross-expansion mixing.

---

# TOPOLOGY ATTACHMENT (Implementation Contract)

CORE-01-00-T01 A topology implementation must define a function Adjacent(TileA, TileB) → Boolean.
CORE-01-00-T02 Adjacent(TileA, TileB) must be deterministic.
CORE-01-00-T03 All adjacency-based rules reference Adjacent(TileA, TileB).
CORE-01-00-T04 The topology implementation may represent hexagonal, orthogonal, or other grid structures.
CORE-01-00-T05 Changing topology does not alter any rule outside adjacency evaluation.
CORE-01-00-T06 Board Position Binding
Each Tile in Board is bound to exactly one Position value defined by the topology. No two Tiles may share a Position.
CORE-01-00-T07 Neighbor Positions: A topology implementation must define NeighborPositions(Position) → ordered list of adjacent Positions.
CORE-01-00-T07A Adjacency Consistency (Canonical): For Tiles in Board, Adjacent(TileA, TileB) MUST be true iff TileB.Position is contained in NeighborPositions(TileA.Position).
CORE-01-00-T08 Canonical Position Order: A topology implementation must define PositionKey(Position) → a deterministic total-order key used for canonical ordering.
CORE-01-00-T09 StartPosition: A topology implementation MUST define a constant StartPosition (a valid Position value). During Setup (CORE-01-03-01), bind the Start Committee tile to StartPosition.

---

# CORE-01-01 FOUNDATIONS

CORE-01-01-01 Influence is the only victory metric.
CORE-01-01-02 Resources exist solely to enable Influence-related actions.
CORE-01-01-03 Relative majority enables control.
CORE-01-01-04 Tie results in no control.

---

# CORE-01-02 COMPONENTS

CORE-01-02-01 The game contains exactly one Start Committee tile.
CORE-01-02-02 The Start Committee tile is not part of the DrawPile.
CORE-01-02-03 A tile in the DrawPile is drawn only during DrawAndPlaceTile.
CORE-01-02-03A Ownership
Each Influence object is owned by exactly one player. A player may move only their own Influence unless a rule explicitly states otherwise.

CORE-01-02-04 Core tile types are: ResortTiles, Committees, Grassroots, Lobbyists, Hotspots.

CORE-01-02-04A The core game defines exactly three Resource resorts: DOM, FOR, INF.
CORE-01-02-04B DOM represents Domestic Affairs.
CORE-01-02-04C FOR represents Foreign Affairs.
CORE-01-02-04D INF represents Information / Media Control.
CORE-01-02-04E A “Resource type” in this specification refers exclusively to one of these resorts.
CORE-01-02-04F No additional Resource resorts exist in CORE-01 unless introduced by an explicit expansion.
CORE-01-02-04G Each Resource object has exactly one resort attribute.

CORE-01-02-05 ResortTiles produce Resources during Round Settlement.
CORE-01-02-06 Committees enable the FormalizeInfluence action.
CORE-01-02-07 Grassroots enable the ConvertResources action.
CORE-01-02-07A Grassroots Type Tag (Normative): A Typed Grassroots tile has a printed type tag T where T ∈ {DOM, FOR, INF}. An Untyped Grassroots tile has no type tag.
CORE-01-02-08 Lobbyists contribute virtual Influence for majority calculation only.
CORE-01-02-09 Hotspots resolve when fully surrounded.

CORE-01-02-10 Core tile counts (DOM ResortTiles): W1×2, W2×4, W3×4, W4×1, W5×1.
CORE-01-02-11 Core tile counts (FOR ResortTiles): W1×2, W2×4, W3×4, W4×1, W5×1.
CORE-01-02-12 Core tile counts (INF ResortTiles): W1×2, W2×4, W3×4, W4×1, W5×1.
CORE-01-02-13 Core tile counts (Committees): ×10.
CORE-01-02-14 Core tile counts (Grassroots): ×8.
CORE-01-02-14A Grassroots Composition (Normative): The 8 Grassroots tiles consist of: Untyped ×2, Typed(DOM) ×2, Typed(FOR) ×2, Typed(INF) ×2.
The counts MUST sum to 8.
CORE-01-02-15 Core tile counts (Lobbyists): ×9.
CORE-01-02-16 Core tile counts (Hotspots): ×8.
CORE-01-02-17 ResortTiles have printed production value equal to their W number.
CORE-01-02-17A Each player has exactly one Meta-Marker (Cooldown Token).
CORE-01-02-17B A Meta-Marker is not Influence, not a Resource, and not an Overlay.
CORE-01-02-17C A Meta-Marker exists either in the owning player’s PersonalSupply or on exactly one ResortTile or exactly one Grassroots tile in Board.
CORE-01-02-17D A Meta-Marker may not be placed on the Start Committee.
CORE-01-02-17E Meta-Marker Mode Domain: Meta-Marker mode is one of: None, PingPong, Convert. At game start, mode = None.

---

# CORE-01-03 SETUP

CORE-01-03-01 Setup places the Start Committee tile into Board.
CORE-01-03-02 Setup shuffles all non-Start tiles into DrawPile.
CORE-01-03-02A Deterministic Randomness Contract
All randomization in CORE-01 (shuffles, starting player selection) MUST use a deterministic RNG seeded at game start, and the seed MUST be part of the initial game state.
CORE-01-03-02A.1 Canonical Shuffle Algorithm: ‘Shuffle’ means Fisher–Yates shuffle over the list from last index down to 1, swapping index i with index j where j = RNG.nextInt(i+1).
CORE-01-03-02A.2 Canonical RNG Call Order (Setup): During Setup, perform the DrawPile shuffle (CORE-01-03-02) first. Immediately after that shuffle completes, determine the starting player by k = RNG.nextInt(playerCount), where k is the starting seat index.
CORE-01-03-02B Canonical Pre-Shuffle Ordering: Before any shuffle, build the initial DrawPile list in a canonical total order using these keys:
(1) TileTypeOrder where ResortTiles < Committees < Grassroots < Lobbyists < Hotspots.
(2) ResortOrder where DOM < FOR < INF; Tiles without a Resort use ResortOrder = None (sorted after INF).
(3) WOrder ascending numeric; Tiles without W use WOrder = None (sorted after all W values).
(4) SerialIndex ascending, assigned starting at 0 within each identical (TileType, Resort, W) group.
CORE-01-03-02B.1 Grassroots ResortOrder Binding (Canonical): For the purposes of Canonical Pre-Shuffle Ordering key (2) ResortOrder (CORE-01-03-02B), treat:
(a) Typed Grassroots with type tag T as having ResortOrder = T, and
(b) Untyped Grassroots as having ResortOrder = None.
This binding affects ordering only and does not change any rule behavior.
CORE-01-03-03 Setup determines a starting player.
CORE-01-03-03A Turn Order: Turn order is fixed for the entire game: starting player acts first, then players act in ascending seat order wrapping around.
CORE-01-03-04 For 2 players, assign 4 Influence objects to each player’s PersonalSupply.
CORE-01-03-05 For 3 players, assign 3 Influence objects to each player’s PersonalSupply.
CORE-01-03-06 For 4 players, assign 2 Influence objects to each player’s PersonalSupply.

---

# CORE-01-04 TURN STRUCTURE

CORE-01-04-01 A turn consists of exactly two phases.
CORE-01-04-02 Phase 1 is DrawAndPlaceTile.
CORE-01-04-03 Phase 2 is ExactlyOnePoliticalAction.

CORE-01-04-04 DrawAndPlaceTile repeats: draw the top Tile from DrawPile, attempt to place it legally, until either (a) a Tile is placed, or (b) DrawPile is empty.
CORE-01-04-05 A tile placement is legal only if adjacent to at least one Tile in Board.
CORE-01-04-05A Placement Choice (Canonical): If the drawn Tile has one or more legal Positions, the active player MUST choose exactly one legal unoccupied Position and place the Tile there.
A Position is legal iff it is unoccupied (CORE-01-04-08) and is in NeighborPositions(T.Position) for at least one Tile T currently in Board.
CORE-01-04-06 If the drawn Tile cannot be legally placed, move it from DrawPile to DiscardFaceUp.
CORE-01-04-07 If a Tile is moved to DiscardFaceUp due to illegality, the player immediately draws again from DrawPile.
CORE-01-04-08 A tile may be placed only on an unoccupied Position in the current topology.

CORE-01-04-09 ExactlyOnePoliticalAction allows exactly one action type from: PlaceOrMoveInfluence, FormalizeInfluence, ConvertResources.
CORE-01-04-09A Meta-Marker Carryover (Canonical): After resolving the active player’s ExactlyOnePoliticalAction, if that action did not place or update the active player’s Meta-Marker on a ResortTile or Grassroots tile as part of its resolution, return the Meta-Marker to PersonalSupply[activePlayer] and set its mode to None.

CORE-01-04-10 PlaceOrMoveInfluence may be chosen as the Political Action.
CORE-01-04-11 PlaceOrMoveInfluence (Place) moves exactly one Influence from the active player’s PersonalSupply to Board on a chosen Tile.
CORE-01-04-11A PlaceOrMoveInfluence (Place) Legality
Place is legal only if the active player has at least one Influence in PersonalSupply and the chosen Tile is not prohibited by restrictions (e.g., Start Committee per CORE-01-08-04/06E).
CORE-01-04-12 PlaceOrMoveInfluence (Move) moves exactly one active-player-owned Influence from a source Board Tile to a different destination Board Tile. The Start Committee may not be source or destination (CORE-01-08-06E).
CORE-01-04-12A PlaceOrMoveInfluence (Move) Meta-Marker Update: After a successful PlaceOrMoveInfluence (Move) resolution, if the source Tile is a ResortTile, place the active player’s Meta-Marker onto the source Tile and set its mode to PingPong.
Otherwise, do not place the Meta-Marker on Board as part of this move (see CORE-01-04-09A).
If the Meta-Marker was previously on another Tile, remove it from that Tile.

CORE-01-04-12B PlaceOrMoveInfluence (Move) Ping-Pong Penalty (Meta-Marker): If, at the moment PlaceOrMoveInfluence (Move) begins resolution, the active player’s Meta-Marker is on the destination Tile and its mode is PingPong, the active player MUST pay a Ping-Pong penalty before the Influence is moved.
Let R be the total count of Resource objects in PersonalSupply[activePlayer] at that moment. Let N = min(10, floor(R / 2)).
If N > 0, the active player chooses any N Resources from PersonalSupply[activePlayer] and moves them to Noise. This choice is locked before any movement occurs.

CORE-01-04-12C PlaceOrMoveInfluence (Move) Meta-Marker Expiry: Delete. (Meta-Marker persistence is governed by CORE-01-07-03A/B and CORE-01-04-09A.)”

CORE-01-04-13 FormalizeInfluence may be chosen as the Political Action.
CORE-01-04-14 FormalizeInfluence is performed via a Committee tile.
CORE-01-04-14A Start Committee Override: If the selected Committee tile is the Start Committee, resolve FormalizeInfluence using CORE-01-08-07 through CORE-01-08-10A instead of CORE-01-04-15 through CORE-01-04-19
CORE-01-04-14B Start Committee Formalize — Legality and Failure: Selecting the Start Committee as the Committee for FormalizeInfluence is legal only if:
(a) CORE-01-08-02 is satisfied,
(b) the active player has not previously resolved Start Committee formalization (CORE-01-08-07),
(c) the active player can fully pay the cost defined in CORE-01-08-08, and
(d) the Influence Cap Check in CORE-01-08-10A passes.
If any condition (a)–(d) is not satisfied, the action is invalid and does not resolve; no state change occurs (CORE-01-06-00-03).
CORE-01-04-15 FormalizeInfluence (Standard Committee) cost requires paying 2 Resources of different resorts.
CORE-01-04-16 FormalizeInfluence (Standard Committee) moves paid Resources from the active player’s PersonalSupply to Bank.
CORE-01-04-17 FormalizeInfluence (Standard Committee) creates exactly one new Influence in the active player’s PersonalSupply.
CORE-01-04-17A Influence Cap Check
FormalizeInfluence does not resolve if creating the new Influence would cause the active player to exceed the Influence cap (CORE-01-08-01). In that case, no state change occurs (CORE-01-04-19).
CORE-01-04-18 FormalizeInfluence fails if the required Resources cannot be fully paid.
CORE-01-04-19 If FormalizeInfluence fails, no state change occurs.

CORE-01-04-20 ConvertResources may be chosen as the Political Action.
CORE-01-04-21 ConvertResources is performed via a Grassroots tile.
CORE-01-04-22 ConvertResources cost and effect are defined by the specific Grassroots tile text.

CORE-01-04-22A ConvertResources Output Unit: ConvertResources produces exactly 1 Resource object as output per successful ConvertResources action.
If a Grassroots tile text specifies multiple output Resource objects, that tile text overrides this rule.
CORE-01-04-22B ConvertResources Availability (Control Requirement): ConvertResources is legal only if the active player currently controls at least one Grassroots tile in Board.
If the active player controls zero Grassroots tiles, ConvertResources may not be chosen as the Political Action.
CORE-01-04-22C ConvertResources Repeat Penalty (Meta-Marker): If, at the moment ConvertResources begins resolution, the active player’s Meta-Marker is on any Tile with mode Convert, then increase the conversion cost by +1 additional Resource. The active player chooses the resort for this additional Resource as part of cost declaration; this choice is locked before any payment is performed.
This penalty applies regardless of which controlled Grassroots tile is selected for the current ConvertResources action.
CORE-01-04-22D ConvertResources Convert Anchor Selection: When resolving ConvertResources, the active player must select exactly one Grassroots tile that the active player currently controls.
This selected tile is the Convert Anchor for this ConvertResources resolution.
CORE-01-04-22E ConvertResources Meta-Marker Placement: After a successful ConvertResources resolution, place the active player’s Meta-Marker onto the selected Convert Anchor tile and set its mode to Convert.
If the Meta-Marker was previously on another Tile, remove it from that Tile.
CORE-01-04-22F ConvertResources Meta-Marker Expiry: Delete. (Meta-Marker persistence/return is governed by CORE-01-07-03A/B and CORE-01-04-09A.)”
CORE-01-04-22G Grassroots ConvertRecipe Requirement: For engine implementations, each Grassroots Tile MUST provide a machine-readable ConvertRecipe descriptor (inputs + outputs) that exactly matches its printed text.
If the selected Grassroots Tile has no ConvertRecipe descriptor, ConvertResources is invalid and does not resolve (CORE-01-06-00-03).
CORE-01-04-22H Core Grassroots Definitions (Normative): The CORE-01 ruleset MUST include a complete normative definition for every Grassroots Tile used in CORE-01 (including ADD56-01 additions): (a) its printed text, and (b) its machine-readable ConvertRecipe (inputs + outputs).
If these definitions are not present as part of the CORE-01 specification artifact, ConvertResources is undefined and may not be executed.
CORE-01-04-22I Grassroots Tile Kinds (Canonical): Each Grassroots tile in CORE-01 is exactly one of:
(a) Untyped Grassroots, or
(b) Typed Grassroots with a printed type tag T where T ∈ {DOM, FOR, INF}.
The Grassroots tile set composition is defined by CORE-01-02-14A.
All Untyped Grassroots tiles share the definition in CORE-01-04-22K.
All Typed Grassroots tiles share the definition in CORE-01-04-22L with their own printed type tag T substituted.
CORE-01-04-22J ConvertResources — Canonical Declaration, Payment, and Failure: The active player MUST declare the chosen recipe variant and any required choices (e.g., output resort where applicable) before any Resource movement occurs; this declaration is locked for the resolution.
If CORE-01-04-22C applies, the additional +1 Resource (including its chosen resort) is part of this locked declaration.
If the active player cannot fully pay the declared total input cost (recipe inputs plus any CORE-01-04-22C additional Resource), ConvertResources fails and does not resolve; no state change occurs (CORE-01-06-00-03).
On success, move all paid input Resources from PersonalSupply[activePlayer] to Bank, then move the output Resource(s) from Bank to PersonalSupply[activePlayer].
CORE-01-04-22K Untyped Grassroots — Printed Text + ConvertRecipe (Normative): Printed text: ‘Convert 3 Resources into 1 Resource of your choice.’
ConvertRecipe: exactly one variant:
Inputs: 3× Resource(any resort)
Outputs: 1× Resource(output resort chosen by the active player, where output resort ∈ {DOM, FOR, INF})
CORE-01-04-22L Typed Grassroots — Printed Text + ConvertRecipe (Normative): Let T be the tile’s printed type tag (DOM/FOR/INF).
Printed text: ‘Convert 2 Resources into 1 {T} Resource. Or convert 3 Resources into 1 Resource of your choice, but not {T}.’
ConvertRecipe: exactly two variants; the active player MUST choose exactly one variant during the locked declaration step (CORE-01-04-22J):
Variant A (Typed):
Inputs: 2× Resource(any resort)
Outputs: 1× Resource(resort = T)
Variant B (Off-Type 3:1):
Inputs: 3× Resource(any resort)
Outputs: 1× Resource(output resort chosen by the active player, where output resort ∈ {DOM, FOR, INF} and output resort ≠ T)
Legality constraint: If the declared output resort equals T, Variant B is illegal and Variant A MUST be used.

---

# CORE-01-05 CONTROL

CORE-01-05-01 A player controls a Tile iff computeMajority(Tile) returns that player (CORE-01-05-03A).
CORE-01-05-02 If computeMajority(Tile) returns None (tie), no player controls that Tile (CORE-01-05-03A).
CORE-01-05-03 Control updates immediately after any Influence movement onto, off, or between Board Tiles, and immediately after any Tile is placed into Board (since adjacency-based modifiers can change)
CORE-01-05-03A Definition — computeMajority(Tile)
0. If Tile is the Start Committee, return None. No modifiers are applied when evaluating the Start Committee.

Applicable modifiers in CORE-01 are limited to Lobbyist adjacency per CORE-01-05-04A and are subject to CORE-01-05-04B.

1. For each player:
   totalInfluence =
   Influence markers on the Tile

   * all applicable modifiers (e.g., Lobbyist adjacency bonus)

2. The player with strictly highest totalInfluence is returned.

3. If two or more players share the highest totalInfluence,
   return None.

CORE-01-05-04 Each Lobbyist adjacent to a Tile contributes +1 virtual Influence for majority calculation on that adjacent Tile.
CORE-01-05-04A Lobbyist Bonus Attribution
For a given target Tile X, each adjacent Lobbyist Tile L contributes +1 virtual Influence to the player who controls L, applied to X during majority calculation.
If L is uncontrolled, L contributes 0.
CORE-01-05-04B Lobbyist Self-Reference Exclusion
When computing majority/control for a Lobbyist Tile, do not apply any Lobbyist adjacency bonuses (i.e., treat the Lobbyist modifier set as empty for that Tile).
CORE-01-05-05 Lobbyist contribution applies only to majority calculation.
CORE-01-05-06 Lobbyist contribution does not create or move Influence objects.

---

# CORE-01-06 EFFECTS

CORE-01-06-00-01 Definition — “Effect”
An “Effect” is any rule-defined state change that is executed as a result of:
(a) resolving a Tile’s printed behavior (including Resort production during Round Settlement), or
(b) resolving a triggered Tile behavior (e.g., Hotspot resolution), or
(c) resolving a Political Action (PlaceOrMoveInfluence, FormalizeInfluence, ConvertResources), or
(d) resolving any Measure or Regulation instruction.
In CORE-01 without expansions, there are no Measures, Regulations, Overlays, or external prohibition/modifier effects beyond those explicitly defined in this document.

CORE-01-06-00-02 Paying costs, checking prohibitions, and applying modifiers are part of effect resolution.
CORE-01-06-00-03 If an Effect does not resolve, no partial state changes occur unless explicitly stated.

CORE-01-06-00-04 Effect Context (Tile Binding)
An effect resolves with exactly one ContextTile (nullable).
Rules that apply “on that Tile” evaluate against ContextTile.

CORE-01-06-00-05 ContextTile Assignment (Canonical)
Assign ContextTile as follows:
(a) If the effect is a Political Action performed via a Tile (Committee / Grassroots / Start Committee), ContextTile = that Tile.
(b) If the effect targets exactly one Tile (e.g., “target one ResortTile / Hotspot”), ContextTile = that target Tile.
(c) If the effect is Resort Production during Round Settlement, ContextTile = the producing ResortTile.
(d) If the effect is Hotspot resolution, ContextTile = that Hotspot Tile.
(e) If none applies, ContextTile = null.

CORE-01-06-00-06 Multiple-Tile References
If an instruction references multiple Tiles, it must explicitly state which Tile is the ContextTile; otherwise the effect is invalid and does not resolve.

CORE-01-06-01 A Hotspot becomes “fully surrounded” when all positions adjacent to that Hotspot are occupied by Tiles.
CORE-01-06-02 The check for full enclosure occurs immediately after a Tile is placed during DrawAndPlaceTile.
CORE-01-06-03 If full enclosure is detected, Hotspot resolution is executed immediately before proceeding to the Political Action phase of that turn.
CORE-01-06-03A Multiple Hotspots (Canonical Order)
If multiple Hotspots are fully surrounded as a result of the same Tile placement, resolve them one at a time in ascending PositionKey(Hotspot.Position).
If resolving one Hotspot affects Influence availability for later Hotspots, later Hotspots resolve using the updated state.
CORE-01-06-03B Hotspot Single-Resolution Invariant: Each Hotspot Tile resolves at most once per game.
Immediately after each successful Tile placement (CORE-01-06-02), the engine MUST evaluate all Hotspots in Board that are not yet resolved. Any such Hotspot that is fully surrounded (CORE-01-06-01) MUST resolve now (ordered per CORE-01-06-03A).
After a Hotspot resolution attempt (including cases where no Influence can be placed due to CORE-01-06-07), mark that Hotspot as resolved; it MUST NOT resolve again.
CORE-01-06-04 Hotspot resolution follows this order:
(a) Apply any pre-majority effects explicitly defined as occurring “before majority determination.”
(b) Determine majority on that Hotspot.
(c) Resolve majority outcome (only after completing step (d); if step (d) prohibits this effect, do not execute step (c)).
(d) Evaluate any applicable effect modifiers and prohibitions according to Rule Hierarchy. If any prohibition applies, Hotspot resolution does not resolve and no state change occurs (CORE-01-06-00-03).
CORE-01-06-05 If a player has majority on the Hotspot, place exactly one Influence on that Hotspot for the majority player.
CORE-01-06-06 Hotspot placement moves one Influence from that player’s PersonalSupply to the Hotspot Tile in Board.
CORE-01-06-07 If the majority player has no available Influence in PersonalSupply, Hotspot placement cannot occur.
CORE-01-06-08 Hotspots do not produce Resources.

CORE-01-06-09 Resort Production is resolved only during Round Settlement.
CORE-01-06-10 Each ResortTile has a printed production value.
CORE-01-06-11 When resolving Resort Production, the produced Resource amount is the production output computed by CORE-01-06-16(a), and the receiving player(s) are determined by CORE-01-06-16(b)/(c)
CORE-01-06-12 Produced Resources are moved from Bank to the controlling player’s PersonalSupply.
CORE-01-06-13 If the highest totalInfluence on a ResortTile is 0, that ResortTile produces 0 Resources.
CORE-01-06-13A Definition — totalInfluence for Production: For Resort Production, ‘totalInfluence’ is computed exactly as in CORE-01-05-03A step (1) for that ResortTile (Influence on the Tile plus applicable modifiers).
CORE-01-06-14 If two or more players tie for highest totalInfluence on a ResortTile and that highest totalInfluence is > 0, divide the produced Resources evenly among those tied players.
CORE-01-06-15 Any remainder from a tied ResortTile production is moved to Noise.
CORE-01-06-16 Production Resolution Order (Canonical)
CORE-01-06-16-00 Modifier Collection Step
Before resolving production for a tile, collect all applicable modifiers for that production instance.
No modifier is applied until the canonical order steps (a)–(c) begin.

When resolving a ResortTile’s production during Round Settlement, use the following order:

(a) Determine the total production output amount using the applicable modifier steps:
1. Start with the tile’s printed production value.
2. Apply doubling effects (if any).
3. Apply production output modifiers (reductions or increases).
4. No additional production reductions apply in CORE-01.
5. Apply floors (minimum 0).

(b) Determine highest totalInfluence on that Tile using the standard majority rules (including modifiers). If the unique highest player exists, that player is the production winner. If multiple players tie for highest and highest > 0, those players are tied production winners. If highest == 0, there are no production winners.

(c) Distribute the produced Resources:
- If there is exactly one production winner, that player receives the full amount.
- If the highest totalInfluence on the Tile is 0, produce 0.
- If there are tied production winners (highest > 0), split evenly; any remainder is moved to Noise.

CORE-01-06-17 If an effect-level prohibition applies to production (e.g., “Blockade”), production output is treated as 0 and no Resources are distributed.

---

# CORE-01-07 ROUND STRUCTURE

CORE-01-07-01 A round consists of one complete player cycle in turn order.
CORE-01-07-02 After the last player completes a turn in a round, Round Settlement begins.
CORE-01-07-03 Round Settlement resolves Resort Production for all ResortTiles.
CORE-01-07-03A Meta-Marker Round Start: At the beginning of each Round, do not move Meta-Markers.
CORE-01-07-03B Meta-Marker Persistence: A Meta-Marker remains at its current location until updated or returned to PersonalSupply by a rule.
CORE-01-07-03C Meta-Marker Mode Reset: When a Meta-Marker is returned to PersonalSupply, set its mode to None.
CORE-01-07-03D Resort Production Sweep Order (Canonical): During Round Settlement, resolve Resort Production for ResortTiles in Board in ascending PositionKey(ResortTile.Position).

---

# CORE-01-08 RESTRICTIONS

CORE-01-08-01 A player may not exceed 7 Influence objects in total.

CORE-01-08-02 FormalizeInfluence may not be performed until, for every player, every Influence object assigned to that player during Setup as Starting Influence (CORE-01-03-04/05/06, modified by VAR-01-02 and/or ADD56-01-02) is in Board. Influence created by FormalizeInfluence is not Starting Influence.
CORE-01-08-03 This restriction applies to all Committees, including the Start Committee.

CORE-01-08-04 No Influence may be placed on the Start Committee.
CORE-01-08-05 The Start Committee cannot be controlled.
CORE-01-08-06 The Start Committee is immune to all effects, Measures, and Regulations.
CORE-01-08-06A Immunity Scope: When an action is performed via the Start Committee (including Start Committee formalization),
ignore any external modifiers that would:
(a) prohibit execution (e.g., Blockade),
(b) increase or alter costs,
(c) reduce or alter output,
unless that modifier explicitly states it affects the Start Committee.
CORE-01-08-06B The Start Committee’s immunity does not override CORE-01-08-02 (timing restriction) and does not allow placing or moving Influence onto the Start Committee.
CORE-01-08-06C Start Committee Connectivity Clarification: The Start Committee may be used as a connector when evaluating adjacency-derived connectivity or paths between Tiles.
This does not allow any Influence object to enter, remain on, or be placed on the Start Committee.
CORE-01-08-06C.1 Definitions — Path and Connectivity: A Path is a finite sequence of Tiles in Board where each consecutive pair satisfies Adjacent(TileA, TileB) = true.
Two Tiles are connected iff at least one Path exists between them.
CORE-01-08-06D Start Committee “Pass-Through” Prohibition for Influence: If any rule evaluates a path that includes the Start Committee, treat the Start Committee as a connector node only.
Influence does not move onto or off of the Start Committee as an intermediate step.
CORE-01-08-06E Start Committee Targeting Restriction: The Start Committee may not be the destination Tile of PlaceOrMoveInfluence (Place).
The Start Committee may not be the source or destination Tile of PlaceOrMoveInfluence (Move).
Meta-Marker placement is governed by CORE-01-02-17C/17D.
CORE-01-08-06F Immunity Interpretation Clarification: Start Committee immunity applies to effects that target or would modify the Start Committee tile. It does not prohibit performing actions via the Start Committee as explicitly defined (CORE-01-04-14A / CORE-01-08-07..10A), Meta-Marker placement is governed by CORE-01-02-17C/17D.
CORE-01-08-07 Each player may FormalizeInfluence via the Start Committee at most once per game.
CORE-01-08-08 Start Committee formalization cost requires paying 3 Resources of different resorts plus 1 additional Resource of any resort.
CORE-01-08-09 Start Committee formalization moves all paid Resources from the active player’s PersonalSupply to Bank.
CORE-01-08-10 Start Committee formalization creates exactly one new Influence in the active player’s PersonalSupply.
CORE-01-08-10A Influence Cap Check (Start Committee)
Start Committee formalization does not resolve if it would cause the active player to exceed the Influence cap (CORE-01-08-01 / ADD56-01-03-00-01). In that case, no state change occurs.

---

# CORE-01-09 END GAME

CORE-01-09-01 The game ends when no further Tiles can be drawn from DrawPile.
CORE-01-09-01A Final Settlement Trigger: If a player would begin DrawAndPlaceTile and DrawPile is empty, immediately begin the final Round Settlement (CORE-01-07-02) and then end the game (CORE-01-09-02).
If, during DrawAndPlaceTile, DrawPile becomes empty before a Tile is placed, immediately begin the final Round Settlement and then end the game; skip the Political Action phase of that turn.
CORE-01-09-02 After the final Round Settlement completes, the game ends immediately.
CORE-01-09-03 Compute each player’s score as the count of Influence objects owned by that player that are in Board. Virtual Influence from Lobbyists (CORE-01-05-04/04A) is ignored for scoring. The player with the highest score wins.
CORE-01-09-04 If two or more players tie for highest score, victory is shared.

---

# CORE-01-10 RULE HIERARCHY

CORE-01-10-01 Tile text overrides general rules.
CORE-01-10-02 Specific rules override general rules.
CORE-01-10-03 General rules apply unless overridden.
CORE-01-10-04 No implicit effects exist.

---

# VAR-01 VARIANTS (Simulation Specification)

VAR-01-01-01 TileRecycling is an optional variant.
VAR-01-01-02 When TileRecycling is active, CORE-01-04-06 is not used.
VAR-01-01-03 When TileRecycling is active, CORE-01-04-07 is not used.
VAR-01-01-04 If a drawn Tile cannot be legally placed, move it from the draw resolution back into DrawPile.
VAR-01-01-05 After returning the Tile to DrawPile, shuffle DrawPile.
VAR-01-01-06 After shuffling DrawPile, the active player immediately draws again as part of DrawAndPlaceTile.
VAR-01-01-07 Returned Tile Insertion (Canonical): When returning a Tile to DrawPile (VAR-01-01-04), append that Tile to the bottom of the DrawPile list before shuffling (VAR-01-01-05).
VAR-01-01-08 TileRecycling Termination Guard: If, at any time during DrawAndPlaceTile, there exists no unoccupied Position that is adjacent (per NeighborPositions/Adjacent) to any Tile in Board, then no Tile can be legally placed. In that case, immediately treat DrawPile as empty for CORE-01-09-01A (begin final Round Settlement, then end the game).

VAR-01-02-01 FirstPlayerHandicap is an optional variant.
VAR-01-02-02 When FirstPlayerHandicap is active, the starting player receives one fewer Starting Influence during setup.
VAR-01-02-03 The reduction applies after the standard starting Influence assignment.
VAR-01-02-04 FirstPlayerHandicap modifies CORE-01-03-04.
VAR-01-02-05 FirstPlayerHandicap modifies CORE-01-03-05.
VAR-01-02-06 FirstPlayerHandicap modifies CORE-01-03-06.
VAR-01-02-07 If the 5–6 Player Add-On is active, FirstPlayerHandicap also modifies ADD56-01-02-01.
VAR-01-02-08 If the 5–6 Player Add-On is active, FirstPlayerHandicap also modifies ADD56-01-02-02.

---

# ADD56-01 5–6 PLAYER ADD-ON (Simulation Specification)

ADD56-01-01-01 The 5–6 Player Add-On extends the DrawPile tile set.

ADD56-01-01-02 Add DOM-W2 ×1 to DrawPile.
ADD56-01-01-03 Add DOM-W3 ×1 to DrawPile.
ADD56-01-01-04 Add DOM-W4 ×1 to DrawPile.

ADD56-01-01-05 Add FOR-W2 ×1 to DrawPile.
ADD56-01-01-06 Add FOR-W3 ×1 to DrawPile.
ADD56-01-01-07 Add FOR-W4 ×1 to DrawPile.

ADD56-01-01-08 Add INF-W2 ×1 to DrawPile.
ADD56-01-01-09 Add INF-W3 ×1 to DrawPile.
ADD56-01-01-10 Add INF-W4 ×1 to DrawPile.

ADD56-01-01-11 Add Committee ×2 to DrawPile.
ADD56-01-01-12 Add Lobbyist ×3 to DrawPile.
ADD56-01-01-13 Add Grassroots ×2 to DrawPile.

ADD56-01-01-14 Add Hotspot (DOM) ×1 to DrawPile.
ADD56-01-01-15 Add Hotspot (FOR) ×1 to DrawPile.
ADD56-01-01-16 These Hotspot labels do not modify Hotspot resolution rules.

ADD56-01-02-01 For 5 players, assign 2 Influence objects to each player’s PersonalSupply during setup.
ADD56-01-02-02 For 6 players, assign 2 Influence objects to each player’s PersonalSupply during setup.

ADD56-01-03-00-01 Influence cap adjustment
For 5 players, a player may not exceed 8 Influence objects in total.
For 6 players, a player may not exceed 8 Influence objects in total.
This overrides CORE-01-08-01 while the 5–6 Player Add-On is active.

ADD56-01-03-01 All other CORE-01 rules remain unchanged when the 5–6 Player Add-On is active.
