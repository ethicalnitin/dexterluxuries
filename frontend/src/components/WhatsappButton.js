import React, { useEffect, useState } from 'react';
import { FaWhatsapp } from 'react-icons/fa6';
import './layout.css';

/**
 * Floating WhatsApp chat button.
 *
 * Self-detects any fixed bottom bar in the page (matched by
 * `stickyBarSelector`, default `.buy-bar` on the product page) and lifts
 * itself above that bar's measured height, so it never overlaps. A
 * `stickyBarVisible` prop is still accepted as a manual fallback.
 */
const WhatsappButton = ({ stickyBarVisible = false, stickyBarSelector = '.buy-bar' }) => {
  const phoneNumber = '+12403013547'; // 🔴 Replace with your number (with country code, no +)
  const message = 'Hello! I am interested in your TradingView Premium plans. Can you share more details?';
  const [barHeight, setBarHeight] = useState(0);

  useEffect(() => {
    const measure = () => {
      const bar = document.querySelector(stickyBarSelector);
      setBarHeight(bar ? bar.offsetHeight : 0);
    };

    measure();

    // Catch the bar appearing/disappearing (it's conditionally rendered).
    const mo = new MutationObserver(measure);
    mo.observe(document.body, { childList: true, subtree: true });

    // Catch its height changing (e.g. responsive layout shifts).
    const ro = new ResizeObserver(measure);
    const existingBar = document.querySelector(stickyBarSelector);
    if (existingBar) ro.observe(existingBar);

    window.addEventListener('resize', measure);

    return () => {
      mo.disconnect();
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [stickyBarSelector]);

  // Measured height wins; the boolean prop is just a manual fallback lift
  // for cases where the bar can't be found by selector.
  const lift = barHeight > 0 ? barHeight + 14 : (stickyBarVisible ? 90 : 0);

  const handleClick = () => {
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="wa-float" style={lift ? { transform: `translateY(-${lift}px)` } : undefined}>
      <span className="wa-float__tooltip" aria-hidden="true">
        Chat with us on WhatsApp
      </span>
      <button
        type="button"
        className="wa-float__button"
        onClick={handleClick}
        title="Chat with us on WhatsApp"
        aria-label="Chat with us on WhatsApp"
      >
        <span className="wa-float__dot" aria-hidden="true">1</span>
        <FaWhatsapp aria-hidden="true" />
      </button>
    </div>
  );
};

export default WhatsappButton;
