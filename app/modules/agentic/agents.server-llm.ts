// SERVER-ONLY helper for direct, structured LLM calls from loaders/actions.
//
// The browser-facing `invokeLLM` (in agents.service.ts) posts to the scaffold
// route `/api/agents/llm`. When you're already on the server (a React Router
// action or an Express handler) you can skip that internal HTTP hop and call
// the agentic platform directly with this helper. It mirrors the same upstream
// contract (message + JSON schema + optional system prompt) and returns the
// structured `response` object the model produced.
//
// Never import this from browser code — it uses `node:crypto` and `axios`.

import { createHash } from "node:crypto";
import axios, { AxiosError } from "axios";

const AGENTIC_SERVICE_URL = "https://api-micro-agentic.quantumbyte.ai";

export interface InvokeLLMServerInput {
  message: string;
  schema: Record<string, unknown>;
  systemPrompt?: string;
  idempotencyKey?: string;
  /** Override the default 60s upstream timeout (ms). */
  timeoutMs?: number;
}

export interface InvokeLLMServerResult {
  status: "DONE" | "ERROR";
  model: string;
  response: Record<string, unknown> | null;
  error: string | null;
}

function keyspace(): string {
  return process.env._KEYSPACE ?? "";
}

function authHeaders(): Record<string, string> {
  const auth = process.env.QB_SCAFFOLDER_KEY;
  return auth ? { Authentication: auth } : {};
}

function dedupeKey(
  ks: string,
  message: string,
  schema: string,
  systemPrompt: string,
): string {
  const h = createHash("sha256");
  h.update(ks);
  h.update("\x00");
  h.update(message);
  h.update("\x00");
  h.update(schema);
  h.update("\x00");
  h.update(systemPrompt);
  return h.digest("hex").slice(0, 32);
}

/**
 * Direct, server-side structured LLM invocation against the agentic platform.
 * Returns the parsed `response` object matching the provided JSON schema.
 */
export async function invokeLLMServer(
  input: InvokeLLMServerInput,
): Promise<InvokeLLMServerResult> {
  const message = input.message.trim();
  const systemPrompt = (input.systemPrompt ?? "").trim();
  const schemaText = JSON.stringify(input.schema);
  const ks = keyspace();

  const idempotencyKey =
    input.idempotencyKey ?? dedupeKey(ks, message, schemaText, systemPrompt);

  const form = new FormData();
  form.set("message", message);
  form.set("schema", schemaText);
  if (systemPrompt) form.set("system_prompt", systemPrompt);

  try {
    const response = await axios.post(`${AGENTIC_SERVICE_URL}/api/llm`, form, {
      headers: {
        "x-id-keyspace": ks,
        "idempotency-key": idempotencyKey,
        ...authHeaders(),
      },
      timeout: input.timeoutMs ?? 120_000,
    });

    const data = response.data as {
      status?: "DONE" | "ERROR";
      model?: string;
      response?: Record<string, unknown> | null;
      error?: string | null;
    };

    return {
      status: data.status === "ERROR" ? "ERROR" : "DONE",
      model: data.model ?? "",
      response: data.response ?? null,
      error: data.error ?? null,
    };
  } catch (error) {
    const ax = error as AxiosError<{ detail?: unknown; message?: string }>;
    const detail =
      ax.response?.data?.detail ??
      ax.response?.data?.message ??
      ax.message ??
      "LLM request failed";
    return {
      status: "ERROR",
      model: "",
      response: null,
      error: typeof detail === "string" ? detail : JSON.stringify(detail),
    };
  }
}
