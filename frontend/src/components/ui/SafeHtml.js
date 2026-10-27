import React from "react";

const ALLOWED_TAGS = new Set([
  "a", "b", "blockquote", "br", "code", "div", "em", "h1", "h2", "h3", "h4", "h5", "h6", "hr",
  "i", "img", "li", "ol", "p", "pre", "s", "small", "span", "strong", "sub", "sup", "u", "ul",
  "table", "thead", "tbody", "tr", "th", "td",
]);

const DROPPED_TAGS = new Set([
  "script", "style", "iframe", "frame", "frameset", "object", "embed", "noscript", "template",
  "svg", "math", "form", "input", "button", "textarea", "select", "link", "meta", "base", "title", "head",
]);

const VOID_TAGS = new Set(["br", "hr", "img"]);
const SAFE_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

function safeUrl(raw) {
  if (!raw) return null;
  try {
    const url = new URL(raw, window.location.origin);
    return SAFE_PROTOCOLS.has(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function toReact(node, key) {
  if (node.nodeType === 3) return node.nodeValue;
  if (node.nodeType !== 1) return null;

  const tag = node.tagName.toLowerCase();
  if (DROPPED_TAGS.has(tag)) return null;

  const children = VOID_TAGS.has(tag) ? undefined : Array.from(node.childNodes, (child, i) => toReact(child, i));
  if (!ALLOWED_TAGS.has(tag)) return <React.Fragment key={key}>{children}</React.Fragment>;

  const props = { key };
  if (tag === "a") {
    const href = safeUrl(node.getAttribute("href"));
    if (href) {
      props.href = href;
      props.target = "_blank";
      props.rel = "noopener noreferrer";
    }
  } else if (tag === "img") {
    const src = safeUrl(node.getAttribute("src"));
    if (!src || src.startsWith("mailto:")) return null;
    props.src = src;
    props.alt = node.getAttribute("alt") || "";
    props.loading = "lazy";
  }
  return React.createElement(tag, props, children);
}

export function sanitizeToReact(html) {
  if (typeof html !== "string" || !html) return null;
  const doc = new DOMParser().parseFromString(html, "text/html");
  return Array.from(doc.body.childNodes, (node, i) => toReact(node, i));
}

export default function SafeHtml({ html, className = "" }) {
  return <div className={className}>{sanitizeToReact(html)}</div>;
}
