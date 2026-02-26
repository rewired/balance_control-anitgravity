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
  2. zero or more `action` records
  3. zero or more `checkpoint` records (optional MVP)
  4. `footer` (exactly once, last line)

## 3. Record Types

Each line object MUST contain `recordType` with one of:

- `header`
- `action`
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

### 3.3 `checkpoint` (optional MVP)

Required fields:

- `recordType`: `"checkpoint"`
- `stateHash`: string

Optional recommended field:

- `afterSeq`: integer (`>= 0`), linking the checkpoint to the last applied action sequence.

Rules:

- `checkpoint` is optional in MVP and may be emitted at implementation-defined cadence.
- If present, `stateHash` MUST be produced with the canonical deterministic hashing pipeline.

### 3.4 `footer`

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
- `footer.totalActions` equals action count

## 6. Minimal Example (NDJSON)

```json
{"recordType":"header","schemaVersion":"1","seed":"seed-123","matchConfig":{"players":2},"expansions":["exp01","exp03"]}
{"recordType":"action","seq":1,"player":"0","moveType":"playCard","args":{"cardId":"C-001","tile":"A1"},"turn":0,"phase":"main"}
{"recordType":"checkpoint","afterSeq":1,"stateHash":"sha256:abc..."}
{"recordType":"footer","finalStateHash":"sha256:def...","totalActions":1}
```
