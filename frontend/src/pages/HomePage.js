import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const HomePage = () => {

  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3040/api/products") // API call to backend
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((error) => console.error("Error fetching products:", error));
  }, []);



  return (
    <div className="w-full max-w-screen-xl mx-auto px-4 py-6">
  {/* Product Section */}
  <h2 className="text-2xl sm:text-3xl font-semibold text-center mb-8">
    Featured Products🔥
  </h2>
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
    {products.map((product) => (
      <div key={product.id} className="border p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 relative bg-white">
        <Link to={`/product/${product.id}`} className="block">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-64 object-contain rounded-lg mb-4"
          />
          <h3 className="text-lg md:text-xl font-semibold">{product.name}</h3>
        </Link>

        {/* Pricing Section */}
        <p className="text-gray-600 text-sm md:text-base mt-2">
          <span className="font-semibold text-black">₹{product.price}</span>
          <span className="line-through text-gray-500 ml-2">₹{product.strikeThroughPrice}</span>
        </p>

        {/* View Details Button */}
        <div className="flex justify-end mt-4">
          <Link to={`/product/${product.id}`}>
            <button className="bg-blue-600 text-white text-sm px-4 py-2 rounded-md hover:bg-blue-700 transition">
              View Details
            </button>
          </Link>
        </div>
      </div>
    ))}
  </div>
</div>

  );
};

export default HomePage;
