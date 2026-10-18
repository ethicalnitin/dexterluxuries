import React from "react";
import { LuInfo, LuCheckCircle2, LuAlertTriangle, LuAlertCircle } from "react-icons/lu";

/* Badges, alerts, spinners and full-section status messages. */

// variant: neutral | primary | success | warning | danger
export function Badge({ variant = "neutral", icon = null, className = "", children }) {
  const variantClass = variant === "neutral" ? "" : ` ui-badge--${variant}`;
  return (
    <span className={`ui-badge${variantClass} ${className}`}>
      {icon}
      {children}
    </span>
  );
}

const ALERT_ICONS = {
  info: LuInfo,
  success: LuCheckCircle2,
  warning: LuAlertTriangle,
  danger: LuAlertCircle,
};

// variant: info | success | warning | danger
export function Alert({ variant = "info", className = "", children, ...rest }) {
  const Icon = ALERT_ICONS[variant] || LuInfo;
  const role = variant === "danger" || variant === "warning" ? "alert" : "status";
  return (
    <div className={`ui-alert ui-alert--${variant} ${className}`} role={role} {...rest}>
      <Icon aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}

export function Spinner({ className = "", label }) {
  return <span className={`ui-spinner ${className}`} role={label ? "status" : undefined} aria-label={label} />;
}

/**
 * Centred message for loading, empty and error states of a page or section.
 *   <StatusMessage loading title="Loading products…" />
 *   <StatusMessage icon={<LuPackage />} title="Nothing here yet" text="…" action={<Button …/>} />
 */
export function StatusMessage({ loading = false, icon = null, title, text, action = null, className = "" }) {
  return (
    <div className={`ui-state ${className}`} role={loading ? "status" : undefined} aria-live={loading ? "polite" : undefined}>
      {(loading || icon) && (
        <span className="ui-state__icon" aria-hidden="true">
          {loading ? <span className="ui-spinner" /> : icon}
        </span>
      )}
      {title && <p className="ui-state__title">{title}</p>}
      {text && <p className="ui-state__text">{text}</p>}
      {action}
    </div>
  );
}
