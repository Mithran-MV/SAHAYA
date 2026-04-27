import Header from '@/components/Header';
import HeroStrip from '@/components/HeroStrip';
import NeedsMap from '@/components/NeedsMap';
import ActivityFeed from '@/components/ActivityFeed';
import NeedTypeBreakdown from '@/components/NeedTypeBreakdown';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 space-y-6">
        <Hero />
        <HeroStrip />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[460px] lg:h-[520px]">
            <NeedsMap />
          </div>
          <div className="lg:col-span-1 h-[460px] lg:h-[520px]">
            <ActivityFeed />
          </div>
        </div>
        <NeedTypeBreakdown />
        <Footer />
      </div>
    </main>
  );
}

function Hero() {
  return (
    <section className="rounded-2xl border border-slate-800/60 bg-gradient-to-br from-emerald-500/10 via-slate-900/40 to-slate-950 p-6 lg:p-8">
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow" />
        <span className="text-xs uppercase tracking-widest text-emerald-300/80">
          Live · Coimbatore region
        </span>
      </div>
      <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight max-w-2xl">
        Every need a frontline worker speaks aloud, mapped and answered.
      </h2>
      <p className="mt-3 text-slate-300/80 text-sm sm:text-base max-w-2xl">
        ASHA workers send WhatsApp voice notes in Tamil, Hindi, or English. Gemini turns each into
        structured needs, the closest qualified volunteer is dispatched, and resolutions are
        verified by photo. This is the public ledger.
      </p>
    </section>
  );
}

function Footer() {
  return (
    <footer className="text-xs text-slate-500 border-t border-slate-800/60 pt-6 pb-2 flex flex-col sm:flex-row sm:items-center gap-2">
      <span>
        SAHAYA · Solution Challenge 2026 · GDG on Campus — CIT
      </span>
      <span className="sm:ml-auto">
        Built with Gemini, Cloud Run, and Google Maps Platform.{' '}
        <a
          href="https://github.com/Mithran-MV/SAHAYA"
          target="_blank"
          rel="noopener"
          className="underline hover:text-slate-300 transition"
        >
          Source on GitHub
        </a>
      </span>
    </footer>
  );
}
