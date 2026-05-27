import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { run, type RunnerEnv } from "../src/runner.js";

const here = fileURLToPath(new URL(".", import.meta.url));
const CARD_CONTENT = readFileSync(`${here}/../fixtures/read-search-vectorstore.json`, "utf8");

function makeEnv(opts: {
  cardPath?: string;
  cardContent?: string;
  outputPath?: string;
  isPullRequest?: boolean;
  hasToken?: boolean;
  hideBadges?: string;
}): RunnerEnv {
  const cardPath = opts.cardPath ?? "tool-cards/my-tool.json";
  const cardContent = opts.cardContent ?? CARD_CONTENT;
  const inputs: Record<string, string | undefined> = {
    card_path: cardPath,
    comment_on_pr: "false"
  };
  if (opts.outputPath !== undefined) inputs.output_path = opts.outputPath;
  if (opts.hasToken) inputs.github_token = "ghs_test";
  if (opts.hideBadges !== undefined) inputs.hide_badges = opts.hideBadges;

  const writes: Array<{ path: string; content: string }> = [];
  const env: RunnerEnv = {
    inputs,
    readFile: (p) => (p === cardPath ? cardContent : "{}"),
    exists: (p) => p === cardPath || p.endsWith("event.json"),
    writeFile: (p, c) => { writes.push({ path: p, content: c }); },
    write: () => undefined
  };
  (env as RunnerEnv & { __writes: typeof writes }).__writes = writes;

  if (opts.isPullRequest) {
    env.GITHUB_EVENT_NAME = "pull_request";
    env.GITHUB_REPOSITORY = "x/y";
    env.GITHUB_EVENT_PATH = `${here}/event.json`;
    env.readFile = (p) => {
      if (p === cardPath) return cardContent;
      if (p.endsWith("event.json")) return JSON.stringify({ number: 42, pull_request: { number: 42, base: { sha: "abc123" } } });
      return "{}";
    };
  }
  return env;
}

describe("runner.run", () => {
  it("generates Markdown from a valid MCP Tool Card and exits 0", async () => {
    const r = await run(makeEnv({}));
    expect(r.exitCode).toBe(0);
    expect(r.markdown.length).toBeGreaterThan(0);
  });

  it("rejects when card-path input is missing", async () => {
    await expect(run({ inputs: {} })).rejects.toThrow(/card_path/);
  });

  it("exits 1 when card-path doesn't exist on disk", async () => {
    const env: RunnerEnv = {
      inputs: { card_path: "nonexistent.json", comment_on_pr: "false" },
      readFile: () => "{}",
      exists: () => false,
      write: () => undefined
    };
    const r = await run(env);
    expect(r.exitCode).toBe(1);
    expect(r.reason).toBe("card-path not found");
  });

  it("exits 1 when card-path is malformed JSON", async () => {
    const r = await run(makeEnv({ cardContent: "not-json {{{" }));
    expect(r.exitCode).toBe(1);
    expect(r.reason).toBe("malformed ToolCard JSON");
  });

  it("writes the rendered Markdown to output-path when provided", async () => {
    const env = makeEnv({ outputPath: "docs/tool.md" });
    const r = await run(env);
    expect(r.outputWritten).toBe(true);
    const writes = (env as RunnerEnv & { __writes: Array<{ path: string; content: string }> }).__writes;
    expect(writes[0].path).toBe("docs/tool.md");
    expect(writes[0].content).toBe(r.markdown);
  });

  it("exits 1 when output-path write fails", async () => {
    const env = makeEnv({ outputPath: "docs/tool.md" });
    env.writeFile = () => { throw new Error("EACCES"); };
    const r = await run(env);
    expect(r.exitCode).toBe(1);
    expect(r.reason).toBe("write failed");
  });

  it("respects hide-badges input", async () => {
    const r = await run(makeEnv({ hideBadges: "true" }));
    expect(r.exitCode).toBe(0);
    expect(r.markdown.length).toBeGreaterThan(0);
  });

  it("posts a PR comment in pull_request context", async () => {
    const calls: Array<{ body: string }> = [];
    const env = makeEnv({ isPullRequest: true, hasToken: true });
    env.inputs.comment_on_pr = "auto";
    env.postComment = async (args) => { calls.push({ body: args.body }); };
    const r = await run(env);
    expect(r.commentPosted).toBe(true);
    expect(calls[0].body).toContain("MCP Tool Card README");
  });

  it("skips PR comment when token is missing", async () => {
    const env = makeEnv({ isPullRequest: true });
    env.inputs.comment_on_pr = "true";
    const r = await run(env);
    expect(r.commentPosted).toBe(false);
    expect(r.reason).toBe("no github-token provided");
  });

  it("does not comment on non-PR events with comment_on_pr=auto", async () => {
    const env: RunnerEnv = {
      inputs: { card_path: "x.json", comment_on_pr: "auto", github_token: "ghs" },
      GITHUB_EVENT_NAME: "push",
      readFile: () => CARD_CONTENT,
      exists: (p) => p === "x.json",
      write: () => undefined
    };
    const r = await run(env);
    expect(r.commentPosted).toBe(false);
  });
});
