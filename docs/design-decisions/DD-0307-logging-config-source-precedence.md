# DD-0307 — Logging config source precedence and ENV mapping

- Status: Accepted
- Date: 2026-02-26
- Task: 0307

## Context

The logging v1 configuration spec needed a deterministic source-precedence contract and explicit conversion/failure behavior per source. Without this contract, different runtimes could load identical inputs differently.

## Decision

1. Define a strict precedence order for effective logging configuration: CLI flags > ENV > `conf.json` > internal defaults.
2. Define an ENV path mapping convention using `BC_` prefix and double underscore (`__`) as path separator.
3. Keep unknown keys forward-compatible and non-fatal across CLI/ENV/`conf.json`, while still logging informational compatibility notices.
4. Treat known-key type/value violations as startup-fatal with clear key-specific messages.

## Consequences

- Configuration resolution is deterministic and auditable across deployment environments.
- Operators can override persistent config safely with temporary ENV/CLI layers.
- Misconfigurations fail fast at startup instead of producing partial runtime behavior.
- Future config expansion remains compatible through unknown-key tolerance.
