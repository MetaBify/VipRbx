"use client";

import Link from "next/link";
import { useUserSummary } from "@/lib/useUserSummary";

const LEVEL_INTERVAL = 100;

const tiers = [
  { level: 1, perk: "Welcome badge in chat" },
  { level: 3, perk: "Priority responses for withdrawals" },
  { level: 5, perk: "Bonus entry to giveaways" },
  { level: 8, perk: "Early access to limited offers" },
  { level: 10, perk: "VIP Discord access (coming soon)" },
];

export default function LevelsPage() {
  const { user, loading, needsAuth } = useUserSummary();

  if (!loading && needsAuth) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 px-6 py-16 text-center">
        <div className="max-w-md space-y-6 rounded-3xl bg-white p-10 shadow-2xl">
          <h1 className="text-2xl font-semibold text-slate-900">
            Sign in to view your level
          </h1>
          <p className="text-sm text-slate-600">
            Track how close you are to unlocking the next badge. Each 100
            points increases your level.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/login"
              className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="rounded-full border border-emerald-400 px-6 py-3 text-sm font-semibold text-emerald-500 transition hover:bg-emerald-500 hover:text-white"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-sm text-slate-600">Loading level...</p>
      </div>
    );
  }

  const totalPoints = Number(user.balance + user.pending);
  const currentLevel = user.level;
  const nextLevelTarget = currentLevel * LEVEL_INTERVAL;
  const progressToNext = Math.min(
    100,
    Math.floor(((totalPoints % LEVEL_INTERVAL) / LEVEL_INTERVAL) * 100)
  );
  const pointsNeeded = Math.max(0, nextLevelTarget - totalPoints);

  const nextPerk = tiers.find((tier) => tier.level > currentLevel);
  const upcomingPerk = nextPerk
    ? `Unlocks at level ${nextPerk.level}: ${nextPerk.perk}`
    : "You have unlocked all current perks.";

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-4 py-16">
      <section className="rounded-3xl bg-gradient-to-br from-indigo-500 via-violet-500 to-emerald-500 p-8 text-white shadow-2xl">
        <p className="text-xs uppercase tracking-[0.35em] text-white/70">
          Level center
        </p>
        <h1 className="mt-2 text-3xl font-semibold md:text-4xl">
          {user.username}, you&apos;re level {currentLevel}
        </h1>
        <p className="mt-3 text-sm text-white/80">
          Each 100 points increases your level, which shows up in chat and future leaderboards.
        </p>
        <div className="mt-6">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/70">
            <span>
              {totalPoints % LEVEL_INTERVAL}/{LEVEL_INTERVAL} pts
            </span>
            <span>Next level in {pointsNeeded} pts</span>
          </div>
          <div className="mt-2 h-3 rounded-full bg-white/30">
            <div
              className="h-full rounded-full bg-white"
              style={{ width: `${progressToNext}%` }}
            />
          </div>
          <p className="mt-4 text-sm text-white/80">{upcomingPerk}</p>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-slate-900">
          Level perks roadmap
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          These perks unlock automatically as you climb. More perks will be
          added as the community grows.
        </p>
        <div className="mt-6 space-y-4">
          {tiers.map((tier) => (
            <div
              key={tier.level}
              className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700"
            >
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  Level {tier.level}
                </p>
                <p className="font-semibold text-slate-900">{tier.perk}</p>
              </div>
              {currentLevel >= tier.level ? (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Unlocked
                </span>
              ) : (
                <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                  Locked
                </span>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
