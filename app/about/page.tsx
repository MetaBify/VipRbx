"use client";

import Link from "next/link";
import Image from "next/image";

const SUPPORT_EMAIL = "lvg3ns@gmail.com";

const faqs = [
  {
    question: "How do levels work?",
    answer:
      "Every 100 points you earn (balance + pending) increases your level by one. Levels are shown next to your username everywhere—including the global chat—so grinding offers visibly upgrades your status.",
  },
  {
    question: "How does the withdrawal flow work?",
    answer:
      "Once you pick a reward and submit a request, the points are deducted immediately. Our team reviews every request and replies via Telegram or email (based on your note) within 24 hours with the Robux code or PayPal transfer.",
  },
  {
    question: "Why are my points pending?",
    answer:
      "Offer providers need a little time to confirm completion. Pending points automatically move into your balance once the advertiser unlocks them, usually within 15 minutes to a few hours.",
  },
  {
    question: "What keeps the global chat clean?",
    answer:
      "Messages are capped at 230 characters, links are blocked, and only the latest 20 are stored. Anyone spamming or posting unsafe content gets removed instantly—keep it helpful!",
  },
  {
    question: "I completed an offer but nothing showed up.",
    answer:
      "Tap “Sync progress” on the Verify page to force a refresh. If it still doesn’t appear after a few hours, try a different offer source—some advertisers reject VPN/proxy traffic.",
  },
];

export default function AboutPage() {
  return (
    <div className="bg-gray-50 min-h-screen py-8 px-4 sm:px-8 md:px-16 mt-6">
      <div className="bg-gradient-to-r from-yellow-300 to-yellow-500 shadow-md rounded-lg p-6 mb-10 text-center">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">
          Q&A
        </h1>
        <p className="mt-2 text-sm sm:text-base md:text-lg text-gray-700">
          Everything you need to know about offers, levels, and withdrawals in
          one place. VipRbx is a new project, so report any bugs or payout
          issues to{" "}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="font-semibold underline"
          >
            {SUPPORT_EMAIL}
          </a>{" "}
          while we keep shipping updates.
        </p>
      </div>

      <div className="flex flex-col md:flex-row items-center md:items-start bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="md:w-1/3 py-6 px-4 sm:py-8 sm:px-6">
          <Image
            src="/images/duo.png"
            alt="Rewards team"
            width={400}
            height={400}
            unoptimized
            className="w-40 h-40 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-full shadow-md object-cover mx-auto"
          />
        </div>

        <div className="md:w-2/3 py-6 px-4 sm:py-8 sm:px-6">
          <div className="flex flex-col gap-5 text-sm sm:text-base md:text-lg text-slate-700">
            <p>
              Complete offers, sync your progress, and watch your balance grow.
              Pending points auto-unlock once providers confirm them. Withdraw
              whenever you hit the requirement—requests deduct points instantly
              to prevent double spends, and our team sends the Robux code (or
              PayPal) manually within 1-3 days to the contact details you supply.
            </p>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-emerald-500">
                Quick reminders
              </p>
              <ul className="mt-2 list-disc space-y-2 pl-5">
                <li>Disable VPNs/ad-blockers before running offers.</li>
                <li>Use the Verify page’s Sync button every session.</li>
                <li>Leave accurate withdrawal notes (PayPal email, Roblox user, etc.).</li>
                <li>Keep the global chat helpful—spam = instant block.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-10 space-y-4">
        {faqs.map((faq) => (
          <details
            key={faq.question}
            className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <summary className="flex cursor-pointer items-center justify-between text-base font-semibold text-slate-900">
              {faq.question}
              <span className="text-xs uppercase tracking-[0.35em] text-emerald-500 transition group-open:rotate-90">
                »
              </span>
            </summary>
            <p className="mt-3 text-sm text-slate-600">{faq.answer}</p>
          </details>
        ))}
      </section>

      <div className="shadow-xl rounded-lg p-8 mt-12 text-center bg-gradient-to-r">
        <div className="flex flex-col items-center mb-8 space-y-6">
          <div className="flex items-center space-x-4 gap-2">
            <Image
              width={100}
              height={100}
              className="w-16 h-16 object-contain"
              alt="YouTube Logo"
              src="/images/yt.png"
              unoptimized
            />
            <div className="flex flex-col">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold">
                YT:
              </h2>
              <Link
                href="https://www.youtube.com/@metabify"
                className="text-lg sm:text-xl md:text-2xl transition-colors"
              >
                @metabify
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2">
            <Image
              width={200}
              height={200}
              className="w-16 h-16 object-contain"
              alt="Roblox Logo"
              src="https://static.wikia.nocookie.net/logopedia/images/d/da/Roblox_2018_O_Icon_final_-_Gray.svg/revision/latest/scale-to-width-down/250?cb=20190809191156"
            />
            <div className="flex flex-col">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold">
                Roblox:
              </h2>
              <Link
                href="https://www.roblox.com/users/2313780943/profile"
                className="text-lg sm:text-xl md:text-2xl transition-colors"
              >
                @SatBlox
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2">
            <Image
              width={200}
              height={200}
              className="w-16 h-16 object-contain"
              alt="TikTok Logo"
              src="https://img.freepik.com/premium-vector/social-media-icon-illustration-tiktok-tiktok-icon-vector-illustration_561158-2136.jpg?w=740"
              unoptimized
            />
            <div className="flex flex-col">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold">
                TikTok:
              </h2>
              <Link
                href="https://www.tiktok.com/@viprbxofficial"
                className="text-lg sm:text-xl md:text-2xl transition-colors"
              >
                @viprbxofficial
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2">
            <Image
              width={200}
              height={200}
              className="w-16 h-16 object-contain"
              alt="Instagram Logo"
              src="https://img.freepik.com/premium-psd/instagram-logo_971166-164438.jpg?w=740"
              unoptimized
            />
            <div className="flex flex-col">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold">
                Instagram:
              </h2>
              <Link
                href="https://www.instagram.com/bertusontop/reels"
                className="text-lg sm:text-xl md:text-2xl transition-colors"
              >
                @bertusontop
              </Link>
            </div>
          </div>
        </div>

        <div className="group hover:shadow-2xl hover:scale-105 transition-transform duration-300 ease-in-out">
          <p className="text-base sm:text-lg md:text-xl text-black mt-4">
            Follow for live updates, new offers, and surprise drops!
          </p>
        </div>
      </div>

      <div className="mt-12 text-center">
        <Link
          href="/keywords"
          className="text-xs uppercase tracking-[0.35em] text-emerald-500 transition hover:text-emerald-600 sm:text-sm"
        >
          robux giveaways · roblox reward codes · instant robux redemption
        </Link>
      </div>

      <div className="mt-6 flex justify-center">
        <Link
          href="/privacy"
          className="inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-[0.65rem] uppercase tracking-[0.35em] text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
        >
          privacy policy
        </Link>
      </div>
    </div>
  );
}
