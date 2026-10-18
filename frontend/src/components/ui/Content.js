import React from "react";

/* Content patterns shared by the homepage, About and Proofs pages. */

/**
 * Grid of icon + title + text cards.
 *   <FeatureGrid items={[{ Icon: LuZap, title: "Fast", text: "…" }]} columns={3} />
 */
export function FeatureGrid({ items, columns = 3 }) {
  return (
    <div className={`ui-feature-grid ui-feature-grid--${columns}`}>
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

/**
 * Row of headline figures.
 *   <StatStrip items={[{ value: "2021", label: "Founded" }]} />
 */
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

/**
 * Closing call-to-action panel.
 *   <CtaPanel title="Ready?" text="…" actions={<Button …/>} />
 */
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
