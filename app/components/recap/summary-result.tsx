import { useState } from "react";
import { useConfigurables } from "~/modules/configurables";
import type { StudySummary } from "~/lib/recap.client";

interface SummaryResultProps {
  summary: StudySummary;
  onReset: () => void;
}

function buildCopyText(
  summary: StudySummary,
  labels: { keyPoints: string; definitions: string; testLikely: string },
): string {
  const lines: string[] = [];
  if (summary.title) lines.push(summary.title, "");
  if (summary.overview) lines.push(summary.overview, "");

  if (summary.keyPoints.length) {
    lines.push(labels.keyPoints.toUpperCase());
    summary.keyPoints.forEach((p) => lines.push(`- ${p}`));
    lines.push("");
  }
  if (summary.keyTerms.length) {
    lines.push(labels.definitions.toUpperCase());
    summary.keyTerms.forEach((t) => lines.push(`- ${t.term}: ${t.definition}`));
    lines.push("");
  }
  if (summary.testLikely.length) {
    lines.push(labels.testLikely.toUpperCase());
    summary.testLikely.forEach((t) => lines.push(`- ${t.concept} — ${t.why}`));
    lines.push("");
  }
  return lines.join("\n").trim();
}

function SectionHeader({
  icon,
  label,
  count,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-accent-foreground">
        {icon}
      </span>
      <h2 className="text-base font-semibold tracking-tight text-foreground">
        {label}
      </h2>
      <span className="ml-auto text-xs font-medium tabular-nums text-muted-foreground">
        {count}
      </span>
    </div>
  );
}

export function SummaryResult({ summary, onReset }: SummaryResultProps) {
  const { config } = useConfigurables();
  const keyPointsLabel = config?.keyPointsLabel || "Key Points";
  const definitionsLabel = config?.definitionsLabel || "Key Terms & Definitions";
  const testLikelyLabel = config?.testLikelyLabel || "Likely on the Test";

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = buildCopyText(summary, {
      keyPoints: keyPointsLabel,
      definitions: definitionsLabel,
      testLikely: testLikelyLabel,
    });
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* Header: title + actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {summary.author ? (
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {summary.author}
            </p>
          ) : null}
          <h1 className="mt-1 text-balance text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">
            {summary.title || "Your study summary"}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {copied ? (
              <>
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 text-[var(--success-accent)]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="9" y="9" width="11" height="11" rx="2" />
                  <path d="M5 15V5a2 2 0 0 1 2-2h10" />
                </svg>
                Copy
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
            New
          </button>
        </div>
      </div>

      {/* Overview */}
      {summary.overview ? (
        <p className="mt-5 text-[15px] leading-7 text-muted-foreground">
          {summary.overview}
        </p>
      ) : null}

      <div className="mt-8 space-y-5">
        {/* Key Points */}
        {summary.keyPoints.length > 0 ? (
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <SectionHeader
              label={keyPointsLabel}
              count={summary.keyPoints.length}
              icon={
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m9 11 3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              }
            />
            <ul className="mt-4 space-y-3">
              {summary.keyPoints.map((point, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span className="text-[15px] leading-7 text-foreground">
                    {point}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Key Terms & Definitions */}
        {summary.keyTerms.length > 0 ? (
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <SectionHeader
              label={definitionsLabel}
              count={summary.keyTerms.length}
              icon={
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                </svg>
              }
            />
            <dl className="mt-4 space-y-4">
              {summary.keyTerms.map((t, i) => (
                <div
                  key={i}
                  className="border-l-2 border-accent-foreground/30 pl-4"
                >
                  <dt className="text-[15px] font-semibold text-foreground">
                    {t.term}
                  </dt>
                  <dd className="mt-0.5 text-[15px] leading-7 text-muted-foreground">
                    {t.definition}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        {/* Likely on the Test */}
        {summary.testLikely.length > 0 ? (
          <section className="rounded-2xl border border-[var(--test-accent)]/25 bg-[var(--test-accent)]/[0.06] p-6 shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--test-accent)]/15 text-[var(--test-accent)]">
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2v4" />
                  <path d="m6.34 6.34 2.83 2.83" />
                  <path d="M2 12h4" />
                  <circle cx="12" cy="14" r="6" />
                  <path d="M12 11v3l1.5 1.5" />
                </svg>
              </span>
              <h2 className="text-base font-semibold tracking-tight text-[var(--test-accent)]">
                {testLikelyLabel}
              </h2>
              <span className="ml-auto text-xs font-medium tabular-nums text-[var(--test-accent)]/80">
                {summary.testLikely.length}
              </span>
            </div>
            <ul className="mt-4 space-y-4">
              {summary.testLikely.map((t, i) => (
                <li key={i}>
                  <p className="text-[15px] font-semibold text-foreground">
                    {t.concept}
                  </p>
                  <p className="mt-0.5 text-[15px] leading-7 text-muted-foreground">
                    {t.why}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
