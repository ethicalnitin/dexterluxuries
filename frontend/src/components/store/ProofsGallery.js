import React, { useCallback, useEffect, useState } from "react";
import { LuChevronLeft, LuChevronRight, LuX, LuEyeOff, LuImage } from "react-icons/lu";
import { Button, Section, SectionHeader } from "../ui";

const PREVIEW_COUNT = 5;

const ProofsGallery = React.forwardRef(function ProofsGallery({ proofs, hidden, onToggleHidden }, ref) {
  const [showAll, setShowAll] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const count = proofs.length;

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const showPrev = useCallback(() => setLightboxIndex((i) => (i - 1 + count) % count), [count]);
  const showNext = useCallback(() => setLightboxIndex((i) => (i + 1) % count), [count]);

  useEffect(() => {
    if (lightboxIndex === null) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") showPrev();
      else if (e.key === "ArrowRight") showNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, closeLightbox, showPrev, showNext]);

  const visible = showAll ? proofs : proofs.slice(0, PREVIEW_COUNT);

  return (
    <>
      <Section bordered className="pdp-section" ref={ref}>
        <SectionHeader
          title="Delivery proof"
          description="Screenshots of recent deliveries to our customers. Tap an image to view it larger."
          action={
            <Button variant="secondary" size="sm" onClick={onToggleHidden} icon={hidden ? <LuImage /> : <LuEyeOff />}>
              {hidden ? "Show proofs" : "Hide proofs"}
            </Button>
          }
        />

        {hidden ? (
          <p className="ui-subtle ui-small">Proofs are hidden — use “Show proofs” to view them.</p>
        ) : (
          <>
            <div className="pdp-proofs">
              {visible.map((proof, idx) => (
                <button
                  type="button"
                  className="pdp-proof"
                  key={proof.id}
                  onClick={() => setLightboxIndex(idx)}
                  aria-label={`View ${proof.label || `proof ${idx + 1}`} larger`}
                >
                  <img src={proof.url} alt={proof.label || `Proof ${idx + 1}`} loading="lazy" />
                </button>
              ))}
            </div>
            {!showAll && count > PREVIEW_COUNT && (
              <div className="pdp-proofs__more">
                <Button variant="secondary" onClick={() => setShowAll(true)}>
                  Show all {count} proofs
                </Button>
              </div>
            )}
          </>
        )}
      </Section>

      {lightboxIndex !== null && (
        <div className="pdp-lightbox" onClick={closeLightbox} role="dialog" aria-modal="true" aria-label="Proof image">
          <button type="button" className="pdp-lightbox__btn pdp-lightbox__close" onClick={closeLightbox} aria-label="Close">
            <LuX />
          </button>
          {count > 1 && (
            <button
              type="button"
              className="pdp-lightbox__btn pdp-lightbox__prev"
              onClick={(e) => {
                e.stopPropagation();
                showPrev();
              }}
              aria-label="Previous"
            >
              <LuChevronLeft />
            </button>
          )}
          <img
            src={proofs[lightboxIndex].url}
            alt={proofs[lightboxIndex].label || "Proof"}
            className="pdp-lightbox__img"
            onClick={(e) => e.stopPropagation()}
          />
          {count > 1 && (
            <button
              type="button"
              className="pdp-lightbox__btn pdp-lightbox__next"
              onClick={(e) => {
                e.stopPropagation();
                showNext();
              }}
              aria-label="Next"
            >
              <LuChevronRight />
            </button>
          )}
          <span className="pdp-lightbox__count ui-mono">
            {lightboxIndex + 1} / {count}
          </span>
        </div>
      )}
    </>
  );
});

export default ProofsGallery;
