# DECISIONS — pickitupe (append-only)

Newest last. Never edit or delete entries.

## 2026-10-13 — auto-memory protocol adopted
Agents (Claude Code via hooks, Grok/Codex via AGENTS.md / .grok/GROK.md) read `ai/NOW.md` + a graph slice at task start and update NOW/DECISIONS at task end; graph refresh by post-commit hook and the `graphify-refresh` Action (writes only to the `graph` branch). Why: shared memory without being asked, low token use (graph query, not GRAPH_REPORT).

## 2026-11-13 — winter: junk first, 3D truck hero
Owner asked (Nov 13) to favor junk removal for winter and make the site as creative as possible with design, animation and a 3D look, while keeping navigation clean. Home now leads with junk and estate cleanouts; leaf hero video retired; quick quote opens on Junk / One piece; new /estate-cleanout-grand-forks, /appliance-removal-grand-forks and /pricing. The 3D truck is procedural three.js (no model download) loaded after idle with an SVG poster so LCP stays text. The old "no scroll-position-driven motion" rule is relaxed to CSS scroll timelines only (no JS scroll listeners, no pinning), which was the reason for the rule. Why: post-vacuum, leaf copy was costing every visit; estate work has the best per-slot contribution in the winter plan.
