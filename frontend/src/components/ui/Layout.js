import React from "react";

/* Page-structure primitives: width container, vertical section, headings. */

export function Container({ narrow = false, as: Tag = "div", className = "", children, ...rest }) {
  return (
    <Tag className={`ui-container${narrow ? " ui-container--narrow" : ""} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

// A full-width page section with standard vertical spacing. `narrow` keeps
// the content at reading width but aligned with the page's left edge.
export const Section = React.forwardRef(function Section(
  { bordered = false, narrow = false, className = "", containerClassName = "", children, ...rest },
  ref
) {
  return (
    <section ref={ref} className={`ui-section${bordered ? " ui-section--bordered" : ""} ${className}`} {...rest}>
      <Container className={`${narrow ? "ui-container--reading " : ""}${containerClassName}`}>{children}</Container>
    </section>
  );
});

// Eyebrow + heading + description, with an optional action on the right.
export function SectionHeader({ eyebrow, title, description, action = null, align = "start", as: Heading = "h2" }) {
  return (
    <div className={`ui-section-header${align === "center" ? " ui-section-header--center" : ""}`}>
      <div className="ui-section-header__text">
        {eyebrow && <span className="ui-eyebrow">{eyebrow}</span>}
        <Heading className="ui-title-section">{title}</Heading>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}

// Title block at the top of content pages (About, Contact, policies…).
export function PageHeader({ eyebrow, title, description, children }) {
  return (
    <header className="ui-page-header">
      <Container>
        <div className="ui-page-header__inner">
          {eyebrow && <span className="ui-eyebrow">{eyebrow}</span>}
          <h1 className="ui-title-page">{title}</h1>
          {description && <p className="ui-lead">{description}</p>}
          {children}
        </div>
      </Container>
    </header>
  );
}
