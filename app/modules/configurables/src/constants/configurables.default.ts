/*
 * Default Configurable Data — seeded into Mongo on first boot.
 *
 * BEFORE EDITING: read ./RULES.md (especially R5: schema and defaults must
 * stay in sync) and ./configurables.schema.ts. For per-type schema and
 * default-value samples, see RULES.md §5 "Field Type Reference".
 */

export type TBrandColor = {
  // Base
  background: string;
  foreground: string;
  // Card
  card: string;
  cardForeground: string;
  // Popover
  popover: string;
  popoverForeground: string;
  // Primary
  primary: string;
  primaryForeground: string;
  // Secondary
  secondary: string;
  secondaryForeground: string;
  // Muted
  muted: string;
  mutedForeground: string;
  // Accent
  accent: string;
  accentForeground: string;
  // Destructive
  destructive: string;
  destructiveForeground: string;
  // Border / Input / Ring
  border: string;
  input: string;
  ring: string;
  // Charts
  chart1?: string;
  chart2?: string;
  chart3?: string;
  chart4?: string;
  chart5?: string;
  // Navbar
  navbarBackground: string;
  // Sidebar
  sidebarBackground: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
  sidebarRing: string;
};

export type TFont = {
  headingFont: string;
  textFont: string;
};

export type TDefaultConfigurableData = {
  appName: string;
  logoUrl: string;
  brandColor: TBrandColor;
  // Home / hero copy
  heroEyebrow?: string;
  heroHeadline: string;
  heroSubheadline: string;
  inputPlaceholder: string;
  summarizeButtonLabel: string;
  supportingNote?: string;
  // Loading state copy
  loadingTitle: string;
  loadingSubtitle: string;
  loadingStages?: string[];
  // Summary section labels
  keyPointsLabel: string;
  definitionsLabel: string;
  testLikelyLabel: string;
  footerText?: string;
  // Semantic accents
  testAccentColor: string;
  successAccentColor: string;
  font: TFont;
};

export const defaultConfigurablesData: TDefaultConfigurableData = {
  appName: "Recap",
  logoUrl: "",
  brandColor: {
    // Base — clean near-white canvas, deep slate text
    background:        "#fafaf9",
    foreground:        "#1c1c21",
    // Card — crisp white surfaces lift off the warm canvas
    card:              "#ffffff",
    cardForeground:    "#1c1c21",
    // Popover
    popover:           "#ffffff",
    popoverForeground: "#1c1c21",
    // Primary — academic indigo
    primary:           "#4f46e5",
    primaryForeground: "#ffffff",
    // Secondary — soft warm gray surface
    secondary:           "#f1f0ef",
    secondaryForeground: "#1c1c21",
    // Muted — secondary text + quiet fills
    muted:           "#f1f0ef",
    mutedForeground: "#6b7280",
    // Accent — gentle indigo wash
    accent:           "#eef2ff",
    accentForeground: "#4338ca",
    // Destructive
    destructive:           "#dc2626",
    destructiveForeground: "#ffffff",
    // Border / Input / Ring
    border: "#e5e7eb",
    input:  "#e5e7eb",
    ring:   "#4f46e5",
    // Charts
    chart1: "#4f46e5",
    chart2: "#0d9488",
    chart3: "#f59e0b",
    chart4: "#6366f1",
    chart5: "#0ea5e9",
    // Navbar
    navbarBackground: "#fafaf9",
    // Sidebar
    sidebarBackground:        "#ffffff",
    sidebarForeground:        "#1c1c21",
    sidebarPrimary:           "#4f46e5",
    sidebarPrimaryForeground: "#ffffff",
    sidebarAccent:            "#eef2ff",
    sidebarAccentForeground:  "#4338ca",
    sidebarBorder:            "#e5e7eb",
    sidebarRing:              "#4f46e5",
  },
  // Home / hero copy
  heroEyebrow: "Study smarter, not longer",
  heroHeadline: "Turn any lecture into a study-ready summary",
  heroSubheadline:
    "Paste a YouTube lecture link and get the key points, definitions, and what's most likely on the test — in about the time it takes to grab a coffee.",
  inputPlaceholder: "Paste a YouTube lecture link",
  summarizeButtonLabel: "Summarize",
  supportingNote: "No sign-up needed. Works with public YouTube lectures.",
  // Loading state copy
  loadingTitle: "Working on it",
  loadingSubtitle:
    "This usually takes a couple of minutes. Hang tight — we're reading the lecture so you don't have to.",
  loadingStages: [
    "Fetching the lecture",
    "Reading the transcript",
    "Pulling out the key points",
    "Polishing your summary",
  ],
  // Summary section labels
  keyPointsLabel: "Key Points",
  definitionsLabel: "Key Terms & Definitions",
  testLikelyLabel: "Likely on the Test",
  footerText: "Recap — paste a link, get a study summary.",
  // Semantic accents
  testAccentColor: "#b45309",
  successAccentColor: "#15803d",
  font: {
    headingFont: "Plus Jakarta Sans",
    textFont: "Inter",
  },
};
