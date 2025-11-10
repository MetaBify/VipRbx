"use client";

import Link from "next/link";
import { useUserSummary } from "@/lib/useUserSummary";
import { useMemo } from "react";

export default function HomeHero() {
  const { user, loading } = useUserSummary();

  const ctaButtons = useMemo(() => {
    if (loading) {
      return (
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <span className="rounded-full bg-white/20 px-6 py-3 text-sm font-semibold text-white">
            Checking session...
          </span>
        </div>
      );
    }

    if (user) {
      return (
        <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="/offers"
            className="w-56 rounded-full bg-white px-6 py-3 text-center text-sm font-semibold text-emerald-600 shadow-lg transition hover:bg-emerald-50"
          >
            View offers
          </Link>
          <Link
            href="/profile"
            className="w-56 rounded-full border border-white/40 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Profile &amp; rewards
          </Link>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <Link
          href="/register"
          className="w-56 rounded-full bg-white px-6 py-3 text-center text-sm font-semibold text-emerald-600 shadow-lg transition hover:bg-emerald-50"
        >
          Create your account
        </Link>
        <Link
          href="/login"
          className="w-56 rounded-full border border-white/40 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10"
        >
          I already have one
        </Link>
      </div>
    );
  }, [loading, user]);

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 px-6 py-16 text-white shadow-2xl sm:px-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_55%)]" />
      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-6 text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-white/70">
          viprbx rewards platform
        </p>
        <h1 className="text-3xl font-semibold sm:text-4xl md:text-5xl">
          Sign up, complete offers, redeem points for Robux
        </h1>
        <p className="text-sm text-white/80 sm:text-base">
        Complete partner offers to earn points automatically. Every point equals roughly 8 Robux once redeemed.
        </p>
        {user && (
          <div className="flex flex-wrap items-center justify-center gap-4 rounded-2xl bg-white/10 px-5 py-4 text-sm">
            <div className="text-left">
              <p className="text-xs uppercase tracking-[0.25em] text-white/70">
                your summary
              </p>
              <p className="mt-1 font-semibold">
                Balance: {user.balance.toFixed(2)} pts · Pending:{" "}
                {user.pending.toFixed(2)} pts
              </p>
            </div>
          </div>
        )}
        {ctaButtons}
        <div className="mt-8 grid gap-4 text-left text-sm text-white/80 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/20 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-white/60">
              1. register
            </p>
            <p className="mt-2">
              Create your viprbx account so we can track points and unlock rewards.
            </p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-white/60">
              2. complete offers
            </p>
            <p className="mt-2">
              Sync progress from the offers wall - every completed offer awards points.
            </p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-white/60">
              3. redeem rewards
            </p>
            <p className="mt-2">
              Claim your points and request a payout as soon as you hit 100 points.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
