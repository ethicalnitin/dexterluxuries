import React from "react";
import { Link } from "react-router-dom";

/**
 * Button — renders a <button>, a router <Link> (`to`) or an <a> (`href`).
 *
 *   <Button variant="primary" size="lg" block loading={saving}>Save</Button>
 *   <Button to="/contact" variant="secondary">Contact</Button>
 *
 * variant: primary | secondary | ghost | danger | success | whatsapp
 * size:    sm | md | lg
 */
const Button = React.forwardRef(function Button(
  {
    variant = "secondary",
    size = "md",
    block = false,
    loading = false,
    icon = null,
    iconRight = null,
    iconOnly = false,
    to,
    href,
    className = "",
    children,
    disabled,
    type = "button",
    ...rest
  },
  ref
) {
  const classes = [
    "ui-btn",
    `ui-btn--${variant}`,
    size !== "md" && `ui-btn--${size}`,
    block && "ui-btn--block",
    iconOnly && "ui-btn--icon",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      {loading ? <span className="ui-spinner" aria-hidden="true" /> : icon}
      {children}
      {!loading && iconRight}
    </>
  );

  if (to) {
    return (
      <Link ref={ref} to={to} className={classes} {...rest}>
        {content}
      </Link>
    );
  }
  if (href) {
    return (
      <a ref={ref} href={href} className={classes} {...rest}>
        {content}
      </a>
    );
  }
  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {content}
    </button>
  );
});

export default Button;
