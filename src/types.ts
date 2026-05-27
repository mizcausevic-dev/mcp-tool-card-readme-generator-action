// Generate a human-readable Markdown README from a single MCP Tool Card JSON document.
// Reference: https://github.com/mizcausevic-dev/mcp-tool-card-spec

export type SideEffectClass = "read" | "mutating" | "external" | "destructive";
export type PiiExposure = "none" | "low" | "medium" | "high";
export type SecretsExposure = "none" | "reads_secret_material" | "writes_secret_material";

export interface ToolCard {
  tool_card_version: string;
  tool: {
    server_id: string;
    name: string;
    version: string;
    mcp_server_uri: string;
    description: string;
  };
  schema: {
    input_schema_inline?: Record<string, unknown>;
    input_schema_uri?: string;
  };
  safety: {
    side_effect_class: SideEffectClass;
    external_systems?: string[];
    reversible?: boolean;
    rate_limited?: boolean;
    pii_exposure?: PiiExposure;
    secrets_exposure?: SecretsExposure;
    human_approval_required?: boolean;
    refusal_modes?: string[];
  };
  tested_with?: Array<{ llm: string; provider?: string; pass_rate?: number; sample_size?: number; tested_at?: string; test_suite_uri?: string }>;
  performance?: { p50_latency_ms?: number; p95_latency_ms?: number; p99_latency_ms?: number; measurement_window?: string };
  cost?: { per_call_usd?: number; measurement_window?: string };
  audit?: { log_uri?: string; retention_days?: number; signed_by?: string; incident_response_uri?: string };
}

export interface GenerateOptions {
  /** Suppress the trailing badge line under the title. */
  hideBadges?: boolean;
}
