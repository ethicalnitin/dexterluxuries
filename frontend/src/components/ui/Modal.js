import React, { useEffect, useId } from "react";
import { LuX } from "react-icons/lu";
import Button from "./Button";

export default function Modal({ open, onClose, title, eyebrow, description, ariaLabel, className = "", children }) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="ui-modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`ui-modal ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : ariaLabel}
      >
        <Button variant="ghost" size="sm" iconOnly className="ui-modal__close" onClick={onClose} aria-label="Close">
          <LuX />
        </Button>
        {eyebrow && <div className="ui-modal__eyebrow">{eyebrow}</div>}
        {title && (
          <h2 id={titleId} className="ui-modal__title">
            {title}
          </h2>
        )}
        {description && <p className="ui-modal__text">{description}</p>}
        {children}
      </div>
    </div>
  );
}
