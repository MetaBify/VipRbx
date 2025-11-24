"use client";

import { useEffect, useState } from "react";

export default function AntiAdblockPopup() {
  const [blocked, setBlocked] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let cancelled = false;

    const runDetection = () => {
      if (cancelled) return;

      const bait = document.createElement("div");
      bait.className = "adsbox ad-unit banner-slot";
      bait.style.position = "absolute";
      bait.style.left = "-9999px";
      bait.style.width = "1px";
      bait.style.height = "1px";
      bait.style.pointerEvents = "none";
      document.body.appendChild(bait);

      window.setTimeout(() => {
        const isBlocked =
          !bait ||
          bait.offsetParent === null ||
          bait.offsetHeight === 0 ||
          bait.clientHeight === 0;

        setBlocked(isBlocked);

        if (bait && bait.parentNode) {
          bait.parentNode.removeChild(bait);
        }
      }, 180);
    };

    runDetection();
    const interval = window.setInterval(runDetection, 8000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const handleRetry = () => {
    if (typeof window === "undefined") {
      return;
    }
    const next = retryCount + 1;
    setRetryCount(next);
    if (next >= 3) {
      window.location.reload();
      return;
    }

    const bait = document.createElement("div");
    bait.className = "adsbox ad-unit banner-slot";
    bait.style.position = "absolute";
    bait.style.left = "-9999px";
    bait.style.width = "1px";
    bait.style.height = "1px";
    bait.style.pointerEvents = "none";
    document.body.appendChild(bait);

    window.setTimeout(() => {
      const isBlocked =
        !bait ||
        bait.offsetParent === null ||
        bait.offsetHeight === 0 ||
        bait.clientHeight === 0;
      setBlocked(isBlocked);
      if (bait && bait.parentNode) {
        bait.parentNode.removeChild(bait);
      }
    }, 180);
  };

  if (!blocked) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/80 px-4 backdrop-blur">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 text-slate-900 shadow-2xl">
        <h2 className="text-lg font-semibold text-slate-900">
          Disable Ad Blocker
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Ad blocking is preventing offer walls from loading. Please disable or
          whitelist this site, then refresh so we can verify and unlock the
          rewards page.
        </p>
        <button
          type="button"
          onClick={handleRetry}
          className="mt-5 w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-emerald-600"
        >
          I disabled my ad blocker ({Math.min(retryCount + 1, 3)}/3)
        </button>
        <p className="mt-3 text-center text-xs text-slate-500">
          Access will stay locked until ad blocking is fully disabled.
        </p>
      </div>
    </div>
  );
}
