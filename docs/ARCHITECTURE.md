# Syntax system architecture

Syntax is a **local-first capability shell** with optional governed remote
connectors. The Mac runtime owns local file access and native actions. Cloud
services never receive local content unless the user explicitly invokes a
configured capability that requires it.

## Planes

1. Experience — command surface, modules, results and explanations.
2. Local runtime — indexer, SQLite FTS, watcher and native actions.
3. Capability — skills, recipes, styles, memory and policy.
4. Execution — workers, scheduler, leases, retry, DLQ and receipts.
5. Connector — apps, MCP, models, GitHub, Drive and Supabase.
6. Evidence — immutable receipts, readback, telemetry and truth states.

## Trust boundary

- Mac content remains local by default.
- Personal secrets live in macOS Keychain.
- Organisation secrets are references to a governed store.
- Remote connectors use least privilege and retain source permissions.
- Every mutation requires authority, idempotency, receipt and readback.

## Runtime contract

`EVENT → WAKE → CLAIM → EXECUTE → TEST → VALIDATE → RECEIPT → READBACK → SLEEP`

Every worker requires an idempotency key, exclusive lease, retry budget, DLQ,
heartbeat, checkpoint, duplicate detection, pause/kill, compensating action,
immutable receipt, recovery owner and quarantine threshold.

## Initial topology

- `Syntax.app` — Mac shell and global shortcut.
- `syntax-indexer` — launch agent and incremental index.
- SQLite FTS5 — local catalogue and activity ledger.
- Signed loopback API — app-to-runtime contract.
- Optional HTTPS gateway — remote services only.
- Web console — product, account and team administration.

The web console cannot directly open or index Mac files. Those operations are
owned by the signed local runtime.
