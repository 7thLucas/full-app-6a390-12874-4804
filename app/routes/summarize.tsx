import type { ActionFunctionArgs } from "react-router";
import { summarizeYouTubeLecture, SummarizeError } from "~/lib/recap.server";

/**
 * Resource route: POST /summarize
 *
 * The home page posts the pasted YouTube URL here. We run the full pipeline
 * server-side (fetch transcript -> structured LLM summary) and return JSON.
 * No UI component is exported — this is a data endpoint.
 */
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json(
      { ok: false, code: "METHOD_NOT_ALLOWED", message: "Method not allowed" },
      { status: 405 },
    );
  }

  let url = "";
  try {
    const body = (await request.json()) as { url?: unknown };
    url = typeof body?.url === "string" ? body.url.trim() : "";
  } catch {
    return Response.json(
      { ok: false, code: "INVALID_URL", message: "Please paste a YouTube link." },
      { status: 400 },
    );
  }

  if (!url) {
    return Response.json(
      { ok: false, code: "INVALID_URL", message: "Please paste a YouTube link." },
      { status: 400 },
    );
  }

  try {
    const summary = await summarizeYouTubeLecture(url);
    return Response.json({ ok: true, summary });
  } catch (error) {
    if (error instanceof SummarizeError) {
      const status =
        error.code === "INVALID_URL"
          ? 400
          : error.code === "SUMMARY_FAILED"
            ? 502
            : 422;
      return Response.json(
        { ok: false, code: error.code, message: error.message },
        { status },
      );
    }
    console.error("[summarize] unexpected error", error);
    return Response.json(
      {
        ok: false,
        code: "SUMMARY_FAILED",
        message: "Something went wrong. Please try again.",
      },
      { status: 500 },
    );
  }
}

// A loader that rejects GETs keeps this route purely an action endpoint.
export async function loader() {
  return Response.json(
    { ok: false, message: "POST a YouTube url to this endpoint." },
    { status: 405 },
  );
}
