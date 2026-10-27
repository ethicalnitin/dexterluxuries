import React, { useEffect, useState } from "react";
import { LuClock } from "react-icons/lu";

const secondsUntil = (deadline) => Math.max(0, Math.round((deadline - Date.now()) / 1000));

function formatMMSS(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function PaymentTimer({ deadline, totalSeconds, onExpire }) {
  const [secondsLeft, setSecondsLeft] = useState(() => secondsUntil(deadline));
  const expired = secondsLeft <= 0;

  useEffect(() => {
    const tick = () => setSecondsLeft(secondsUntil(deadline));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  useEffect(() => {
    if (expired) onExpire();
  }, [expired, onExpire]);

  const urgent = !expired && secondsLeft <= 60;
  const progressPct = Math.max(0, Math.min(100, (secondsLeft / totalSeconds) * 100));

  return (
    <div className={`pay-timer${expired ? " pay-timer--expired" : urgent ? " pay-timer--urgent" : ""}`}>
      <div className="pay-timer__top">
        <span className="pay-timer__label">
          <LuClock aria-hidden="true" />
          {expired ? "Payment window closed" : "Price held for"}
        </span>
        {!expired && <span className="pay-timer__value ui-mono">{formatMMSS(secondsLeft)}</span>}
      </div>
      <div
        className="pay-timer__track"
        role="progressbar"
        aria-label="Time left to pay"
        aria-valuemin={0}
        aria-valuemax={totalSeconds}
        aria-valuenow={secondsLeft}
      >
        <div className="pay-timer__fill" style={{ width: `${progressPct}%` }} />
      </div>
    </div>
  );
}
