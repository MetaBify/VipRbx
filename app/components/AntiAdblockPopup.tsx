"use client";

import { useEffect, useState } from "react";

const storageKey = "support-popup-dismissed";

export default function AntiAdblockPopup() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (window.sessionStorage.getItem(storageKey) === "1") {
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

    const detect = () => {
      const blocked =
        !bait ||
        bait.offsetParent === null ||
        bait.offsetHeight === 0 ||
        bait.clientHeight === 0;

      if (blocked) {
        setVisible(true);
      }

      if (bait && bait.parentNode) {
        bait.parentNode.removeChild(bait);
      }
    };

    const timing = window.setTimeout(detect, 180);

    return () => {
      window.clearTimeout(timing);
      if (bait && bait.parentNode) {
        bait.parentNode.removeChild(bait);
      }
    };
  }, []);

  const handleClose = () => {
    setVisible(false);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(storageKey, "1");
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 text-slate-900 shadow-2xl">
        <h2 className="text-lg font-semibold">Disable Ad Blocker</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Please disable your ad blocker to continue receiving Robux rewards. Once you pause the blocker or whitelist this site, refresh the page to keep the bonus active.
        </p>
        <button
          type="button"
          onClick={handleClose}
          className="mt-5 w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-emerald-600"
        >
          I&apos;ll do it
        </button>
      </div>
    </div>
  );
}
