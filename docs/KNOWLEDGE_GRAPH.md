# Syntax Knowledge Graph

Syntax now has a local-first knowledge-graph compiler inspired by `rahulnyk/knowledge_graph`.
The upstream project establishes the useful primitive: split a corpus into chunks, extract concepts and relationships with a local LLM, then render the resulting graph. Syntax adds source selection, typed evidence, local receipts and repeatable runtime execution.

## Trigger

```bash
npm run runtime:graph
```

Or point directly at one or more roots:

```bash
npm run runtime:build --silent && node runtime-dist/cli.js graph "$HOME/Documents/LLM-Chats" "$HOME/Documents/Projects" 
```

The command writes JSON graph data and an HTML visualisation under `~/.syntax/graphs/` and emits a JSON receipt.

## Configure sources

Create `~/.syntax/graph-sources.json`:

```json
[
  {"name":"mac-documents","kind":"mac","path":"/Users/YOU/Documents","enabled":true},
  {"name":"llm-chats","kind":"llm-chats","path":"/Users/YOU/Documents/LLM-Chats","enabled":true},
  {"name":"google-drive","kind":"gdrive","path":"/Users/YOU/Library/CloudStorage/GoogleDrive-ACCOUNT/My Drive","enabled":true}
]
```

Google Drive for desktop is deliberately treated as a local source in v1. This avoids creating a second OAuth/data plane: once Drive is mounted on the Mac, Syntax can ingest the mounted files like any other local source. A direct Drive API adapter can be added later without changing the graph schema.

## LLM

The compiler uses Ollama by default at `http://127.0.0.1:11434` and reads `SYNTAX_GRAPH_MODEL`. Example:

```bash
SYNTAX_GRAPH_MODEL=qwen2.5:1.5b npm run runtime:graph
```

Any Ollama model capable of reliable JSON extraction can be selected. The model is a compiler component, not the source of truth: relationships retain source-text evidence and every run writes a receipt.

## LLM chat exports

The first adapter accepts text-like exports such as Markdown, TXT, JSON/JSONL and HTML. Put exports from ChatGPT, Claude, Gemini or other systems into the configured `llm-chats` folder. The graph compiler treats those exports as source documents; it does not require a provider-specific API.

## Truth model

- `REAL`: extraction completed and a receipt was written.
- `PARTIAL`: some chunks could not be processed; output is still preserved and the receipt records the degraded run.
- `BLOCKED`: no readable source was available.

A co-occurrence is not automatically promoted to a semantic relationship. The LLM must return a relationship supported by the chunk. Evidence is retained with each edge so later verification can inspect the originating text.

## Deliberate v1 boundary

This is an ingest/compiler surface, not yet the canonical T4H graph database. The next layer should resolve concepts into canonical entities, add lifecycle/authority/owner fields, support incremental updates, and connect graph reads to the Syntax worker/runtime receipt system.
