"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUserSummary } from "@/lib/useUserSummary";

const robuxIconPath = "/images/robux-points.png"; // Drop your Robux/points icon in public/images

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, needsAuth, refresh } = useUserSummary();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const claimableLeads = useMemo(
    () => user?.leads.filter((lead) => lead.status === "AVAILABLE") ?? [],
    [user?.leads]
  );

  const pendingLeads = useMemo(
    () => user?.leads.filter((lead) => lead.status === "PENDING") ?? [],
    [user?.leads]
  );

  const handlePasswordUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setPasswordLoading(true);
    try {
      const response = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();
      if (!response.ok) {
        setPasswordError(data.error ?? "Unable to update password.");
        return;
      }

      setPasswordSuccess("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      refresh();
    } catch (error) {
      console.error(error);
      setPasswordError("Something went wrong while updating the password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!loading && needsAuth) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 px-6 py-16 text-center">
        <div className="max-w-md space-y-6 rounded-3xl bg-white p-10 shadow-2xl">
          <h1 className="text-2xl font-semibold text-slate-900">
            Sign in to view your profile
          </h1>
          <p className="text-sm text-slate-600">
            Create an account or log in to manage your offer progress, review claimable points, and update your credentials.
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
        <p className="text-sm text-slate-600">Loading your profile...</p>
      </div>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-4 py-16">
      <section className="rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 p-8 text-white shadow-2xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/70">
              viprbx profile
            </p>
            <h1 className="mt-2 text-3xl font-semibold md:text-4xl">
              Hey {user.username}, here&apos;s your progress
            </h1>
          </div>
          <div className="flex items-center gap-4 rounded-2xl bg-white/10 px-5 py-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
              <Image
                src={robuxIconPath}
                alt="Robux points icon"
                width={48}
                height={48}
                priority
                className="h-10 w-10 object-contain drop-shadow-lg"
              />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/70">
                points balance
              </p>
              <p className="text-xl font-semibold">
                {user.balance.toFixed(2)} pts
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            {
              label: "Total Points",
              value: user.totalPoints.toFixed(2),
            },
            {
              label: "Claimable",
              value: user.availablePoints.toFixed(2),
            },
            {
              label: "Pending",
              value: user.pending.toFixed(2),
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl bg-white/10 p-4 text-sm font-medium text-white shadow-lg backdrop-blur"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-white/70">
                {stat.label}
              </p>
              <p className="mt-3 text-2xl font-semibold">{stat.value} pts</p>
            </div>
          ))}
        </div>
      </section>


      <section className="rounded-3xl bg-white p-8 shadow-xl">
        <h2 className="text-xl font-semibold text-slate-900">
          Change password
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Secure your account with a fresh password. At least 6 characters are required.
        </p>

        <form onSubmit={handlePasswordUpdate} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
              Current password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
              New password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
              Confirm new password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
            />
          </div>

          {passwordError && (
            <p className="rounded-xl bg-rose-100 px-4 py-2 text-sm text-rose-700">
              {passwordError}
            </p>
          )}

          {passwordSuccess && (
            <p className="rounded-xl bg-emerald-100 px-4 py-2 text-sm text-emerald-700">
              {passwordSuccess}
            </p>
          )}

          <button
            type="submit"
            disabled={passwordLoading}
            className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-400"
          >
            {passwordLoading ? "Updating..." : "Update password"}
          </button>
        </form>
      </section>
    </main>
  );
}
