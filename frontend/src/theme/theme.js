import logoMark from "../assets/logo-mark.png";

/* ============================================================
   STORE THEME — the one place to change how the store looks.

   Every page and component reads these values through CSS
   variables (applied to <html> by applyTheme.js before the app
   renders), so editing a value here updates the whole store.

   Common changes:
     • Store name / tagline ....... brand.name, brand.tagline
     • Logo / favicon ............. brand.logo, brand.favicon
     • Brand colour ............... colors.primary (hover, tints and
                                    focus rings are derived from it)
     • Fonts ...................... fonts.* (+ fonts.googleFontsUrl)
     • Text sizes ................. fontSizes.*
     • Spacing / page widths ...... space.*, layout.*
     • Button / input / card look . components.*, radius.*

   Naming: a key becomes a CSS variable by group prefix + kebab-case,
   e.g. colors.textMuted -> --color-text-muted, space[4] -> --space-4,
   components.button.height -> --button-height. Use those variables in
   CSS — never hard-code a value that exists here.

   Breakpoints can't be CSS variables (media queries don't support
   them), so stylesheets use the same numbers listed in `breakpoints`.
============================================================ */

const theme = {
  brand: {
    name: "MKR Tools & Softwares",
    shortName: "MKR",
    tagline: "Smart tools. Better solutions.",
    // Shown in the footer under the store name.
    description:
      "India's trusted digital product store since 2021. Serving 50,000+ traders and enthusiasts with premium subscriptions at unbeatable prices.",
    logo: logoMark, // square mark used in the header, footer and checkout
    favicon: "/favicon-64.png", // file in /public
    foundedYear: 2021,
  },

  // Dark palette built from the logo: black background, logo blue,
  // logo silver. Text colours meet WCAG AA contrast on `background`.
  colors: {
    primary: "#1F6FEB", // logo blue — buttons, selected states
    onPrimary: "#FFFFFF", // text/icons placed on primary
    secondary: "#C9D1DC", // logo silver — wordmark, quiet highlights
    accent: "#5AA9FF", // links and highlights on dark surfaces

    background: "#090B10", // page background
    surface: "#10141B", // cards, panels, inputs
    surfaceRaised: "#161B24", // modals, menus, hovered cards
    border: "#232A36",
    borderStrong: "#323B4A",

    text: "#EDF1F7",
    textMuted: "#A2ABBB",
    textSubtle: "#7C8698",

    success: "#34C77B",
    warning: "#F5A524",
    danger: "#F2555A",

    whatsapp: "#25D366", // WhatsApp's own brand colour, for WhatsApp actions only
  },

  fonts: {
    // One stylesheet for every font family below. Change both together.
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap",
    heading: "'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', sans-serif",
    body: "'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', sans-serif",
    mono: "'JetBrains Mono', ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace", // prices, codes, UTRs
  },

  fontSizes: {
    xs: "0.75rem", // 12px — captions, badges
    sm: "0.875rem", // 14px — secondary text, labels
    base: "1rem", // 16px — body
    lg: "1.125rem", // 18px — lead paragraphs, card titles
    xl: "1.25rem", // 20px — small headings
    "2xl": "clamp(1.375rem, 1.2rem + 0.8vw, 1.75rem)", // section headings
    "3xl": "clamp(1.75rem, 1.4rem + 1.6vw, 2.5rem)", // page titles
    "4xl": "clamp(2.125rem, 1.6rem + 2.6vw, 3.25rem)", // homepage hero
  },

  fontWeights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    heavy: 800,
  },

  lineHeights: {
    tight: 1.15,
    snug: 1.35,
    normal: 1.6,
    relaxed: 1.75,
  },

  letterSpacing: {
    tight: "-0.025em", // large headings
    snug: "-0.01em",
    normal: "0",
    wide: "0.08em", // uppercase eyebrows
  },

  // 4px-based spacing scale.
  space: {
    1: "4px",
    2: "8px",
    3: "12px",
    4: "16px",
    5: "20px",
    6: "24px",
    8: "32px",
    10: "40px",
    12: "48px",
    16: "64px",
    20: "80px",
  },

  layout: {
    maxWidth: "1200px", // main content width
    narrowWidth: "760px", // reading width: policies, FAQ, checkout
    gutter: "clamp(16px, 4vw, 32px)", // side padding of every page
    sectionGap: "clamp(56px, 7vw, 96px)", // vertical space between page sections
    gridGap: "clamp(12px, 2vw, 20px)", // gap between cards in grids
    headerHeight: "64px",
  },

  radius: {
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "20px",
    pill: "999px",
  },

  shadows: {
    sm: "0 1px 2px rgba(0, 0, 0, 0.4)",
    md: "0 8px 24px rgba(0, 0, 0, 0.35)",
    lg: "0 24px 64px rgba(0, 0, 0, 0.5)",
  },

  motion: {
    fast: "120ms",
    base: "200ms",
    slow: "320ms",
    ease: "cubic-bezier(0.2, 0.7, 0.2, 1)",
  },

  // Stacking order of fixed layers.
  zIndex: {
    header: 100,
    stickyBar: 150, // product page buy bar
    floating: 200, // WhatsApp button
    drawer: 300, // mobile menu, account menu
    modal: 1000,
    overlay: 2000, // confetti, lightbox
  },

  // Per-component knobs. Radii can reference the scale above.
  components: {
    button: {
      height: "46px",
      heightSm: "38px",
      heightLg: "54px",
      radius: "10px",
      fontWeight: 600,
    },
    input: {
      height: "48px",
      radius: "10px",
    },
    card: {
      radius: "16px",
      padding: "clamp(16px, 2.5vw, 24px)",
    },
    badge: {
      radius: "6px",
    },
  },

  // Reference only — keep media queries in CSS in sync with these.
  breakpoints: {
    sm: 480,
    md: 768,
    lg: 1024,
    xl: 1280,
  },
};

export default theme;
