# mcp-tool-card-readme-generator-action

[![CI](https://github.com/mizcausevic-dev/mcp-tool-card-readme-generator-action/actions/workflows/ci.yml/badge.svg)](https://github.com/mizcausevic-dev/mcp-tool-card-readme-generator-action/actions/workflows/ci.yml)
[![License: AGPL-3.0-or-later](https://img.shields.io/badge/License-AGPL--3.0--or--later-blue.svg)](LICENSE)

GitHub Action that **renders a human-readable Markdown README from an MCP Tool Card JSON**. Wraps [`mcp-tool-card-readme-generator`](https://github.com/mizcausevic-dev/mcp-tool-card-readme-generator). Posts the rendered Markdown as a PR comment, and/or writes it to a target file path — auto-updates docs so the rendered output stays in lockstep with the JSON.

**Second in the per-protocol readme-generator Action quintet**.

Part of the [Kinetic Gain Suite](https://suite.kineticgain.com/).

---

## Usage

### Auto-update a docs file on every change to the Tool Card

```yaml
name: Sync Tool Card README
on:
  push:
    branches: [main]
    paths: ["tool-cards/**/*.json"]
permissions:
  contents: write
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: mizcausevic-dev/mcp-tool-card-readme-generator-action@v0.1-shipped
        with:
          card-path: tool-cards/my-tool.json
          output-path: docs/my-tool.md
```

### Post the rendered Markdown as a PR comment

```yaml
on:
  pull_request:
    paths: ["tool-cards/**/*.json"]
jobs:
  preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: mizcausevic-dev/mcp-tool-card-readme-generator-action@v0.1-shipped
        with:
          card-path: tool-cards/my-tool.json
```

## Inputs

| input            | required | default     | description |
|---|---|---|---|
| `card-path`      | ✓        | —           | Path (relative to repo root) to the MCP Tool Card JSON file. |
| `output-path`    |          | —           | Optional. If set, the rendered Markdown is written to this path. |
| `comment-on-pr`  |          | `auto`      | `auto` posts only on `pull_request` events. |
| `hide-badges`    |          | `false`     | Suppress the trailing safety badges. |
| `github-token`   |          | `${{ github.token }}` | Token for posting the PR comment. |

## Outputs

| output            | description |
|---|---|
| `markdown-length` | Length (in characters) of the rendered Markdown. |
| `output-written`  | `true` iff `output-path` was specified and successfully written. |

## How it composes

- Pair with [`mcp-tool-card-diff-action`](https://github.com/mizcausevic-dev/mcp-tool-card-diff-action) — diff catches breaking changes, this Action keeps the rendered docs in lockstep.
- Pair with [`mcp-tool-card-fleet-summary-action`](https://github.com/mizcausevic-dev/mcp-tool-card-fleet-summary-action) — fleet-level audit + per-doc rendered docs.
- Sibling: [`agent-card-readme-generator-action`](https://github.com/mizcausevic-dev/agent-card-readme-generator-action).

## License

[AGPL-3.0-or-later](LICENSE)
