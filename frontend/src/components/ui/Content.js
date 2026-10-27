import React from "react";

export function FeatureGrid({ items, columns = 3, plain = false }) {
  return (
    <div className={`ui-feature-grid ui-feature-grid--${columns}${plain ? " ui-feature-grid--plain" : ""}`}>
      {items.map(({ Icon, title, text }) => (
        <div className="ui-card ui-feature" key={title}>
          {Icon && (
            <span className="ui-icon-tile">
              <Icon aria-hidden="true" />
            </span>
          )}
          <h3 className="ui-title-card">{title}</h3>
          <p className="ui-muted ui-small">{text}</p>
        </div>
      ))}
    </div>
  );
}

export function StatStrip({ items }) {
  return (
    <dl className="ui-stats">
      {items.map(({ value, label }) => (
        <div className="ui-stats__item" key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function CtaPanel({ title, text, actions }) {
  return (
    <div className="ui-cta">
      <div className="ui-cta__text">
        <h2 className="ui-title-section">{title}</h2>
        {text && <p className="ui-muted">{text}</p>}
      </div>
      {actions && <div className="ui-cta__actions">{actions}</div>}
    </div>
  );
}
