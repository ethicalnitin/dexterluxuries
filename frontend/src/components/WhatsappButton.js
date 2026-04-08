import React from 'react';

const style = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&display=swap');

  .wa-wrapper {
    position: fixed;
    bottom: 28px;
    right: 28px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 10px;
    font-family: 'DM Sans', sans-serif;
  }

  /* ── TOOLTIP BUBBLE ── */
  .wa-tooltip {
    background: #fff;
    color: #111;
    font-size: 13.5px;
    font-weight: 500;
    padding: 10px 16px;
    border-radius: 12px 12px 2px 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.15);
    white-space: nowrap;
    opacity: 0;
    transform: translateY(6px) scale(0.95);
    transition: opacity 0.25s ease, transform 0.25s ease;
    pointer-events: none;
    position: relative;
  }

  .wa-tooltip::after {
    content: '';
    position: absolute;
    bottom: -6px;
    right: 14px;
    width: 12px;
    height: 12px;
    background: #fff;
    clip-path: polygon(0 0, 100% 0, 0 100%);
  }

  .wa-wrapper:hover .wa-tooltip {
    opacity: 1;
    transform: translateY(0) scale(1);
    pointer-events: auto;
  }

  /* ── MAIN BUTTON ── */
  .wa-button {
    position: relative;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: #25D366;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 20px rgba(37,211,102,0.45);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    animation: wa-bounce 2.5s ease-in-out 1.5s infinite;
  }

  .wa-button:hover {
    transform: scale(1.1);
    box-shadow: 0 8px 32px rgba(37,211,102,0.6);
    animation: none;
  }

  .wa-button:active {
    transform: scale(0.96);
  }

  /* ── PULSE RINGS ── */
  .wa-button::before,
  .wa-button::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: rgba(37,211,102,0.4);
    animation: wa-pulse 2.5s ease-out infinite;
  }

  .wa-button::after {
    background: rgba(37,211,102,0.2);
    animation-delay: 0.5s;
  }

  /* ── NOTIFICATION DOT ── */
  .wa-dot {
    position: absolute;
    top: 3px;
    right: 3px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #FF3B30;
    border: 2px solid #fff;
    animation: wa-dot-pop 0.4s 0.8s cubic-bezier(0.34,1.56,0.64,1) both;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .wa-dot span {
    color: #fff;
    font-size: 7px;
    font-weight: 700;
    line-height: 1;
  }

  /* ── SVG ICON ── */
  .wa-icon {
    width: 30px;
    height: 30px;
    fill: #fff;
    position: relative;
    z-index: 1;
    transition: transform 0.2s ease;
  }

  .wa-button:hover .wa-icon {
    transform: rotate(-8deg) scale(1.1);
  }

  /* ── ANIMATIONS ── */
  @keyframes wa-pulse {
    0%   { transform: scale(1);   opacity: 0.7; }
    70%  { transform: scale(1.6); opacity: 0; }
    100% { transform: scale(1.6); opacity: 0; }
  }

  @keyframes wa-bounce {
    0%, 100% { transform: translateY(0); }
    40%       { transform: translateY(-8px); }
    60%       { transform: translateY(-4px); }
  }

  @keyframes wa-dot-pop {
    from { transform: scale(0); opacity: 0; }
    to   { transform: scale(1); opacity: 1; }
  }

  /* ── MOBILE ── */
  @media (max-width: 480px) {
    .wa-wrapper {
      bottom: 20px;
      right: 20px;
    }

    .wa-button {
      width: 54px;
      height: 54px;
    }

    .wa-icon {
      width: 26px;
      height: 26px;
    }
  }
`;

const WhatsappButton = () => {
  const phoneNumber = '919876543210'; // 🔴 Replace with your number (with country code, no +)
  const message = 'Hello! I am interested in your TradingView Premium plans. Can you share more details?';

  const handleClick = () => {
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <>
      <style>{style}</style>
      <div className="wa-wrapper">

        {/* Tooltip bubble */}
        <div className="wa-tooltip">
          💬 Chat with us on WhatsApp!
        </div>

        {/* Main button */}
        <button
          className="wa-button"
          onClick={handleClick}
          title="Chat with us on WhatsApp"
          aria-label="Chat with us on WhatsApp"
        >
          {/* Notification dot */}
          <div className="wa-dot">
            <span>1</span>
          </div>

          {/* Official WhatsApp SVG */}
          <svg className="wa-icon" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 0C7.164 0 0 7.163 0 16c0 2.822.736 5.472 2.025 7.775L0 32l8.454-2.007A15.93 15.93 0 0016 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm0 29.333a13.27 13.27 0 01-6.766-1.848l-.486-.288-5.02 1.193 1.237-4.878-.317-.5A13.24 13.24 0 012.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333zm7.27-9.908c-.398-.2-2.355-1.162-2.72-1.294-.365-.133-.63-.2-.895.2-.265.4-1.028 1.294-1.26 1.56-.232.267-.465.3-.863.1-.398-.2-1.681-.619-3.202-1.978-1.183-1.057-1.982-2.363-2.214-2.762-.232-.4-.025-.616.174-.815.178-.178.398-.465.597-.698.199-.233.265-.4.398-.665.133-.267.066-.5-.033-.7-.1-.2-.895-2.16-1.227-2.958-.323-.777-.651-.672-.895-.684-.232-.012-.497-.015-.763-.015a1.46 1.46 0 00-1.06.5c-.365.4-1.393 1.362-1.393 3.32s1.426 3.853 1.625 4.12c.199.267 2.806 4.285 6.797 6.01.95.41 1.692.655 2.271.839.954.304 1.823.261 2.51.158.766-.114 2.355-.963 2.688-1.893.333-.93.333-1.727.233-1.893-.1-.167-.365-.267-.763-.467z"/>
          </svg>
        </button>

      </div>
    </>
  );
};

export default WhatsappButton;