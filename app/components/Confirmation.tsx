import React from "react";
import Image from "next/image";

export type User = {
  displayName: string;
  avatarUrl: string | null;
  username: string;
  profilePictureUrl: string | null;
};

interface ConfirmationProps {
  user?: User | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const Confirmation = ({ user, onConfirm, onCancel }: ConfirmationProps) => {
  return (
    <div className="flex flex-col items-center p-2 sm:p-4">
      <h3 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 text-gray-800 text-center">
        Confirm Account
      </h3>

      <div className="profile-info flex flex-col items-center space-y-3 sm:space-y-4 p-3 sm:p-4 rounded-lg border border-green-500 shadow-lg w-full max-w-sm">
        {user && (
          <div className="flex flex-col items-center">
            <div className="relative w-24 h-24 sm:w-36 sm:h-36">
              <Image
                src={user.profilePictureUrl || "/images/noob.png"}
                alt={`${user.displayName}'s Avatar ` || "avatar"}
                className="rounded-full shadow-md hover:shadow-lg transition-shadow duration-300"
                width={144}
                height={144}
                unoptimized
              />
            </div>

            <div className="user-details flex flex-col items-center justify-center text-center">
              <h4 className="text-xl sm:text-2xl font-bold text-gray-800 tracking-wide">
                {user.displayName || "Displayname not available"}
              </h4>
              <p className="text-xs sm:text-sm text-gray-600">
                @{user.username || "roblox-user"}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="confirmation-buttons flex flex-col sm:flex-row gap-2 sm:gap-4 mt-3 sm:mt-4 w-full max-w-sm">
        <button
          className="bg-green-600 text-white px-4 py-2 sm:px-5 sm:py-2 rounded-lg font-semibold hover:bg-green-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          onClick={onConfirm}
        >
          Yes, this is me!
        </button>
        <button
          className="bg-red-600 text-white px-4 py-2 sm:px-5 sm:py-2 rounded-lg font-semibold hover:bg-red-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          onClick={onCancel}
        >
          No, change username
        </button>
      </div>
    </div>
  );
};

export default Confirmation;
