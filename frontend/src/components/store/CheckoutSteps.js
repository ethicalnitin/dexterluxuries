import React from "react";
import { LuCheck } from "react-icons/lu";

export const CHECKOUT_STEPS = ["Review", "Pay", "Confirmation"];

export default function CheckoutSteps({ current }) {
  return (
    <ol className="pay-progress" aria-label="Checkout progress">
      {CHECKOUT_STEPS.map((label, i) => {
        const state = i < current ? "done" : i === current ? "current" : "todo";
        return (
          <li key={label} className={`pay-progress__step is-${state}`} aria-current={state === "current" ? "step" : undefined}>
            <span className="pay-progress__dot">{state === "done" ? <LuCheck aria-hidden="true" /> : i + 1}</span>
            <span className="pay-progress__label">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
