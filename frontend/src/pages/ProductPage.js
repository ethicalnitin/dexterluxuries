import { useParams } from "react-router-dom";
import React, { useState, useEffect } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Countdown from "react-countdown";

const reviews = [
  { id: 1, name: "Amit Sharma", review: "Great product! Helped me understand DSA concepts much better." },
  { id: 2, name: "Sneha Verma", review: "The notes are well structured and easy to follow. Highly recommended!" },
  { id: 3, name: "Rahul Mehta", review: "Worth the price! Covers everything needed for cracking interviews." },
  { id: 4, name: "Priya Das", review: "Absolutely loved it! The AI section is very detailed." },
];

const ProductPage = () => {
 
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState("");

  const { id } = useParams();


  useEffect(() => {
    window.scrollTo(0, 0);
    setError("");
    setIsLoading(true);

    // Function to check if ID is a valid number
    const isValidNumericId = (id) => /^\d+$/.test(id); // Ensures it's only digits

    if (!id || !isValidNumericId(id)) {
      setError("Invalid product ID format. ID must be a number.");
      setIsLoading(false);
      return;
    }

    const fetchProduct = async () => {
      try {
        const response = await fetch(`https://dexterluxuries.onrender.com/api/products/${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch product");
        }

        setProduct(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);
  if (isLoading) {
    return <div className="text-center mt-20 text-lg font-bold">Loading product details...</div>;
  }

  if (error || !product) {
    return (
      <div className="flex items-center justify-center h-screen">
        <h2 className="text-center text-xl font-semibold text-red-500">⚠️ {error || "Product not found"}</h2>
      </div>
    );
  }

  const handleBuyNowClick = async () => {
    setIsPaying(true);
    setError("");

    try {
      console.log("buy now clicked");
      const response = await fetch("https://dexterluxuries.onrender.com/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: product.price, currency: "INR" }),
      });

      const data = await response.json();
      if (!data.success) throw new Error("Failed to create order.");

      const { order } = data;
      const options = {
        key: "rzp_live_qzRYRxbSri7zLo",
        amount: order.amount,
        currency: order.currency,
        name: "Dexter Luxuries",
        description: product.name,
        order_id: order.id,
        handler: async function (response) {
          try {
            const verifyResponse = await fetch("https://dexterluxuries.onrender.com/api/payment/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: order.id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyResponse.json();
            if (verifyData.success) alert("✅ Payment successful!");
            else alert("❌ Payment verification failed!");
          } catch (error) {
            alert("Error verifying payment");
          }
        },
        theme: { color: "#F37254" },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      setError("⚠️ Error processing payment. Try later.");
      console.error(error);
    } finally {
      setIsPaying(false);
    }
  };

  const carouselSettings = {
    dots: false,
    infinite: true,
    speed: 1000,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: false,
  };

  const countdownEnd = new Date(Date.now() + 3600000); // Set countdown for 1 hour from now

  return (
    <div className="max-w-6xl mx-auto p-2 mt-2">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="pt-20 justify-center">
          <h1 className="text-2xl font-bold mb-2">#1011 - {product.name}🔥</h1>
          <img src={product.image} alt={product.name} className="pt-5 w-full md:w-3/4 rounded-lg shadow-lg" />
        </div>

        <div className="bg-gray-300 text-black p-3 rounded-lg mt-3">
          <h2 className="text-sm font-bold mb-2">Only till stock lasts!⏳</h2>
          <Countdown
            date={countdownEnd}
            renderer={({ hours, minutes, seconds }) => (
              <div className="flex space-x-4 text-xl font-bold text-red-500">
                <div className="timer-item">
                  <span className="block text-2xl">{hours}</span>
                  <span className="text-sm">Hours</span>
                </div>
                <div className="timer-item">
                  <span className="block text-2xl">{minutes}</span>
                  <span className="text-sm">Minutes</span>
                </div>
                <div className="timer-item">
                  <span className="block text-2xl">{seconds}</span>
                  <span className="text-sm">Seconds</span>
                </div>
              </div>
            )}
          />
        </div>

        <div className="flex flex-row items-center mt-1 gap-3">
          <div className="flex items-center space-x-2">
            <p className="text-xl font-semibold text-gray-500 line-through">₹{product.strikeThroughPrice}</p>
            <p className="text-2xl font-semibold text-green-600">₹{product.price}</p>
          </div>

          <button
            id="buy-now-button"
            onClick={handleBuyNowClick}
            disabled={isPaying}
            className={`mt-1 w-auto md:w-48 py-3 px-20 text-white font-bold rounded-lg shadow-lg transition-all duration-200 ease-in-out ${isPaying ? "bg-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-pink-500 to-red-500 hover:from-red-500 hover:to-pink-500"}`}
          >
            {isPaying ? "Processing..." : "Buy Now"}
          </button>
        </div>

        <div className="flex flex-col justify-center">
          <p className="text-black-700 text-lg mt-3" dangerouslySetInnerHTML={{ __html: product.description }} />
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>
      </div>

      <div className="w-full max-w-md mt-6 mx-auto">
        <h2 className="text-xl font-semibold text-center mb-4">Customer Reviews🤝</h2>
        <Slider {...carouselSettings}>
          {reviews.map((review) => (
            <div key={review.id} className="p-4 bg-gray-100 rounded-lg shadow-md text-center">
              <p className="text-gray-800 text-sm font-medium">"{review.review}"</p>
              <p className="text-gray-600 mt-2 font-semibold">- {review.name}</p>
            </div>
          ))}
        </Slider>
      </div>
    </div>
  );
};

export default ProductPage;
