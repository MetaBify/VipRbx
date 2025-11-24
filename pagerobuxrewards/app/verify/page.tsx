"use client";

/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useMemo, useState } from "react";
import Loading from "../components/Loader";

type AdBlueOffer = {
  id: string | number;
  name?: string;
  conversion?: string;
  payout?: string | number;
  url?: string;
  network_icon?: string;
  icon?: string;
  offerphoto?: string;
};

const parseNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = value.replace(",", ".");
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const extractPoints = (offer: AdBlueOffer): number => {
  const payout =
    parseNumber(offer.payout) ??
    parseNumber((offer as { rate?: unknown }).rate) ??
    parseNumber((offer as { value?: unknown }).value) ??
    parseNumber((offer as { payout_amount?: unknown }).payout_amount) ??
    0;
  return Math.max(0, Number(payout.toFixed(2)));
};

const getIcon = (offer: AdBlueOffer) => {
  return (
    offer.network_icon ||
    offer.offerphoto ||
    offer.icon ||
    "https://adbluemedia.com/logo-488x74.png"
  );
};

const openOfferUrl = (url?: string) => {
  if (!url) return;
  try {
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (!opened) {
      console.warn("Popup blocked. Please allow popups for offers.");
    }
  } catch (e) {
    console.error("Popup blocked", e);
  }
};

function Verify() {
  const [offers, setOffers] = useState<AdBlueOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOffers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/offers/feed", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Feed error: ${response.status}`);
      }
      const data = await response.json();
      const items: AdBlueOffer[] = Array.isArray(data) ? data : data?.offers ?? [];
      setOffers(items);
    } catch (e) {
      setError("Unable to load offers right now.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOffers();
  }, []);

  const cards = useMemo(() => offers.slice(0, 10), [offers]);

  return (
    <div className="bg-gray-200 flex flex-col items-center gap-5 px-4 py-[60px]">
      <header className="h-full max-w-6xl w-full verify-header bg-cover bg-center text-center py-8 text-2xl font-bold text-gray-800">
        Complete to get Robux
        <span className="block text-sm font-medium mt-2">
          AdBlueMedia offer wall — open an offer below to verify.
        </span>
      </header>

      {loading && <Loading verify={true} />}

      {error && (
        <div className="w-full max-w-4xl rounded-xl bg-rose-100 px-4 py-3 text-rose-700 shadow">
          {error}
        </div>
      )}

      <div className="grid w-full max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((offer) => {
          const points = extractPoints(offer);
          return (
            <div
              key={offer.id}
              className="relative flex flex-col items-center justify-between rounded-xl border border-gray-300 bg-white p-5 text-center shadow-lg transition duration-200 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex flex-col items-center gap-3 w-full">
                <img
                  src={getIcon(offer)}
                  alt="Offer icon"
                  className="h-20 w-20 rounded-md border border-gray-200 bg-slate-50 object-contain shadow-inner"
                  loading="lazy"
                />
                <h3 className="text-center text-lg font-semibold text-slate-900">
                  {offer.name ?? "Offer"}
                </h3>
              </div>
              <p className="mt-2 text-center text-sm text-slate-600">
                {offer.conversion ?? "Complete the listed requirements."}
              </p>
              <button
                className="mt-4 w-full rounded-full border-4 border-white bg-green-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-green-600"
                type="button"
                onClick={() => openOfferUrl(offer.url)}
              >
                Start offer
              </button>
            </div>
          );
        })}
        {!loading && cards.length === 0 && (
          <div className="col-span-full rounded-xl border border-slate-200 bg-white px-4 py-6 text-center text-slate-600 shadow">
            No offers available at this time.
          </div>
        )}
      </div>
    </div>
  );
}

export default Verify;
