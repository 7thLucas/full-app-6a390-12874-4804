/**
 * Browser-safe client for the Recap summarize endpoint.
 * No Node deps — safe to import from React components.
 */

export interface KeyTerm {
  term: string;
  definition: string;
}

export interface TestLikelyConcept {
  concept: string;
  why: string;
}

export interface StudySummary {
  videoId: string;
  title: string | null;
  author: string | null;
  overview: string;
  keyPoints: string[];
  keyTerms: KeyTerm[];
  testLikely: TestLikelyConcept[];
}

export interface SummarizeSuccess {
  ok: true;
  summary: StudySummary;
}

export interface SummarizeFailure {
  ok: false;
  code: string;
  message: string;
}

export type SummarizeResponse = SummarizeSuccess | SummarizeFailure;

/**
 * Post a YouTube URL to the server and resolve with the structured study
 * summary (or a typed failure with a friendly message).
 */
export async function requestSummary(url: string): Promise<SummarizeResponse> {
  try {
    const res = await fetch("/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    const data = (await res.json()) as SummarizeResponse;
    return data;
  } catch {
    return {
      ok: false,
      code: "NETWORK",
      message: "We couldn't reach the server. Check your connection and try again.",
    };
  }
}
