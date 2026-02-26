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
