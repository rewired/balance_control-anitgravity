# ARCH-02 — STATE SHAPE CONTRACT
Version: 1.1
Status: Normative

## PURPOSE
Define canonical state structure aligned with SPEC-CORE-01.

## ZONE MODEL
Every object exists in exactly one zone.
Zones are authoritative containers.

## CORE ZONES
Influence: PersonalSupply, Board
Resources: PersonalSupply, Bank, Noise
Tiles: DrawPile, Board, DiscardFaceUp

## EXPANSION ZONES
Each expansion defines isolated zones.
Cross-expansion mixing is forbidden unless explicitly defined.

## SERIALIZATION
State must be fully serializable.
No computed fields may persist in authoritative state.
