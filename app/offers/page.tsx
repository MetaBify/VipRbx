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

type OfferNetwork = "adblue" | "bitlabs" | "ogads" | "taprain";

type BitLabsOffer = {
  id: number | string;
  anchor?: string;
  click_url?: string;
  icon_url?: string;
  confirmation_time?: string;
  description?: string;
  total_points?: string | number;
  payout?: string | number;
  epc?: string | number;
  events?: Array<{
    name?: string;
    payout?: string | number;
    points?: string | number;
    payable?: boolean;
  }>;
  is_sticky?: boolean;
};

type BitLabsStartedOffer = {
  anchor?: string;
  description?: string;
  latest_date?: string;
  completed_events?: number;
  events?: Array<{ name?: string; status?: string }>;
};

type OgAdsOffer = {
  offerid: number | string;
  name?: string;
  name_short?: string;
  description?: string;
  adcopy?: string;
  picture?: string;
  payout?: string | number;
  epc?: string | number;
  country?: string;
  device?: string;
  link?: string;
};

type TapRainOffer = {
  id: string | number;
  anchor?: string;
  conversion?: string;
  payout?: string | number;
  url?: string;
};

const NETWORKS: Record<
  OfferNetwork,
  {
    label: string;
    badge: string;
    boost: string;
    badgeColor: string;
    boostColor: string;
    gradient: string;
    logo: { src: string; width: number; height: number; alt: string };
    description: string;
    fetchUrl: string;
    enabled?: boolean;
  }
> = {
  adblue: {
    label: "AdBlueMedia",
    badge: "HOT",
    boost: "+40%",
    badgeColor: "bg-emerald-500",
    boostColor: "bg-emerald-400",
    gradient: "from-slate-800 to-slate-900",
    logo: {
      src: "https://adbluemedia.com/logo-488x74.png",
      width: 300,
      height: 70,
      alt: "AdBlueMedia logo",
    },
    description: "Rotating CPI/CPE offers with geo targeting & 48h verification.",
    fetchUrl: "/api/offers/feed",
  },
  bitlabs: {
    label: "BitLabs",
    badge: "BEST",
    boost: "+75%",
    badgeColor: "bg-yellow-400 text-slate-900",
    boostColor: "bg-emerald-500",
    gradient: "from-sky-500 to-blue-500",
    logo: {
      src: "https://cdn.prod.website-files.com/603902f0b6e52132b1b427ed/626bd942d8b5e7ab3013fa8d_adjust_bitlabs.png",
      width: 320,
      height: 90,
      alt: "BitLabs logo",
    },
    description: "High paying goal-based offers plus in-progress tracking.",
    fetchUrl: "/api/offers/bitlabs",
    enabled: false,
  },
  ogads: {
    label: "OGAds",
    badge: "NEW",
    boost: "+35%",
    badgeColor: "bg-purple-500",
    boostColor: "bg-teal-400",
    gradient: "from-slate-900 to-purple-900",
    logo: {
      src: "https://members.ogads.com/build/assets/og-ads-logo-dark-CqvYjLFB.svg",
      width: 260,
      height: 70,
      alt: "OGAds logo",
    },
    description: "Direct CPI/CPA feed with device targeting and instant links.",
    fetchUrl: "/api/offers/ogads",
  },
  taprain: {
    label: "TapRain",
    badge: "NEW",
    boost: "+60%",
    badgeColor: "bg-orange-400 text-slate-900",
    boostColor: "bg-indigo-500",
    gradient: "from-indigo-900 to-orange-900",
    logo: {
      src: "https://taprain.com/placeholder-logo.png",
      width: 260,
      height: 70,
      alt: "TapRain logo",
    },
    description: "TapRain incentive feed with lead callbacks.",
    fetchUrl: "/api/offers/taprain",
  },
};

const CHECK_WINDOW_MS = 48 * 60 * 60 * 1000;
const DISPLAY_CHECK_WINDOW_MS = 10 * 60 * 60 * 1000;

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

const parseNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.replace(",", ".");
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
};

const mapBitLabsOffer = (offer: BitLabsOffer): OfferItem => {
  const eventWithPayout =
    offer.events?.find((event) => parseNumber(event.payout) && event.payable) ??
    offer.events?.find((event) => parseNumber(event.payout)) ??
    offer.events?.[0];

  const totalPoints = parseNumber(offer.total_points);
  const payout =
    parseNumber(eventWithPayout?.payout) ??
    parseNumber(offer.payout) ??
    parseNumber(offer.epc) ??
    (totalPoints ? totalPoints / 100 : null) ??
    0;

  const fallbackId = `bitlabs-${Math.random().toString(36).slice(2, 10)}`;

  return {
    id: String(offer.id ?? fallbackId),
    name: offer.anchor ?? `BitLabs offer ${offer.id ?? ""}`,
    conversion:
      offer.confirmation_time ??
      eventWithPayout?.name ??
      offer.description ??
      "",
    payout: payout ?? undefined,
    network_icon: offer.icon_url ?? NETWORKS.bitlabs.logo.src,
    url: offer.click_url ?? "#",
    sticky: Boolean(offer.is_sticky),
    meta: {
      events: offer.events ?? [],
    },
  };
};

const mapOgAdsOffer = (offer: OgAdsOffer): OfferItem => {
  const fallbackId = `ogads-${Math.random().toString(36).slice(2, 10)}`;
  const payout =
    parseNumber(offer.payout) ??
    parseNumber(offer.epc) ??
    undefined;

  return {
    id: String(offer.offerid ?? fallbackId),
    name: offer.name ?? offer.name_short ?? `OGAds offer ${offer.offerid ?? ""}`,
    conversion:
      offer.adcopy ??
      offer.description ??
      [offer.device, offer.country].filter(Boolean).join(" • "),
    payout: payout,
    network_icon: offer.picture ?? NETWORKS.ogads.logo.src,
    url: offer.link ?? "#",
    meta: {
      country: offer.country,
      device: offer.device,
    },
  };
};

const mapTapRainOffer = (offer: TapRainOffer): OfferItem => {
  const fallbackId = `taprain-${Math.random().toString(36).slice(2, 10)}`;
  const payout =
    parseNumber(offer.payout ?? 0) ?? 0;

  return {
    id: String(offer.id ?? fallbackId),
    name: offer.anchor ?? `TapRain offer ${offer.id ?? ""}`,
    conversion: offer.conversion ?? "Complete the listed requirements.",
    payout,
    network_icon: NETWORKS.taprain.logo.src,
    url: offer.url ?? "#",
  };
};

export default function VerifyPage() {
  const { user, setUser, loading: userLoading, needsAuth, refresh } =
    useUserSummary();
  const [networkOffers, setNetworkOffers] = useState<
    Record<OfferNetwork, OfferItem[]>
  >({
    adblue: [],
    bitlabs: [],
  ogads: [],
  taprain: [],
  });
  const [bitLabsProgress, setBitLabsProgress] = useState<
    BitLabsStartedOffer[]
  >([]);
  const [activeNetwork, setActiveNetwork] = useState<OfferNetwork | null>(null);
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
  const syncLeadsRef =
    useRef<(showSpinner: boolean) => Promise<void>>(async () => {});

  const fetchOffers = useCallback(async (network: OfferNetwork) => {
    setLoadingOffers(true);
    setError(null);
    try {
      const response = await fetch(NETWORKS[network].fetchUrl, {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("Unable to load offers right now.");
      }
      const data = await response.json();
      let list: OfferItem[] = [];
      if (network === "adblue") {
        list = Array.isArray(data) ? data.slice(0, 20) : [];
        setBitLabsProgress([]);
      } else if (network === "bitlabs") {
        const rawOffers: BitLabsOffer[] = data?.data?.offers ?? [];
        list = rawOffers.map(mapBitLabsOffer);
        setBitLabsProgress(data?.data?.started_offers ?? []);
      } else if (network === "ogads") {
        const rawOffers: OgAdsOffer[] = data?.offers ?? [];
        list = rawOffers.map(mapOgAdsOffer);
        setBitLabsProgress([]);
      } else if (network === "taprain") {
        const rawOffers: TapRainOffer[] = Array.isArray(data)
          ? data
          : data?.offers ?? [];
        list = rawOffers.map(mapTapRainOffer);
        setBitLabsProgress([]);
      }
      setNetworkOffers((prev) => ({
        ...prev,
        [network]: list,
      }));
      setDisplayCount(Math.min(8, list.length || 8));
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Unable to load offers right now."
      );
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
  const activeOffers = useMemo(
    () => (activeNetwork ? networkOffers[activeNetwork] ?? [] : []),
    [activeNetwork, networkOffers]
  );

  useEffect(() => {
    if (!userId) {
      setActiveNetwork(null);
      setNetworkOffers({
        adblue: [],
        bitlabs: [],
        ogads: [],
        taprain: [],
      });
      setBitLabsProgress([]);
      setDisplayCount(0);
      return;
    }

    if (activeNetwork && NETWORKS[activeNetwork]?.enabled === false) {
      setActiveNetwork(null);
    }
  }, [userId, activeNetwork]);

  useEffect(() => {
    if (!userId || !activeNetwork) {
      return;
    }

    if (networkOffers[activeNetwork].length) {
      setDisplayCount(Math.min(8, networkOffers[activeNetwork].length));
      return;
    }

    fetchOffers(activeNetwork);
  }, [activeNetwork, userId, networkOffers, fetchOffers]);

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
    const timer = window.setInterval(() => {
      const current = Date.now();
      setOfferChecks((prev) => {
        let mutated = false;
        const next = { ...prev };
        Object.entries(prev).forEach(([offerId, state]) => {
          if (state.endAt && state.endAt <= current) {
            delete next[offerId];
            mutated = true;
          }
        });
        return mutated ? next : prev;
      });
    }, 60 * 1000);

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
            endAt: Date.now() + DISPLAY_CHECK_WINDOW_MS,
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
          endAt: Date.now() + DISPLAY_CHECK_WINDOW_MS,
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
            endAt: Date.now() + DISPLAY_CHECK_WINDOW_MS,
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
    setDisplayCount((prev) => Math.min(prev + 4, activeOffers.length));
  };

  const handleShowLess = () => {
    setDisplayCount(Math.min(8, activeOffers.length));
  };

const handleSelectNetwork = (network: OfferNetwork) => {
    if (NETWORKS[network]?.enabled === false) {
      return;
    }
    setError(null);
    setActiveNetwork(network);
  };

  const handleBackToNetworks = () => {
    setActiveNetwork(null);
    setDisplayCount(8);
    setError(null);
  };

  const handleReloadNetwork = () => {
    if (activeNetwork) {
      fetchOffers(activeNetwork);
    }
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
                | Pending:{" "}
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
                {syncing ? "Refreshing..." : "Refresh"}
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

      {!activeNetwork && (
        <section className="grid w-full max-w-6xl grid-cols-1 gap-4 md:grid-cols-2">
          {(Object.entries(NETWORKS) as Array<
            [OfferNetwork, (typeof NETWORKS)[OfferNetwork]]
          >)
            .filter(([, config]) => config.enabled !== false)
            .map(([networkId, config]) => (
            <button
              type="button"
              key={networkId}
              onClick={() => handleSelectNetwork(networkId)}
              className={`rounded-3xl bg-gradient-to-r ${config.gradient} p-5 text-left text-white shadow-lg transition hover:scale-[1.01] focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60`}
            >
              <div className="flex items-center justify-between text-[0.65rem] font-semibold uppercase tracking-[0.25em] sm:text-xs">
                <span className={`rounded-full px-3 py-1 ${config.badgeColor}`}>
                  {config.badge}
                </span>
                <span className={`rounded-full px-3 py-1 ${config.boostColor}`}>
                  {config.boost}
                </span>
              </div>
              <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                <Image
                  width={config.logo.width}
                  height={config.logo.height}
                  src={config.logo.src}
                  alt={config.logo.alt}
                  className="h-12 w-auto object-contain sm:h-16"
                  unoptimized
                />
                <p className="text-sm opacity-90 sm:text-base">
                  {config.description}
                </p>
              </div>
            </button>
          ))}
        </section>
      )}

      {activeNetwork && (
        <>
          <div className="flex w-full max-w-6xl flex-col gap-4 rounded-3xl bg-slate-900 p-5 text-white shadow-lg md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-amber-300">
                {NETWORKS[activeNetwork].label}
              </p>
              <h3 className="text-2xl font-semibold">
                Curated {NETWORKS[activeNetwork].label} offers
              </h3>
              <p className="text-sm text-slate-200">
                {NETWORKS[activeNetwork].description}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleBackToNetworks}
                className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10"
              >
                Back to offer hubs
              </button>
              <button
                type="button"
                onClick={handleReloadNetwork}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Reload {NETWORKS[activeNetwork].label}
              </button>
            </div>
          </div>

          {activeNetwork === "bitlabs" && bitLabsProgress.length > 0 && (
            <div className="w-full max-w-6xl rounded-3xl border border-slate-200 bg-white/90 p-5 shadow">
              <p className="text-sm font-semibold text-slate-900">
                In-progress BitLabs goals
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {bitLabsProgress.slice(0, 4).map((progress, index) => (
                  <div
                    key={`${progress.anchor ?? progress.latest_date ?? index}`}
                    className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <p className="text-base font-semibold text-slate-900">
                      {progress.anchor ?? "Active goal"}
                    </p>
                    <p className="text-xs text-slate-600">
                      {progress.description ??
                        "Finish the remaining steps to unlock rewards."}
                    </p>
                    <p className="mt-3 text-xs font-semibold text-emerald-600">
                      {progress.completed_events ?? 0} events completed
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loadingOffers && <Loading verify={true} />}

          {error && (
            <div className="w-full max-w-6xl rounded-2xl bg-rose-100 px-4 py-3 text-sm text-rose-700 shadow">
              {error}
            </div>
          )}

          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full max-w-6xl">
            {activeOffers.slice(0, displayCount).map((ad) => {
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
          const isChecking =
            offerState?.status === "checking" &&
            (!offerState.endAt || offerState.endAt > Date.now());
          const hasFailed =
            !isChecking && offerState?.status === "failed";
          let buttonLabel = "Start offer";
          if (isChecking) {
            buttonLabel = "Checking...";
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

          {activeOffers.length > 0 && (
            <div className="mt-8 flex gap-4">
              {displayCount < activeOffers.length && (
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
          )}
        </>
      )}
    </div>
  );
}
