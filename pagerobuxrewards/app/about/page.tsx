import React from "react";
import Image from "next/image";
import Link from "next/link";
function page() {
  return (
    <div className="bg-gray-50 min-h-screen py-8 px-4 sm:px-8 md:px-16 mt-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-yellow-300 to-yellow-500 shadow-md rounded-lg p-6 mb-10 text-center">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">
          Q&A
        </h1>
        <p className="mt-2 text-sm sm:text-base md:text-lg text-gray-700">
          Find answers to commonly asked questions and get the information you
          need quickly and easily.
        </p>
      </div>

      <div className="flex flex-col md:flex-row items-center md:items-start bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="md:w-1/3  py-6 px-4 sm:py-8 sm:px-6">
          <Image
            src="/images/duo.png"
            alt="Our Team"
            width={400}
            height={400}
            unoptimized
            className="w-40 h-40 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-full shadow-md object-cover mx-auto"
          />
        </div>

        <div className="md:w-2/3 py-6 px-4 sm:py-8 sm:px-6">
          <ul className="list-disc pl-5 text-xl sm:2xl flex flex-col gap-5">
            <li>You need to complete the offer to receive the Robux.</li>
            <li>
              It may sometimes take up to 1 to 3 days to finalize and send the
              Robux to the specified user.
            </li>
            <li>
              If the Robux hasn’t been sent to your account, please try again
              later.
            </li>
            <li>
              If you completed an offer and didn’t receive the Robux, simply try
              a different offer until you do
            </li>
          </ul>
        </div>
      </div>

      <div className="shadow-xl rounded-lg p-8 mt-12 text-center bg-gradient-to-r ">
        <div className="flex flex-col items-center mb-8 space-y-6">
          <div className="flex items-center space-x-4 gap-2">
            <Image
              width={100}
              height={100}
              className="w-16 h-16 object-contain"
              alt="YouTube Logo"
              src={"/images/yt.png"}
              unoptimized
            />
            <div className="flex flex-col">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold">
                YT:
              </h2>
              <Link
                href={"https://www.youtube.com/@SatBloxy"}
                className="text-lg sm:text-xl md:text-2xl  transition-colors"
              >
                @SatBloxy
              </Link>
            </div>
          </div>

          <div className="flex  items-center justify-center gap-2">
            <Image
              width={200}
              height={200}
              className="w-16 h-16 object-contain"
              alt="Roblox Logo"
              src={"/images/roblox-logo.png"}
              unoptimized
            />
            <div className="flex flex-col ">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold">
                Roblox:
              </h2>
              <Link
                href={"https://www.roblox.com/users/2313780943/profile"}
                className="text-lg sm:text-xl md:text-2xl  transition-colors"
              >
                @SatBlox
              </Link>
            </div>
          </div>
        </div>

        {/* Hoverable Card Shadow Effect */}
        <div className="group hover:shadow-2xl  hover:scale-105 transition-transform duration-300 ease-in-out">
          <p className="text-base sm:text-lg md:text-xl text-black mt-4">
            Follow on YouTube and Roblox for updates!
          </p>
        </div>
      </div>
    </div>
  );
}

export default page;
