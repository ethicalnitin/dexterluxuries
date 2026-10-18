import React from "react";
import { LuChevronDown } from "react-icons/lu";

/**
 * Form field wrapper: label, optional right-hand label content,
 * the control, then help text or an error message.
 *
 *   <Field label="Email" htmlFor="email" error={err}>
 *     <Input id="email" type="email" invalid={!!err} />
 *   </Field>
 */
export function Field({ label, htmlFor, labelAside = null, hint, error, children, className = "" }) {
  return (
    <div className={`ui-field ${className}`}>
      {(label || labelAside) && (
        <div className="ui-label-row">
          {label && (
            <label className="ui-label" htmlFor={htmlFor}>
              {label}
            </label>
          )}
          {labelAside}
        </div>
      )}
      {children}
      {error ? (
        <p className="ui-field-error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="ui-help">{hint}</p>
      ) : null}
    </div>
  );
}

const stateClass = (invalid, valid) => (invalid ? " ui-input--invalid" : valid ? " ui-input--valid" : "");

export const Input = React.forwardRef(function Input({ invalid, valid, className = "", ...rest }, ref) {
  return (
    <input
      ref={ref}
      className={`ui-input${stateClass(invalid, valid)} ${className}`}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
});

export const Textarea = React.forwardRef(function Textarea({ invalid, className = "", ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      className={`ui-textarea${stateClass(invalid)} ${className}`}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
});

export const Select = React.forwardRef(function Select({ invalid, className = "", children, ...rest }, ref) {
  return (
    <div className="ui-select-wrap">
      <select ref={ref} className={`ui-select${stateClass(invalid)} ${className}`} {...rest}>
        {children}
      </select>
      <LuChevronDown aria-hidden="true" />
    </div>
  );
});
