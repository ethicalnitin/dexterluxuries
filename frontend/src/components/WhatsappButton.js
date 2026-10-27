import React, { useEffect, useState } from 'react';
import { FaWhatsapp } from 'react-icons/fa6';
import theme from '../theme/theme';
import { whatsappUrl } from '../utils/whatsapp';
import './layout.css';

const WhatsappButton = ({ stickyBarVisible = false, stickyBarSelector = '.buy-bar' }) => {
  const message = `Hi ${theme.brand.name}, I have a question.`;
  const [barHeight, setBarHeight] = useState(0);

  useEffect(() => {
    const measure = () => {
      const bar = document.querySelector(stickyBarSelector);
      setBarHeight(bar ? bar.offsetHeight : 0);
    };

    measure();

    const mo = new MutationObserver(measure);
    mo.observe(document.body, { childList: true, subtree: true });

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

  const lift = barHeight > 0 ? barHeight + 12 : (stickyBarVisible ? 90 : 0);

  const handleClick = () => {
    window.open(whatsappUrl(message), '_blank');
  };

  return (
    <div className="wa-float" style={lift ? { transform: `translateY(-${lift}px)` } : undefined}>
      <button
        type="button"
        className="wa-float__button"
        onClick={handleClick}
        aria-label="Chat with us on WhatsApp"
      >
        <FaWhatsapp aria-hidden="true" />
        <span className="wa-float__label" aria-hidden="true">
          Help
        </span>
      </button>
    </div>
  );
};

export default WhatsappButton;
