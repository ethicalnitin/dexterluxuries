import React from "react";

const Contact = () => {
  return (
    <div className="container mx-auto p-6 mt-14">
      <h1 className="text-3xl font-bold">Contact Us</h1>
      <p className="text-gray-700 mt-4">
        We would love to hear from you! Whether you have questions, suggestions, or just want to get in touch, feel free to reach out to us.
      </p>
      <div className="mt-6">
        <h2 className="text-xl font-semibold">Email Us</h2>
        <p className="text-gray-700 mt-2">
          You can contact us via email at: 
          <a href="mailto:leader@cybermafia.shop" className="text-blue-500 underline"> leader@cybermafia.shop</a>
        </p>
      </div>
    </div>
  );
};

export default Contact;
