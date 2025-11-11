"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserSummary } from "@/lib/useUserSummary";

export default function SignupBonusPopup() {
  const { bonusJustGranted, acknowledgeBonus } = useUserSummary();
  const [visible, setVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (bonusJustGranted) {
      setVisible(true);
    }
  }, [bonusJustGranted]);

  const close = () => {
    setVisible(false);
    acknowledgeBonus();
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[11500] flex items-center justify-center bg-slate-900/60 px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-500">
          Welcome bonus
        </p>
        <h2 className="mt-2 text-xl font-bold text-slate-900">
          +5 points added to your balance ??
        </h2>
        <p className="mt-3 text-sm text-slate-600">
          Thanks for joining VipRbx! Use your bonus points toward your next Robux withdrawal or keep grinding more offers.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={() => {
              close();
              router.push("/withdraw");
            }}
            className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-600"
          >
            Go to withdraw center
          </button>
          <button
            onClick={close}
            className="text-xs font-semibold uppercase tracking-wide text-slate-400"
          >
            Awesome!
          </button>
        </div>
      </div>
    </div>
  );
}
