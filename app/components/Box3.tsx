import React, { useState, useEffect } from "react";
import Image from "next/image";
import { FiChevronDown } from "react-icons/fi";
import getCurrencySymbol from "../actions/getCurrencySymbol";
import axios from "axios";
interface RobuxPackage {
  price: string;
  robux: number;
}

interface Box3Props {
  handleRobuxClick: (robuxAmount: number) => void;
  bonusItem: {
    name: string;
    image: string;
    description: string;
    limitedTime: boolean;
  };
  robuxPackages: RobuxPackage[];
  additionalPackages: RobuxPackage[];
}

const Box3: React.FC<Box3Props> = ({
  handleRobuxClick,
  bonusItem,
  robuxPackages,
  additionalPackages,
}) => {
  const [user, setUser] = useState(null);
  const [currency, setCurrency] = useState("");

  useEffect(() => {
    const fetchCurrency = async () => {
      try {
        const response = await axios.get("/api/location");
        const locationData = response.data;

        if (locationData.currency) {
          setCurrency(getCurrencySymbol(locationData.currency));
        } else {
          console.log("Currency data not found in response");
          setCurrency("$");
        }
      } catch (error) {
        setCurrency("$");
        console.log("Error fetching currency data:", error.message);
      }
    };
    const storedUser = sessionStorage.getItem("robloxUser");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchCurrency();
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("robloxUser");
    window.location.reload();
  };

  return (
    <main className="space-y-10 px-4 sm:px-8 md:px-16">
      <div className="rounded-lg bg-gradient-to-r from-yellow-300 to-yellow-500 shadow-md p-5 text-gray-800 text-center">
        <h2 className="font-semibold text-lg sm:text-xl md:text-2xl flex items-center justify-center gap-3">
          Bonus Virtual Item Included with a Robux Purchase
          <FiChevronDown
            width={25}
            height={25}
            className="text-gray-700 w-5 h-5 sm:w-8 sm:h-8 md:w-10 md:h-10 "
          />
        </h2>

        {user && (
          <div className="flex   mt-3 items-center gap-2 space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full overflow-hidden border border-gray-300 shadow-md">
              <Image
                src={
                  user.profilePictureUrl || user.avatarUrl || "/images/noob.png"
                }
                alt={`${user.displayName}'s Avatar`}
                className="object-cover w-full h-full"
                width={200}
                height={200}
                unoptimized
              />
            </div>

            <div className="user-details flex flex-col items-center justify-center">
              <h4 className="text-2xl font-bold text-gray-800 tracking-wide">
                {user.displayName || ""}
              </h4>
              <p className="text-sm text-gray-600">
                @{user.username || "roblox-user"}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="mt-3 sm:mt-0 bg-red-500 text-white font-medium text-xs sm:text-sm md:text-base px-3 py-1.5 sm:px-4 sm:py-2 rounded-md hover:bg-red-600 transition shadow focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Log Out
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="flex flex-col items-center  p-1 px-4 sm:py-8 sm:px-6 md:py-10 md:px-6 md:w-1/3 bg-gradient-to-b from-gray-50 to-gray-100 shadow-inner rounded-md">
          <div className="relative overflow-hidden">
            <Image
              width={200}
              height={200}
              src={bonusItem.image}
              alt={bonusItem.name}
              className="w-32 h-32 sm:w-40 sm:h-40 md:w-40 md:h-40 object-cover rounded-md"
            />
          </div>
          {bonusItem.limitedTime && (
            <span className="bg-yellow-400 text-black text-xs sm:text-sm md:text-base font-semibold px-3 py-1 rounded-full  shadow-lg">
              Limited Time Only!
            </span>
          )}
          <h3 className="text-sm sm:text-lg md:text-lg font-bold text-gray-800 text-center mt-2 leading-snug">
            {bonusItem.name}
          </h3>
          <p className="text-gray-600 text-xs sm:text-sm md:text-sm  text-center leading-relaxed max-w-xs">
            {bonusItem.description}
          </p>
        </div>

        <div className="flex flex-col md:w-2/3 py-6 px-4 sm:py-8 sm:px-8">
          <div className="border-b flex justify-between items-center py-2 text-sm sm:text-base md:text-lg font-semibold text-gray-700">
            <div className="w-1/3 text-center">Price</div>
            <div className="w-1/3 text-center">Robux Packages</div>
            <div className="w-1/3 text-center"></div>
          </div>

          {robuxPackages.map((pkg, index) => (
            <div
              key={index}
              className="border-b flex flex-col md:flex-row items-center md:justify-between py-3 sm:py-4 hover:bg-gray-50 transition"
            >
              <div className="text-gray-900 flex gap-2 font-semibold text-xl sm:text-2xl md:text-3xl mb-2 md:mb-0">
                <div className="font-semibold ">{currency}</div>
                {pkg.price}
              </div>

              <div className="flex items-center justify-center w-full md:w-[120px] lg:w-[140px] bg-gray-800 text-white rounded-lg shadow-sm p-2 mb-2 md:mb-0">
                <Image
                  alt="Robux icon"
                  width={24}
                  height={24}
                  src="/images/robux-white.png"
                  className="w-4 sm:w-5"
                />
                <span className="font-bold text-white text-sm sm:text-base md:text-base ml-2">
                  {pkg.robux.toLocaleString()}
                </span>
              </div>

              {/* Button */}
              <button
                onClick={() => handleRobuxClick(pkg.robux)}
                className="bg-green-500 text-white font-bold text-xs sm:text-sm md:text-sm px-3 py-1.5 rounded-md shadow-md hover:bg-green-600 transition duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 w-full md:w-auto"
              >
                Get Robux
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg shadow-lg p-4 sm:p-6 md:p-8">
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-center mb-6 sm:mb-8 text-gray-700">
          Same Great Value on Other Robux Packages
        </h2>

        <div className="border-b flex justify-between items-center py-2 text-sm sm:text-base md:text-lg font-bold text-gray-700 bg-gray-100 rounded-t-lg">
          <div className="w-1/3 text-center">Price</div>
          <div className="w-1/3 text-center">Robux Packages</div>
          <div className="w-1/3 text-center"></div>
        </div>

        {additionalPackages.map((pkg, index) => (
          <div
            key={index}
            className="border-b flex flex-col md:flex-row md:justify-between items-center py-3 sm:py-4 hover:bg-gray-100 transition-all duration-200 rounded-md"
          >
            <div className="w-full md:w-1/3 flex gap-2 text-gray-900 font-semibold text-center md:text-left  text-xl sm:text-2xl md:text-3xl mb-2 md:mb-0">
              <div className="font-semibold ">{currency}</div>
              {pkg.price}
            </div>

            <div className="flex items-center justify-center w-full md:w-1/3 gap-2 p-2 bg-gray-50 border border-gray-300 rounded-lg shadow-sm">
              <Image
                alt="Robux icon"
                width={24}
                height={24}
                src="/images/robux-gray.png"
                className="w-5 sm:w-6"
              />
              <span className="font-bold text-gray-800 text-sm sm:text-base md:text-lg">
                {pkg.robux.toLocaleString()}
              </span>
            </div>

            <button
              onClick={() => handleRobuxClick(pkg.robux)}
              className="mt-3 md:mt-0 bg-green-500 text-white font-semibold text-sm sm:text-base md:text-lg px-4 py-2 rounded-md shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition w-full md:w-auto"
            >
              Get Robux
            </button>
          </div>
        ))}
      </div>
    </main>
  );
};

export default Box3;
