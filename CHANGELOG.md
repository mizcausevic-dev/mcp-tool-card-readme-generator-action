# Changelog

## v0.1.0 — 2026-05-27

- Initial release: GitHub Action wrapping `mcp-tool-card-readme-generator` to render a Markdown README from an MCP Tool Card JSON.
- Inputs: `card-path` (required), `output-path` (optional), `comment-on-pr` (auto/true/false), `hide-badges`, `github-token`.
- Outputs: `markdown-length`, `output-written`.
- Dual-mode: post as PR comment AND/OR write to a target file path.
- Vendored `generateReadme()` from `mcp-tool-card-readme-generator`.
- 11 hermetic tests with injected `readFile`/`writeFile`. 2 fixtures from the underlying lib.
- **Second in the per-protocol readme-generator Action quintet**.
- Node 20/22 CI, AGPL-3.0-or-later, Dependabot.
