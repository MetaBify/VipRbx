import React from "react";
import Image from "next/image";
import { IoClose } from "react-icons/io5"; // Importing close icon from react-icons

function Offer({ removeOffer }) {
  return (
    <div
      className="fixed inset-0 bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center z-50"
      style={{ height: "100vh" }}
    >
      <div
        className="relative flex flex-col items-center justify-center bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full"
        style={{
          maxWidth: "400px",
          boxShadow: "0px 12px 20px rgba(0, 0, 0, 0.15)",
          transform: "scale(1.05)",
          animation: "pulse 1.5s infinite alternate",
        }}
      >
        {/* Close button with an X icon */}
        <button
          className="absolute top-2 right-2 p-2 text-white bg-black rounded-full hover:bg-gray-800"
          onClick={removeOffer}
        >
          <IoClose size={24} />
        </button>
        <Image
          width={100}
          height={100}
          src="/images/tik-tok.png"
          alt="logo"
          className="w-24 h-24 object-cover mb-4"
          unoptimized
        />
        <div className="flex flex-col items-center gap-3 mt-4">
          <h3 className="text-3xl font-bold text-center text-black drop-shadow-lg">
            TikTok Exclusive Offer
          </h3>
          <p className="text-green-700 text-center text-lg drop-shadow-md">
            Download TikTok now and claim 100,000 Robux instantly!
          </p>
        </div>

        <button
          className="mt-6 w-full py-3 rounded-full border-4 border-white bg-green-600 text-white font-bold hover:bg-green-700 transition-colors duration-300 transform hover:scale-105"
          onClick={() => {
            window.open("https://smrturl.co/a/s658300b486/86?s1=", "_blank");
            removeOffer();
          }}
        >
          Get 100,000 Robux
        </button>
      </div>
    </div>
  );
}

export default Offer;
