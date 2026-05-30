"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function ClaimPlusApply() {
  const router = useRouter();
  const [robloxUsername, setRobloxUsername] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVerification, setShowVerification] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/claimplus/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ robloxUsername, email }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to submit application.");
      }

      setShowVerification(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to submit application."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-16">
      <section className="mx-auto max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <Image
            src="/images/plus.png"
            alt="Roblox Plus"
            width={96}
            height={96}
            className="h-20 w-20 object-contain"
            priority
          />
          <h1 className="mt-4 text-2xl font-bold text-slate-950">
            Roblox Plus Application
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Enter your details to apply for 6 months for non-creators.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Roblox username
            </span>
            <input
              type="text"
              value={robloxUsername}
              onChange={(event) => setRobloxUsername(event.target.value)}
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-3 text-slate-950 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/30"
              placeholder="Enter username"
              required
              minLength={3}
              maxLength={32}
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-3 text-slate-950 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/30"
              placeholder="you@example.com"
              required
            />
          </label>

          {error && (
            <p className="rounded-md bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="min-h-12 w-full rounded-md bg-green-500 px-5 py-3 text-base font-bold text-white shadow-md transition hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {submitting ? "Submitting..." : "Apply"}
          </button>
        </form>
      </section>

      {showVerification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-red-50">
              <Image
                src="/images/norobots.png"
                alt="No robots verification"
                width={96}
                height={96}
                className="h-20 w-20 object-contain"
                priority
              />
            </div>

            <h3 className="text-2xl font-bold text-gray-900">
              Manual Verification Required
            </h3>
            <p className="mt-4 text-sm leading-6 text-gray-700 sm:text-base">
              Please complete verification before your application can be
              reviewed.
            </p>

            <button
              onClick={() => router.push("/claimplus/verify")}
              className="mt-6 min-h-12 w-full rounded-md bg-green-500 px-5 py-3 text-base font-bold text-white shadow-md transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Proceed to Verification
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
