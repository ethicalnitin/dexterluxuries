import React from "react";

export function Container({ narrow = false, as: Tag = "div", className = "", children, ...rest }) {
  return (
    <Tag className={`ui-container${narrow ? " ui-container--narrow" : ""} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

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
