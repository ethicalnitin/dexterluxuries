import React, { useState } from "react";
import { LuChevronDown } from "react-icons/lu";

/**
 * FAQ-style accordion. One item open at a time.
 *   <Accordion items={[{ q: "Question", a: "Answer" }]} defaultOpen={0} />
 * `a` may be a string or JSX.
 */
export default function Accordion({ items, defaultOpen = -1, idPrefix = "faq" }) {
  const [openIndex, setOpenIndex] = useState(defaultOpen);

  return (
    <div className="ui-accordion">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        const panelId = `${idPrefix}-panel-${i}`;
        const triggerId = `${idPrefix}-trigger-${i}`;
        return (
          <div className="ui-accordion__item" data-open={isOpen} key={item.q}>
            <h3>
              <button
                type="button"
                id={triggerId}
                className="ui-accordion__trigger"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? -1 : i)}
              >
                {item.q}
                <LuChevronDown className="ui-accordion__icon" aria-hidden="true" />
              </button>
            </h3>
            <div className="ui-accordion__panel" id={panelId} role="region" aria-labelledby={triggerId}>
              <div className="ui-accordion__panel-inner">
                <div className="ui-accordion__content">{item.a}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
