import React from "react";

const SIZES = {
  sm: "var(--text-base)",
  md: "var(--text-lg)",
  lg: "var(--text-2xl)",
  xl: "var(--text-3xl)",
};

export default function Price({ amount, strike, from = false, size = "md", className = "" }) {
  if (!amount) return null;
  return (
    <span className={`ui-price ${className}`} style={{ "--price-size": SIZES[size] || SIZES.md }}>
      {from && <span className="ui-price__from">From</span>}
      <span className="ui-price__current">{amount}</span>
      {strike && (
        <span className="ui-price__strike">
          <span className="ui-visually-hidden">Was </span>
          {strike}
        </span>
      )}
    </span>
  );
}
