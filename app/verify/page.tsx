"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Loading from "../components/Loader";
import { useUserSummary } from "@/lib/useUserSummary";

type OfferItem = {
  id: string;
  name: string;
  conversion?: string;
  payout?: number | string;
  payout_cents?: number;
  payout_amount?: number | string;
  rate?: number | string;
  value?: number | string;
  network_icon: string;
  url: string;
  [key: string]: unknown;
};

const CHECK_WINDOW_MS = 30 * 60 * 1000;

function extractOfferPoints(offer: OfferItem): number {
  const candidates: number[] = [];

  const fields = [
    offer.payout,
    offer.payout_amount,
    offer.rate,
    offer.value,
    offer.conversion,
  ];

  for (const field of fields) {
    if (typeof field === "number") {
      candidates.push(field);
      continue;
    }

    if (typeof field === "string") {
      const normalized = field.replace(",", ".");
      const match = normalized.match(/(\d+(\.\d+)?)/);
      if (match) {
        candidates.push(parseFloat(match[1]));
      }
    }
  }

  if (typeof offer.payout_cents === "number") {
    candidates.push(offer.payout_cents / 100);
  }

  const chosen = candidates.find((value) => Number.isFinite(value) && value > 0);
  if (chosen && chosen > 0) {
    return Number(chosen.toFixed(2));
  }

  return 0;
}

export default function VerifyPage() {
  const { user, setUser, loading: userLoading, needsAuth, refresh } =
    useUserSummary();
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [displayCount, setDisplayCount] = useState(8);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offerChecks, setOfferChecks] = useState<
    Record<string, { status: "idle" | "checking" | "failed"; endAt: number | null }>
  >({});
  const [now, setNow] = useState(Date.now());
  const checkTimers = useRef<Record<string, number>>({});
  const syncLeadsRef =
    useRef<(showSpinner: boolean) => Promise<void>>(async () => {});

  const fetchOffers = useCallback(async () => {
    setLoadingOffers(true);
    setError(null);
    try {
      const response = await fetch("/api/offers/feed", { cache: "no-store" });
      if (!response.ok) {
        setError("Unable to load offers right now.");
        return;
      }
      const data = await response.json();
      const list = Array.isArray(data) ? data.slice(0, 10) : [];
      setOffers(list);
      setDisplayCount(Math.min(8, list.length));
    } catch (err) {
      console.error(err);
      setError("Unable to load offers right now.");
    } finally {
      setLoadingOffers(false);
    }
  }, []);

  const syncLeads = useCallback(
    async (showSpinner: boolean) => {
      if (!user) return;
      if (showSpinner) setSyncing(true);

      try {
        const response = await fetch("/api/offers/check", { method: "POST" });
        if (!response.ok) {
          if (response.status === 401) {
            refresh();
          } else {
            setError("Unable to sync progress right now.");
          }
          return;
        }

        const data = await response.json();
        setUser((prev) =>
          prev
            ? {
                ...prev,
                balance: data.balance ?? prev.balance,
                pending: data.pending ?? prev.pending,
                availablePoints:
                  data.availablePoints ?? prev.availablePoints ?? prev.balance,
                totalPoints:
                  data.totalPoints ??
                  prev.totalPoints ??
                  prev.balance + prev.pending,
                leads: data.leads ?? prev.leads,
              }
            : prev
        );
      } catch (err) {
        console.error(err);
        setError("Unable to sync progress right now.");
      } finally {
        if (showSpinner) setSyncing(false);
      }
    },
    [user, refresh, setUser]
  );

  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) {
      setOffers([]);
      setDisplayCount(0);
      return;
    }

    fetchOffers();
  }, [userId, fetchOffers]);

  useEffect(() => {
    syncLeadsRef.current = syncLeads;
  }, [syncLeads]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    syncLeadsRef.current(false);
    const interval = window.setInterval(() => {
      syncLeadsRef.current(false);
    }, 10 * 60 * 1000);

    return () => window.clearInterval(interval);
  }, [userId]);

  const clearAllTimers = useCallback(() => {
    Object.values(checkTimers.current).forEach((timeoutId) =>
      window.clearTimeout(timeoutId)
    );
    checkTimers.current = {};
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.clearInterval(timer);
      clearAllTimers();
    };
  }, [clearAllTimers]);

  const recentLeads = useMemo(() => user?.leads ?? [], [user?.leads]);

  const handleStartOffer = useCallback((offerId: string, url: string) => {
    window.open(url, "_blank", "noopener");

    if (checkTimers.current[offerId]) {
      window.clearTimeout(checkTimers.current[offerId]);
      delete checkTimers.current[offerId];
    }

    setOfferChecks((prev) => ({
      ...prev,
      [offerId]: { status: "checking", endAt: Date.now() + CHECK_WINDOW_MS },
    }));

    checkTimers.current[offerId] = window.setTimeout(() => {
      setOfferChecks((prev) => ({
        ...prev,
        [offerId]: { status: "failed", endAt: null },
      }));
      delete checkTimers.current[offerId];
    }, CHECK_WINDOW_MS);
  }, []);

  const handleLoadMore = () => {
    setDisplayCount((prev) => Math.min(prev + 4, offers.length));
  };

  const handleShowLess = () => {
    setDisplayCount(Math.min(8, offers.length));
  };

  if (!userLoading && needsAuth) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 px-6 py-16 text-center">
        <div className="max-w-md space-y-6 rounded-3xl bg-white p-10 shadow-2xl">
          <h1 className="text-2xl font-semibold text-slate-900">
            Sign in to access offers
          </h1>
          <p className="text-sm text-slate-600">
            Create an account or log in to track progress, sync completed offers, and convert payouts into points.
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

  return (
    <div className="bg-gray-200 flex flex-col items-center gap-5 px-4 py-[60px]">
      <header className="h-full max-w-6xl w-full verify-header bg-cover bg-center text-center py-8 text-2xl font-bold text-gray-800">
        Complete offers to earn points
        <span className="block text-sm font-medium mt-2">
          Earn points for every offer you complete. Credits unlock shortly after completion.
        </span>
      </header>

      {user && (
        <section className="w-full max-w-6xl rounded-3xl bg-white p-6 shadow-lg">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {user.username}
              </h2>
              <p className="text-sm text-slate-600">
                Balance:{" "}
                <span className="font-semibold text-emerald-600">
                  {user.balance.toFixed(2)} pts
                </span>{" "}
                · Pending:{" "}
                <span className="font-semibold text-amber-600">
                  {user.pending.toFixed(2)} pts
                </span>
              </p>
              <p className="text-xs text-slate-500">
                Claimable now: {user.availablePoints.toFixed(2)} pts
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => syncLeads(true)}
                disabled={syncing}
                className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-400"
              >
                {syncing ? "Syncing..." : "Sync progress"}
              </button>
              <Link
                href="/withdraw"
                className="rounded-full border border-emerald-400 px-5 py-2 text-sm font-semibold text-emerald-500 transition hover:bg-emerald-500 hover:text-white"
              >
                Claim rewards
              </Link>
              <Link
                href="/withdraw"
                className="rounded-full border border-emerald-400 px-5 py-2 text-sm font-semibold text-emerald-500 transition hover:bg-emerald-500 hover:text-white"
              >
                Withdraw
              </Link>
            </div>
          </div>

          {!!recentLeads.length && (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {recentLeads.slice(0, 6).map((lead) => (
                <div
                  key={lead.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">
                      Offer {lead.offerId}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        lead.status === "AVAILABLE"
                          ? "bg-emerald-100 text-emerald-700"
                          : lead.status === "PENDING"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {lead.status.toLowerCase()}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                    <span>{lead.points.toFixed(2)} pts</span>
                    <span>
                      {new Date(lead.createdAt).toLocaleString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {loadingOffers && <Loading verify={true} />}

      {error && (
        <div className="w-full max-w-6xl rounded-2xl bg-rose-100 px-4 py-3 text-sm text-rose-700 shadow">
          {error}
        </div>
      )}

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full max-w-6xl">
        {offers.slice(0, displayCount).map((ad) => {
          const estimatedPoints = extractOfferPoints(ad);
          const offerState = offerChecks[ad.id] ?? {
            status: "idle",
            endAt: null,
          };
          const isChecking = offerState.status === "checking";
          const hasFailed = offerState.status === "failed";
          let buttonLabel = "Start offer";
          if (isChecking && offerState.endAt) {
            const secondsLeft = Math.max(
              0,
              Math.ceil((offerState.endAt - now) / 1000)
            );
            const minutes = Math.floor(secondsLeft / 60)
              .toString()
              .padStart(2, "0");
            const seconds = (secondsLeft % 60).toString().padStart(2, "0");
            buttonLabel = `Checking ${minutes}:${seconds}`;
          } else if (isChecking) {
            buttonLabel = "Checking...";
          }

          const buttonClasses = isChecking
            ? "mt-4 w-full rounded-full border-4 border-white bg-slate-400 py-2 text-sm font-semibold text-white cursor-not-allowed"
            : "mt-4 w-full rounded-full border-4 border-white bg-emerald-500 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600";

          return (
            <div
              key={ad.id}
              className="relative flex flex-col items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-lg transition-shadow duration-300 hover:shadow-xl"
            >
              <Image
                width={80}
                height={80}
                src={ad.network_icon}
                alt={ad.name}
                className="h-20 w-20 object-cover"
                unoptimized
              />

              <div className="mt-3 flex flex-col items-center gap-2 text-center">
                <h3 className="text-lg font-semibold text-slate-900">
                  {ad.name}
                </h3>
                {ad.conversion && (
                  <p className="text-sm text-slate-600">{ad.conversion}</p>
                )}
                <p className="text-xs font-semibold text-emerald-600">
                  ~ {estimatedPoints.toFixed(2)} pts (approx.{" "}
                  {(estimatedPoints * 2).toFixed(2)} Robux)
                </p>
              </div>

              <button
                className={buttonClasses}
                onClick={() => handleStartOffer(ad.id, ad.url)}
                disabled={isChecking}
              >
                {isChecking && (
                  <span className="mr-2 inline-flex h-3 w-3 animate-spin rounded-full border-2 border-white border-l-transparent" />
                )}
                {buttonLabel}
              </button>

              {hasFailed && (
                <p className="mt-2 text-center text-xs font-semibold text-rose-600">
                  Prompt failed to verify completion. Please retry.
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex gap-4">
        {displayCount < offers.length && (
          <button
            className="rounded-md border-2 border-black bg-cyan-400 px-4 py-2 font-semibold text-black transition-colors hover:bg-cyan-500"
            onClick={handleLoadMore}
          >
            More offers
          </button>
        )}
        {displayCount > 8 && (
          <button
            className="rounded-md border-2 border-black bg-cyan-400 px-4 py-2 font-semibold text-black transition-colors hover:bg-cyan-500"
            onClick={handleShowLess}
          >
            Less offers
          </button>
        )}
      </div>
    </div>
  );
}
