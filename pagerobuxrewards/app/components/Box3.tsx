import React, { useState, useEffect } from "react";
import Image from "next/image";
import getCurrencySymbol from "../actions/getCurrencySymbol";
import axios from "axios";
interface RobuxPackage {
  price: string;
  robux: number;
}

interface Box3Props {
  handleRobuxClick: (robuxAmount: number) => void;
  robuxPackages: RobuxPackage[];
  additionalPackages: RobuxPackage[];
}

const Box3: React.FC<Box3Props> = ({
  handleRobuxClick,
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
      {user && (
        <div className="rounded-lg bg-white shadow-md p-5 text-gray-800">
          <div className="flex items-center gap-3 sm:gap-4">
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

            <div className="user-details flex flex-col justify-center">
              <h4 className="text-2xl font-bold text-gray-800 tracking-wide">
                {user.displayName || ""}
              </h4>
              <p className="text-sm text-gray-600">
                @{user.username || "roblox-user"}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="ml-auto bg-red-500 text-white font-medium text-xs sm:text-sm md:text-base px-3 py-1.5 sm:px-4 sm:py-2 rounded-md hover:bg-red-600 transition shadow focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Log Out
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="flex items-center justify-center p-6 sm:p-8 md:w-1/3 bg-gray-50">
          <Image
            width={260}
            height={260}
            src="/images/robloxugcimage.png"
            alt="Roblox UGC item"
            className="h-auto w-full max-w-[260px] object-contain"
            priority
          />
        </div>

        <div className="flex flex-col md:w-2/3 py-6 px-4 sm:py-8 sm:px-8">
          <h2 className="mb-4 text-center text-xl font-bold text-gray-900 sm:text-2xl md:text-left">
            Roblox UGC Fund
          </h2>

          <div className="border-b flex justify-between items-center py-2 text-sm sm:text-base md:text-lg font-semibold text-gray-700">
            <div className="w-1/3 text-center">Price</div>
            <div className="w-1/3 text-center">Funding Amount</div>
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
                className="bg-green-500 text-white font-bold text-base sm:text-base md:text-sm px-5 py-3 md:py-2 rounded-md shadow-md hover:bg-green-600 transition duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 w-full md:w-auto min-h-12"
              >
                Claim UGC Funds
              </button>
            </div>
          ))}
        </div>
      </div>

      {additionalPackages.length > 0 && (
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
                Claim funds for Roblox hat
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
};

export default Box3;
