# ARCH-04 — LLM BOT CONTRACT
Version: 1.1
Status: Normative

## PURPOSE
Define deterministic interface for LLM-driven bots.

## INTERACTION MODEL
Bot operates exclusively via enumerateLegalIntents.
Bot selects only from enumerated legal intents.

## RESTRICTIONS
Bot must not inspect internal engine structures.
Bot must not bypass move validation.

## DETERMINISM
Bot decisions must not introduce nondeterministic state.
All randomness must originate from engine RNG.
