import logoMark from "../assets/logo-mark.png";

const theme = {
  brand: {
    name: "MKR Tools & Softwares",
    shortName: "MKR",
    tagline: "Smart tools. Better solutions.",
    description:
      "Software subscriptions, trading tools and courses since 2021. Paid by UPI, checked by a person, delivered to your own account.",
    logo: logoMark,
    favicon: "/favicon-64.png",
    foundedYear: 2021,
    whatsapp: "+12403013547",
  },

  colors: {
    primary: "#1C3D6E",
    onPrimary: "#FFFFFF",
    secondary: "#8A94A6",
    accent: "#1F5AA6",

    highlight: "#F2B035",
    onHighlight: "#2A1D05",

    background: "#F6F4EF",
    surface: "#FFFFFF",
    surfaceRaised: "#FFFFFF",
    surfaceSunken: "#EFECE5",
    border: "#E2DDD3",
    borderStrong: "#CAC3B6",

    text: "#17191E",
    textMuted: "#4C5260",
    textSubtle: "#686E7B",

    inverse: "#132036",
    onInverse: "#EEF1F6",
    onInverseMuted: "#A8B2C3",

    success: "#1D7A4A",
    warning: "#A15C07",
    danger: "#B42318",

    whatsapp: "#25D366",
  },

  fonts: {
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&family=IBM+Plex+Sans:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,600;8..60,700&display=swap",
    heading: "'Source Serif 4', Georgia, 'Times New Roman', serif",
    body: "'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', sans-serif",
    mono: "'IBM Plex Mono', ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace",
  },

  fontSizes: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "clamp(1.375rem, 1.25rem + 0.6vw, 1.75rem)",
    "3xl": "clamp(1.75rem, 1.5rem + 1.2vw, 2.375rem)",
    "4xl": "clamp(2rem, 1.6rem + 1.8vw, 2.875rem)",
  },

  fontWeights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    heavy: 700,
  },

  lineHeights: {
    tight: 1.15,
    snug: 1.35,
    normal: 1.55,
    relaxed: 1.7,
  },

  letterSpacing: {
    tight: "-0.015em",
    snug: "-0.005em",
    normal: "0",
    wide: "0.06em",
  },

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
    maxWidth: "1240px",
    narrowWidth: "760px",
    gutter: "clamp(16px, 3.5vw, 32px)",
    sectionGap: "clamp(40px, 5vw, 64px)",
    gridGap: "clamp(12px, 1.6vw, 20px)",
    headerHeight: "68px",
  },

  radius: {
    sm: "4px",
    md: "6px",
    lg: "8px",
    xl: "10px",
    pill: "999px",
  },

  shadows: {
    sm: "0 1px 2px rgba(23, 25, 30, 0.06)",
    md: "0 6px 18px rgba(23, 25, 30, 0.10)",
    lg: "0 18px 48px rgba(23, 25, 30, 0.18)",
  },

  motion: {
    fast: "120ms",
    base: "180ms",
    slow: "260ms",
    ease: "cubic-bezier(0.2, 0.7, 0.2, 1)",
  },

  zIndex: {
    header: 100,
    stickyBar: 150,
    floating: 200,
    drawer: 300,
    modal: 1000,
    overlay: 2000,
  },

  components: {
    button: {
      height: "44px",
      heightSm: "36px",
      heightLg: "50px",
      radius: "6px",
      fontWeight: 600,
    },
    input: {
      height: "46px",
      radius: "6px",
    },
    card: {
      radius: "8px",
      padding: "clamp(16px, 2.2vw, 24px)",
    },
    badge: {
      radius: "4px",
    },
  },

  categoryTints: ["#E7EDF5", "#ECEFE4", "#F3EBE2", "#E5EFEC", "#F2EDDD", "#EBEAEF"],

  breakpoints: {
    sm: 480,
    md: 768,
    lg: 1024,
    xl: 1280,
  },
};

export default theme;
