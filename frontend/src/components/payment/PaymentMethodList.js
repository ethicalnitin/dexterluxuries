import React from "react";
import { LuCheck } from "react-icons/lu";
import { UpiMark } from "./UpiAppLogos";

const METHODS = [{ id: "upi", label: "UPI", desc: "Google Pay, PhonePe, Paytm or any UPI app", Icon: UpiMark }];

export default function PaymentMethodList({ upiAvailable }) {
  const available = METHODS.filter((m) => m.id === "upi" && upiAvailable);
  if (available.length === 0) return null;

  return (
    <div className="pay-methods">
      <div className="pay-methods__list" role="radiogroup" aria-label="Payment method">
        {available.map(({ id, label, desc, Icon }) => (
          <div key={id} role="radio" aria-checked="true" tabIndex={0} className="pay-method is-selected">
            <span className="pay-method__icon" aria-hidden="true">
              <Icon />
            </span>
            <span className="pay-method__body">
              <span className="pay-method__label">{label}</span>
              <span className="pay-method__desc">{desc}</span>
            </span>
            <span className="pay-method__check" aria-hidden="true">
              <LuCheck />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
