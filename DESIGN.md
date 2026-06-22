Design guidelines for Recap — a calm, focused, study-friendly study tool. The aesthetic should feel trustworthy and academic without being stuffy; speed and clarity are the emotional headline.

## Design principles
- Clarity over decoration. Generous whitespace, strong typographic hierarchy, no visual noise.
- Single-purpose focus. The home screen leads with one input (a YouTube link field) and one primary action. Nothing competes with it.
- Calm and reassuring. The in-progress/loading state should feel patient and confident, not anxious — communicate "this takes a moment, it's working."
- Readable output. The summary is the product; it must be scannable, well-structured, and pleasant to read for long stretches.

## Color
- Base: clean near-white background (#FAFAF9 / #FFFFFF) with deep slate text (#1C1C21) for high readability.
- Primary accent: a focused, academic indigo/blue (around #4F46E5 to #4338CA) for the primary call to action and key highlights. Conveys trust and study focus.
- Supporting neutrals: warm grays for secondary text and borders (#6B7280, #E5E7EB).
- Subtle semantic accents only where needed: a soft green for success/completion, a muted amber for "test-likely" callouts so they stand out without alarm.
- Avoid harsh pure black and avoid loud, saturated multi-color palettes.

## Typography
- A clean, modern sans-serif for UI and headings (e.g. Inter or similar) — confident and legible.
- For the summary body, prioritize reading comfort: comfortable line-height (1.6-1.7), constrained measure (~65-75 characters per line), clear spacing between sections.
- Strong hierarchy: distinct visual treatment for section headers (Key Points, Key Terms & Definitions, Likely on the Test), so the summary is instantly scannable.

## Layout & components
- Hero/home: centered, focused composition. A short confident headline, a single prominent YouTube link input with a clear primary button (e.g. "Summarize"). Minimal supporting copy.
- Loading/in-progress state: a reassuring, well-designed waiting experience (progress indication or staged status) since the summary takes up to a couple of minutes. Never leave the user wondering if it's stuck.
- Summary result: a clean reading layout with clearly delineated sections — Key Points (scannable list), Key Terms & Definitions (term + concise definition), Likely on the Test (highlighted callouts using the muted amber accent). A copy action for the summary.
- Components: rounded corners (medium radius), soft subtle shadows/elevation, comfortable touch/click targets, clear focus states on the input.

## Tone in UI copy
- Clear, encouraging, student-friendly. Plain language. No gimmicks, no hype. Examples: "Paste a YouTube lecture link to get a study-ready summary." / "Working on it — this usually takes a couple of minutes."

## Anti-references (what to avoid)
- No cluttered dashboards or competing CTAs on the home screen.
- No transcript-dump walls of text — always structured and distilled.
- No gimmicky gradients, neon, or playful/childish styling. Keep it calm and academic.