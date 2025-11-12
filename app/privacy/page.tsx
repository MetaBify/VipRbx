"use client";

const SUPPORT_EMAIL = "lvg3ns@gmail.com";

const sections = [
  {
    title: "What we collect",
    bullets: [
      "Account data: username, email (if provided), Roblox identifiers, avatar preferences, and withdrawal notes so we know where to send rewards.",
      "Offer tracking: when you start an offer we tag it with your internal user id as `s1`, plus the offer id and timestamp. Providers can also send back device info, completion value, and rejection reasons.",
      "Device & security info: IP address, user agent, and cookie/session ids are logged while you browse to keep accounts safe, stop double claims, and show geo-targeted offers.",
      "Cookies: we store a signed session token and light analytics (for example your last sync) so you stay logged in across tabs.",
    ],
  },
  {
    title: "Manual payouts",
    bullets: [
      "Submitting a withdrawal immediately deducts the points so the same balance cannot be spent twice.",
      "Our team verifies the lead with the ad provider (this can take up to 48 hours) and then manually emails or DMs the Robux code or payment within 1-3 days.",
      "If we cannot fulfill the request we refund the points or reach out to the contact email tied to the ticket.",
    ],
  },
  {
    title: "Lead validation window",
    bullets: [
      "Offers stay in a \"checking\" state behind the scenes for 48 hours even though the UI badge disappears after roughly 10 hours.",
      "If an advertiser cancels a lead during that window we remove the pending points automatically so balances stay accurate.",
      "Deleting an account before a lead unlocks voids the reward because there is no longer a destination user to credit.",
    ],
  },
  {
    title: "Your controls",
    bullets: [
      `Need an export or deletion? Email ${SUPPORT_EMAIL} with the username in question and we will wipe the data from our database and backups.`,
      "Report bugs, suspicious charges, or missing points via the About page contact card or the TikTok link - we respond within 24 hours.",
      "Continuing to use VipRbx means you agree to the practices listed here; major updates will be posted on this page.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4 sm:px-8 md:px-16">
      <div className="mx-auto max-w-3xl space-y-10">
        <header className="rounded-3xl bg-gradient-to-r from-yellow-200 via-amber-200 to-orange-200 p-8 shadow-lg">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-700">
            VipRbx Privacy
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl">
            How we handle your data while you grind offers
          </h1>
          <p className="mt-4 text-base text-slate-700">
            VipRbx is a community-driven rewards project. We only collect the
            information needed to credit leads, combat fraud, and send manual
            payouts. Nothing is sold to third parties - data goes solely to our
            offer providers when they need to verify completions.
          </p>
        </header>

        <section className="space-y-8">
          {sections.map((section) => (
            <article
              key={section.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-xl font-semibold text-slate-900">
                {section.title}
              </h2>
              <ul className="mt-4 list-disc space-y-3 pl-5 text-sm text-slate-600">
                {section.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-slate-900 bg-slate-900 p-6 text-white">
          <h3 className="text-lg font-semibold tracking-wide">Contact us</h3>
          <p className="mt-2 text-sm text-slate-100">
            Questions about this policy, payout timing, or account reviews? Email{" "}
            <a
              className="underline decoration-yellow-400 decoration-2 underline-offset-4"
              href={`mailto:${SUPPORT_EMAIL}`}
            >
              {SUPPORT_EMAIL}
            </a>{" "}
            and include proof of ownership if you are requesting deletions.
          </p>
        </section>
      </div>
    </div>
  );
}

