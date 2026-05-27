# Security Policy

`mcp-tool-card-readme-generator-action` reads the MCP Tool Card JSON file at the workflow's checkout HEAD, renders it into Markdown, optionally writes the result to a target path, and optionally posts a single PR comment via the GitHub API. No remote fetch beyond the GitHub API comment call, no execution of user-supplied code.

The action uses `${{ github.token }}` by default — scoped to the repository where the workflow runs and never persisted. If you provide your own token, ensure it has only `pull-requests: write` (and `contents: write` if you commit the rendered output).

JSON parsing uses `JSON.parse` without `eval` or `Function()`. Malformed JSON is caught and the run exits 1.

## Supported versions

Only the latest tagged release is supported.

## Reporting a vulnerability

Please use GitHub Security Advisories for private disclosure:

- [Open a security advisory](https://github.com/mizcausevic-dev/mcp-tool-card-readme-generator-action/security/advisories/new)

Do not file public issues for security reports.
