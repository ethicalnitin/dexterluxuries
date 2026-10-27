import React, { useEffect, useState } from "react";
import { LuPackage } from "react-icons/lu";
import "./store.css";

const initialsOf = (name) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();

export default function ProductImage({ src, alt = "", name = "", loading = "lazy" }) {
  const [failed, setFailed] = useState(!src);

  useEffect(() => setFailed(!src), [src]);

  if (failed) {
    const initials = initialsOf(name);
    return (
      <span className="product-image-fallback" role={alt ? "img" : undefined} aria-label={alt || undefined}>
        {initials ? <span aria-hidden="true">{initials}</span> : <LuPackage aria-hidden="true" />}
      </span>
    );
  }

  return <img src={src} alt={alt} loading={loading} onError={() => setFailed(true)} />;
}
