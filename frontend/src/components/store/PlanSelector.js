import React, { useRef } from "react";
import { Badge, Price } from "../ui";
import { formatPlanDuration, getPlanPricing, isPlanAvailable } from "../../utils/pricing";
import "./store.css";

/**
 * Plan picker for multi-plan products. Radio-group semantics with arrow-key
 * support; sold-out plans are shown but can't be selected. The last plan
 * gets the "Best value" tag, as before.
 */
export default function PlanSelector({ plans, selectedIndex, onSelect, label = "Choose your plan" }) {
  const optionRefs = useRef([]);

  const move = (from, step) => {
    for (let i = 1; i <= plans.length; i++) {
      const next = (from + step * i + plans.length) % plans.length;
      if (isPlanAvailable(plans[next])) return next;
    }
    return from;
  };

  // Roving focus: arrow keys select the next in-stock plan and move focus to it.
  const onKeyDown = (e, idx) => {
    let next = null;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") next = move(idx, 1);
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = move(idx, -1);
    if (next === null) return;
    e.preventDefault();
    onSelect(next);
    optionRefs.current[next]?.focus();
  };

  return (
    <div className="plan-selector">
      <span className="plan-selector__label" id="plan-selector-label">
        {label}
      </span>
      <div className="plan-selector__list" role="radiogroup" aria-labelledby="plan-selector-label">
        {plans.map((plan, idx) => {
          const isActive = selectedIndex === idx;
          const available = isPlanAvailable(plan);
          const { price, strike } = getPlanPricing(plan);
          return (
            <button
              key={`${plan.name}-${idx}`}
              ref={(el) => (optionRefs.current[idx] = el)}
              type="button"
              role="radio"
              aria-checked={isActive}
              tabIndex={isActive ? 0 : -1}
              disabled={!available}
              className={`plan-option${isActive ? " plan-option--active" : ""}`}
              onClick={() => available && onSelect(idx)}
              onKeyDown={(e) => onKeyDown(e, idx)}
            >
              <span className="plan-option__radio" aria-hidden="true" />
              <span className="plan-option__name">{formatPlanDuration(plan)}</span>
              {!available ? (
                <Badge variant="danger">Out of stock</Badge>
              ) : idx === plans.length - 1 ? (
                <Badge variant="primary">Best value</Badge>
              ) : null}
              <Price amount={price} strike={strike} size="sm" className="plan-option__price" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
