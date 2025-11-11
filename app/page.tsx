import HomeHero from "./components/HomeHero";

export default async function Home() {
  return (
    <div className="home-container ">
      <div className="px-4 pt-28 pb-16 sm:px-6 lg:px-8">
        <HomeHero />
      </div>
      <section className="mx-auto flex max-w-5xl flex-col gap-10 px-4 pb-24 text-slate-800">
        <div className="rounded-3xl bg-white p-8 shadow-xl">
          <h2 className="text-2xl font-semibold">How it works</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {[
              {
                title: "Register or login",
                copy: "Create your viprbx account so we can sync offer progress and store your points securely.",
              },
              {
                title: "Complete offers",
                copy: "Head to the offer wall, complete tasks, and tap `Sync progress` to pull your pending leads.",
              },
              {
                title: "Claim & withdraw",
                copy: "Points unlock shortly after completion. Claim them on the Profile or Claim pages and withdraw once you reach 50 points.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-sm">
                <h3 className="text-lg font-semibold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-slate-600">{item.copy}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white shadow-xl">
          <h2 className="text-2xl font-semibold">Why viprbx?</h2>
          <ul className="mt-6 space-y-4 text-sm text-white/80">
            <li>&bull; Real-time point tracking with a claim center and withdrawal flow.</li>
            <li>&bull; Points from offer providers convert to about 8 Robux each when redeemed.</li>
            <li>&bull; No fake username prompt. just register, sync offers, and redeem when you&apos;re ready.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
