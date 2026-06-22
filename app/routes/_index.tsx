import { useState } from "react";
import { useConfigurables } from "~/modules/configurables";
import { requestSummary, type StudySummary } from "~/lib/recap.client";
import { BrandMark } from "~/components/recap/brand-mark";
import { SummaryLoading } from "~/components/recap/summary-loading";
import { SummaryResult } from "~/components/recap/summary-result";

type View = "idle" | "loading" | "result";

export function meta() {
  return [
    { title: "Recap — Turn any lecture into a study-ready summary" },
    {
      name: "description",
      content:
        "Paste a YouTube lecture link and get the key points, definitions, and what's most likely on the test — fast.",
    },
  ];
}

export default function IndexPage() {
  const { config, loading: configLoading } = useConfigurables();

  const [view, setView] = useState<View>("idle");
  const [url, setUrl] = useState("");
  const [summary, setSummary] = useState<StudySummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Config-driven copy with sensible fallbacks so first paint is never empty.
  const eyebrow = config?.heroEyebrow ?? "";
  const headline =
    config?.heroHeadline ?? "Turn any lecture into a study-ready summary";
  const subheadline =
    config?.heroSubheadline ??
    "Paste a YouTube lecture link and get the key points, definitions, and what's most likely on the test.";
  const placeholder = config?.inputPlaceholder ?? "Paste a YouTube lecture link";
  const buttonLabel = config?.summarizeButtonLabel ?? "Summarize";
  const supportingNote = config?.supportingNote ?? "";
  const footerText = config?.footerText ?? "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed || view === "loading") return;

    setError(null);
    setView("loading");

    const result = await requestSummary(trimmed);

    if (result.ok) {
      setSummary(result.summary);
      setView("result");
    } else {
      setError(result.message);
      setView("idle");
    }
  }

  function handleReset() {
    setSummary(null);
    setError(null);
    setUrl("");
    setView("idle");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-border/70 bg-navbar/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-5">
          <button
            type="button"
            onClick={handleReset}
            className="rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label="Back to home"
          >
            <BrandMark />
          </button>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        {view === "result" && summary ? (
          <div className="mx-auto w-full max-w-5xl px-5 py-10 sm:py-14">
            <SummaryResult summary={summary} onReset={handleReset} />
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-5 py-12 sm:py-20">
            {view === "loading" ? (
              <SummaryLoading />
            ) : (
              <div className="w-full max-w-2xl text-center">
                {eyebrow ? (
                  <span className="inline-flex items-center rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
                    {eyebrow}
                  </span>
                ) : null}

                <h1 className="mt-5 text-balance text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
                  {headline}
                </h1>

                <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
                  {subheadline}
                </p>

                <form
                  onSubmit={handleSubmit}
                  className="mx-auto mt-9 w-full max-w-xl"
                >
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative flex-1">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                        <svg
                          viewBox="0 0 24 24"
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                        </svg>
                      </span>
                      <input
                        type="url"
                        inputMode="url"
                        autoComplete="off"
                        spellCheck={false}
                        value={url}
                        onChange={(e) => {
                          setUrl(e.target.value);
                          if (error) setError(null);
                        }}
                        placeholder={placeholder}
                        aria-label={placeholder}
                        className="w-full rounded-xl border border-input bg-card py-3.5 pl-11 pr-4 text-[15px] text-foreground shadow-sm transition-shadow placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!url.trim()}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-[15px] font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {buttonLabel}
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  {error ? (
                    <div
                      role="alert"
                      className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-left text-sm text-destructive"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="mt-0.5 h-4 w-4 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 8v4" />
                        <path d="M12 16h.01" />
                      </svg>
                      <span>{error}</span>
                    </div>
                  ) : supportingNote ? (
                    <p className="mt-3 text-sm text-muted-foreground">
                      {supportingNote}
                    </p>
                  ) : null}
                </form>
              </div>
            )}
          </div>
        )}
      </main>

      {footerText ? (
        <footer className="border-t border-border/70">
          <div className="mx-auto w-full max-w-5xl px-5 py-6">
            <p className="text-center text-sm text-muted-foreground">
              {footerText}
            </p>
          </div>
        </footer>
      ) : null}

      {/* Avoid layout shift flash while config loads on very first paint */}
      {configLoading ? <span className="sr-only">Loading</span> : null}
    </div>
  );
}
