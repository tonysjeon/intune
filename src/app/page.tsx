const features = [
  {
    number: "01",
    title: "Connect",
    description: "Authorize your own Spotify account. Your listening data stays yours.",
  },
  {
    number: "02",
    title: "Invite",
    description: "Share a private comparison link with someone whose taste you want to know.",
  },
  {
    number: "03",
    title: "Discover",
    description: "See your compatibility, shared favorites, and songs worth sending.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden px-6 py-6 sm:px-10 lg:px-16">
      <nav className="mx-auto flex max-w-7xl items-center justify-between border-b border-white/10 pb-5">
        <a className="text-xl font-semibold tracking-tight" href="#">
          in<span className="text-lime-300">tune</span>
        </a>
        <span className="text-xs uppercase tracking-[0.22em] text-white/45">
          Spotify taste matching
        </span>
      </nav>

      <section className="mx-auto grid min-h-[70vh] max-w-7xl items-center gap-14 py-20 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
        <div>
          <p className="mb-6 text-sm font-medium uppercase tracking-[0.24em] text-lime-300">
            Music says a lot about us
          </p>
          <h1 className="max-w-4xl text-6xl font-semibold leading-[0.93] tracking-[-0.065em] sm:text-7xl lg:text-[7.4rem]">
            Are you two in tune?
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-8 text-white/60 sm:text-xl">
            Connect two Spotify accounts and turn your listening histories into a
            shared taste map, a compatibility score, and genuinely good song
            recommendations.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <button
              className="rounded-full bg-lime-300 px-7 py-3.5 text-sm font-semibold text-neutral-950 transition hover:bg-lime-200"
              type="button"
            >
              Connect Spotify
            </button>
            <span className="text-sm text-white/35">Both people opt in separately</span>
          </div>
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-lg" aria-hidden="true">
          <div className="absolute inset-[8%] rounded-full border border-lime-300/20 bg-lime-300/[0.03]" />
          <div className="absolute inset-[22%] rounded-full border border-white/10" />
          <div className="absolute left-[20%] top-[31%] h-40 w-40 rounded-full bg-violet-500/70 blur-sm sm:h-48 sm:w-48" />
          <div className="absolute bottom-[23%] right-[17%] h-40 w-40 rounded-full bg-lime-300/70 blur-sm sm:h-48 sm:w-48" />
          <div className="absolute left-[43%] top-[44%] h-24 w-24 rounded-full bg-white/60 blur-md" />
          <span className="absolute left-[11%] top-[20%] rounded-full border border-white/10 bg-neutral-950/70 px-3 py-2 text-xs text-white/55 backdrop-blur">
            alt R&amp;B
          </span>
          <span className="absolute bottom-[14%] right-[8%] rounded-full border border-white/10 bg-neutral-950/70 px-3 py-2 text-xs text-white/55 backdrop-blur">
            indie soul
          </span>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl border-t border-white/10 md:grid-cols-3">
        {features.map((feature) => (
          <article
            className="border-b border-white/10 py-8 md:border-b-0 md:border-r md:px-8 md:first:pl-0 md:last:border-r-0"
            key={feature.number}
          >
            <p className="text-xs text-lime-300/70">{feature.number}</p>
            <h2 className="mt-5 text-2xl font-medium tracking-tight">{feature.title}</h2>
            <p className="mt-3 max-w-sm text-sm leading-6 text-white/45">
              {feature.description}
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}
