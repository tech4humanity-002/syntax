# Syntax

**Make your machine work in your language.**

Syntax is a local-first command, search and automation workspace spanning files,
skills, models, MCP servers, apps, workers, recipes, schedules, history, styles,
memory and usage. This repository is the canonical home for **Syntax by Synal**.

Architecture and product design are approved. The first live local runtime now
provides SQLite FTS indexing, deterministic search, duplicate classification,
CLI access and JSON execution receipts.

## Surfaces

`/search` `/skills` `/bring-your-own` `/apps` `/mcp` `/workers` `/recipes`
`/scheduler` `/history` `/styles` `/memory` `/usage`

## Run

```bash
npm install
npm run check
npm run build
```

```bash
npm run runtime:index -- "$HOME/Documents" "$HOME/Library/CloudStorage"
npm run runtime:search -- "widget register"
```

See [architecture](docs/ARCHITECTURE.md), [product design](docs/PRODUCT_DESIGN.md),
[security](docs/SECURITY.md), [resale pack](docs/RESALE_PACK.md) and the
[post-design gate](docs/POST_DESIGN_GATE.md).

No interface claim is real until a runtime action produces a receipt and
independent readback. Demonstration content is labelled `DESIGN_DATA`.
