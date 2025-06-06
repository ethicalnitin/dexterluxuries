import { useParams } from "react-router-dom";
import React, { useState, useEffect } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Countdown from "react-countdown";

// --- Static Data ---
const reviews = [
    { id: 1, name: "Amit Sharma", review: "Great product! Helped me understand DSA concepts much better." },
    { id: 2, name: "Sneha Verma", review: "The notes are well structured and easy to follow. Highly recommended!" },
    { id: 3, name: "Rahul Mehta", review: "Worth the price! Covers everything needed for cracking interviews." },
    { id: 4, name: "Priya Das", review: "Absolutely loved it! The AI section is very detailed." },
];

// --- Component ---
const ProductPage = () => {
    // --- State Variables ---
    const [product, setProduct] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const { id } = useParams();

    // --- Effects ---
    useEffect(() => {
        window.scrollTo(0, 0);
        setError("");
        setIsLoading(true);

        if (!id || !/^\d+$/.test(id)) {
            setError("Invalid product ID format. ID must be a number.");
            setIsLoading(false);
            return;
        }

        const fetchProduct = async () => {
            try {
                // Replace with your actual API endpoint if needed
                const response = await fetch(`http://localhost:3046/api/products/${id}`);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Failed to fetch product");
                }

                setProduct(data);

            } catch (err) {
                setError(err.message || "An error occurred while fetching the product.");
                console.error("Fetch Product Error:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProduct();
    }, [id]);

    // --- Event Handlers ---
    const handleBuyNowClick = () => {
        // Ensure product and price are loaded before constructing URL
        if (!product || typeof product.price === 'undefined') {
            console.error("Product data or price is missing. Cannot redirect accurately.");
            // Optionally, redirect without parameters or show an error to the user
            // window.location.href = 'https://payment.cybermafia.shop';
            alert("Error: Could not retrieve product details. Please try again later.");
            return; // Stop execution if product data is incomplete
        }

        // Encode product name in case it contains spaces or special characters
        const encodedProductName = encodeURIComponent(product.name || 'Product');

        // Construct the URL with query parameters
        // Common parameter names are 'amount', 'productId', 'productName'.
        // The external page MUST be coded to recognize these specific names.
        const paymentUrl = `https://payment.cybermafia.shop?amount=${product.price}&productId=${id}&productName=${encodedProductName}`;

        // Navigate directly to the external payment URL with parameters
        console.log("Navigating to:", paymentUrl); // Log URL for debugging
        window.location.href = paymentUrl;
    };

    // --- Render Logic ---
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

    // --- Carousel Settings ---
    const carouselSettings = {
        dots: false, infinite: true, speed: 1000, slidesToShow: 1,
        slidesToScroll: 1, autoplay: true, autoplaySpeed: 3000, arrows: false,
    };

    // --- Countdown Timer ---
    const countdownEnd = new Date(Date.now() + 3600000); // 1 hour from now

    // --- JSX ---
    return (
        <div className="max-w-6xl mx-auto p-2 mt-2">
            {/* Product Details Grid */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Left Column: Image and Title */}
                <div className="pt-20 flex flex-col items-center md:items-start">
                    <h1 className="text-2xl font-bold mb-2 text-center md:text-left">#1011 - {product.name}🔥</h1>
                    <img src={product.image} alt={product.name} className="pt-5 w-full max-w-md md:max-w-lg rounded-lg shadow-md" />
                </div>

                {/* Right Column: Details, Price, Buy Button, Description */}
                <div className="flex flex-col pt-0 md:pt-20 space-y-4">
                    {/* Countdown Timer */}
                    <div className="bg-gray-200 text-black p-4 rounded-lg shadow-inner self-center md:self-start">
                        <p className="text-sm font-semibold mb-2 text-center text-gray-700">Limited Time Offer Ends In:</p>
                        <Countdown date={countdownEnd} renderer={({ hours, minutes, seconds, completed }) => {
                            if (completed) return <span className="text-red-600 font-bold">Offer Expired!</span>;
                            return (
                                <div className="flex justify-center space-x-3 text-red-600">
                                    <div className="text-center"><span className="block text-2xl font-bold">{String(hours).padStart(2, '0')}</span><span className="text-xs">Hours</span></div>
                                    <div className="text-2xl font-bold">:</div>
                                    <div className="text-center"><span className="block text-2xl font-bold">{String(minutes).padStart(2, '0')}</span><span className="text-xs">Minutes</span></div>
                                    <div className="text-2xl font-bold">:</div>
                                    <div className="text-center"><span className="block text-2xl font-bold">{String(seconds).padStart(2, '0')}</span><span className="text-xs">Seconds</span></div>
                                </div>);
                        }} />
                    </div>

                    {/* Price and Buy Button */}
                    <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4 mt-4">
                        <div className="flex items-baseline space-x-2">
                            <p className="text-xl font-semibold text-gray-500 line-through">₹{product.strikeThroughPrice}</p>
                            <p className="text-3xl font-bold text-green-600">₹{product.price}</p>
                        </div>
                        {/* Button now calls the updated handler */}
                        <button id="buy-now-button" onClick={handleBuyNowClick}
                            className="w-full sm:w-auto py-3 px-8 md:px-12 text-white text-lg font-bold rounded-lg shadow-lg transition-all duration-200 ease-in-out bg-gradient-to-r from-pink-500 to-red-500 hover:from-red-500 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                            Buy Now
                        </button>
                    </div>
                     {/* Optional: Add user instruction */}
                     <p className="text-sm text-gray-600 text-center md:text-left mt-2">
                         Clicking 'Buy Now' will take you to the payment page. Please ensure ₹{product.price} is selected.
                     </p>

                    {/* Description */}
                    <div className="mt-4 text-gray-700 text-base md:text-lg prose max-w-none" dangerouslySetInnerHTML={{ __html: product.description }} />
                    {/* Display general errors if any */}
                    {error && <p className="text-red-500 mt-2">{error}</p>}
                </div>
            </div>

            {/* Customer Reviews Section */}
            <div className="w-full max-w-2xl mt-12 mx-auto">
                <h2 className="text-2xl font-semibold text-center mb-6">Customer Reviews 🤝</h2>
                <Slider {...carouselSettings}>
                    {reviews.map((review) => (
                        <div key={review.id} className="p-6 bg-gray-100 rounded-lg shadow-md text-center mx-2">
                            <p className="text-gray-800 text-base font-medium italic">"{review.review}"</p>
                            <p className="text-gray-600 mt-3 font-semibold">- {review.name}</p>
                        </div>))}
                </Slider>
            </div>
        </div> // End of main container
    );
};

export default ProductPage;