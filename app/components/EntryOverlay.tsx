"use client";

import { useEffect, useMemo, useState } from "react";

const baseUsers = [
  "@ZahnSabi30",
  "@KadeVex12",
  "@MiraNova9",
  "@RexPixel77",
  "@LunaKai23",
  "@Jak3nator",
  "@TessyBop5",
  "@NeoDrift44",
  "@CoraMint7",
  "@VibeZed88",
  "@RileyRogue3",
  "@SkyeEcho14",
  "@FinnFlash21",
  "@AvaRune4",
  "@ZedVector66",
  "@MiloCraft11",
  "@NoriSpark2",
  "@JunoByte19",
  "@KaiStorm8",
  "@LoloQuest17",
  "@PaxOrbit13",
  "@ZaraBlink6",
  "@DexNova99",
  "@MayaGlint15",
  "@RexVolt31",
  "@KiraFrost27",
  "@BrixStone10",
  "@SoraWing18",
  "@TheoSpin20",
  "@EllaQuest29",
  "@RemyPulse24",
  "@GioShift16",
  "@NyxCoder32",
  "@ZaneFlux26",
  "@PiperRush28",
  "@OliForge33",
  "@IvyNimbus35",
  "@KodaWave36",
  "@ZuriLark37",
  "@TaliSpark38",
];


const actionPhrases = [
  "just claimed",
  "secured a prize from",
  "snagged a reward from",
  "cashed out on",
  "won big in",
  "locked in a drop from",
  "grabbed a code from",
  "just scored with",
  "redeemed a win from",
  "hit the jackpot on",
  "just cleaned up with",
  "snapped up a reward from",
];

const suffixPhrases = [
  "a few seconds ago",
  "right now",
  "moments ago",
  "just in time",
  "literally a second ago",
  "fresh off the win",
  "not long ago",
  "as we speak",
  "recently claimed",
  "just happened",
];


const headlinePhrases = [
  "Daily drops waiting for you.",
  "Instant Robux payouts, zero wait.",
  "Verified rewards from our partners.",
  "Complete offers, unlock bonus Robux.",
];

function randomItem<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

function randomAmount(): string {
  const tiers = [4000, 6200, 7500, 9600, 12800, 15400, 22000, 32000];
  const amount = tiers[Math.floor(Math.random() * tiers.length)];
  return `${amount.toLocaleString()} Robux`;
}

function createTickerMessage(id: number) {
  const user = randomItem(baseUsers);
  const action = randomItem(actionPhrases);
  const amount = randomAmount();
  const suffix = randomItem(suffixPhrases);
  return {
    id,
    text: `${user} ${action} ${amount} - ${suffix}`,
  };
}

export default function EntryOverlay() {
  const [open, setOpen] = useState(true);
  const [ticker, setTicker] = useState(() => createTickerMessage(0));
  const [headlineIndex, setHeadlineIndex] = useState(0);

  const shuffledHeadlines = useMemo(() => {
    const copy = [...headlinePhrases];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const dismissed =
      sessionStorage.getItem("viprbx-entry-overlay-dismissed") === "true";
    if (dismissed) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const tickerInterval = window.setInterval(() => {
      setTicker((prev) => createTickerMessage(prev.id + 1));
    }, 3200);

    const headlineInterval = window.setInterval(() => {
      setHeadlineIndex((prev) => (prev + 1) % shuffledHeadlines.length);
    }, 4200);

    return () => {
      window.clearInterval(tickerInterval);
      window.clearInterval(headlineInterval);
    };
  }, [open, shuffledHeadlines.length]);

  const handleClose = () => {
    setOpen(false);
    try {
      sessionStorage.setItem("viprbx-entry-overlay-dismissed", "true");
    } catch {
      // ignore session storage errors
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9900] flex items-center justify-center bg-slate-900/80 px-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-3xl bg-white p-8 shadow-2xl transition-all duration-300 sm:p-12">
        <div className="mb-6 text-center text-xs font-semibold uppercase tracking-[0.4em] text-emerald-500 sm:text-sm">
          viprbx instant rewards
        </div>

        <h1 className="text-center text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
          Robux Giveaways
        </h1>

        <p className="mt-4 text-center text-base text-slate-600 sm:text-lg">
          {shuffledHeadlines[headlineIndex]}
        </p>

        <div className="mt-6 flex justify-center">
          <div className="relative h-12 w-full max-w-md overflow-hidden rounded-full bg-slate-100 px-4">
            <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-emerald-600 sm:text-base">
              <div key={ticker.id} className="animate-ticker">
                {ticker.text}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={handleClose}
            className="w-full max-w-xs rounded-full bg-emerald-500 px-6 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-300"
          >
            Claim Robux
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400 sm:text-sm">
          Complete featured offers and unlock bonuses - verified payouts, no bots.
        </p>
      </div>
    </div>
  );
}

