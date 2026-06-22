/**
 * YouTube transcript fetching — server-only.
 *
 * Recap's day-one input is a YouTube link (not a file upload). This module
 * turns a pasted YouTube URL into the spoken transcript text, which is then
 * handed to the LLM for summarization.
 *
 * Strategy (no third-party deps, native fetch only):
 *   1. Parse the video ID out of any common YouTube URL shape.
 *   2. Load the watch page HTML and extract the caption track list from the
 *      embedded `ytInitialPlayerResponse` JSON.
 *   3. Fetch the best caption track (prefer English, prefer human-authored)
 *      and flatten its segments into a single transcript string.
 *
 * Throws YouTubeTranscriptError with a stable `code` so the route can map
 * failures to friendly, student-facing messages.
 */

export type YouTubeTranscriptErrorCode =
  | "INVALID_URL"
  | "VIDEO_UNAVAILABLE"
  | "NO_TRANSCRIPT"
  | "FETCH_FAILED";

export class YouTubeTranscriptError extends Error {
  constructor(
    message: string,
    public readonly code: YouTubeTranscriptErrorCode,
  ) {
    super(message);
    this.name = "YouTubeTranscriptError";
  }
}

export interface TranscriptResult {
  videoId: string;
  title: string | null;
  author: string | null;
  language: string | null;
  text: string;
}

const YT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/**
 * Extract the 11-character YouTube video ID from any common URL form.
 * Supports: watch?v=, youtu.be/, /embed/, /shorts/, /live/, and bare IDs.
 */
export function parseYouTubeId(input: string): string | null {
  const raw = (input ?? "").trim();
  if (!raw) return null;

  // Bare 11-char video id.
  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;

  let url: URL;
  try {
    url = new URL(raw.includes("://") ? raw : `https://${raw}`);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  const isYouTubeHost =
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "music.youtube.com" ||
    host === "youtu.be" ||
    host === "youtube-nocookie.com";

  if (!isYouTubeHost) return null;

  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
  }

  const vParam = url.searchParams.get("v");
  if (vParam && /^[a-zA-Z0-9_-]{11}$/.test(vParam)) return vParam;

  const segments = url.pathname.split("/").filter(Boolean);
  const prefixes = new Set(["embed", "shorts", "live", "v"]);
  for (let i = 0; i < segments.length - 1; i += 1) {
    if (prefixes.has(segments[i])) {
      const candidate = segments[i + 1];
      if (/^[a-zA-Z0-9_-]{11}$/.test(candidate)) return candidate;
    }
  }

  return null;
}

interface CaptionTrack {
  baseUrl: string;
  languageCode?: string;
  kind?: string;
  name?: { simpleText?: string };
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&#34;|&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Pull the player-response JSON object out of the watch page HTML. YouTube
 * inlines it as `var ytInitialPlayerResponse = {...};`. We brace-match to
 * extract the full object rather than relying on a brittle regex.
 */
function extractPlayerResponse(html: string): Record<string, unknown> | null {
  const marker = "ytInitialPlayerResponse";
  const markerIdx = html.indexOf(marker);
  if (markerIdx === -1) return null;

  const braceStart = html.indexOf("{", markerIdx);
  if (braceStart === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = braceStart; i < html.length; i += 1) {
    const ch = html[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
    } else if (ch === "{") {
      depth += 1;
    } else if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        const jsonText = html.slice(braceStart, i + 1);
        try {
          return JSON.parse(jsonText) as Record<string, unknown>;
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

function pickBestTrack(tracks: CaptionTrack[]): CaptionTrack | null {
  if (tracks.length === 0) return null;

  const score = (t: CaptionTrack): number => {
    let s = 0;
    const lang = (t.languageCode ?? "").toLowerCase();
    if (lang === "en") s += 100;
    else if (lang.startsWith("en")) s += 80;
    // Prefer human-authored captions over ASR ("asr" kind).
    if (t.kind !== "asr") s += 20;
    return s;
  };

  return [...tracks].sort((a, b) => score(b) - score(a))[0] ?? null;
}

async function fetchCaptionText(baseUrl: string): Promise<string> {
  // Request JSON3 format — cleaner to parse than the legacy XML.
  const url = baseUrl.includes("fmt=") ? baseUrl : `${baseUrl}&fmt=json3`;
  const res = await fetch(url, {
    headers: { "User-Agent": YT_USER_AGENT, "Accept-Language": "en-US,en;q=0.9" },
  });

  if (!res.ok) {
    throw new YouTubeTranscriptError(
      "Could not download the lecture's captions.",
      "FETCH_FAILED",
    );
  }

  const body = await res.text();

  // Try JSON3 first.
  try {
    const parsed = JSON.parse(body) as {
      events?: Array<{ segs?: Array<{ utf8?: string }> }>;
    };
    if (Array.isArray(parsed.events)) {
      const text = parsed.events
        .map((event) =>
          (event.segs ?? []).map((seg) => seg.utf8 ?? "").join(""),
        )
        .join(" ");
      const cleaned = decodeEntities(text);
      if (cleaned) return cleaned;
    }
  } catch {
    // Fall through to XML parsing.
  }

  // Fallback: legacy XML transcript (<text> nodes).
  const matches = [...body.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)];
  if (matches.length > 0) {
    return decodeEntities(matches.map((m) => m[1]).join(" "));
  }

  return "";
}

/**
 * Fetch and assemble the transcript for a YouTube lecture URL.
 */
export async function fetchYouTubeTranscript(
  rawUrl: string,
): Promise<TranscriptResult> {
  const videoId = parseYouTubeId(rawUrl);
  if (!videoId) {
    throw new YouTubeTranscriptError(
      "That doesn't look like a YouTube link. Paste the full URL of a YouTube lecture.",
      "INVALID_URL",
    );
  }

  let html: string;
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=en`, {
      headers: {
        "User-Agent": YT_USER_AGENT,
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    if (!res.ok) {
      throw new YouTubeTranscriptError(
        "We couldn't reach that video on YouTube.",
        "VIDEO_UNAVAILABLE",
      );
    }
    html = await res.text();
  } catch (err) {
    if (err instanceof YouTubeTranscriptError) throw err;
    throw new YouTubeTranscriptError(
      "We couldn't reach that video on YouTube.",
      "VIDEO_UNAVAILABLE",
    );
  }

  const player = extractPlayerResponse(html);

  // Detect unplayable videos (private, deleted, region-locked).
  const playability = player?.playabilityStatus as
    | { status?: string; reason?: string }
    | undefined;
  if (playability?.status && playability.status !== "OK") {
    throw new YouTubeTranscriptError(
      playability.reason ||
        "This video can't be opened — it may be private, removed, or region-locked.",
      "VIDEO_UNAVAILABLE",
    );
  }

  const videoDetails = player?.videoDetails as
    | { title?: string; author?: string }
    | undefined;

  const captions = player?.captions as
    | {
        playerCaptionsTracklistRenderer?: {
          captionTracks?: CaptionTrack[];
        };
      }
    | undefined;

  const tracks =
    captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];

  const best = pickBestTrack(tracks);
  if (!best?.baseUrl) {
    throw new YouTubeTranscriptError(
      "This lecture doesn't have captions we can read. Try a video with captions or subtitles turned on.",
      "NO_TRANSCRIPT",
    );
  }

  const text = await fetchCaptionText(best.baseUrl);
  if (!text || text.length < 40) {
    throw new YouTubeTranscriptError(
      "We found captions but couldn't read enough text to summarize. Try a different lecture.",
      "NO_TRANSCRIPT",
    );
  }

  return {
    videoId,
    title: videoDetails?.title ?? null,
    author: videoDetails?.author ?? null,
    language: best.languageCode ?? null,
    text,
  };
}
