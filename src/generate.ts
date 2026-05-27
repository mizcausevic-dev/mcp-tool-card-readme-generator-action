import type { GenerateOptions, PiiExposure, SecretsExposure, SideEffectClass, ToolCard } from "./types.js";

const SIDE_EFFECT_BADGE: Record<SideEffectClass, string> = {
  read: "🟢 read",
  mutating: "🟡 mutating",
  external: "🟠 external",
  destructive: "🔴 destructive"
};

const PII_BADGE: Record<PiiExposure, string> = {
  none: "✅ PII: none",
  low: "🟡 PII: low",
  medium: "🟠 PII: medium",
  high: "🔴 PII: high"
};

const SECRETS_BADGE: Record<SecretsExposure, string> = {
  none: "✅ secrets: none",
  reads_secret_material: "🟠 reads secrets",
  writes_secret_material: "🔴 writes secrets"
};

function header(card: ToolCard, opts: GenerateOptions): string {
  const lines: string[] = [];
  lines.push(`# ${card.tool.name}`);
  lines.push("");
  lines.push(card.tool.description);

  if (!opts.hideBadges) {
    const badges: string[] = [];
    badges.push(SIDE_EFFECT_BADGE[card.safety.side_effect_class] ?? card.safety.side_effect_class);
    if (card.safety.pii_exposure) badges.push(PII_BADGE[card.safety.pii_exposure] ?? `PII: ${card.safety.pii_exposure}`);
    if (card.safety.secrets_exposure) badges.push(SECRETS_BADGE[card.safety.secrets_exposure] ?? `secrets: ${card.safety.secrets_exposure}`);
    if (card.safety.human_approval_required === true) badges.push("🔒 requires human approval");
    if (card.safety.reversible === false) badges.push("⚠ not reversible");
    if (card.safety.rate_limited === true) badges.push("⏱ rate limited");
    lines.push("");
    lines.push(badges.join("  ·  "));
  }
  lines.push("");
  lines.push(`**Server:** \`${card.tool.server_id}\` · **Tool:** \`${card.tool.name}\` · **Version:** \`${card.tool.version}\``);
  lines.push(`**MCP server URI:** ${card.tool.mcp_server_uri}`);
  return lines.join("\n");
}

function safetyBlock(card: ToolCard): string {
  const s = card.safety;
  const lines: string[] = [`## Safety`, ""];
  lines.push(`- **Side-effect class:** ${SIDE_EFFECT_BADGE[s.side_effect_class] ?? s.side_effect_class}`);
  if (s.external_systems && s.external_systems.length > 0) {
    lines.push(`- **External systems:** ${s.external_systems.map((x) => `\`${x}\``).join(", ")}`);
  }
  if (s.reversible !== undefined) lines.push(`- **Reversible:** ${s.reversible ? "✓" : "✗"}`);
  if (s.rate_limited !== undefined) lines.push(`- **Rate limited:** ${s.rate_limited ? "✓" : "✗"}`);
  if (s.pii_exposure) lines.push(`- **PII exposure:** ${s.pii_exposure}`);
  if (s.secrets_exposure) lines.push(`- **Secrets exposure:** ${s.secrets_exposure}`);
  if (s.human_approval_required !== undefined) {
    lines.push(`- **Human approval required:** ${s.human_approval_required ? "✓" : "✗"}`);
  }
  if (s.refusal_modes && s.refusal_modes.length > 0) {
    lines.push(``);
    lines.push(`**Refusal modes:**`);
    for (const m of s.refusal_modes) lines.push(`- \`${m}\``);
  }
  return lines.join("\n");
}

function schemaBlock(card: ToolCard): string {
  const s = card.schema;
  const lines: string[] = [`## Input schema`, ""];
  if (s.input_schema_inline) {
    lines.push("```json");
    lines.push(JSON.stringify(s.input_schema_inline, null, 2));
    lines.push("```");
  } else if (s.input_schema_uri) {
    lines.push(`Schema hosted at: ${s.input_schema_uri}`);
  } else {
    lines.push(`_No input schema declared._`);
  }
  return lines.join("\n");
}

function testedBlock(card: ToolCard): string {
  const t = card.tested_with ?? [];
  const lines: string[] = [`## Tested with (${t.length})`, ""];
  if (t.length === 0) {
    lines.push(`_No tested_with entries — consumers should gate on this._`);
    return lines.join("\n");
  }
  lines.push(`| LLM | provider | pass rate | sample | tested at | test suite |`);
  lines.push(`|---|---|---:|---:|---|---|`);
  for (const e of t) {
    const pr = e.pass_rate === undefined ? "—" : `${(e.pass_rate * 100).toFixed(1)}%`;
    const ss = e.sample_size === undefined ? "—" : String(e.sample_size);
    const ta = e.tested_at ? e.tested_at.slice(0, 10) : "—";
    const ts = e.test_suite_uri ? `[link](${e.test_suite_uri})` : "—";
    lines.push(`| \`${e.llm}\` | ${e.provider ?? "—"} | ${pr} | ${ss} | ${ta} | ${ts} |`);
  }
  return lines.join("\n");
}

function performanceBlock(card: ToolCard): string {
  const p = card.performance;
  if (!p || Object.keys(p).length === 0) return "";
  const lines: string[] = [`## Performance`, ""];
  if (p.p50_latency_ms !== undefined) lines.push(`- **p50 latency:** ${p.p50_latency_ms} ms`);
  if (p.p95_latency_ms !== undefined) lines.push(`- **p95 latency:** ${p.p95_latency_ms} ms`);
  if (p.p99_latency_ms !== undefined) lines.push(`- **p99 latency:** ${p.p99_latency_ms} ms`);
  if (p.measurement_window) lines.push(`- **Measurement window:** ${p.measurement_window}`);
  return lines.join("\n");
}

function costBlock(card: ToolCard): string {
  const c = card.cost;
  if (!c || Object.keys(c).length === 0) return "";
  const lines: string[] = [`## Cost`, ""];
  if (c.per_call_usd !== undefined) lines.push(`- **Per call:** \`$${c.per_call_usd}\` USD`);
  if (c.measurement_window) lines.push(`- **Measurement window:** ${c.measurement_window}`);
  return lines.join("\n");
}

function auditBlock(card: ToolCard): string {
  const a = card.audit;
  if (!a || Object.keys(a).length === 0) return "";
  const lines: string[] = [`## Audit`, ""];
  if (a.log_uri) lines.push(`- **Log URI:** ${a.log_uri}`);
  if (a.retention_days !== undefined) lines.push(`- **Retention:** ${a.retention_days} days`);
  if (a.signed_by) lines.push(`- **Signed by:** \`${a.signed_by}\``);
  if (a.incident_response_uri) lines.push(`- **Incident response:** ${a.incident_response_uri}`);
  return lines.join("\n");
}

export function generateReadme(card: ToolCard, opts: GenerateOptions = {}): string {
  if (!card || !card.tool || !card.safety) {
    throw new Error("input must be a valid MCP Tool Card document");
  }
  const sections = [
    header(card, opts),
    safetyBlock(card),
    schemaBlock(card),
    testedBlock(card),
    performanceBlock(card),
    costBlock(card),
    auditBlock(card)
  ].filter((s) => s.length > 0);
  return sections.join("\n\n").trimEnd() + "\n";
}
