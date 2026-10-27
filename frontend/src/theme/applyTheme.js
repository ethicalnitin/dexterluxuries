const PREFIXES = {
  colors: "color",
  fonts: "font",
  fontSizes: "text",
  fontWeights: "weight",
  lineHeights: "leading",
  letterSpacing: "tracking",
  space: "space",
  layout: "layout",
  radius: "radius",
  shadows: "shadow",
  motion: "motion",
  zIndex: "z",
};

const kebab = (key) => String(key).replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

function hexToRgb(hex) {
  let h = String(hex).replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const rgba = (hex, alpha) => `rgba(${hexToRgb(hex).join(", ")}, ${alpha})`;

function mix(a, b, amount) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const out = ca.map((v, i) => Math.round(v + (cb[i] - v) * amount));
  return `#${out.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function derivedColors(c) {
  const vars = {
    "--color-primary-hover": mix(c.primary, "#000000", 0.18),
    "--color-primary-active": mix(c.primary, "#000000", 0.3),
    "--color-primary-soft": rgba(c.primary, 0.07),
    "--color-primary-border": rgba(c.primary, 0.35),
    "--color-accent-soft": rgba(c.accent, 0.08),
    "--color-focus-ring": rgba(c.accent, 0.45),
    "--color-surface-hover": mix(c.background, "#FFFFFF", 0.35),
    "--color-header-bg": c.surface,
    "--color-overlay": rgba(c.text, 0.45),
    "--color-highlight-soft": rgba(c.highlight, 0.22),
    "--color-whatsapp-hover": mix(c.whatsapp, "#000000", 0.12),
  };
  ["success", "warning", "danger"].forEach((name) => {
    vars[`--color-${name}-soft`] = rgba(c[name], 0.12);
    vars[`--color-${name}-border`] = rgba(c[name], 0.4);
  });
  return vars;
}

export function themeToCssVars(theme) {
  const vars = {};

  Object.entries(PREFIXES).forEach(([group, prefix]) => {
    Object.entries(theme[group] || {}).forEach(([key, value]) => {
      if (group === "fonts" && key === "googleFontsUrl") return;
      vars[`--${prefix}-${kebab(key)}`] = String(value);
    });
  });

  Object.entries(theme.components || {}).forEach(([component, settings]) => {
    Object.entries(settings).forEach(([key, value]) => {
      vars[`--${kebab(component)}-${kebab(key)}`] = String(value);
    });
  });

  return { ...vars, ...derivedColors(theme.colors) };
}

function ensureLink(rel, href, extra = {}) {
  if (!href) return;
  let link = document.head.querySelector(`link[rel="${rel}"][data-theme]`);
  if (!link) {
    link = document.createElement("link");
    link.rel = rel;
    link.setAttribute("data-theme", "");
    Object.entries(extra).forEach(([k, v]) => link.setAttribute(k, v));
    document.head.appendChild(link);
  }
  link.href = href;
}

export default function applyTheme(theme) {
  const root = document.documentElement;
  Object.entries(themeToCssVars(theme)).forEach(([name, value]) => root.style.setProperty(name, value));

  ensureLink("preconnect", "https://fonts.gstatic.com", { crossorigin: "" });
  ensureLink("stylesheet", theme.fonts.googleFontsUrl);
  ensureLink("icon", theme.brand.favicon, { type: "image/png" });

  let meta = document.head.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.content = theme.colors.background;

  document.title = theme.brand.name;
}
