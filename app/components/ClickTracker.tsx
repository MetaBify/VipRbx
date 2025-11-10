"use client";

import { useState, useEffect } from "react";
import Offer from "./Offer";
import axios from "axios";

const ClickTracker = ({ children }: { children: React.ReactNode }) => {
  const [showOffer, setShowOffer] = useState(false);
  const [clicks, setClicks] = useState(0);

  useEffect(() => {
    const handleClick = async () => {
      try {
        const response = await axios.get("/api/location");
        const data = await response.data;

        const isFromUS = data?.location?.country_name === "United States";

        setClicks((prevClicks) => {
          const newClickCount = prevClicks + 1;

          if (newClickCount % 5 === 0 && !showOffer && isFromUS) {
            setShowOffer(true);
          }

          return newClickCount;
        });
      } catch (error) {
        console.log("Error fetching location data:", error);
      }
    };

    window.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("click", handleClick);
    };
  }, [showOffer, clicks]);

  const removeOffer = () => {
    setShowOffer(false);
    setClicks(0);
  };

  return (
    <div>
      {children}

      {showOffer && (
        <div>
          <Offer removeOffer={removeOffer} />

          <button
            onClick={removeOffer}
            className="mt-4 py-2 px-4 bg-red-500 text-white rounded-full hover:bg-red-600"
          >
            Close Offer
          </button>
        </div>
      )}
    </div>
  );
};

export default ClickTracker;
