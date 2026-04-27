import { Github } from 'lucide-react';

export default function Header() {
  return (
    <header className="border-b border-slate-800/60 bg-slate-950/80 backdrop-blur sticky top-0 z-30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 grid place-items-center text-xl">
            🌾
          </div>
          <div>
            <h1 className="font-display text-lg font-semibold tracking-tight leading-tight">
              SAHAYA
            </h1>
            <p className="text-xs text-slate-400 -mt-0.5">
              Voice-first community needs · Coimbatore
            </p>
          </div>
        </div>
        <a
          href="https://github.com/Mithran-MV/SAHAYA"
          target="_blank"
          rel="noopener"
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition"
        >
          <Github className="w-4 h-4" />
          <span className="hidden sm:inline">Mithran-MV/SAHAYA</span>
        </a>
      </div>
    </header>
  );
}
