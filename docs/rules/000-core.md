# BALANCE // CONTROL

# CORE-01 Simulation Specification (Atomic, Deterministic)

Version: 01
Scope: Core Rules v1.0.21 only with variants (no expansions)

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
CORE-01-00-03 Influence zones are: PersonalSupply, Board.
CORE-01-00-04 Resource zones are: PersonalSupply, Bank, Noise.
CORE-01-00-05 Tile zones are: DrawPile, Board, DiscardFaceUp.
CORE-01-00-06 No object may exist in multiple zones simultaneously.
CORE-01-00-07 The board uses a topology parameter that defines adjacency between Tiles.
CORE-01-00-08 Any rule that references adjacency uses the current topology’s adjacency definition.
CORE-01-00-09 A topology attachment must be defined before game start.
CORE-01-00-10 The topology attachment specifies how adjacency between Tiles is determined.
CORE-01-00-11 The topology attachment does not modify any other rule.
CORE-01-00-12 Expansion-specific zones
If an expansion introduces additional zones (e.g., Measure zones), those zones exist separately per expansion.
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
CORE-01-00-T07 Neighbor Positions
A topology implementation must define NeighborPositions(Position) → ordered list of adjacent Positions.
CORE-01-00-T08 Canonical Position Order
A topology implementation must define PositionKey(Position) → a deterministic total-order key used for canonical ordering.

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
CORE-01-02-08 Lobbyists contribute virtual Influence for majority calculation only.
CORE-01-02-09 Hotspots resolve when fully surrounded.

CORE-01-02-10 Core tile counts (DOM ResortTiles): W1×2, W2×4, W3×4, W4×1, W5×1.
CORE-01-02-11 Core tile counts (FOR ResortTiles): W1×2, W2×4, W3×4, W4×1, W5×1.
CORE-01-02-12 Core tile counts (INF ResortTiles): W1×2, W2×4, W3×4, W4×1, W5×1.
CORE-01-02-13 Core tile counts (Committees): ×10.
CORE-01-02-14 Core tile counts (Grassroots): ×8.
CORE-01-02-15 Core tile counts (Lobbyists): ×9.
CORE-01-02-16 Core tile counts (Hotspots): ×8.
CORE-01-02-17 ResortTiles have printed production value equal to their W number.
CORE-01-02-17A Each player has exactly one Meta-Marker (Cooldown Token).
CORE-01-02-17B A Meta-Marker is not Influence, not a Resource, and not an Overlay.
CORE-01-02-17C A Meta-Marker exists either in the owning player’s PersonalSupply or on exactly one Tile in Board.
CORE-01-02-17D A Meta-Marker may be placed on the Start Committee despite Start Committee immunity.

---

# CORE-01-03 SETUP

CORE-01-03-01 Setup places the Start Committee tile into Board.
CORE-01-03-02 Setup shuffles all non-Start tiles into DrawPile.
CORE-01-03-02A Deterministic Randomness Contract
All randomization in CORE-01 (shuffles, starting player selection) MUST use a deterministic RNG seeded at game start, and the seed MUST be part of the initial game state.
CORE-01-03-02B Canonical Pre-Shuffle Ordering
Before any shuffle, build the initial DrawPile list in a canonical order: sort by (TileType, Resort if any, W value if any), and within identical entries by an increasing serial index.
CORE-01-03-03 Setup determines a starting player.
CORE-01-03-03A Turn Order
Turn order is fixed for the entire game: starting player acts first, then players act in ascending seat order wrapping around.

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
CORE-01-04-06 If the drawn Tile cannot be legally placed, move it from DrawPile to DiscardFaceUp.
CORE-01-04-07 If a Tile is moved to DiscardFaceUp due to illegality, the player immediately draws again from DrawPile.
CORE-01-04-08 A tile may be placed only on an unoccupied Position in the current topology.

CORE-01-04-09 ExactlyOnePoliticalAction allows exactly one action type from: PlaceOrMoveInfluence, FormalizeInfluence, ConvertResources.

CORE-01-04-10 PlaceOrMoveInfluence may be chosen as the Political Action.
CORE-01-04-11 PlaceOrMoveInfluence (Place) moves exactly one Influence from the active player’s PersonalSupply to Board on a chosen Tile.
CORE-01-04-11A PlaceOrMoveInfluence (Place) Legality
Place is legal only if the active player has at least one Influence in PersonalSupply and the chosen Tile is not prohibited by restrictions (e.g., Start Committee per CORE-01-08-04/06E).
CORE-01-04-12 PlaceOrMoveInfluence (Move) moves exactly one active-player-owned Influence from a source Board Tile to a different destination Board Tile. The Start Committee may not be source or destination (CORE-01-08-06E).
CORE-01-04-12A PlaceOrMoveInfluence (Move) Meta-Marker Placement
After a successful PlaceOrMoveInfluence (Move) resolution, place the active player’s Meta-Marker onto the source Tile (the Tile the Influence was moved from).
If the Meta-Marker was previously on another Tile, remove it from that Tile.

CORE-01-04-12B PlaceOrMoveInfluence (Move) Ping-Pong Classification
If, at the moment PlaceOrMoveInfluence (Move) begins resolution, the active player’s Meta-Marker is on the destination Tile of that move, then that move is a Ping-Pong Move.
If the move is a Ping-Pong Move, set the Meta-Marker’s mode to PingPong for the remainder of the Round.
If the move is not a Ping-Pong Move, set the Meta-Marker’s mode to Shift for the remainder of the Round.

CORE-01-04-12C PlaceOrMoveInfluence (Move) Meta-Marker Expiry
A Meta-Marker placed or updated due to PlaceOrMoveInfluence (Move) expires at the beginning of the next Round and is returned to its owner’s PersonalSupply.

CORE-01-04-13 FormalizeInfluence may be chosen as the Political Action.
CORE-01-04-14 FormalizeInfluence is performed via a Committee tile.
CORE-01-04-14A Start Committee Override
If the selected Committee tile is the Start Committee, resolve FormalizeInfluence using CORE-01-08-07 through CORE-01-08-10 instead of CORE-01-04-15 through CORE-01-04-19.
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

CORE-01-04-22A ConvertResources Output Unit
ConvertResources produces exactly 1 Resource object as output per successful ConvertResources action.
If a Grassroots tile text specifies multiple output Resource objects, that tile text overrides this rule.

CORE-01-04-22B ConvertResources Availability (Control Requirement)
ConvertResources is legal only if the active player currently controls at least one Grassroots tile in Board.
If the active player controls zero Grassroots tiles, ConvertResources may not be chosen as the Political Action.

CORE-01-04-22C ConvertResources Repeat Penalty (Meta-Marker)
If, at the moment ConvertResources begins resolution, the active player’s Meta-Marker is currently on any Tile (i.e., not in that player’s PersonalSupply) with mode Convert, then increase the conversion cost by +1 additional Resource of any resort.
This penalty applies regardless of which controlled Grassroots tile is selected for the current ConvertResources action.

CORE-01-04-22D ConvertResources Convert Anchor Selection
When resolving ConvertResources, the active player must select exactly one Grassroots tile that the active player currently controls.
This selected tile is the Convert Anchor for this ConvertResources resolution.

CORE-01-04-22E ConvertResources Meta-Marker Placement
After a successful ConvertResources resolution, place the active player’s Meta-Marker onto the selected Convert Anchor tile and set its mode to Convert.
If the Meta-Marker was previously on another Tile, remove it from that Tile.

CORE-01-04-22F ConvertResources Meta-Marker Expiry
A Meta-Marker placed or updated due to ConvertResources expires at the beginning of the next Round and is returned to its owner’s PersonalSupply.

CORE-01-04-22G Grassroots ConvertRecipe Requirement
For engine implementations, each Grassroots Tile MUST provide a machine-readable ConvertRecipe descriptor (inputs + outputs) that exactly matches its printed text.
If the selected Grassroots Tile has no ConvertRecipe descriptor, ConvertResources is invalid and does not resolve (CORE-01-06-00-03).

---

# CORE-01-05 CONTROL

CORE-01-05-01 A player controls a Tile iff computeMajority(Tile) returns that player (CORE-01-05-03A).
CORE-01-05-02 If computeMajority(Tile) returns None (tie), no player controls that Tile (CORE-01-05-03A).
CORE-01-05-03 Control updates immediately after any Influence movement onto, off, or between Board Tiles.

CORE-01-05-03A Definition — computeMajority(Tile)

computeMajority(Tile):

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
CORE-01-06-04 Hotspot resolution follows this order:
(a) Apply any pre-majority effects explicitly defined as occurring “before majority determination.”
(b) Determine majority on that Hotspot.
(c) Resolve majority outcome.
(d) Apply effect modifiers and prohibitions according to Rule Hierarchy.
CORE-01-06-05 If a player has majority on the Hotspot, place exactly one Influence on that Hotspot for the majority player.
CORE-01-06-06 Hotspot placement moves one Influence from that player’s PersonalSupply to the Hotspot Tile in Board.
CORE-01-06-07 If the majority player has no available Influence in PersonalSupply, Hotspot placement cannot occur.
CORE-01-06-08 Hotspots do not produce Resources.

CORE-01-06-09 Resort Production is resolved only during Round Settlement.
CORE-01-06-10 Each ResortTile has a printed production value.
CORE-01-06-11 When a player controls a ResortTile, that ResortTile produces Resources equal to its printed production value.
CORE-01-06-12 Produced Resources are moved from Bank to the controlling player’s PersonalSupply.
CORE-01-06-13 If no player controls a ResortTile, that ResortTile produces no Resources.
CORE-01-06-13A Zero-Influence Production
If the highest totalInfluence on a ResortTile is 0 (i.e., no player has any Influence/modifier advantage on that tile), that ResortTile produces 0 Resources.
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
4. Apply Ping-Pong reduction, if applicable:
If the production winner determined in step (b) is exactly one player and that player’s Meta-Marker mode is PingPong, reduce this production output to 50% (rounded down) and cap it at a maximum of 10.
5. Apply floors (minimum 0).

(b) Determine highest totalInfluence on that Tile using the standard majority rules (including modifiers). If the unique highest player exists, that player is the production winner. If multiple players tie for highest and highest > 0, those players are tied production winners. If highest == 0, there are no production winners.

(c) Distribute the produced Resources:
- If there is exactly one production winner, that player receives the full amount.
- If no player controls the Tile, produce 0.
- If there are tied production winners (highest > 0), split evenly; any remainder is moved to Noise.

CORE-01-06-17 If an effect-level prohibition applies to production (e.g., “Blockade”), production output is treated as 0 and no Resources are distributed.

---

# CORE-01-07 ROUND STRUCTURE

CORE-01-07-01 A round consists of one complete player cycle in turn order.
CORE-01-07-02 After the last player completes a turn in a round, Round Settlement begins.
CORE-01-07-03 Round Settlement resolves Resort Production for all ResortTiles.
CORE-01-07-03A Meta-Marker Return Step (Round Start)
At the beginning of each Round, before any player takes a turn, return every Meta-Marker currently on Board to its owner’s PersonalSupply.

CORE-01-07-03B Meta-Marker Duration
A Meta-Marker placed during a Round remains on its Tile for at most that Round and is returned at the beginning of the next Round.
CORE-01-07-03C Meta-Marker Mode Reset
When a Meta-Marker is returned at the beginning of a Round, set its mode to None.

---

# CORE-01-08 RESTRICTIONS

CORE-01-08-01 A player may not exceed 7 Influence objects in total.

CORE-01-08-02 FormalizeInfluence may not be performed until all players have placed all of their Starting Influence onto the Board.
CORE-01-08-03 This restriction applies to all Committees, including the Start Committee.

CORE-01-08-04 No Influence may be placed on the Start Committee.
CORE-01-08-05 The Start Committee cannot be controlled.
CORE-01-08-06 The Start Committee is immune to all effects, Measures, and Regulations.

CORE-01-08-06A Immunity Scope:
When an action is performed via the Start Committee (including Start Committee formalization),
ignore any external modifiers that would:
(a) prohibit execution (e.g., Blockade),
(b) increase or alter costs,
(c) reduce or alter output,
unless that modifier explicitly states it affects the Start Committee.

CORE-01-08-06B The Start Committee’s immunity does not override CORE-01-08-02 (timing restriction) and does not allow placing or moving Influence onto the Start Committee.

CORE-01-08-06C Start Committee Connectivity Clarification
The Start Committee may be used as a connector when evaluating adjacency-derived connectivity or paths between Tiles.
This does not allow any Influence object to enter, remain on, or be placed on the Start Committee.

CORE-01-08-06D Start Committee “Pass-Through” Prohibition for Influence
If any rule evaluates a path that includes the Start Committee, treat the Start Committee as a connector node only.
Influence does not move onto or off of the Start Committee as an intermediate step.

CORE-01-08-06E Start Committee Targeting Restriction
The Start Committee may not be the source or destination of PlaceOrMoveInfluence.
This does not restrict placing a Meta-Marker on the Start Committee as defined elsewhere in CORE-01.

CORE-01-08-07 Each player may FormalizeInfluence via the Start Committee at most once per game.
CORE-01-08-08 Start Committee formalization cost requires paying 3 Resources of different resorts plus 1 additional Resource of any resort.
CORE-01-08-09 Start Committee formalization moves all paid Resources from the active player’s PersonalSupply to Bank.
CORE-01-08-10 Start Committee formalization creates exactly one new Influence in the active player’s PersonalSupply.
CORE-01-08-10A Influence Cap Check (Start Committee)
Start Committee formalization does not resolve if it would cause the active player to exceed the Influence cap (CORE-01-08-01 / ADD56-01-03-00-01). In that case, no state change occurs.

---

# CORE-01-09 END GAME

CORE-01-09-01 The game ends when no further Tiles can be drawn from DrawPile.
CORE-01-09-01A Final Settlement Trigger
If a player would begin DrawAndPlaceTile and DrawPile is empty, immediately begin the final Round Settlement (CORE-01-07-02) and then end the game (CORE-01-09-02).
CORE-01-09-02 After the final Round Settlement completes, the game ends immediately.
CORE-01-09-03 The player with the highest total Influence on Board wins.
CORE-01-09-04 If two or more players tie for highest total Influence on Board, victory is shared.

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
