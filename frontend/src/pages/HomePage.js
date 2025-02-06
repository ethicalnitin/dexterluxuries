import React from "react";
import products from "../data/products";
import { Link } from "react-router-dom";

const HomePage = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Hero Section */}
      



      {/* Introductory Section */}
      <div className="text-center mb-12 pt-20">
        <p className="text-lg md:text-xl text-gray-600">
          Discover our exclusive collection of luxurious products. Shop the finest items designed to elevate your lifestyle.
        </p>
      </div>

      {/* Product Section */}
      <h2 className="text-2xl sm:text-3xl font-semibold text-center mb-8">
        Featured Products🔥
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {products.map((product) => (
          <div
            key={product.id}
            className="border p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 relative bg-white"
          >
            <Link to={`/product/${product.id}`} className="block">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-auto aspect-square object-cover rounded-lg mb-4"
              />
              <h3 className="text-lg md:text-xl font-semibold">{product.name}</h3>
            </Link>

            {/* Pricing Section */}
            <p className="text-gray-600 text-sm md:text-base mt-2">
              <span className="font-semibold text-black">₹{product.price}</span>
              <span className="line-through text-gray-500 ml-2">₹{product.strikeThroughPrice}</span>
            </p>

            {/* View Details Button */}
            <Link to={`/product/${product.id}`} className="absolute bottom-4 right-4">
              <button className="bg-blue-600 text-white text-sm px-4 py-2 rounded-md hover:bg-blue-700 transition">
                View Details
              </button>
            </Link>
          </div>
        ))}
      </div>

      {/* Call to Action Section */}
      <div className="bg-gray-100 py-12 mt-16 rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
            Join the Dexter Luxuries Family
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Sign up today and be the first to know about our latest arrivals, exclusive offers, and more.
          </p>
          <Link to="/signup" className="bg-blue-600 text-white text-lg px-6 py-3 rounded-md hover:bg-blue-700 transition">
            Get Started
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6 mt-12">
        <div className="text-center">
          <p>&copy; 2025 Dexter Luxuries. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
