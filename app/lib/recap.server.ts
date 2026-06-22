/**
 * Recap summarizer — server-only orchestration.
 *
 * Ties the two halves of the day-one flow together:
 *   1. YouTube link  -> transcript        (youtube.server.ts)
 *   2. transcript    -> study summary     (agentic LLM, structured JSON)
 *
 * The LLM is constrained with a strict JSON schema so the output is always a
 * clean, scannable study summary (key points, definitions, test-likely
 * concepts) — never a transcript dump.
 */

import { invokeLLMServer } from "~/modules/agentic/server";
import {
  fetchYouTubeTranscript,
  YouTubeTranscriptError,
  type YouTubeTranscriptErrorCode,
} from "./youtube.server";

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

export type SummarizeErrorCode = YouTubeTranscriptErrorCode | "SUMMARY_FAILED";

export class SummarizeError extends Error {
  constructor(
    message: string,
    public readonly code: SummarizeErrorCode,
  ) {
    super(message);
    this.name = "SummarizeError";
  }
}

// Transcripts can be long; keep the model prompt within a sane bound. We keep
// the head of the lecture (where framing + most signal usually lives) plus a
// generous tail so conclusions aren't lost.
const MAX_TRANSCRIPT_CHARS = 48_000;

function clampTranscript(text: string): string {
  if (text.length <= MAX_TRANSCRIPT_CHARS) return text;
  const headChars = Math.floor(MAX_TRANSCRIPT_CHARS * 0.7);
  const tailChars = MAX_TRANSCRIPT_CHARS - headChars;
  const head = text.slice(0, headChars);
  const tail = text.slice(text.length - tailChars);
  return `${head}\n\n[...middle of the lecture omitted for length...]\n\n${tail}`;
}

const SUMMARY_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    overview: {
      type: "string",
      description:
        "One or two plain-language sentences capturing what this lecture is about and what a student should take away.",
    },
    keyPoints: {
      type: "array",
      description:
        "The most important points worth remembering, ordered by importance. Each is a single, self-contained sentence in plain language.",
      items: { type: "string" },
      minItems: 3,
      maxItems: 10,
    },
    keyTerms: {
      type: "array",
      description:
        "Important terms or definitions introduced in the lecture, each with a concise student-friendly definition.",
      items: {
        type: "object",
        properties: {
          term: { type: "string" },
          definition: { type: "string" },
        },
        required: ["term", "definition"],
        additionalProperties: false,
      },
      maxItems: 12,
    },
    testLikely: {
      type: "array",
      description:
        "Concepts most likely to appear on a test or exam, each with a short note on why it matters or how it might be assessed.",
      items: {
        type: "object",
        properties: {
          concept: { type: "string" },
          why: { type: "string" },
        },
        required: ["concept", "why"],
        additionalProperties: false,
      },
      minItems: 2,
      maxItems: 8,
    },
  },
  required: ["overview", "keyPoints", "keyTerms", "testLikely"],
  additionalProperties: false,
};

const SYSTEM_PROMPT = [
  "You are Recap, a calm and focused study assistant for students.",
  "You are given the transcript of a recorded lecture.",
  "Produce a clean, scannable, study-ready summary — never a transcript dump.",
  "Write in clear, plain language a student cramming before an exam can absorb quickly.",
  "Focus on signal over volume: what to remember, the terms that matter, and what is most likely on a test.",
  "Base everything strictly on the transcript content. Do not invent facts that are not supported by the transcript.",
  "Return ONLY structured data that matches the provided JSON schema.",
].join(" ");

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeSummary(
  raw: Record<string, unknown> | null,
): Omit<StudySummary, "videoId" | "title" | "author"> {
  const overview = asString(raw?.overview);

  const keyPoints = Array.isArray(raw?.keyPoints)
    ? (raw!.keyPoints as unknown[]).map(asString).filter(Boolean)
    : [];

  const keyTerms = Array.isArray(raw?.keyTerms)
    ? (raw!.keyTerms as unknown[])
        .map((item) => {
          const obj = item as Record<string, unknown>;
          return {
            term: asString(obj?.term),
            definition: asString(obj?.definition),
          };
        })
        .filter((t) => t.term && t.definition)
    : [];

  const testLikely = Array.isArray(raw?.testLikely)
    ? (raw!.testLikely as unknown[])
        .map((item) => {
          const obj = item as Record<string, unknown>;
          return {
            concept: asString(obj?.concept),
            why: asString(obj?.why),
          };
        })
        .filter((t) => t.concept && t.why)
    : [];

  return { overview, keyPoints, keyTerms, testLikely };
}

/**
 * Full pipeline: YouTube URL -> transcript -> structured study summary.
 */
export async function summarizeYouTubeLecture(
  url: string,
): Promise<StudySummary> {
  let transcript;
  try {
    transcript = await fetchYouTubeTranscript(url);
  } catch (err) {
    if (err instanceof YouTubeTranscriptError) {
      throw new SummarizeError(err.message, err.code);
    }
    throw new SummarizeError(
      "Something went wrong reading that lecture. Please try again.",
      "FETCH_FAILED",
    );
  }

  const message = [
    transcript.title ? `Lecture title: ${transcript.title}` : null,
    transcript.author ? `Channel/instructor: ${transcript.author}` : null,
    "",
    "Transcript:",
    clampTranscript(transcript.text),
  ]
    .filter((line) => line !== null)
    .join("\n");

  const result = await invokeLLMServer({
    message,
    schema: SUMMARY_SCHEMA,
    systemPrompt: SYSTEM_PROMPT,
  });

  if (result.status === "ERROR" || !result.response) {
    throw new SummarizeError(
      "We couldn't generate a summary for this lecture. Please try again in a moment.",
      "SUMMARY_FAILED",
    );
  }

  const normalized = normalizeSummary(result.response);

  if (normalized.keyPoints.length === 0 && normalized.overview === "") {
    throw new SummarizeError(
      "We couldn't generate a summary for this lecture. Please try again in a moment.",
      "SUMMARY_FAILED",
    );
  }

  return {
    videoId: transcript.videoId,
    title: transcript.title,
    author: transcript.author,
    ...normalized,
  };
}
