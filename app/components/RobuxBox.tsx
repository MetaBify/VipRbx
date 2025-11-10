"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
          bonusItem={{
            name: "Platinum Domino Crown",
            image: "/images/bonus-item.gif",
            description:
              "One bonus item per account. Refunds result in losing the item.",
            limitedTime: true,
          }}
          handleRobuxClick={handleRobuxClick}
        />
      )}

      {currentStep === "final" && (
        <div className="box4">
          <h3>Final Step!</h3>
          <p>
            Please verify that you are not a robot by answering a few questions
            to receive your Robux! Please enter valid information for the Robux
            to go through. Take your time, as completing it will grant you bonus
            Robux as a reward!
          </p>
          <button
            onClick={() => router.push("/verify")}
            style={{ fontSize: "19px" }}
            className="mt-3 w-1/3 hover:bg-green-700 bg-green-500"
          >
            Verify
          </button>
        </div>
      )}
    </div>
  );
};

export default RobuxBox;
