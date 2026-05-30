"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Box3 from "./Box3";
import robuxPackages from "../../robuxPackages.json";
import additionalPackages from "../../additionalPackages.json";
// import fetchRobloxUser from "../actions/getRobloxUser";
import Confirmation from "./Confirmation";

import Loading from "./Loader";
import axios from "axios";
const RobuxBox = () => {
  const [username, setUsername] = useState("");

  const [currentStep, setCurrentStep] = useState<
    "input" | "loading" | "box3" | "final" | "confirmation"
  >("input");
  const [user, setUser] = useState(null);
  const [userOutput, setUserOutput] = useState<string>("");

  const router = useRouter();

  const handleGetRobuxClick = async () => {
    const trimmedUsername = username.trim();

    if (trimmedUsername.length <= 2) {
      alert("Please enter a valid username");
      return;
    }

    setUsername(trimmedUsername);
    setUserOutput(`Searching for ${trimmedUsername}...`);

    setCurrentStep("loading");

    setTimeout(async () => {
      try {
        const response = await axios.get(
          `/api/getRobloxUser?username=${trimmedUsername}`
        );

        if (response.status === 200) {
          setUser(response.data);
          setCurrentStep("confirmation");
        } else {
          setUser(null);
          setCurrentStep("box3");
        }
      } catch (error) {
        console.log(error);
        setCurrentStep("box3");
      }
    }, 3000);
  };

  const handleRobuxClick = (robux: number) => {
    setUserOutput(`Sending ${robux} Robux to ${username}`);
    setCurrentStep("loading");
    setTimeout(() => {
      setCurrentStep("final");
    }, 2500);
  };

  const handleConfirm = () => {
    if (user) {
      sessionStorage.setItem("robloxUser", JSON.stringify(user));
      setCurrentStep("box3");
      router.refresh();
    }
  };

  const handleCancel = () => {
    setTimeout(() => {
      setUsername("");
      setCurrentStep("input");
    }, 4000);
    setCurrentStep("loading");
    setUser(null);

    setUserOutput("");
  };

  useEffect(() => {
    const savedUser = sessionStorage.getItem("robloxUser");
    if (savedUser && currentStep === "input") {
      setUser(JSON.parse(savedUser));
      setCurrentStep("box3");
    }
  }, [currentStep]);

  return (
    <div className="box_con rounded-md">
      {currentStep === "input" && (
        <div className="flex flex-col justify-center">
          <h3>Roblox Username</h3>
          <div className="flex flex-col justify-start sm:flex-row gap-4">
            <input
              type="text"
              className="input-username"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <button onClick={handleGetRobuxClick} className="self-start">
              Get Robux
            </button>
          </div>
        </div>
      )}

      {currentStep === "loading" && (
        <Loading userOutput={userOutput} verify={false} user={user} />
      )}

      {currentStep === "confirmation" && (
        <Confirmation
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          user={user}
        />
      )}

      {currentStep === "box3" && (
        <Box3
          additionalPackages={additionalPackages}
          robuxPackages={robuxPackages}
          handleRobuxClick={handleRobuxClick}
        />
      )}

      {currentStep === "final" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-red-50">
              <Image
                src="/images/norobots.png"
                alt="No robots verification"
                width={96}
                height={96}
                className="h-20 w-20 object-contain"
                priority
              />
            </div>

            <h3 className="text-2xl font-bold text-gray-900">
              Failed to Send Robux
            </h3>
            <p className="mt-2 text-base font-semibold text-red-600">
              AI activity detected.
            </p>
            <p className="mt-4 text-sm leading-6 text-gray-700 sm:text-base">
              Manual verification is required before your UGC funds can be
              released.
            </p>

          <button
            onClick={() => router.push("/funding/verify")}
              className="mt-6 min-h-12 w-full rounded-md bg-green-500 px-5 py-3 text-base font-bold text-white shadow-md transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
              Proceed to Verification
          </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RobuxBox;
