"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserSummary } from "@/lib/useUserSummary";

const STORAGE_KEY = "viprbx_signup_teaser_seen";

export default function SignupPromoPopup() {
  const { user, loading } = useUserSummary();
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (loading || user) {
      setVisible(false);
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    const alreadySeen = window.localStorage.getItem(STORAGE_KEY);
    if (!alreadySeen) {
      setVisible(true);
    }
  }, [user, loading]);

  const dismiss = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "1");
    }
    setVisible(false);
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-slate-900/50 px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-500">
          Limited promo
        </p>
        <h2 className="mt-2 text-xl font-bold text-slate-900">
          Sign up to claim +5 points instantly
        </h2>
        <p className="mt-3 text-sm text-slate-600">
          New VipRbx accounts receive a one-time 5 point boost that can be cashed out for Robux. Don&apos;t miss it!
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={() => {
              dismiss();
              router.push("/register");
            }}
            className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-600"
          >
            Create account
          </button>
          <button
            onClick={dismiss}
            className="text-xs font-semibold uppercase tracking-wide text-slate-400"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
