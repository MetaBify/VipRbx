"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useUserSummary } from "@/lib/useUserSummary";

const payoutOptions = [
  {
    id: "giftcard-50",
    label: "Robux gift card ($5 value) - 50 pts",
    points: 50,
    details: "Digital $5 Robux code delivered via email/DM.",
  },
  {
    id: "giftcard-100",
    label: "Robux gift card ($10 value) - 100 pts",
    points: 100,
    details: "Digital $10 Robux code delivered via email/DM.",
  },
  {
    id: "paypal-120",
    label: "PayPal transfer ($10 value) - 120 pts",
    points: 120,
    details: "Send funds to your PayPal account in USD.",
  },
];

export default function WithdrawPage() {
  const { user, loading, needsAuth } = useUserSummary();
  const [selectedOption, setSelectedOption] = useState(payoutOptions[0].id);
  const [note, setNote] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const selectedOptionDetails = useMemo(
    () => payoutOptions.find((item) => item.id === selectedOption),
    [selectedOption]
  );

  const claimableLeads = useMemo(
    () => user?.leads.filter((lead) => lead.status === "AVAILABLE") ?? [],
    [user?.leads]
  );

  const pendingLeads = useMemo(
    () => user?.leads.filter((lead) => lead.status === "PENDING") ?? [],
    [user?.leads]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage(null);
    setStatusError(null);

    if (!user) {
      setStatusError("You need to be signed in to request a withdrawal.");
      return;
    }

    const option = payoutOptions.find((item) => item.id === selectedOption);
    if (!option) {
      setStatusError("Select a valid withdrawal option.");
      return;
    }

    if (option.points > 0 && user.balance < option.points) {
      setStatusError(
        "You don&apos;t have enough points for that reward yet."
      );
      return;
    }

    try {
      const response = await fetch("/api/withdraw/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          optionId: option.id,
          note: note.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatusError(data.error ?? "Unable to submit your withdrawal request right now.");
        return;
      }

      setStatusMessage(data.message ?? "Withdrawal request sent. Our team will contact you shortly.");
      setNote("");
    } catch (error) {
      console.error(error);
      setStatusError("Network error while submitting the withdrawal request.");
    }
  };

  if (!loading && needsAuth) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 px-6 py-16 text-center">
        <div className="max-w-md space-y-6 rounded-3xl bg-white p-10 shadow-2xl">
          <h1 className="text-2xl font-semibold text-slate-900">
            Sign in to withdraw
          </h1>
          <p className="text-sm text-slate-600">
            Sign in to unlock withdrawal options once you&apos;re ready to redeem your points.
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
        <p className="text-sm text-slate-600">Loading withdraw options...</p>
      </div>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-10 px-4 py-16">
      <section className="rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 p-8 text-white shadow-2xl">
        <p className="text-xs uppercase tracking-[0.35em] text-white/70">
          withdrawal hub
        </p>
        <h1 className="mt-2 text-3xl font-semibold md:text-4xl">
          Choose how you want to redeem your {user.balance.toFixed(2)} points
        </h1>
        <p className="mt-4 text-sm text-white/80">
          Requests unlock at 100 points for most rewards, with a $5 gift card option starting at 50 points (about 8 Robux per point).
        </p>
      </section>

      <section className="rounded-3xl bg-white p-8 shadow-xl">
        <h2 className="text-xl font-semibold text-slate-900">
          Request a payout
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          This form is a placeholder; connect it to your processing flow or Airtable/Sheet. The request is validated on the client so users have enough points.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
              Withdrawal option
            </label>
            <select
              value={selectedOption}
              onChange={(event) => setSelectedOption(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
            >
              {payoutOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            {selectedOptionDetails?.details && (
              <p className="mt-2 text-xs text-slate-500">
                {selectedOptionDetails.details}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
              Notes / contact info
            </label>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={4}
              placeholder="Provide delivery details (PayPal email, Roblox username, Discord tag, etc.)."
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
            />
          </div>

          {statusError && (
            <p className="rounded-xl bg-rose-100 px-4 py-2 text-sm text-rose-700">
              {statusError}
            </p>
          )}

          {statusMessage && (
            <p className="rounded-xl bg-emerald-100 px-4 py-2 text-sm text-emerald-700">
              {statusMessage}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-600"
          >
            Submit request
          </button>
        </form>

        <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-sm text-emerald-700">
          <p>
            Heads up: submitting a withdrawal immediately deducts the required points from your balance, so double-check the details before you send it in.
          </p>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-8 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">
            Claimable rewards
          </h2>
          <Link
            href="/profile"
            className="text-sm font-semibold text-emerald-500 transition hover:text-emerald-600"
          >
            View profile summary
          </Link>
        </div>
        {claimableLeads.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            No claimable rewards yet. Completed offers will appear here soon after verification.
          </p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {claimableLeads.map((lead) => (
              <div
                key={lead.id}
                className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm"
              >
                <p className="text-sm font-semibold text-emerald-800">
                  Offer {lead.offerId}
                </p>
                <p className="mt-2 text-sm text-emerald-600">
                  {lead.points.toFixed(2)} pts ready to redeem
                </p>
                <p className="mt-1 text-xs text-emerald-500">
                  Unlocked at{" "}
                  {lead.availableAt
                    ? new Date(lead.availableAt).toLocaleString()
                    : "Just now"}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl bg-white p-8 shadow-xl">
        <h2 className="text-xl font-semibold text-slate-900">
          Pending confirmations
        </h2>
        {pendingLeads.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            You have no pending leads. Keep an eye out for new rewards.
          </p>
        ) : (
          <div className="mt-6 space-y-4">
            {pendingLeads.map((lead) => (
              <div
                key={lead.id}
                className="flex flex-col gap-2 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-700"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-amber-800">
                    Offer {lead.offerId}
                  </span>
                  <span>{lead.points.toFixed(2)} pts</span>
                </div>
                <p className="text-xs text-amber-600">
                  Expected unlock around{" "}
                  {new Date(lead.availableAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
