import { useEffect, useState } from "react";
import { useConfigurables } from "~/modules/configurables";

const FALLBACK_STAGES = [
  "Fetching the lecture",
  "Reading the transcript",
  "Pulling out the key points",
  "Polishing your summary",
];

/**
 * SummaryLoading — a calm, reassuring waiting experience.
 *
 * Summaries can take a couple of minutes, so the loading state walks through
 * staged status messages and a gentle progress bar so the user always knows
 * it's working, never stuck.
 */
export function SummaryLoading() {
  const { config } = useConfigurables();
  const title = config?.loadingTitle || "Working on it";
  const subtitle =
    config?.loadingSubtitle ||
    "This usually takes a couple of minutes. Hang tight.";
  const stages =
    Array.isArray(config?.loadingStages) && config!.loadingStages!.length > 0
      ? config!.loadingStages!
      : FALLBACK_STAGES;

  const [activeStage, setActiveStage] = useState(0);

  // Advance through stages on a gentle timer. The last stage holds until the
  // real result arrives, so it never implies completion prematurely.
  useEffect(() => {
    setActiveStage(0);
    const interval = window.setInterval(() => {
      setActiveStage((prev) => Math.min(prev + 1, stages.length - 1));
    }, 9000);
    return () => window.clearInterval(interval);
  }, [stages.length]);

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm sm:p-10">
        <div className="flex items-center gap-4">
          <span className="relative flex h-12 w-12 shrink-0 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-primary/15" />
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-primary">
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6 animate-spin"
                style={{ animationDuration: "1.6s" }}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            </span>
          </span>
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              {title}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {subtitle}
            </p>
          </div>
        </div>

        <ul className="mt-8 space-y-3.5">
          {stages.map((stage, index) => {
            const isDone = index < activeStage;
            const isActive = index === activeStage;
            return (
              <li key={`${stage}-${index}`} className="flex items-center gap-3">
                <span
                  className={[
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                    isDone
                      ? "border-transparent bg-[var(--success-accent)] text-primary-foreground"
                      : isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-secondary text-muted-foreground",
                  ].join(" ")}
                >
                  {isDone ? (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  ) : isActive ? (
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary-foreground" />
                  ) : (
                    index + 1
                  )}
                </span>
                <span
                  className={[
                    "text-sm transition-colors",
                    isActive
                      ? "font-medium text-foreground"
                      : isDone
                        ? "text-muted-foreground"
                        : "text-muted-foreground/70",
                  ].join(" ")}
                >
                  {stage}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
