/* ============================================================
   Turns theme.js into CSS variables on <html>, loads the fonts,
   and sets the favicon / browser theme colour. Called once from
   index.js before React renders, so the first paint is themed.

   You shouldn't need to edit this file to restyle the store —
   change theme.js instead.
============================================================ */

// theme group -> CSS variable prefix
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

// Linear blend of two hex colours; amount 0 = a, 1 = b.
function mix(a, b, amount) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const out = ca.map((v, i) => Math.round(v + (cb[i] - v) * amount));
  return `#${out.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

// Hover/pressed shades and translucent tints, derived from the base
// colours so they follow automatically when a base colour changes.
function derivedColors(c) {
  const vars = {
    "--color-primary-hover": mix(c.primary, "#FFFFFF", 0.12),
    "--color-primary-active": mix(c.primary, "#000000", 0.12),
    "--color-primary-soft": rgba(c.primary, 0.14),
    "--color-primary-border": rgba(c.primary, 0.55),
    "--color-accent-soft": rgba(c.accent, 0.12),
    "--color-focus-ring": rgba(c.accent, 0.55),
    "--color-surface-hover": mix(c.surface, "#FFFFFF", 0.035),
    "--color-header-bg": rgba(c.background, 0.86),
    "--color-overlay": rgba(c.background, 0.8),
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

  // components.button.height -> --button-height
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
