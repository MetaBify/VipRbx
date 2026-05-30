"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function ClaimPlusLanding() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-16">
      <section className="mx-auto flex max-w-5xl flex-col items-center gap-8 rounded-lg bg-white px-6 py-10 text-center shadow-xl sm:px-10">
        <Image
          src="/images/plus.png"
          alt="Roblox Plus"
          width={180}
          height={180}
          className="h-36 w-36 object-contain sm:h-44 sm:w-44"
          priority
        />

        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold text-slate-950 sm:text-5xl">
            Apply for Roblox Plus
          </h1>
          <p className="mt-4 text-lg font-semibold text-slate-700 sm:text-xl">
            6 months for non-creators
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
            Submit your Roblox username and email to begin the application.
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/claimplus/apply")}
          className="min-h-14 w-full max-w-md rounded-md bg-green-500 px-6 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          Apply Now
        </button>
      </section>
    </main>
  );
}
