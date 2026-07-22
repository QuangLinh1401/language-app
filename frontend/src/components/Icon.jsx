// Outline + single-accent icon system.
//
// Each icon = an outline drawn with stroke="currentColor" (so it inherits the
// surrounding text color) PLUS exactly one accent element filled with a fixed
// semantic color. The accent element carries class "icon-accent" and an
// animation class so a hovered ancestor (.nav-tab, .mod-card, .topic-card,
// button, or any .icon-trigger) can animate just that piece via CSS.
//
// This project's CSS palette differs from the spec's --primary/--gold/etc, so
// the semantic table is mapped onto the real variables in styles.css:
//   accent-primary   -> var(--teal)     (daily / correct)
//   accent-gold      -> var(--amber)    (social / streak / hint)
//   accent-secondary -> var(--violet)   (tech / pronounce)
//   accent-neutral   -> var(--ink)      (business)
//   accent-danger    -> var(--bad)      (wrong)
//   accent-muted     -> var(--ink-soft) (settings)
// Nav icons pass accent="nav" so both outline and accent use currentColor and
// follow the nav button's own active/inactive color instead of a fixed hue.

const ACCENT_VARS = {
  primary: "var(--teal)",
  gold: "var(--amber)",
  secondary: "var(--violet)",
  neutral: "var(--ink)",
  danger: "var(--bad)",
  muted: "var(--ink-soft)",
  nav: "currentColor"
};

// Default accent (semantic color) + default hover animation per icon.
const ICON_META = {
  home: { accent: "primary", anim: "pop" },
  book: { accent: "primary", anim: "page-flip" },
  "pencil-ruler": { accent: "secondary", anim: "wiggle" },
  headphones: { accent: "secondary", anim: "wiggle" },
  mic: { accent: "secondary", anim: "pulse-ring" },
  "speaker-wave": { accent: "secondary", anim: "wave" },
  flame: { accent: "gold", anim: "flicker" },
  check: { accent: "primary", anim: "draw" },
  cross: { accent: "danger", anim: "shake" },
  lightbulb: { accent: "gold", anim: "flicker" },
  gear: { accent: "muted", anim: "spin" },
  mail: { accent: "primary", anim: "pop" },
  chart: { accent: "primary", anim: "pop" },
  repeat: { accent: "primary", anim: "spin" },
  sparkle: { accent: "gold", anim: "flicker" },
  newspaper: { accent: "primary", anim: "page-flip" },
  puzzle: { accent: "secondary", anim: "pop" },
  globe: { accent: "primary", anim: "spin" },
  // vocabulary domain/topic icons
  food: { accent: "primary", anim: "pop" },
  "shopping-bag": { accent: "gold", anim: "pop" },
  taxi: { accent: "gold", anim: "pop" },
  "medical-cross": { accent: "danger", anim: "pop" },
  chat: { accent: "gold", anim: "pop" },
  laptop: { accent: "secondary", anim: "pop" },
  briefcase: { accent: "neutral", anim: "pop" },
  palette: { accent: "secondary", anim: "pop" },
  "graduation-cap": { accent: "neutral", anim: "pop" },
  // study-mode icons
  flashcard: { accent: "primary", anim: "page-flip" },
  "fill-blank": { accent: "secondary", anim: "pop" },
  match: { accent: "gold", anim: "pop" },
  reading: { accent: "primary", anim: "page-flip" },
  dictation: { accent: "secondary", anim: "wave" },
  sentence: { accent: "primary", anim: "pop" },
  shuffle: { accent: "gold", anim: "spin" }
};

// Each render function receives the accent color string and animation class,
// returns the inner SVG markup. Outline strokes use currentColor; the single
// accent element gets fill={accent} and className "icon-accent {anim}".
const ICON_SVGS = {
  home: (a, c) => (
    <>
      <path d="M4 11.5 12 4l8 7.5M6 10v9h12v-9" />
      <rect className={c} x="10" y="14" width="4" height="5" fill={a} stroke="none" />
    </>
  ),
  book: (a, c) => (
    <>
      <path d="M5 5.5A2 2 0 0 1 7 4h11v14H7a2 2 0 0 0-2 2V5.5Z" />
      <path className={c} d="M7 4h5v14H7a2 2 0 0 0-2 2V5.5A2 2 0 0 1 7 4Z" fill={a} stroke="none" />
    </>
  ),
  "pencil-ruler": (a, c) => (
    <>
      <path d="M4 20l3-1 9-9-2-2-9 9-1 3Z" />
      <path className={c} d="m14 8 2-2a1.4 1.4 0 0 1 2 2l-2 2-2-2Z" fill={a} stroke="none" />
    </>
  ),
  headphones: (a, c) => (
    <>
      <path d="M5 15v-3a7 7 0 0 1 14 0v3" />
      <rect className={c} x="3.5" y="14" width="4" height="6" rx="2" fill={a} stroke="none" />
      <rect className={c} x="16.5" y="14" width="4" height="6" rx="2" fill={a} stroke="none" />
    </>
  ),
  mic: (a, c) => (
    <>
      <path d="M6 11a6 6 0 0 0 12 0M12 19v2" />
      <rect className={c} x="9" y="3" width="6" height="12" rx="3" fill={a} stroke="none" />
    </>
  ),
  "speaker-wave": (a, c) => (
    <>
      <path d="M4 9v6h4l5 4V5L8 9H4Z" />
      <path className={c} d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" fill="none" stroke={a} />
    </>
  ),
  flame: (a, c) => (
    <>
      <path d="M12 3c1 3-3 4-3 8a3 3 0 0 0 6 0c0-1-1-2-1-2 2 1 4 3 4 6a6 6 0 0 1-12 0c0-6 4-7 6-12Z" />
      <path className={c} d="M12 12c.6 1.4 2 2 2 4a2 2 0 0 1-4 0c0-1 1-1.5 2-4Z" fill={a} stroke="none" />
    </>
  ),
  check: (a, c) => (
    <>
      <circle cx="12" cy="12" r="9" />
      <path className={c} d="m7.5 12.5 3 3 6-6.5" fill="none" stroke={a} strokeWidth="2.4" />
    </>
  ),
  cross: (a, c) => (
    <>
      <circle cx="12" cy="12" r="9" />
      <path className={c} d="m8.5 8.5 7 7M15.5 8.5l-7 7" fill="none" stroke={a} strokeWidth="2.4" />
    </>
  ),
  lightbulb: (a, c) => (
    <>
      <path d="M9 18h6M10 21h4" />
      <path className={c} d="M12 3a6 6 0 0 1 4 10.5c-.7.7-1 1.2-1 2.5H9c0-1.3-.3-1.8-1-2.5A6 6 0 0 1 12 3Z" fill={a} stroke="none" />
    </>
  ),
  gear: (a, c) => (
    <>
      <path d="M12 3.5l1.4 2.1 2.5-.6.6 2.5 2.1 1.4-1.1 2.3 1.1 2.3-2.1 1.4-.6 2.5-2.5-.6L12 20.5l-1.4-2.1-2.5.6-.6-2.5L5.4 15l1.1-2.3L5.4 10.4l2.1-1.4.6-2.5 2.5.6L12 3.5Z" />
      <circle className={c} cx="12" cy="12" r="3" fill={a} stroke="none" />
    </>
  ),
  mail: (a, c) => (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
      <path className={c} d="m4 7 8 6 8-6" fill="none" stroke={a} strokeWidth="2.2" />
    </>
  ),
  chart: (a, c) => (
    <>
      <path d="M4 20h16M6 20v-6M18 20v-9" />
      <rect className={c} x="10" y="9" width="4" height="11" fill={a} stroke="none" />
    </>
  ),
  repeat: (a, c) => (
    <>
      <path d="M4 9a5 5 0 0 1 5-5h9M20 15a5 5 0 0 1-5 5H6" />
      <path className={c} d="M17 1.5 20.5 4 17 6.5V1.5ZM7 22.5 3.5 20 7 17.5v5Z" fill={a} stroke="none" />
    </>
  ),
  sparkle: (a, c) => (
    <>
      <path d="M5 19l1-3 3-1-3-1-1-3-1 3-3 1 3 1 1 3Z" />
      <path className={c} d="M15 3l1.8 4.2L21 9l-4.2 1.8L15 15l-1.8-4.2L9 9l4.2-1.8L15 3Z" fill={a} stroke="none" />
    </>
  ),
  newspaper: (a, c) => (
    <>
      <path d="M5 4h11l3 3v13H5V4ZM9 9h6M9 13h6M9 17h4" />
      <rect className={c} x="5" y="4" width="11" height="3.5" fill={a} stroke="none" />
    </>
  ),
  puzzle: (a, c) => (
    <>
      <path d="M9 4h6v3a2 2 0 0 0 4 0V4h1a2 2 0 0 1 2 2v6h-3a2 2 0 0 0 0 4h3v4a2 2 0 0 1-2 2h-6v-3a2 2 0 0 0-4 0v3H4a2 2 0 0 1-2-2v-6h3a2 2 0 0 0 0-4H2V6a2 2 0 0 1 2-2h5Z" />
      <circle className={c} cx="12" cy="12" r="2.5" fill={a} stroke="none" />
    </>
  ),
  globe: (a, c) => (
    <>
      <circle cx="12" cy="12" r="9" />
      <path className={c} d="M3 12h18M12 3c2.6 2.6 2.6 15 0 18M12 3c-2.6 2.6-2.6 15 0 18" fill="none" stroke={a} />
    </>
  ),
  food: (a, c) => (
    <>
      <path d="M6 3v7a3 3 0 0 0 6 0V3M9 10v11M17 3c-2 1-2 5 0 6v12" />
      <circle className={c} cx="9" cy="6" r="1.6" fill={a} stroke="none" />
    </>
  ),
  "shopping-bag": (a, c) => (
    <>
      <path d="M6 8h12l1 12H5L6 8Z" />
      <path className={c} d="M9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke={a} strokeWidth="2.2" />
    </>
  ),
  taxi: (a, c) => (
    <>
      <path d="M5 16V10l2-4h10l2 4v6M5 16a1.5 1.5 0 0 0 3 0M16 16a1.5 1.5 0 0 0 3 0M5 12h14" />
      <rect className={c} x="9" y="3.5" width="6" height="3" rx="1" fill={a} stroke="none" />
    </>
  ),
  "medical-cross": (a, c) => (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <path className={c} d="M12 8v8M8 12h8" fill="none" stroke={a} strokeWidth="2.4" />
    </>
  ),
  chat: (a, c) => (
    <>
      <path d="M4 5h16v11H9l-4 4V5Z" />
      <path className={c} d="M8 9h8M8 12h5" fill="none" stroke={a} strokeWidth="2.1" />
    </>
  ),
  laptop: (a, c) => (
    <>
      <path d="M5 6h14v9H5V6ZM2 18h20l-2-3H4l-2 3Z" />
      <rect className={c} x="5" y="6" width="14" height="9" rx="1" fill={a} stroke="none" opacity="0.18" />
    </>
  ),
  briefcase: (a, c) => (
    <>
      <path d="M4 8h16v11H4V8ZM9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <rect className={c} x="4" y="11" width="16" height="3" fill={a} stroke="none" />
    </>
  ),
  palette: (a, c) => (
    <>
      <path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2s-.6-1.4-.6-2 1-1 2-1h1a3.6 3.6 0 0 0 3.6-3.6A8 8 0 0 0 12 3Z" />
      <circle className={c} cx="8.5" cy="10" r="1.4" fill={a} stroke="none" />
    </>
  ),
  "graduation-cap": (a, c) => (
    <>
      <path d="M7 12v5c0 1.4 2.5 2.5 5 2.5s5-1.1 5-2.5v-5" />
      <path className={c} d="m2 9 10-4.5L22 9l-10 4.5L2 9Z" fill={a} stroke="none" />
    </>
  ),
  flashcard: (a, c) => (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2.5" />
      <rect className={c} x="3" y="6" width="18" height="4" rx="2.5" fill={a} stroke="none" />
    </>
  ),
  "fill-blank": (a, c) => (
    <>
      <path d="M4 7h6M4 12h10M4 17h7" />
      <rect className={c} x="14" y="15" width="6" height="4" rx="1" fill={a} stroke="none" />
    </>
  ),
  match: (a, c) => (
    <>
      <path d="M7 8h4M7 12h4M7 16h4" />
      <circle className={c} cx="16" cy="10" r="2" fill={a} stroke="none" />
      <circle className={c} cx="16" cy="15" r="2" fill={a} stroke="none" />
    </>
  ),
  reading: (a, c) => (
    <>
      <path d="M4 5c2.5-1 5-1 8 0v14c-3-1-5.5-1-8 0V5ZM12 5c2.5-1 5-1 8 0v14c-3-1-5.5-1-8 0" />
      <path className={c} d="M6.5 9h3M6.5 12h3" fill="none" stroke={a} strokeWidth="1.6" />
    </>
  ),
  dictation: (a, c) => (
    <>
      <path d="M6 11a6 6 0 0 0 12 0M12 19v2" />
      <rect className={c} x="9" y="3" width="6" height="12" rx="3" fill={a} stroke="none" />
    </>
  ),
  sentence: (a, c) => (
    <>
      <path d="M4 6h16M4 11h16M4 16h10" />
      <rect className={c} x="16" y="14.5" width="4" height="3" rx="0.6" fill={a} stroke="none" />
    </>
  ),
  shuffle: (a, c) => (
    <>
      <path d="M3 7h4l10 10h4M3 17h4l3-3M14 8l3-1" />
      <path className={c} d="M18 3.5 21.5 6 18 8.5v-5ZM18 15.5 21.5 18 18 20.5v-5Z" fill={a} stroke="none" />
    </>
  )
};

// Fallback for an unknown name: a simple dot so nothing ever renders blank.
function fallbackSvg(a, c) {
  return <circle className={c} cx="12" cy="12" r="5" fill={a} stroke="none" />;
}

/**
 * <Icon name size accent animate title ariaLabel className style />
 * - accent: override the semantic accent key (primary|gold|secondary|neutral|
 *   danger|muted|nav). Omit to use the icon's default from ICON_META.
 * - animate: false to render a static accent (no hover animation class).
 */
export default function Icon({
  name,
  size = 20,
  accent,
  animate = true,
  title,
  ariaLabel,
  className = "",
  style
}) {
  const meta = ICON_META[name] || { accent: "primary", anim: "pop" };
  const accentKey = accent || meta.accent;
  const accentColor = ACCENT_VARS[accentKey] || ACCENT_VARS.primary;
  const animClass = animate ? `icon-accent-anim anim-${meta.anim}` : "";
  const render = ICON_SVGS[name] || fallbackSvg;

  return (
    <svg
      className={`app-icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={ariaLabel ? "img" : "presentation"}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : "true"}
      style={{ flexShrink: 0, display: "block", ...style }}
    >
      {title ? <title>{title}</title> : null}
      {render(accentColor, animClass)}
    </svg>
  );
}

// topic.id (backend) -> icon name, for vocabulary topic cards/headers.
export const TOPIC_ICONS = {
  "daily-life": "home",
  "work-career": "briefcase",
  "communication-social": "chat",
  "travel-transport": "taxi",
  "shopping-money": "shopping-bag",
  "health-body": "medical-cross",
  technology: "laptop",
  "entertainment-hobbies": "palette",
  education: "graduation-cap",
  "society-world": "globe"
};
