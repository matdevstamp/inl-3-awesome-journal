# Graph Report - inl-3-awesome-journal  (2026-09-04)

## Corpus Check
- 120 files · ~60,492 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 658 nodes · 1013 edges · 50 communities (38 shown, 12 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Python plan-tooling tests
- Bug-report pipeline tests
- Report/xlsx tests
- Shared API types (app)
- GitHub API client + CLI
- package.json config
- React UI shell
- Runtime dependencies
- TypeScript config
- Dev dependencies
- shadcn config
- Draft-task reader tests
- shadcn dropdown-menu component
- Mermaid diagram validation
- SQL schema (prisma migration)
- CLI parser tests
- Draft-body cleanup tests
- Root layout + theme provider
- shadcn tabs component
- Prisma seed script
- Playwright auth fixture
- shadcn badge component
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 39

## God Nodes (most connected - your core abstractions)
1. `_make_task()` - 34 edges
2. `GitHubClient` - 33 edges
3. `main()` - 31 edges
4. `compilerOptions` - 22 edges
5. `scripts` - 18 edges
6. `task_graph_mermaid()` - 17 edges
7. `allowScripts` - 16 edges
8. `task_gantt_mermaid()` - 13 edges
9. `FakeGitHubClient` - 13 edges
10. `validate_mermaid()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `main()` --calls--> `GitHubClient`  [EXTRACTED]
  project_management/cli.py → project_management/github.py
- `main()` --calls--> `GitHubError`  [EXTRACTED]
  project_management/cli.py → project_management/github.py
- `main()` --calls--> `validate_mermaid()`  [EXTRACTED]
  project_management/cli.py → project_management/mermaid_validate.py
- `main()` --calls--> `draft_task_clean_body()`  [EXTRACTED]
  project_management/cli.py → project_management/planner.py
- `main()` --calls--> `draft_task_to_project_fields()`  [EXTRACTED]
  project_management/cli.py → project_management/planner.py

## Import Cycles
- None detected.

## Communities (50 total, 12 thin omitted)

### Community 0 - "Python plan-tooling tests"
Cohesion: 0.06
Nodes (36): _checkbox_counts(), draft_task_to_project_fields(), gantt_unscheduled(), _metadata(), parse_task_refs(), Map a raw task status to one of done | doing | todo., Count checked vs total '- [x]' boxes in a task file., Safely read a task file's text (missing fixture paths -> empty). (+28 more)

### Community 1 - "Bug-report pipeline tests"
Cohesion: 0.06
Nodes (28): BugReport, load_reports(), promote_report(), triage_report(), _write_reports(), deps_sync(), issue_line(), main() (+20 more)

### Community 2 - "Report/xlsx tests"
Cohesion: 0.07
Nodes (41): _autofit(), build_report(), collect_rows(), diff_reports(), group_by(), _group_summary(), parse_questions(), _question_entries() (+33 more)

### Community 3 - "Shared API types (app)"
Cohesion: 0.06
Nodes (25): apiGet(), expectStatus(), GET(), POST(), dynamic, GET(), GET(), GET() (+17 more)

### Community 4 - "GitHub API client + CLI"
Cohesion: 0.08
Nodes (18): dict, patch, output(), GitHubClient, GitHubError, Raised when GitHub rejects an API request., Return the issues a given issue is blocked by., Remove a 'blocked by' relationship from an issue. (+10 more)

### Community 5 - "package.json config"
Cohesion: 0.05
Nodes (39): allowScripts, 0, 1, 2, 3, 4, 5, 6 (+31 more)

### Community 6 - "React UI shell"
Cohesion: 0.07
Nodes (8): ThemeToggle(), Button(), buttonVariants, Card(), CardContent(), CardDescription(), CardHeader(), CardTitle()

### Community 7 - "Runtime dependencies"
Cohesion: 0.06
Nodes (35): bcryptjs, class-variance-authority, cn, @hookform/resolvers, jsonwebtoken, lucide-react, next, next-themes (+27 more)

### Community 8 - "TypeScript config"
Cohesion: 0.06
Nodes (34): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+26 more)

### Community 9 - "Dev dependencies"
Cohesion: 0.06
Nodes (31): eslint, eslint-config-next, eslint-config-prettier, devDependencies, eslint, eslint-config-next, eslint-config-prettier, @playwright/test (+23 more)

### Community 10 - "shadcn config"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 11 - "Draft-task reader tests"
Cohesion: 0.23
Nodes (6): Stamp a draft task file with the GitHub issue it was created from. Inserts a…, read_task(), update_task_reference(), Tests for read_task() — parsing markdown draft files., TestReadTask, TestUpdateTaskReference

### Community 13 - "shadcn dropdown-menu component"
Cohesion: 0.21
Nodes (12): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+4 more)

### Community 14 - "Mermaid diagram validation"
Cohesion: 0.22
Nodes (7): _flowchart_errors(), _gantt_errors(), Structural validation for generated Mermaid diagrams (mermaid 11.x).…, Validate one mermaid block. ``kind`` is 'flowchart' | 'gantt' (auto-detected)., validate_mermaid(), Generated diagrams must pass the structural validator before being written., TestMermaidValidation

### Community 17 - "SQL schema (prisma migration)"
Cohesion: 0.67
Nodes (6): "access_logs", "medical_records", "notes", "organizations", "patients", "users"

### Community 19 - "Draft-body cleanup tests"
Cohesion: 0.43
Nodes (3): draft_task_clean_body(), Extract a clean issue body from a draft task markdown file. Returns only the…, TestDraftTaskCleanBody

### Community 20 - "Root layout + theme provider"
Cohesion: 0.33
Nodes (4): geistMono, geistSans, metadata, ThemeProvider()

### Community 23 - "Prisma seed script"
Cohesion: 0.40
Nodes (3): bcrypt, prisma, { PrismaClient }

### Community 24 - "Playwright auth fixture"
Cohesion: 0.50
Nodes (3): LoginAs, test, TestRole

## Knowledge Gaps
- **141 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+136 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `GitHubClient` connect `GitHub API client + CLI` to `Python plan-tooling tests`, `Bug-report pipeline tests`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Why does `main()` connect `Bug-report pipeline tests` to `Python plan-tooling tests`, `Report/xlsx tests`, `GitHub API client + CLI`, `Draft-task reader tests`, `Mermaid diagram validation`, `CLI parser tests`, `Draft-body cleanup tests`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Runtime dependencies` to `package.json config`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _141 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Python plan-tooling tests` be split into smaller, more focused modules?**
  _Cohesion score 0.058126619770455384 - nodes in this community are weakly interconnected._
- **Should `Bug-report pipeline tests` be split into smaller, more focused modules?**
  _Cohesion score 0.06265664160401002 - nodes in this community are weakly interconnected._
- **Should `Report/xlsx tests` be split into smaller, more focused modules?**
  _Cohesion score 0.06821480406386067 - nodes in this community are weakly interconnected._