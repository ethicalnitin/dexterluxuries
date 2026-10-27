import React, { useMemo, useState } from "react";
import { LuCheck, LuCopy, LuEye, LuZap } from "react-icons/lu";
import { FaWhatsapp } from "react-icons/fa6";
import { Alert, Button } from "../ui";
import { formatINR } from "../../utils/pricing";
import PaymentMethodList from "./PaymentMethodList";
import { GPayLogo, PhonePeLogo, PaytmLogo } from "./UpiAppLogos";
import "./checkout.css";

const UPI_ID = "9251033152@mairtel";
const PAYEE_NAME = "MKR Tools & Softwares";
const QR_IMAGE_URL = "https://i.ibb.co/W4chwP53/image.png";

const UPI_AVAILABLE = true;

const UTR_LENGTH = 12;

export default function UpiPayment({ amountInr, orderRef, note, onSubmit, submitting = false, error = "", retry = false, closed = false, onHelp }) {
  const [qrRevealed, setQrRevealed] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [utr, setUtr] = useState("");

  const isMobile = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent);
  }, []);

  const amountLabel = `₹${formatINR(amountInr)}`;
  const utrValid = utr.length === UTR_LENGTH;
  const canConfirm = utrValid && !closed && !submitting;

  const upiLink = (scheme) => {
    const params = new URLSearchParams();
    params.set("pa", UPI_ID);
    params.set("pn", PAYEE_NAME);
    params.set("am", String(amountInr));
    params.set("cu", "INR");
    params.set("tn", `${note} ${orderRef}`.trim());
    return `${scheme}?${params.toString()}`;
  };

  function handleCopy() {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(UPI_ID).then(() => {
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 1800);
    });
  }

  function handleUtrChange(e) {
    setUtr(e.target.value.replace(/\D/g, "").slice(0, UTR_LENGTH));
  }

  if (!UPI_AVAILABLE) {
    return (
      <div className="pay-block">
        <Alert variant="danger">
          <strong>UPI is down right now.</strong> Our bank's servers aren't accepting payments. Message us and we'll send you a
          working payment link in a minute.
        </Alert>
        <Button variant="whatsapp" size="lg" block icon={<FaWhatsapp />} onClick={() => onHelp("UPI is showing as unavailable — please send me a payment link.")}>
          Get a payment link
        </Button>
      </div>
    );
  }

  const qrPanel = (
    <div className="pay-qr">
      <div className={`pay-qr__frame${qrRevealed ? " is-revealed" : ""}${closed ? " is-expired" : ""}`}>
        <img src={QR_IMAGE_URL} alt="UPI QR code" />
        {!qrRevealed && (
          <button className="pay-qr__veil" type="button" onClick={() => setQrRevealed(true)} disabled={closed} aria-label="Show QR code">
            <span className="pay-qr__veil-icon">
              <LuEye aria-hidden="true" />
            </span>
            <span className="pay-qr__veil-text">Show QR code</span>
            <span className="pay-qr__veil-sub">{closed ? "Window closed" : "Scan from another phone"}</span>
          </button>
        )}
      </div>
      <p className="pay-qr__caption">{qrRevealed ? "Scan with any UPI app, then come back here." : "Hidden until you need it."}</p>
    </div>
  );

  const upiIdChip = (
    <div className="pay-upi-id">
      <span className="pay-upi-id__label">UPI ID</span>
      <button type="button" className="pay-upi-chip" onClick={handleCopy} aria-label="Copy UPI ID">
        <span className="ui-mono">{UPI_ID}</span>
        {copiedUpi ? <LuCheck aria-hidden="true" className="pay-upi-chip__ok" /> : <LuCopy aria-hidden="true" />}
      </button>
      {copiedUpi && (
        <span className="pay-copied" role="status">
          Copied
        </span>
      )}
    </div>
  );

  const payButtons = (
    <div className="pay-buttons">
      <Button variant="primary" size="lg" block disabled={closed} onClick={() => (window.location.href = upiLink("upi://pay"))} icon={<LuZap />}>
        Pay {amountLabel} with UPI
      </Button>
      <div className="pay-apps">
        <button className="pay-app" type="button" disabled={closed} onClick={() => (window.location.href = upiLink("tez://upi/pay"))} aria-label="Pay with Google Pay" title="Google Pay">
          <GPayLogo />
        </button>
        <button className="pay-app" type="button" disabled={closed} onClick={() => (window.location.href = upiLink("phonepe://pay"))} aria-label="Pay with PhonePe" title="PhonePe">
          <PhonePeLogo />
        </button>
        <button className="pay-app" type="button" disabled={closed} onClick={() => (window.location.href = upiLink("paytmmp://pay"))} aria-label="Pay with Paytm" title="Paytm">
          <PaytmLogo />
        </button>
      </div>
    </div>
  );

  const scanSteps = (
    <ol className="pay-scan-steps">
      <li>
        <span>Open any UPI app on your phone</span>
      </li>
      <li>
        <span>Scan the QR code or pay to the UPI ID</span>
      </li>
      <li>
        <span>
          Pay exactly <strong className="ui-num">{amountLabel}</strong>, then enter the UTR below
        </span>
      </li>
    </ol>
  );

  return (
    <>
      <div className="pay-block">
        <h2 className="pay-block__title">Payment method</h2>
        <PaymentMethodList upiAvailable={UPI_AVAILABLE} />
      </div>

      <div className="pay-block">
        <div className="pay-step">
          <span className="pay-step__num">1</span>
          <div>
            <h2 className="pay-step__title">Pay {amountLabel} with UPI</h2>
            <p className="pay-step__sub">Use any UPI app — Google Pay, PhonePe, Paytm, BHIM and more</p>
          </div>
        </div>

        {isMobile ? (
          <div className="pay-upi pay-upi--mobile">
            {payButtons}
            <div className="pay-divider">
              <span>or scan the QR code</span>
            </div>
            {qrPanel}
            {upiIdChip}
          </div>
        ) : (
          <div className="pay-upi">
            {qrPanel}
            <div className="pay-upi__info">
              {scanSteps}
              {upiIdChip}
              <div className="pay-divider">
                <span>or open an app on this device</span>
              </div>
              {payButtons}
            </div>
          </div>
        )}
      </div>

      <div className="pay-block">
        <div className="pay-step">
          <span className={`pay-step__num${utrValid ? " pay-step__num--done" : ""}`}>{utrValid ? <LuCheck aria-label="Done" /> : "2"}</span>
          <div>
            <h2 className="pay-step__title">{retry ? "Enter the correct UTR" : "Confirm your payment"}</h2>
            <p className="pay-step__sub">Enter the UTR from your payment receipt</p>
          </div>
        </div>

        <form
          className="pay-confirm"
          onSubmit={(e) => {
            e.preventDefault();
            if (canConfirm) onSubmit(utr);
          }}
        >
          <div className="ui-field">
            <div className="ui-label-row">
              <label className="ui-label" htmlFor="utr-input">
                UTR number
              </label>
              <span className={`pay-utr__count ui-mono${utrValid ? " is-ok" : ""}`}>
                {utr.length}/{UTR_LENGTH}
              </span>
            </div>
            <div className="pay-utr">
              <input
                id="utr-input"
                className={`ui-input pay-utr__input${utrValid ? " ui-input--valid" : ""}`}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={UTR_LENGTH}
                placeholder="000000000000"
                value={utr}
                onChange={handleUtrChange}
                disabled={closed || submitting}
                aria-describedby="utr-help"
              />
              {utrValid && <LuCheck className="pay-utr__check" aria-hidden="true" />}
            </div>
            <p className="ui-help" id="utr-help">
              Find the 12-digit UTR (also called UPI Ref No.) in your app under the payment's transaction details.
            </p>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}

          <Button type="submit" variant="success" size="lg" block disabled={!canConfirm} loading={submitting} icon={<LuCheck />}>
            I've paid — submit UTR
          </Button>
          <p className="pay-hint">
            We match the UTR against our bank statement before delivering. Access usually arrives within 15–30 minutes.
          </p>
        </form>
      </div>
    </>
  );
}
