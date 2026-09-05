# Architecture Review — 2026-09-04 (first graphify run)

**Status:** review performed, findings below.

## Run metadata

- Tool: **graphify (graphifyy 0.9.47)** — structural (AST) extraction, no LLM pass
- Corpus: 120 files · 72 code / 43 docs / 5 images (SVG)
- Graph: **658 nodes · 1 013 edges · 50 communities** (undirected build)
- Scope note: semantic extraction for the docs/images layer needs a Gemini key
  (none on this host), so this run covers **code + SQL only**. Docs join the
  graph on the re-run planned before submission (task 03, impl. note 2).
- Outputs: `graphify-out/graph.html` + `graphify-out/GRAPH_REPORT.md` are the
  only tracked artifacts; `graph.json`, cache and intermediates are ignored.

## Findings

1. **Clean tooling/app separation.** The graph splits into three loose groups
   with almost no cross-talk: the Python planning tooling
   (`project_management/` + tests), the Next.js application (`src/`,
   `prisma/`, `e2e/`), and root config files (`package.json`, `tsconfig.json`,
   `components.json`). No accidental coupling between the repo tooling and app
   code — the architecture matches the "docs/python direct-push, app via PR"
   boundary in the gruppkontrakt.
2. **Schema is a first-class citizen.** The Prisma migration appears as its own
   community (`SQL schema`), i.e. the data model is structurally connected but
   separable — consistent with the kickoff decision that the schema is the
   single source of truth that feature tasks build on.
3. **Hub nodes are the expected seams.** God/bridge nodes are the CLI entry
   (`main()`), `GitHubClient`, and the shared UI/utils modules — all deliberate
   chokepoints, not accidental tangles.
4. **Caveat: structural-only extraction.** 136 edges reference endpoints that
   AST parsing did not materialize (producer-suppression sites). Treat link
   counts as directional hints until the semantic re-run.
5. **No findings that block Gate 3.** Nothing suggests the app scaffold needs
   restructuring before the feature streams (11–18) branch off.

## Re-run before submission

Per task 03: re-run graphify after the first integrated feature milestone and
before final submission — ideally with `GEMINI_API_KEY` set so the docs layer
is included. Record version + command in the README when doing so.
