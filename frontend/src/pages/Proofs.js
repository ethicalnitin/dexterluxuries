import React, { useState, useEffect } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import './Proofs.css';

// --- Static Data for Proofs Page ---
// These reviews are generalized for Dexter Luxuries as a whole,
// showcasing trust in your digital products/services.
const proofsPageReviews = [
  { id: 1, name: "Arjun S.", review: "Dexter Luxuries delivers! Their subscriptions are top-notch and always reliable." },
  { id: 2, name: "Bhavna P.", review: "I've tried their trading bots, and the results are consistently impressive. Highly recommend their digital tools!" },
  { id: 3, name: "Chris D.", review: "Seamless experience from purchase to activation. Dexter Luxuries truly provides premium digital products." },
  { id: 4, name: "Divya R.", review: "Exceptional support and powerful digital solutions. My go-to for all things digital." },
  { id: 5, name: "Eshan M.", review: "The value I get from their services far exceeds the price. Trustworthy and effective." },
];

const Proofs = () => {
  // Static URL for your proofs
  const proofsDriveUrl = "https://shorturl.at/r2Fvv";

  // --- Effects ---
  useEffect(() => {
    window.scrollTo(0, 0); // Scroll to top on component mount
  }, []);

  // --- Carousel Settings (similar to your ProductPage) ---
  const carouselSettings = {
    dots: true, // Show dots for navigation
    infinite: true,
    speed: 1000,
    slidesToShow: 1, // Show one review at a time
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000, // Slightly longer for reviews
    arrows: false, // No arrows, rely on dots or swipe
    responsive: [ // Responsive settings for different screen sizes
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        }
      },
    ]
  };

  return (
    <div className="proofs-page-container py-10 pt-15">
      {/* Hero Section */}
      <div className="proofs-hero py-25">
        <h1 className="proofs-hero-title">Experience the Dexter Luxuries Difference.</h1>
        <p className="proofs-hero-subtitle">
          See the tangible results and unwavering quality behind our premium digital products.
        </p>
      </div>

      {/* Main Content: Proofs Link & Description */}
      <div className="proofs-main-content">
        <div className="proofs-grid-section">
          <div className="proofs-text-content">
            <h2 className="proofs-section-title">Unlock Our Success Stories</h2>
            <p className="proofs-description">
              At Dexter Luxuries, we pride ourselves on delivering high-performance digital solutions that empower our clients.
              From robust trading bots that navigate complex markets to exclusive subscription access that provides unparalleled value,
              our proofs demonstrate the real-world impact of our offerings.
            </p>
            <p className="proofs-description">
              We understand that trust is paramount when investing in digital assets. That's why we've compiled a comprehensive collection
              of results, screenshots, and verifiable outcomes from our satisfied clients. This transparency is our commitment to you.
            </p>

            {/* Direct Link to Proofs */}
            <div className="proofs-action-area">
              <a
                href={proofsDriveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="proofs-main-button"
              >
                View All Proofs
              </a>
              <p className="proofs-note">
                (Clicking this button will open a new tab to our secure Google Drive folder,
                where you can explore detailed screenshots and evidence of our work.)
              </p>
            </div>
          </div>

        
        </div>
      </div>

      {/* Customer Reviews Section */}
      <div className="proofs-reviews-section">
        <h2 className="proofs-section-title">What Our Clients Say About Dexter Luxuries 🤝</h2>
        <Slider {...carouselSettings}>
          {proofsPageReviews.map((review) => (
            <div key={review.id} className="proofs-review-card">
              <p className="proofs-review-quote">"{review.review}"</p>
              <p className="proofs-review-client">- {review.name}</p>
            </div>
          ))}
        </Slider>
      </div>

      {/* Call to Action Section */}
      <div className="proofs-cta-section">
        <h2 className="proofs-cta-title">Ready to Experience Dexter Luxuries?</h2>
        <p className="proofs-cta-subtitle">
          Explore our products and elevate your digital journey.
        </p>
        <a href="/products" className="proofs-cta-button">
          Explore All Products
        </a>
      </div>
     
    </div>
  );
};

export default Proofs;