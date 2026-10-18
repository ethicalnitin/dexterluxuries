import React, { useEffect, useState } from "react";
import { LuPackage } from "react-icons/lu";
import "./store.css";

/**
 * Product image with a themed fallback tile when the URL is missing or fails
 * to load, so a bad image link never shows the browser's broken-image icon.
 */
export default function ProductImage({ src, alt = "", name = "", loading = "lazy" }) {
  const [failed, setFailed] = useState(!src);

  // Reset when the product (and so the URL) changes.
  useEffect(() => setFailed(!src), [src]);

  if (failed) {
    return (
      <span className="product-image-fallback" role={alt ? "img" : undefined} aria-label={alt || undefined}>
        <LuPackage aria-hidden="true" />
        {name && <span aria-hidden="true">{name.trim().charAt(0).toUpperCase()}</span>}
      </span>
    );
  }

  return <img src={src} alt={alt} loading={loading} onError={() => setFailed(true)} />;
}
