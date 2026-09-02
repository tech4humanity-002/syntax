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
npm run runtime:graph
```

The graph command is a local-first corpus compiler. It can be pointed at Mac
folders, exported LLM chats and a Google Drive for desktop mount. It uses a
configurable local Ollama model, preserves source evidence on relationships,
and writes graph JSON, HTML and a runtime receipt under `~/.syntax/graphs/`.
See [knowledge graph](docs/KNOWLEDGE_GRAPH.md).

Content extraction supports plain text and source files, DOCX, XLSX, PPTX,
RTF, and macOS-indexed PDF text. Other files remain searchable by filename,
path, type, size, date, and duplicate hash.

## Open the connected Mac interface

```bash
npm run runtime:serve
open http://127.0.0.1:47831
```

The loopback runtime serves the interface and local API from the same origin.
Searches use the private SQLite index, write receipts, and support native Open
and Reveal in Finder actions. It binds only to `127.0.0.1` and rejects other
Host headers.

See [architecture](docs/ARCHITECTURE.md), [product design](docs/PRODUCT_DESIGN.md),
[security](docs/SECURITY.md), [resale pack](docs/RESALE_PACK.md) and the
[post-design gate](docs/POST_DESIGN_GATE.md).

No interface claim is real until a runtime action produces a receipt and
independent readback. Demonstration content is labelled `DESIGN_DATA`.
