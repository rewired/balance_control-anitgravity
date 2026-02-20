# BALANCE // CONTROL

# CORE-01 Simulation Specification (Atomic, Deterministic)

**Version:** 03
**Scope:** Core Rules v1.1.0 only, incl. variants (no expansions)

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

CORE-01-00-02A PersonalSupply Partition (Canonical): For each player P, exactly one zone PersonalSupply[P] exists. Any Resource in PersonalSupply[P] belongs to player P for all costs/effects.

CORE-01-00-03 Influence zones are: PersonalSupply, Board.
CORE-01-00-03A Influence Tile Attachment Invariant (Canonical): Each Influence in Board is attached to exactly one Tile in Board (“on that Tile”). An Influence in PersonalSupply is unattached.

CORE-01-00-04 Resource zones are: PersonalSupply, Bank, Noise.
CORE-01-00-04A Bank Supply Invariant (Canonical): Bank is an unlimited source/sink. When moving N Resources from Bank, the engine MUST be able to materialize them and move them; Bank availability never restricts legality or production.

CORE-01-00-05 Tile zones are: DrawPile, Board, DiscardFaceUp.
CORE-01-00-05A Ordered Zone Conventions (Canonical): DrawPile and DiscardFaceUp are ordered lists. Top = first element; bottom = last element. Moving a Tile to DiscardFaceUp appends it to the end.

CORE-01-00-06 No object may exist in multiple zones simultaneously.

CORE-01-00-07 The board uses a topology parameter that defines adjacency between Tiles.
CORE-01-00-08 Any rule that references adjacency uses the current topology’s adjacency definition.
CORE-01-00-09 A topology attachment must be defined before game start.
CORE-01-00-10 The topology attachment specifies how adjacency between Tiles is determined.
CORE-01-00-11 The topology attachment does not modify any other rule.

CORE-01-00-12 Expansion-specific zones: If expansions introduce zones, they exist separately per expansion; different expansions do not mix objects unless explicitly defined. (Out of scope here.)

---

# TOPOLOGY ATTACHMENT (Implementation Contract)

CORE-01-00-T01 A topology implementation must define Adjacent(TileA, TileB) → Boolean.
CORE-01-00-T02 Adjacent(TileA, TileB) must be deterministic.
CORE-01-00-T03 All adjacency-based rules reference Adjacent(TileA, TileB).
CORE-01-00-T04 The topology implementation may represent hexagonal, orthogonal, or other grid structures.
CORE-01-00-T05 Changing topology does not alter any rule outside adjacency evaluation.

CORE-01-00-T06 Board Position Binding (Canonical): Each Tile in Board is bound to exactly one topology-defined Position. No two Tiles may share a Position.

CORE-01-00-T07 Neighbor Positions: Define NeighborPositions(Position) → ordered list of adjacent Positions.
CORE-01-00-T07A Adjacency Consistency (Canonical): For Tiles in Board, Adjacent(A,B) MUST be true iff B.Position ∈ NeighborPositions(A.Position).

CORE-01-00-T08 Canonical Position Order: Define PositionKey(Position) → deterministic total-order key for canonical ordering requirements.

CORE-01-00-T09 StartPosition: Define constant StartPosition. During Setup (CORE-01-03-01), bind the Start Committee tile to StartPosition.

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

CORE-01-02-03A Ownership: Each Influence is owned by exactly one player. A player may move only their own Influence unless explicitly stated otherwise.

CORE-01-02-04 Core tile types are: ResortTiles, Committees, Grassroots, Lobbyists, Hotspots.

CORE-01-02-04A The core game defines exactly three Resource resorts: DOM, FOR, INF.
CORE-01-02-04B DOM represents Domestic Affairs.
CORE-01-02-04C FOR represents Foreign Affairs.
CORE-01-02-04D INF represents Information / Media Control.
CORE-01-02-04E “Resource type” refers exclusively to {DOM, FOR, INF}.
CORE-01-02-04F No additional Resource resorts exist in CORE-01 unless introduced by an explicit expansion (out of scope).
CORE-01-02-04G Each Resource object has exactly one resort attribute.

CORE-01-02-05 ResortTiles produce Resources during Round Settlement.
CORE-01-02-06 Committees enable the FormalizeInfluence action.
CORE-01-02-07 Grassroots enable the ConvertResources action.

CORE-01-02-07A Grassroots Type Tag (Normative): Typed Grassroots has printed type tag T ∈ {DOM, FOR, INF}. Untyped Grassroots has no type tag.

CORE-01-02-08 Lobbyists contribute virtual Influence for majority calculation only.
CORE-01-02-09 Hotspots resolve when fully surrounded.

CORE-01-02-10 Core tile counts (DOM ResortTiles): W1×2, W2×4, W3×4, W4×1, W5×1.
CORE-01-02-11 Core tile counts (FOR ResortTiles): W1×2, W2×4, W3×4, W4×1, W5×1.
CORE-01-02-12 Core tile counts (INF ResortTiles): W1×2, W2×4, W3×4, W4×1, W5×1.
CORE-01-02-13 Core tile counts (Committees): ×10.
CORE-01-02-14 Core tile counts (Grassroots): ×8.

CORE-01-02-14A Grassroots Composition (Normative): Untyped ×2, Typed(DOM) ×2, Typed(FOR) ×2, Typed(INF) ×2. Counts MUST sum to 8.

CORE-01-02-15 Core tile counts (Lobbyists): ×9.
CORE-01-02-16 Core tile counts (Hotspots): ×8.

CORE-01-02-17 ResortTiles have printed production value equal to their W number.

CORE-01-02-17A Each player has exactly one Meta-Marker (Cooldown Token).
CORE-01-02-17B A Meta-Marker is not Influence, not a Resource, and not an Overlay.
CORE-01-02-17C A Meta-Marker exists either in PersonalSupply[owner] or on exactly one ResortTile or exactly one Grassroots tile in Board.
CORE-01-02-17D A Meta-Marker may not be placed on the Start Committee.
CORE-01-02-17E Meta-Marker mode ∈ {None, ReturnPenalty, Convert}; at game start, mode = None.

---

# CORE-01-03 SETUP

CORE-01-03-01 Setup places the Start Committee tile into Board.
CORE-01-03-02 Setup shuffles all non-Start tiles into DrawPile.

CORE-01-03-02A Deterministic Randomness Contract: All randomization (shuffles, starting player selection) MUST use a deterministic RNG seeded at game start; the seed MUST be part of initial game state.

CORE-01-03-02A.1 Canonical Shuffle Algorithm: Fisher–Yates over the list from last index down to 1, swap i with j where j = RNG.nextInt(i+1).
CORE-01-03-02A.1A Shuffle Scope (Canonical): Any “shuffle” in this specification (incl. VAR-01-01-05) MUST use CORE-01-03-02A.1 and MUST consume randomness from the same seeded RNG instance.

CORE-01-03-02A.2 Canonical RNG Call Order (Setup): First shuffle DrawPile. Immediately after, determine starting player by k = RNG.nextInt(playerCount) (k = starting seat index).

CORE-01-03-02B Canonical Pre-Shuffle Ordering: Before any shuffle, build initial DrawPile list in total order by keys:
(1) TileTypeOrder: ResortTiles < Committees < Grassroots < Lobbyists < Hotspots
(2) ResortOrder: DOM < FOR < INF; Tiles without resort use ResortOrder = None (sorted after INF)
(3) WOrder ascending; Tiles without W use WOrder = None (sorted after all W)
(4) SerialIndex ascending from 0 within each identical (1–3) group

CORE-01-03-02B.1 Grassroots ResortOrder Binding (Canonical): For ordering only, Typed Grassroots uses ResortOrder = its type tag T; Untyped uses ResortOrder = None.

CORE-01-03-03 Setup determines a starting player.
CORE-01-03-03A Turn Order: Turn order is fixed: starting player first, then ascending seat order wrapping around.

CORE-01-03-04 For 2 players, assign 4 Influence to each player’s PersonalSupply.
CORE-01-03-05 For 3 players, assign 3 Influence to each player’s PersonalSupply.
CORE-01-03-06 For 4 players, assign 2 Influence to each player’s PersonalSupply.

CORE-01-03-03B Setup Step Order (Canonical):
(1) Place Start Committee in Board bound to StartPosition.
(2) Build initial DrawPile in canonical pre-shuffle ordering, including ADD56 additions if active.
(3) Shuffle DrawPile (canonical shuffle).
(4) Determine starting player (canonical RNG call).
(5) Assign Starting Influence per player count (incl. ADD56 if active).
(6) If FirstPlayerHandicap is active, apply reduction to starting player after (5) (VAR-01-02-02/03).

---

# CORE-01-04 TURN STRUCTURE

CORE-01-04-01 A turn consists of exactly two phases.
CORE-01-04-02 Phase 1 is DrawAndPlaceTile.
CORE-01-04-03 Phase 2 is ExactlyOnePoliticalAction.

CORE-01-04-04 DrawAndPlaceTile repeats: draw top Tile, attempt legal placement, until (a) a Tile is placed, or (b) DrawPile is empty.
CORE-01-04-05 A tile placement is legal only if adjacent to at least one Tile in Board.

CORE-01-04-05A Placement Choice (Canonical): If the drawn Tile has ≥1 legal Position, the active player MUST choose exactly one legal unoccupied Position and place it. A Position is legal iff unoccupied (CORE-01-04-08) and in NeighborPositions(T.Position) for at least one Tile T in Board.

CORE-01-04-06 If a drawn Tile cannot be legally placed, move it from DrawPile to DiscardFaceUp.
CORE-01-04-07 If a Tile is moved to DiscardFaceUp due to illegality, immediately draw again.
CORE-01-04-08 A tile may be placed only on an unoccupied Position in the current topology.

CORE-01-04-09 ExactlyOnePoliticalAction allows exactly one action from: PlaceOrMoveInfluence, FormalizeInfluence, ConvertResources.

CORE-01-04-09A Meta-Marker Carryover (Canonical): After resolving the Political Action, if that action did not place/update the active player’s Meta-Marker on a ResortTile or Grassroots as part of resolution, return it to PersonalSupply[activePlayer] and set mode = None.

## PlaceOrMoveInfluence

CORE-01-04-10 PlaceOrMoveInfluence may be chosen as the Political Action.
CORE-01-04-11 PlaceOrMoveInfluence (Place): move exactly one Influence from PersonalSupply[activePlayer] to Board on a chosen Tile.

CORE-01-04-11A Place Legality: legal only if active player has ≥1 Influence in PersonalSupply and the chosen Tile is not prohibited by restrictions (incl. Start Committee restrictions).

CORE-01-04-12 PlaceOrMoveInfluence (Move): move exactly one active-player-owned Influence from a source Board Tile to a different adjacent destination Board Tile.
Start Committee may not be source or destination (CORE-01-08-06E).
If the destination Tile is not adjacent to the source Tile, the action is invalid and does not resolve; no state change occurs (CORE-01-06-00-03).

CORE-01-04-12A Move Meta-Marker Update: after a successful Move, if the source Tile is a ResortTile, place active player’s Meta-Marker onto the source Tile and set mode = ReturnPenalty (removing it from any prior Tile). Otherwise, do not place the Meta-Marker as part of this move (then CORE-01-04-09A applies).

CORE-01-04-12B Return Penalty (Meta-Marker): If, when Move begins resolution, the active player’s Meta-Marker is on the destination Tile and mode = ReturnPenalty, pay penalty before moving:
Let R = Resource count in PersonalSupply[activePlayer]. Let N = min(10, floor(R/2)). If N > 0, choose any N Resources and move them to Noise. This choice is locked before any movement.

CORE-01-04-12C PlaceOrMoveInfluence (Move) Meta-Marker Expiry: Reserved. (Persistence/return governed by CORE-01-07-03A/B and CORE-01-04-09A.)

CORE-01-04-12D Move Adjacency Requirement (Canonical):
A Move is legal only if Adjacent(sourceTile, destinationTile) = true using the current topology’s adjacency definition (CORE-01-00-T01..T03).

## FormalizeInfluence

CORE-01-04-13 FormalizeInfluence may be chosen as the Political Action.
CORE-01-04-14 FormalizeInfluence is performed via a Committee tile.

CORE-01-04-14A Start Committee Override: If selected Committee is Start Committee, resolve per CORE-01-08-07..CORE-01-08-10A instead of CORE-01-04-15..CORE-01-04-19.

CORE-01-04-14B Start Committee Formalize — Legality and Failure: Selecting Start Committee is legal only if (a) CORE-01-08-02 satisfied, (b) player has not used Start Committee formalization (CORE-01-08-07), (c) player can fully pay CORE-01-08-08 cost, and (d) Influence Cap Check CORE-01-08-10A passes. If any fail, action is invalid and does not resolve; no state change occurs (CORE-01-06-00-03).

CORE-01-04-15 Standard Committee cost: pay 2 Resources of different resorts.

CORE-01-04-15A Declaration + Atomic Payment (Canonical): active player MUST declare the two paid Resources (their resorts) before any Resource movement; declaration is locked. Payment is simultaneous; if full payment cannot be made, FormalizeInfluence fails and does not resolve; no state change occurs (CORE-01-06-00-03).

CORE-01-04-16 On success, move paid Resources from PersonalSupply[activePlayer] to Bank.
CORE-01-04-17 On success, create exactly one new Influence in PersonalSupply[activePlayer].

CORE-01-04-17A Influence Cap Check: If creating the new Influence would exceed the Influence cap, FormalizeInfluence does not resolve; no state change occurs (CORE-01-04-19).

CORE-01-04-18 FormalizeInfluence fails if required Resources cannot be fully paid.
CORE-01-04-19 If FormalizeInfluence fails, no state change occurs.

## ConvertResources

CORE-01-04-20 ConvertResources may be chosen as the Political Action.
CORE-01-04-21 ConvertResources is performed via a Grassroots tile.
CORE-01-04-22 ConvertResources cost and effect are defined by the specific Grassroots tile text.

CORE-01-04-22A Output Unit: ConvertResources produces exactly 1 Resource as output per successful action, unless the Grassroots tile text explicitly specifies multiple outputs.

CORE-01-04-22B Availability (Control Requirement): ConvertResources is legal only if active player currently controls at least one Grassroots tile in Board; otherwise ConvertResources may not be chosen.

CORE-01-04-22C Repeat Penalty (Meta-Marker): If, when ConvertResources begins resolution, the active player’s Meta-Marker is on any Tile with mode = Convert, increase conversion cost by +1 additional Resource. The player chooses the resort for this +1 as part of locked cost declaration. Applies regardless of which Grassroots tile is used this time.

CORE-01-04-22D Convert Anchor Selection: select exactly one Grassroots tile that the active player currently controls; that tile is the Convert Anchor for this resolution.

CORE-01-04-22E Meta-Marker Placement: after successful ConvertResources, place Meta-Marker onto the Convert Anchor and set mode = Convert (removing it from any prior Tile).

CORE-01-04-22F Meta-Marker Expiry: Reserved. (Persistence/return governed by CORE-01-07-03A/B and CORE-01-04-09A.)

CORE-01-04-22G ConvertRecipe Requirement: Each Grassroots Tile MUST provide a machine-readable ConvertRecipe (inputs + outputs) matching printed text. If selected Grassroots has no ConvertRecipe, ConvertResources is invalid and does not resolve; no state change occurs (CORE-01-06-00-03).

CORE-01-04-22H Core Grassroots Definitions (Normative): CORE-01 MUST include complete normative definition for every Grassroots tile used (incl. ADD56): printed text + ConvertRecipe. If absent, ConvertResources is undefined and may not be executed.

CORE-01-04-22I Grassroots Tile Kinds (Canonical): Each Grassroots is exactly one of (a) Untyped, or (b) Typed with type tag T ∈ {DOM, FOR, INF}. Untyped share CORE-01-04-22K. Typed share CORE-01-04-22L (substitute T).

CORE-01-04-22J Declaration, Payment, Failure (Canonical): active player MUST declare recipe variant and required choices (incl. output resort where applicable), plus any +1 penalty resource (CORE-01-04-22C) before any Resource movement; declaration is locked. If full payment cannot be made, ConvertResources fails and does not resolve; no state change occurs (CORE-01-06-00-03). On success: move paid inputs to Bank, then move output Resource(s) from Bank to PersonalSupply[activePlayer].

CORE-01-04-22K Untyped Grassroots — Printed Text + ConvertRecipe (Normative):
Printed text: “Convert 3 Resources into 1 Resource of your choice.”
ConvertRecipe (single variant): Inputs: 3× Resource(any). Outputs: 1× Resource(output chosen by active player; output ∈ {DOM, FOR, INF}).

CORE-01-04-22L Typed Grassroots — Printed Text + ConvertRecipe (Normative): Let T be the printed type tag.
Printed text: “Convert 2 Resources into 1 {T} Resource. Or convert 3 Resources into 1 Resource of your choice, but not {T}.”
ConvertRecipe (two variants; choose exactly one in locked declaration):
Variant A (Typed): Inputs 2× Resource(any); Outputs 1× Resource(resort = T).
Variant B (Off-Type 3:1): Inputs 3× Resource(any); Outputs 1× Resource(output chosen; output ∈ {DOM, FOR, INF} and output ≠ T).
Legality: If declared output = T, Variant B is illegal; Variant A MUST be used.

CORE-01-04-22L.1 Illegal Declaration Handling (Canonical): If an illegal variant/output is declared (incl. Variant B with output = T), ConvertResources is invalid and does not resolve; no state change occurs (CORE-01-06-00-03).

---

# CORE-01-05 CONTROL

CORE-01-05-01 A player controls a Tile iff computeMajority(Tile) returns that player (CORE-01-05-03A).
CORE-01-05-02 If computeMajority(Tile) returns None (tie), no player controls that Tile.
CORE-01-05-03 Control updates immediately after any Influence movement onto/off/between Board Tiles and immediately after any Tile placement into Board (adjacency-based modifiers can change).

CORE-01-05-03A Definition — computeMajority(Tile):
0) If Tile is Start Committee, return None; apply no modifiers.

1. For each player, totalInfluence = Influence on Tile + applicable modifiers. (In CORE-01, only Lobbyist adjacency applies, subject to CORE-01-05-04B.)
2. If exactly one player has strictly highest totalInfluence, return that player.
3. Otherwise return None.

CORE-01-05-04 Each Lobbyist adjacent to a Tile contributes +1 virtual Influence for majority calculation on that adjacent Tile.
CORE-01-05-04A Lobbyist Bonus Attribution: For target Tile X, each adjacent Lobbyist Tile L contributes +1 to the player who controls L; if L uncontrolled, contributes 0.
CORE-01-05-04B Lobbyist Self-Reference Exclusion: When computing majority for a Lobbyist Tile, apply no Lobbyist adjacency bonuses.
CORE-01-05-05 Lobbyist contribution applies only to majority calculation.
CORE-01-05-06 Lobbyist contribution does not create or move Influence objects.

---

# CORE-01-06 EFFECTS

CORE-01-06-00-01 Definition — “Effect”: Any rule-defined state change executed by resolving (a) Tile printed behavior (incl. Resort production), (b) triggered Tile behavior (e.g., Hotspot), (c) Political Action, or (d) Measure/Regulation instruction. In CORE-01 without expansions, there are no Measures/Regulations/Overlays/external modifiers beyond this document.
CORE-01-06-00-02 Paying costs, checking prohibitions, and applying modifiers are part of effect resolution.
CORE-01-06-00-03 If an Effect does not resolve, no partial state changes occur unless explicitly stated.

CORE-01-06-00-04 Effect Context (Tile Binding): An effect resolves with exactly one ContextTile (nullable).
CORE-01-06-00-05 ContextTile Assignment (Canonical):
(a) Political Action via a Tile (Committee/Grassroots/Start Committee): that Tile.
(b) Single-target Tile effect: that target Tile.
(c) Resort Production: producing ResortTile.
(d) Hotspot resolution: that Hotspot.
(e) Otherwise: null.
(f) PlaceOrMoveInfluence (Place/Move): destination Tile.

CORE-01-06-00-06 Multiple-Tile References: If an instruction references multiple Tiles, it must explicitly state which Tile is ContextTile; otherwise the effect is invalid and does not resolve.

## Hotspots

CORE-01-06-01 A Hotspot is “fully surrounded” when all adjacent positions are occupied by Tiles.
CORE-01-06-02 Full enclosure is checked immediately after a Tile is placed during DrawAndPlaceTile.
CORE-01-06-03 If full enclosure is detected, resolve Hotspot(s) immediately before proceeding to the Political Action phase of that turn.

CORE-01-06-03A Multiple Hotspots Order (Canonical): If multiple Hotspots become surrounded from the same placement, resolve them in ascending PositionKey(Hotspot.Position); later Hotspots see updated state.

CORE-01-06-03B Hotspot Single-Resolution Invariant (Canonical): Each Hotspot resolves at most once. After a resolution attempt (even if no Influence is placed or step (d) is prohibited), mark the Hotspot resolved; it MUST NOT resolve again. This resolved-marking is an explicit permitted state change even if no Influence is placed.

CORE-01-06-04 Hotspot resolution order (Canonical):
(a) Apply explicitly-defined pre-majority effects.
(b) Determine majority on the Hotspot.
(c) Evaluate applicable modifiers/prohibitions per Rule Hierarchy; if prohibited, skip (d) but still mark resolved.
(d) If a player has majority, attempt to place exactly one Influence for that player per CORE-01-06-05..07; otherwise do nothing.

CORE-01-06-05 If a player has majority on the Hotspot, place exactly one Influence on that Hotspot for the majority player.
CORE-01-06-06 Hotspot placement moves one Influence from that player’s PersonalSupply to the Hotspot Tile in Board.
CORE-01-06-07 If the majority player has no available Influence in PersonalSupply, placement cannot occur.
CORE-01-06-08 Hotspots do not produce Resources.

## Resort Production (Round Settlement only)

CORE-01-06-09 Resort Production is resolved only during Round Settlement.
CORE-01-06-10 Each ResortTile has a printed production value.
CORE-01-06-11 Produced amount is computed by CORE-01-06-16(a); winner(s) by CORE-01-06-16(b)/(c).
CORE-01-06-12 Produced Resources move from Bank to the production winner(s).
CORE-01-06-13 If highest totalInfluence on a ResortTile is 0, produce 0.
CORE-01-06-13A totalInfluence for Production: computed exactly as CORE-01-05-03A step (1) for that ResortTile.
CORE-01-06-14 If tie for highest totalInfluence and highest > 0, split production evenly among tied players.
CORE-01-06-15 Any remainder from tied production is moved to Noise.

CORE-01-06-16 Production Resolution Order (Canonical):
CORE-01-06-16-00 Modifier Collection Step: collect all applicable modifiers for this production instance before applying steps (a)–(c).

(a) Compute production output amount:

1. start with printed value
2. apply doubling effects (if any)
3. apply output modifiers (if any)
4. apply floors (min 0)

(b) Determine production winners via standard majority rules (incl. modifiers): unique highest -> single winner; tie for highest with highest > 0 -> tied winners; highest == 0 -> no winners.

(c) Distribute: single winner gets full amount; tied winners split evenly with remainder to Noise; if no winners produce 0.

CORE-01-06-17 If an effect-level prohibition applies to production, treat output as 0 and distribute nothing.

---

# CORE-01-07 ROUND STRUCTURE

CORE-01-07-01 A round is one complete player cycle in turn order.
CORE-01-07-02 After the last player completes a turn in a round, Round Settlement begins.
CORE-01-07-03 Round Settlement resolves Resort Production for all ResortTiles.

CORE-01-07-03A Meta-Marker Round Start: At the beginning of each Round, do not move Meta-Markers.
CORE-01-07-03B Meta-Marker Persistence: A Meta-Marker remains at its current location until updated or returned to PersonalSupply by a rule.
CORE-01-07-03C Meta-Marker Mode Reset: When a Meta-Marker is returned to PersonalSupply, set mode = None.
CORE-01-07-03D Resort Production Sweep Order (Canonical): During Round Settlement, resolve Resort Production for ResortTiles in Board in ascending PositionKey(ResortTile.Position).

---

# CORE-01-08 RESTRICTIONS

CORE-01-08-01 Influence cap: A player may not exceed 7 Influence objects total across all zones (PersonalSupply + Board).

CORE-01-08-02 Formalize timing gate: FormalizeInfluence may not be performed until, for every player, every Starting Influence assigned during Setup is in Board. Influence created by FormalizeInfluence is not Starting Influence.
CORE-01-08-03 This restriction applies to all Committees, including the Start Committee.

CORE-01-08-04 No Influence may be placed on the Start Committee.
CORE-01-08-05 The Start Committee cannot be controlled.
CORE-01-08-06 The Start Committee is immune to all effects, Measures, and Regulations.

CORE-01-08-06A Immunity Scope: When an action is performed via the Start Committee (including Start Committee formalization), ignore external modifiers that would prohibit execution, increase/alter costs, or reduce/alter output, unless explicitly stated to affect the Start Committee.
CORE-01-08-06B Immunity does not override CORE-01-08-02 and does not allow placing/moving Influence onto the Start Committee.

CORE-01-08-06C Start Committee Connectivity Clarification: Start Committee may be used as connector for adjacency-derived connectivity/paths. This does not allow Influence to enter/remain/be placed on Start Committee.
CORE-01-08-06C.1 Path/Connectivity definitions: A Path is a finite sequence of Tiles where consecutive pairs are Adjacent = true. Two Tiles are connected iff at least one Path exists between them.
CORE-01-08-06D Start Committee “Pass-Through” for Influence (Canonical):
The Start Committee may appear as an intermediate connector node in any adjacency-derived Path/Connectivity evaluation (CORE-01-08-06C.1). Influence is never placed on, moved onto, or remains on the Start Committee. If a rule permits movement/connectivity “through” the Start Committee, treat the Start Committee as transparent: the Influence changes only its source/destination Tile; no intermediate occupancy occurs.

CORE-01-08-06E Targeting Restriction: Start Committee may not be destination of PlaceOrMoveInfluence (Place) and may not be source/destination of PlaceOrMoveInfluence (Move). Meta-Marker placement governed by CORE-01-02-17C/17D.
CORE-01-08-06F Immunity Interpretation: Immunity applies to effects targeting/modifying Start Committee; it does not prohibit actions via Start Committee as explicitly defined (CORE-01-04-14A / CORE-01-08-07..10A).

CORE-01-08-07 Each player may FormalizeInfluence via the Start Committee at most once per game.
CORE-01-08-08 Start Committee formalization cost: pay 3 Resources of different resorts plus 1 additional Resource of any resort.
CORE-01-08-08A Declaration + Atomic Payment (Canonical): Apply CORE-01-04-15A using the cost in CORE-01-08-08.
CORE-01-08-09 Move all paid Resources from PersonalSupply[activePlayer] to Bank.
CORE-01-08-10 Create exactly one new Influence in PersonalSupply[activePlayer].
CORE-01-08-10A Influence Cap Check (Start Committee): If this would exceed the cap, action does not resolve; no state change occurs.

---

# CORE-01-09 END GAME

CORE-01-09-01 The game ends when no further Tiles can be drawn from DrawPile.

CORE-01-09-01A Final Settlement Trigger: If a player would begin DrawAndPlaceTile and DrawPile is empty, immediately begin final Round Settlement (CORE-01-07-03..03D) and then end the game (CORE-01-09-02). If DrawPile becomes empty during DrawAndPlaceTile before a Tile is placed, immediately begin final Round Settlement and end the game; skip the Political Action phase of that turn. Final Round Settlement uses the same sweep order (CORE-01-07-03D).

CORE-01-09-02 After the final Round Settlement completes, the game ends immediately.

CORE-01-09-03 Score = count of a player’s owned Influence objects in Board. Virtual Influence from Lobbyists is ignored for scoring. Highest score wins.
CORE-01-09-04 If tie for highest score, victory is shared.

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
VAR-01-01-04 If a drawn Tile cannot be legally placed, return it to DrawPile.
VAR-01-01-05 After returning the Tile to DrawPile, shuffle DrawPile (canonical shuffle applies).
VAR-01-01-06 After shuffling, immediately draw again as part of DrawAndPlaceTile.
VAR-01-01-07 Returned Tile Insertion (Canonical): Append returned Tile to bottom of DrawPile before shuffling.

VAR-01-01-08 TileRecycling Termination Guard: If during DrawAndPlaceTile there exists no unoccupied Position adjacent to any Tile in Board, then no Tile can be legally placed. Immediately treat DrawPile as empty for CORE-01-09-01A (final settlement then end).

VAR-01-02-01 FirstPlayerHandicap is an optional variant.
VAR-01-02-02 If active, starting player receives one fewer Starting Influence during setup.
VAR-01-02-03 Reduction applies after standard starting Influence assignment.
VAR-01-02-04 FirstPlayerHandicap modifies CORE-01-03-04.
VAR-01-02-05 FirstPlayerHandicap modifies CORE-01-03-05.
VAR-01-02-06 FirstPlayerHandicap modifies CORE-01-03-06.
VAR-01-02-07 If ADD56 is active, FirstPlayerHandicap also modifies ADD56-01-02-01.
VAR-01-02-08 If ADD56 is active, FirstPlayerHandicap also modifies ADD56-01-02-02.

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
ADD56-01-01-13A Added Grassroots Identity (Normative): The 2 added Grassroots tiles are Untyped ×2 and follow CORE-01-04-22K.

ADD56-01-01-14 Add Hotspot (DOM) ×1 to DrawPile.
ADD56-01-01-15 Add Hotspot (FOR) ×1 to DrawPile.
ADD56-01-01-16 These Hotspot labels do not modify Hotspot resolution rules.
ADD56-01-01-16A Hotspot Label Non-Semantics (Canonical): Labels are informational only and do not assign a Resort attribute. For ordering (CORE-01-03-02B key (2)), Hotspots use ResortOrder = None unless explicitly defined otherwise.

ADD56-01-02-01 For 5 players, assign 2 Influence to each player’s PersonalSupply during setup.
ADD56-01-02-02 For 6 players, assign 2 Influence to each player’s PersonalSupply during setup.

ADD56-01-03-00-01 Influence cap adjustment: For 5 players, cap = 8. For 6 players, cap = 8. This overrides CORE-01-08-01 while ADD56 is active.
ADD56-01-03-01 All other CORE-01 rules remain unchanged while the 5–6 Player Add-On is active.

---
