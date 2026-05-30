"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function ClaimPlusLanding() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-20">
      <section className="mx-auto grid max-w-5xl overflow-hidden rounded-lg bg-white shadow-xl lg:grid-cols-[0.85fr_1.15fr]">
        <div className="flex items-center justify-center bg-slate-950 px-8 py-10">
          <Image
            src="/images/plus.png"
            alt="Roblox Plus"
            width={240}
            height={240}
            className="h-44 w-44 object-contain sm:h-56 sm:w-56"
            priority
          />
        </div>

        <div className="flex flex-col justify-center px-6 py-10 text-center sm:px-10 lg:text-left">
          <p className="text-sm font-bold uppercase tracking-wide text-green-500">
            Roblox Plus application
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-slate-950 sm:text-5xl">
            Apply for 6 months of Roblox Plus
          </h1>
          <p className="mt-4 text-lg font-semibold text-slate-700">
            For non-creators applying through the current review flow.
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
            Start with a short application, then complete the verification step
            so your request can be reviewed.
          </p>

          <button
            type="button"
            onClick={() => router.push("/claimplus/apply")}
            className="mt-8 min-h-14 w-full rounded-md bg-green-500 px-6 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:max-w-sm"
          >
            Apply Now
          </button>
        </div>
      </section>
    </main>
  );
}
