"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

const CHECK_WINDOW_MS = 24 * 60 * 60 * 1000;

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
    Record<
      string,
      {
        status: "checking" | "failed";
        endAt: number | null;
        source?: "local" | "server";
      }
    >
  >({});
  const [now, setNow] = useState(Date.now());
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

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const current = Date.now();
      setOfferChecks((prev) => {
        let mutated = false;
        const next = { ...prev };
        Object.entries(prev).forEach(([offerId, state]) => {
          if (
            state.status === "checking" &&
            state.source === "local" &&
            state.endAt &&
            state.endAt <= current
          ) {
            next[offerId] = { status: "failed", endAt: null, source: "local" };
            mutated = true;
          }
        });
        return mutated ? next : prev;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user?.leads) {
      setOfferChecks((prev) => {
        const next = { ...prev };
        Object.entries(next).forEach(([offerId, state]) => {
          if (state.source === "server") {
            delete next[offerId];
          }
        });
        return next;
      });
      return;
    }
    setOfferChecks((prev) => {
      const next = { ...prev };
      const seen = new Set<string>();

      user.leads.forEach((lead) => {
        if (lead.status === "CHECKING") {
          next[lead.offerId] = {
            status: "checking",
            endAt: new Date(lead.availableAt).getTime(),
            source: "server",
          };
          seen.add(lead.offerId);
        } else if (lead.status === "FAILED") {
          next[lead.offerId] = {
            status: "failed",
            endAt: null,
            source: "server",
          };
          seen.add(lead.offerId);
        } else if (next[lead.offerId]?.source === "server") {
          delete next[lead.offerId];
        }
      });

      Object.entries(next).forEach(([offerId, state]) => {
        if (state.source === "server" && !seen.has(offerId)) {
          delete next[offerId];
        }
      });

      return next;
    });
  }, [user?.leads]);

  const handleStartOffer = useCallback(
    async (offer: OfferItem) => {
      window.open(offer.url, "_blank", "noopener");

      if (!user) {
        setError("Sign in to start offers.");
        return;
      }

      const offerId = offer.id;
      const estimatedPoints = extractOfferPoints(offer);

      setOfferChecks((prev) => ({
        ...prev,
        [offerId]: {
          status: "checking",
          endAt: Date.now() + CHECK_WINDOW_MS,
          source: "local",
        },
      }));

      try {
        const response = await fetch("/api/offers/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            offerId,
            offerName: offer.name,
            points: estimatedPoints,
          }),
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok || !data.lead) {
          if (response.status === 401) {
            refresh();
          }
          throw new Error(data.error ?? "Failed to start offer.");
        }

        setOfferChecks((prev) => ({
          ...prev,
          [offerId]: {
            status: "checking",
            endAt: data.lead?.availableAt
              ? new Date(data.lead.availableAt).getTime()
              : Date.now() + CHECK_WINDOW_MS,
            source: "server",
          },
        }));

        setUser((prev) =>
          prev
            ? {
                ...prev,
                pending:
                  typeof data.pending === "number" ? data.pending : prev.pending,
                totalPoints:
                  typeof data.totalPoints === "number"
                    ? data.totalPoints
                    : prev.totalPoints,
                level: typeof data.level === "number" ? data.level : prev.level,
                leads: data.lead
                  ? [
                      {
                        ...data.lead,
                        points: Number(
                          Number(data.lead.points ?? 0).toFixed(2)
                        ),
                      },
                      ...prev.leads.filter((lead) => lead.id !== data.lead.id),
                    ].slice(0, 10)
                  : prev.leads,
              }
            : prev
        );
      } catch (err) {
        console.error(err);
        setOfferChecks((prev) => ({
          ...prev,
          [offerId]: { status: "failed", endAt: null, source: "local" },
        }));
        setError(
          err instanceof Error
            ? err.message
            : "Unable to start offer right now."
        );
      }
    },
    [user, setUser, refresh]
  );

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
                Withdraw
              </Link>
            </div>
          </div>

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
          const serverLead = user?.leads?.find(
            (lead) =>
              lead.offerId === ad.id &&
              (lead.status === "CHECKING" || lead.status === "FAILED")
          );
          const serverState = serverLead
            ? {
                status: serverLead.status === "CHECKING" ? "checking" : "failed",
                endAt:
                  serverLead.status === "CHECKING"
                    ? new Date(serverLead.availableAt).getTime()
                    : null,
              }
            : null;
          const offerState = serverState ?? offerChecks[ad.id];
          const isChecking = offerState?.status === "checking";
          const hasFailed = offerState?.status === "failed";
          let buttonLabel = "Start offer";
          let buttonLabel = "Start offer";
          if (isChecking) {
            buttonLabel = "Checking…";
          }

          const buttonClasses = isChecking
            ? "mt-4 w-full rounded-full border-4 border-white bg-slate-400 py-2 text-sm font-semibold text-white transition hover:bg-slate-500"
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
                onClick={() => handleStartOffer(ad)}
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
