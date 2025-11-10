import React from "react";
import { User } from "./Confirmation";
import Image from "next/image";
interface LoadingProps {
  user?: User | null;
  userOutput?: string | null;
  verify?: boolean;
}
function Loading({ user, userOutput, verify }: LoadingProps) {
  return (
    <div className="box2 flex flex-col gap-5">
      <div className="folding">
        <div className="sk-cube sk-cube1"></div>
        <div className="sk-cube sk-cube2"></div>
        <div className="sk-cube sk-cube3"></div>
        <div className="sk-cube sk-cube4"></div>
        <div
          className={`absolute top-[36%] right-[35%] w-[30px] h-[30px] ${
            verify ? "bg-gray-200" : "bg-white"
          } rotate-[87deg]`}
        ></div>
      </div>
      <div className="flex flex-col sm:flex-row gap-6 items-center text-gray-800">
        {user ? (
          <div className="flex items-center gap-6 flex-col sm:flex-row">
            <h2 className="text-xl font-semibold tracking-tight text-gray-900">
              {userOutput}
            </h2>
            <div className="relative flex items-center gap-4 px-5 py-4 bg-white border border-gray-200 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <Image
                src={
                  user.profilePictureUrl || user.avatarUrl || "/images/noob.png"
                }
                alt={`${user.displayName}'s Avatar`}
                className="rounded-full w-16 h-16 border-4 border-gray-300 object-cover"
                width={100}
                height={100}
                unoptimized
              />
              <div className="text-center">
                <span className="block text-sm font-medium text-gray-600">
                  @{user.username || "roblox-user"}
                </span>
                <span className="block text-base font-semibold text-gray-900">
                  {user.displayName}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <h2 className="text-lg font-medium text-gray-700">{userOutput}</h2>
        )}
      </div>
    </div>
  );
}

export default Loading;
