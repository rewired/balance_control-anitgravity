# Replay Format Specification v1

## 1. Scope

This document defines the canonical **Replay Format v1** record model for deterministic match replays.

Normative goals:

- stable machine parsing for replay consumers
- deterministic serialization for reproducible hashing and comparisons
- explicit record taxonomy with minimal required fields

## 2. Container and Encoding

- Replay files MUST use UTF-8 text.
- Replay files MUST use NDJSON (one JSON object per line).
- Exactly one record object per line.
- Record ordering in file MUST be:
  1. `header` (exactly once, first line)
  2. zero or more body records (`action`, `system.roundSettlement`, `checkpoint`) in deterministic engine emission order
  3. `footer` (exactly once, last line)

## 3. Record Types

Each line object MUST contain `recordType` with one of:

- `header`
- `action`
- `system.roundSettlement`
- `checkpoint`
- `footer`

### 3.1 `header`

Required fields:

- `recordType`: `"header"`
- `schemaVersion`: string literal `"1"`
- `seed`: string
- `matchConfig`: object
- `expansions`: string[]

Rules:

- `schemaVersion` identifies replay schema compatibility, independent from runtime config file versions.
- `seed` MUST be the deterministic match seed used by the engine RNG.
- `matchConfig` MUST contain only replay-relevant deterministic configuration.
- `expansions` MUST be canonicalized (stable order, no duplicates).

### 3.2 `action`

Required fields:

- `recordType`: `"action"`
- `seq`: integer (`>= 1`, strictly increasing by 1)
- `player`: string
- `moveType`: string
- `args`: JSON value (object/array/scalar as move payload)
- `turn`: integer (`>= 0`)
- `phase`: string

Rules:

- `seq` is the canonical action index for deterministic replay iteration.
- `args` MUST include only deterministic move inputs; no ephemeral UI-only fields.


### 3.3 `system.roundSettlement`

Required fields:

- `recordType`: `"system.roundSettlement"`
- `roundNumber`: integer (`>= 1`)
- `settlementKind`: `"regular" | "final"`
- `resortTileOrder`: string[]

Optional field:

- `stateHash`: string (only when replay sink runs with `includeStateHash`)

Rules:

- Emitted for engine-driven round settlement passes that are not direct player actions.
- `resortTileOrder` MUST be the exact deterministic execution order used by the settlement resolver.
- Record payload MUST NOT include timestamps or non-deterministic IDs.

### 3.4 `checkpoint` (optional MVP)

Required fields:

- `recordType`: `"checkpoint"`
- `stateHash`: string

Optional recommended field:

- `afterSeq`: integer (`>= 0`), linking the checkpoint to the last applied action sequence.

Rules:

- `checkpoint` is optional in MVP and may be emitted at implementation-defined cadence.
- If present, `stateHash` MUST be produced with the canonical deterministic hashing pipeline.

### 3.5 `footer`

Required fields:

- `recordType`: `"footer"`
- `finalStateHash`: string
- `totalActions`: integer (`>= 0`)

Rules:

- `totalActions` MUST equal the number of emitted `action` records.
- `finalStateHash` MUST match the terminal deterministic state hash after all actions are applied.

## 4. Deterministic Serialization Rules

Replay writers MUST serialize payloads deterministically:

1. Object keys MUST be emitted in stable lexicographic order at every nesting level.
2. Arrays MUST preserve semantic order from the engine; no reordering during serialization.
3. Numeric and boolean values MUST be serialized as canonical JSON primitives.
4. No pretty-print indentation (single-line JSON per record).
5. No replay-relevant wall-clock timestamps or local-time dependent fields inside replay records.

Clarification:

- Operational metadata (for example filename timestamp in storage paths) is allowed outside record payloads, but MUST NOT influence replay execution or hash verification.

## 5. Validation Invariants

A Replay v1 file is valid iff:

- one `header` exists and is first
- one `footer` exists and is last
- every non-boundary line has `recordType` in the allowed set
- `action.seq` is contiguous and strictly increasing
- `system.roundSettlement` payload fields satisfy the deterministic schema
- `footer.totalActions` equals action count

## 6. Minimal Example (NDJSON)

```json
{"recordType":"header","schemaVersion":"1","seed":"seed-123","matchConfig":{"players":2},"expansions":["exp01","exp03"]}
{"recordType":"action","seq":1,"player":"0","moveType":"playCard","args":{"cardId":"C-001","tile":"A1"},"turn":0,"phase":"main"}
{"recordType":"system.roundSettlement","roundNumber":1,"settlementKind":"regular","resortTileOrder":["tile-a","tile-b"]}
{"recordType":"checkpoint","afterSeq":1,"stateHash":"sha256:abc..."}
{"recordType":"footer","finalStateHash":"sha256:def...","totalActions":1}
```

## 7. Operational Verification CLI (Quick Repro)

Repository provides a fail-fast verifier for fast bug ticket reproduction:

- command: `pnpm replay:verify -- <path-to-replay.ndjson>`
- optional: `--verify-checkpoints`
- optional: `--verify-final-hash`

Behavior:

1. read `header` and initialize the match with identical seed/config
2. execute `action` records in strict sequence
3. optionally verify checkpoint/footer hashes
4. abort at first divergence with sequence number and diagnosis
