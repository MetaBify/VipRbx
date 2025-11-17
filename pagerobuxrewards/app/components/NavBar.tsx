"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaBars, FaTimes } from "react-icons/fa";
import { useRouter } from "next/navigation";
interface User {
  avatarUrl: string;
  displayName: string;
  username: string;
  profilePictureUrl: string;
}

const GIVEAWAY_BASE = "/giveaway";

const NavBar = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  useEffect(() => {
    const storedUser = sessionStorage.getItem("robloxUser");
    if (storedUser) {
      router.refresh();
    }
    setUser(JSON.parse(storedUser));
  }, [router]);

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="bg-[#dee1e3] fixed top-0 left-0 right-0 p-1 lg:px-4 z-50 shadow-md">
      <div className="flex items-center justify-between ">
        <div className="flex items-center space-x-4">
          <FaBars
            onClick={handleMenuToggle}
            className="text-[#393b3d] text-2xl cursor-pointer lg:hidden"
          />
          <Link href={GIVEAWAY_BASE}>
            <Image
              width={40}
              height={40}
              src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTYiIGhlaWdodD0iNTYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTExLjY3NiAwTDAgNDQuMTY2IDQzLjU3NyA1NmwxMS42NzYtNDQuMTY2TDExLjY3NiAwem0yMC40MDkgMzUuODI3bC0xMi4xNzctMy4zMDggMy4yNjQtMTIuMzQyIDEyLjE4MiAzLjMwOC0zLjI3IDEyLjM0MnoiIGZpbGw9IiMzOTNCM0QiLz48L3N2Zz4="
              alt="Logo"
              className="w-8 h-8 cursor-pointer"
              unoptimized
            />
          </Link>
        </div>

        <div className="hidden lg:flex space-x-6">
          {[
            { href: "https://www.roblox.com/charts", label: "Charts" },
            { href: "https://www.roblox.com/catalog", label: "Marketplace" },
            { href: "https://www.roblox.com/home", label: "Create" },
            {
              href: "https://www.roblox.com/upgrades/robux?ctx=navpopover",
              label: "Robux",
            },
            { href: `${GIVEAWAY_BASE}/about`, label: "Q&A" },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <div className="font-semibold text-[#393b3d] px-4 py-2 border-b-2 border-transparent hover:border-black transition-all">
                {item.label}
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg transform ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out z-50`}
      >
        <div className="flex justify-end p-4">
          <FaTimes
            onClick={closeMenu}
            className="text-[#393b3d] text-2xl cursor-pointer"
          />
        </div>

        <div className="flex flex-col mt-4 space-y-4">
          {[
            { href: "https://www.roblox.com/charts", label: "Charts" },
            { href: "https://www.roblox.com/catalog", label: "Marketplace" },
            { href: "https://www.roblox.com/home", label: "Create" },
            {
              href: "https://www.roblox.com/upgrades/robux?ctx=navpopover",
              label: "Robux",
            },
            { href: `${GIVEAWAY_BASE}/about`, label: "Q&A" },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                onClick={closeMenu}
                className="font-semibold text-[#393b3d] px-4 py-2 hover:bg-gray-200 transition-all rounded"
              >
                {item.label}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {user && (
        <div className="flex gap-5">
          <div className="relative flex gap-2 items-center px-3">
            <Image
              src={
                user.profilePictureUrl || user.avatarUrl || "/images/noob.png"
              }
              alt={`${user.displayName}'s Avatar`}
              className="rounded-full w-10 h-10"
              width={96}
              height={96}
              unoptimized
            />

            <div className="text-center ">
              <span className="block text-sm font-semibold text-gray-900">
                {user.displayName || "Display name not available"}
              </span>
            </div>
          </div>
          <button
            className="   p-1 text-[13px] bg-rose-600  hover:bg-rose-400 "
            onClick={() => {
              sessionStorage.removeItem("robloxUser");
              window.location.reload();
            }}
          >
            Log out
          </button>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
