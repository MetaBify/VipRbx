"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaBars, FaTimes } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useUserSummary } from "@/lib/useUserSummary";

const logoSrc = "/images/roblox-logo.png";
const pointsIconSrc = "/images/robux-points.png";

const NavBar = () => {
  const { user, loading, refresh } = useUserSummary();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("/images/noob.png");
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      refresh();
      setAvatarUrl("/images/noob.png");
      router.push("/login");
      router.refresh();
    }
  };

  const handleMenuToggle = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  useEffect(() => {
    if (!user?.username) {
      setAvatarUrl("/images/noob.png");
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    const cacheKey = `roblox-avatar:${user.username}`;

    const applyAvatar = (url: string | null) => {
      if (!url) {
        setAvatarUrl("/images/noob.png");
        return;
      }

      if (typeof window === "undefined") {
        setAvatarUrl(url);
        return;
      }

      const img = new window.Image();
      img.onload = () => {
        if (!cancelled) {
          setAvatarUrl(url);
        }
      };
      img.onerror = () => {
        sessionStorage.removeItem(cacheKey);
        if (!cancelled) {
          setAvatarUrl("/images/noob.png");
        }
      };
      img.src = url;
    };

    const cachedUrl =
      typeof window !== "undefined" ? sessionStorage.getItem(cacheKey) : null;

    if (cachedUrl) {
      applyAvatar(cachedUrl);
      return () => {
        cancelled = true;
        controller.abort();
      };
    }

    const loadAvatar = async () => {
      try {
        const response = await fetch("/api/roblox/avatar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: user.username }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Avatar lookup failed");
        }

        const data = await response.json();
        const imageUrl = data?.avatarUrl ?? null;

        if (typeof window !== "undefined" && imageUrl) {
          sessionStorage.setItem(cacheKey, imageUrl);
        }

        applyAvatar(imageUrl);
      } catch (error) {
        if (!cancelled) {
          console.warn("Roblox avatar fetch failed:", error);
          applyAvatar(null);
        }
      }
    };

    loadAvatar();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [user?.username]);

  const baseLinks = [
    { href: "/offers", label: "Offers" },
    { href: "/levels", label: "Levels" },
    { href: "/about", label: "Q&A" },
  ];

  const accountLinks = [
    { href: "/withdraw", label: "Withdraw" },
    { href: "/profile", label: "Profile" },
  ];

  const centerLinks = user
    ? [baseLinks[0], ...accountLinks, ...baseLinks.slice(1)]
    : baseLinks;

  const mobileLinks = user ? centerLinks : baseLinks;

  return (
    <nav
      id="main-site-nav"
      className="bg-[#dee1e3] fixed top-0 left-0 right-0 py-3 px-3 lg:px-6 z-50 shadow-md"
    >
      <div className="flex w-full items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={handleMenuToggle}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/80 text-[#393b3d] shadow lg:hidden"
            aria-label="Open navigation"
          >
            <FaBars size={18} />
          </button>
          <Link href="/" className="lg:hidden">
            <Image
              width={48}
              height={48}
              src={logoSrc}
              alt="Logo"
              className="h-10 w-10 cursor-pointer object-contain drop-shadow-md"
              priority
            />
          </Link>
          <div className="hidden lg:flex items-center gap-6">
            <Link href="/">
              <Image
                width={56}
                height={56}
                src={logoSrc}
                alt="Logo"
                className="h-12 w-12 cursor-pointer object-contain drop-shadow-md"
                priority
              />
            </Link>
            {centerLinks.map((item) => (
              <Link key={item.href} href={item.href}>
                <div className="font-semibold text-[#393b3d] px-4 py-2 border-b-2 border-transparent hover:border-black transition-all">
                  {item.label}
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <div className="ml-auto flex items-center gap-2 rounded-full bg-white/70 px-2.5 py-1 text-[13px] font-semibold text-gray-900 lg:hidden">
              <Image
                src={avatarUrl}
                alt={`${user.username}'s Avatar`}
                className="h-7 w-7 rounded-full"
                width={56}
                height={56}
                unoptimized
              />
              <div className="flex flex-col items-end leading-tight text-right">
                <span className="text-xs font-semibold">
                  {user.username} <span className="text-[10px]">Lv {user.level}</span>
                </span>
                <span className="flex items-center gap-1 text-[11px] text-emerald-600">
                  <Image
                    src={pointsIconSrc}
                    alt="Points"
                    width={14}
                    height={14}
                    className="h-3.5 w-3.5 object-contain"
                  />
                  {Number(user.balance).toFixed(0)}
                </span>
              </div>
            </div>
          )}
          <div className="hidden lg:flex items-center gap-3 pr-2">
            {loading ? null : user ? (
              <>
                <button
                  className="rounded-full bg-rose-500 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-rose-600"
                  onClick={handleLogout}
                >
                  Log out
                </button>
                <div className="flex items-center gap-3 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 shadow-sm">
                  <Image
                    src={avatarUrl}
                    alt={`${user.username}'s Avatar`}
                    className="h-10 w-10 rounded-full"
                    width={80}
                    height={80}
                    unoptimized
                  />
                  <div className="flex flex-col leading-tight text-gray-900">
                    <span className="text-[15px] font-bold">
                      {user.username}{" "}
                      <span className="text-[12px] font-semibold text-emerald-500">
                        Lv {user.level}
                      </span>
                    </span>
                    <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                      <Image
                        src={pointsIconSrc}
                        alt="Points"
                        width={22}
                        height={22}
                        className="h-5 w-5 object-contain"
                      />
                      {Number(user.balance).toFixed(0)}
                      <span className="text-[11px] font-medium text-emerald-500">
                        | Pending {Number(user.pending).toFixed(0)}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-full border border-emerald-400 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-500 transition hover:bg-emerald-500 hover:text-white"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-lg transition hover:bg-emerald-600"
                >
                  Register
                </Link>
              </>
            )}
          </div>
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
          {mobileLinks.map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                onClick={closeMenu}
                className="font-semibold text-[#393b3d] px-4 py-2 hover:bg-gray-200 transition-all rounded"
              >
                {item.label}
              </div>
            </Link>
          ))}
          {user && (
            <button
              type="button"
              onClick={() => {
                closeMenu();
                handleLogout();
              }}
              className="rounded-xl bg-rose-500 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-rose-600"
            >
              Log out
            </button>
          )}
        </div>
      </div>

      {!loading && !user && (
        <div className="mt-3 flex items-center justify-end gap-3 lg:hidden">
          <Link
            href="/login"
            className="rounded-full border border-emerald-400 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-500 transition hover:bg-emerald-500 hover:text-white"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-lg transition hover:bg-emerald-600"
          >
            Register
          </Link>
        </div>
      )}

    </nav>
  );
};

export default NavBar;
