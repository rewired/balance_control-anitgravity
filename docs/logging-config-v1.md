# Logging Configuration Specification v1

## 1. Scope

This document defines the v1 configuration contract for logging.

## 2. Configuration Namespace

### 2.1 Top-Level

The root logging object is:

- `logging`

### 2.2 Defined v1 Subtree

The v1 subtree defined by this specification is:

- `logging.replay`

### 2.3 Reserved for Future Versions

The following namespaces are reserved in v1 and MUST NOT be treated as errors if present:

- `logging.console`
- `logging.file`
- `logging.redaction`

## 3. v1 Example Schema

```json
{
  "logging": {
    "enabled": true,
    "level": "info",
    "replay": {
      "enabled": true,
      "format": "ndjson",
      "directory": "./var/replays",
      "flushEveryEvents": 1,
      "includeStateHash": true,
      "maxFileSizeMB": 64,
      "rotate": "match"
    }
  }
}
```

## 4. Field Contract (v1)

### 4.1 `logging`

- `enabled`: boolean
- `level`: string (implementation-defined level vocabulary in v1)
- `replay`: object (see section 4.2)

### 4.2 `logging.replay`

- `enabled`: boolean
- `format`: string, **MUST be `ndjson` in v1**
- `directory`: string path
- `flushEveryEvents`: integer >= 1
- `includeStateHash`: boolean
- `maxFileSizeMB`: integer >= 1
- `rotate`: string (`match` in v1 baseline)

## 5. Forward-Compatibility Rule

Unknown fields are allowed for forward compatibility.

Normative behavior:

1. Unknown fields MUST be tolerated (must not fail configuration loading by default).
2. Unknown fields MUST be logged as informational compatibility notices.
3. Known fields retain strict type/value validation as defined by this v1 contract.

## 6. Version Constraint Notes

- `logging.replay.format` is intentionally constrained to `ndjson` for v1 to ensure deterministic replay-log parsing contracts and a single canonical interchange shape.
- Additional formats may be introduced in future versions with explicit versioned documentation updates.

## 7. Source Precedence and Merge Semantics (v1)

### 7.1 Canonical Resolution Order

When a runtime value is present from multiple sources, the winner MUST be chosen by this strict order (highest precedence first):

1. CLI flags (if provided)
2. Environment variables (`BC_LOGGING__REPLAY__...`)
3. `conf.json`
4. Internal defaults

The final effective configuration is the deterministic merge result of this order.

### 7.2 Source Behavior by Layer

- **CLI flags:** sparse override layer; only explicitly provided flags override lower layers.
- **Environment variables:** sparse override layer mapped into config paths via section 8.
- **`conf.json`:** baseline persisted configuration source.
- **Internal defaults:** fallback values for all unspecified fields.

## 8. Environment Mapping Convention (v1)

### 8.1 Path Encoding Rule

Environment variable names MUST use the prefix `BC_` and encode nested object paths with a double underscore (`__`) separator.

- Segment separator: `__`
- Case convention: uppercase segments
- Example path: `logging.replay.includeStateHash` → `BC_LOGGING__REPLAY__INCLUDESTATEHASH`

### 8.2 Canonical Examples

- `BC_LOGGING__REPLAY__ENABLED`
- `BC_LOGGING__REPLAY__DIRECTORY`
- `BC_LOGGING__REPLAY__INCLUDESTATEHASH`

## 9. Type Conversion and Failure Policy (v1)

Type conversion MUST happen independently per source before merge completion. Conversion failures are startup-fatal for known fields.

### 9.1 Internal Defaults

- Source form: native typed values.
- Conversion: none (already typed).
- Failure behavior: implementation bug; startup MUST fail with a clear message naming the invalid default key.

### 9.2 `conf.json`

- Source form: JSON primitives.
- Conversion: JSON parser value type MUST match the contract type.
- Failure behavior:
  - Invalid JSON syntax: startup MUST fail with parse error and file location context.
  - Known key with wrong type/range/value: startup MUST fail with clear key-specific validation message.

### 9.3 Environment Variables

- Source form: strings.
- Conversion rules:
  - boolean: case-insensitive `true|false` only
  - integer: base-10 whole number (`^-?[0-9]+$`) then range check
  - string: raw value (non-empty checks only where the field contract requires it)
- Failure behavior:
  - Invalid boolean (for example `maybe`) MUST fail startup with an error like `Invalid boolean for BC_LOGGING__REPLAY__ENABLED`.
  - Invalid integer or out-of-range value MUST fail startup with an error naming the exact env key and expected constraint.

### 9.4 CLI Flags

- Source form: parser-provided tokens.
- Conversion rules: same target-type constraints as environment variables and `conf.json`.
- Failure behavior:
  - Unknown flag: startup MUST fail with usage help.
  - Known flag with invalid value/type: startup MUST fail with clear flag-specific validation message.

### 9.5 Unknown Keys by Source

- Unknown `logging.*` keys from CLI/ENV/`conf.json` remain non-fatal and MUST be logged as informational compatibility notices.
- Unknown keys MUST NOT silently override known typed fields.
