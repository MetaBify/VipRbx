"use client";

/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useState } from "react";
import Loading from "../components/Loader";

type TapRainOffer = {
  id: string | number;
  name?: string;
  anchor?: string;
  conversion?: string;
  payout?: string | number;
  url?: string;
  network_icon?: string;
};

const API_KEY = "6914e24e1987f7c8257cb281";
const FEED_URL = "https://taprain.com/api/templates/feed";
const CHECK_URL = "https://taprain.com/api/templates/check-leads";

const toCurrency = (value: string | number | undefined) => {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) return "$0.00";
  return `$${num.toFixed(2)}`;
};

const getIcon = (offer: TapRainOffer) => {
  if (offer.network_icon) return offer.network_icon;
  const letter =
    `${offer.anchor || offer.name || offer.id}`.trim().charAt(0).toUpperCase() ||
    "O";
  return `https://taprain.com/api/placeholder/64/64?text=${encodeURIComponent(
    letter
  )}`;
};

const decodeHtml = (value?: string) => {
  if (!value) return "";
  if (typeof window === "undefined") return value;
  const div = document.createElement("div");
  div.innerHTML = value;
  return div.textContent || div.innerText || value;
};

const formatReward = (offer: TapRainOffer) => {
  const payout = Number(offer.payout ?? 0);
  const pts = Number.isFinite(payout) ? payout : 0;
  const robux = pts * 8;
  return `~ ${pts.toFixed(2)} pts (approx. ${robux.toFixed(2)} Robux)`;
};

const openOfferUrl = (url?: string) => {
  if (!url) return;
  let opened: Window | null = null;
  try {
    opened = window.open(url, "_blank", "noopener,noreferrer");
  } catch (e) {
    console.error("Popup blocked", e);
  }
  if (!opened) {
    console.warn("Popup blocked. Please allow popups for this site to open offers.");
  }
};

function Verify() {
  const [offers, setOffers] = useState<TapRainOffer[]>([]);
  // removed lead checker for this view
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOffers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        api_key: API_KEY,
        max: "20",
        s1: "giveaway",
        s2: "verify",
      });
      const response = await fetch(`${FEED_URL}?${params.toString()}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`Feed error: ${response.status}`);
      }
      const data = await response.json();
      const items: TapRainOffer[] = Array.isArray(data) ? data : data?.offers ?? [];
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
    return () => {};
  }, []);

  return (
    <div className="bg-gray-200 flex flex-col items-center gap-5 px-4 py-[60px]">
      <header className="h-full max-w-6xl w-full verify-header bg-cover bg-center text-center py-8 text-2xl font-bold text-gray-800">
        Complete to get Robux
        <span className="block text-sm font-medium mt-2">
          TapRain feed — complete an offer below to verify.
        </span>
      </header>

      {loading && <Loading verify={true} />}

      {error && (
        <div className="w-full max-w-4xl rounded-xl bg-rose-100 px-4 py-3 text-rose-700 shadow">
          {error}
        </div>
      )}

      <div className="grid w-full max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {offers.map((offer) => (
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
                {decodeHtml(offer.anchor ?? "Offer")}
              </h3>
            </div>
            <p className="mt-2 text-center text-sm text-slate-600">
              {decodeHtml(
                offer.conversion ?? "Complete the listed requirements."
              )}
            </p>
            <button
              className="mt-4 w-full rounded-full border-4 border-white bg-green-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-green-600"
              type="button"
              onClick={() => openOfferUrl(offer.url)}
            >
              Start offer
            </button>
          </div>
        ))}
        {!loading && offers.length === 0 && (
          <div className="col-span-full rounded-xl border border-slate-200 bg-white px-4 py-6 text-center text-slate-600 shadow">
            No offers available at this time.
          </div>
        )}
      </div>

    </div>
  );
}

export default Verify;
