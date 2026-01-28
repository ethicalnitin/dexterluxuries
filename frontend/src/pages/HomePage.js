import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import './Homepage.css'; 

const HomePage = () => {
  const [products, setProducts] = useState([]);

 
  const trustBadges = [
    { src: "https://i.ibb.co/Xf3yCrN4/image.png", alt: "Secure Payment" }, 
    { src: "https://i.ibb.co/x8j8N7Pr/image.png", alt: "SSL Certified" },
    { src: "https://i.ibb.co/wNJpGYyz/image.png", alt: "Fast Shipping" },
    { src: "https://i.ibb.co/T9ddrcV/image.png", alt: "24/7 Customer Support" }, 
  ];


  useEffect(() => {
    
    fetch("https://dexterluxuries.onrender.com/api/products/")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => setProducts(data))
      .catch((error) => console.error("Error fetching products:", error));


  }, []);

  return (
   
    <div className="min-h-screen bg-white text-gray-900">
      <div className="w-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white py-2 text-sm font-semibold overflow-hidden">
        <div className="marquee"> {/* Custom CSS class for scrolling */}
          <span>📣 More than 80% off on digital products! Shop Now! 🛒 ✨ Limited Time Offer! ✨ Free Shipping on Orders over $100! 🚚</span>
        </div>
      </div>

      <div className="w-full max-w-screen-xl mx-auto px-4 py-6"> 

        <div className="flex flex-col items-center gap-6 my-8">
          <h3 className="text-xl font-semibold text-center mb-4 text-gray-800">Shop with Confidence</h3> {/* Adjusted text color for light background */}
          {trustBadges.map((badge, index) => (
            <img
              key={index}
              src={badge.src}
              alt={badge.alt}
              className="h-14 object-contain filter drop-shadow-md"
            />
          ))}
        </div>

        
        <div className="text-center text-green-600 font-bold text-lg mb-8 animate-pulse">
          🎉 Join 100+ active users exploring our luxurious collection! 🎉
        </div>

      
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8 text-gray-800">
          Featured Products🔥
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {products.map((product) => (
            <div key={product.id} className="border border-gray-200 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 relative bg-white"> 
              <Link to={`/product/${product.id}`} className="block">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-64 object-contain rounded-lg mb-4 transform hover:scale-105 transition-transform duration-300"
                />
               
                <h3 className="text-lg md:text-xl font-semibold text-gray-900">{product.name}</h3>
              </Link>

              
              <p className="text-gray-700 text-sm md:text-base mt-2">
                <span className="font-bold text-black">₹{product.price}</span>
                <span className="line-through text-gray-500 ml-2">₹{product.strikeThroughPrice}</span>
              </p>

              <div className="flex justify-end mt-4">
                <Link to={`/product/${product.id}`}>
                  <button className="bg-blue-600 text-white text-sm px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
                    View Details
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      
    </div>
  );
};

export default HomePage;
