import { useConfigurables } from "~/modules/configurables";

/**
 * Recap brand mark — uses the configurable logo if set, otherwise a clean
 * typographic wordmark with a small glyph. All copy/branding is config-driven.
 */
export function BrandMark({ className = "" }: { className?: string }) {
  const { config } = useConfigurables();
  const appName = config?.appName || "Recap";
  const logoUrl = config?.logoUrl;

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={appName}
          className="h-8 w-8 rounded-lg object-contain"
        />
      ) : (
        <span
          aria-hidden="true"
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-4 w-4"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H17a2 2 0 0 1 2 2v13.5" />
            <path d="M4 5.5v12A1.5 1.5 0 0 0 5.5 19H19" />
            <path d="M8 9h7" />
            <path d="M8 12.5h5" />
          </svg>
        </span>
      )}
      <span className="text-lg font-semibold tracking-tight text-foreground">
        {appName}
      </span>
    </div>
  );
}
