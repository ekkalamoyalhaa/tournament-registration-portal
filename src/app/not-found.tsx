import Link from 'next/link';
import { Home, Hourglass } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#061911] px-6 py-16 text-slate-100">
      {/* Background */}
      <div
        className="pointer-events-none fixed inset-0"
        aria-hidden="true"
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(
                circle at 50% 35%,
                rgba(27, 77, 62, 0.45) 0%,
                transparent 65%
              ),
              radial-gradient(
                circle at 85% 15%,
                rgba(229, 184, 75, 0.12) 0%,
                transparent 45%
              ),
              radial-gradient(
                circle at 15% 75%,
                rgba(20, 61, 43, 0.5) 0%,
                transparent 55%
              ),
              linear-gradient(
                160deg,
                #0a2419 0%,
                #061911 50%,
                #020d08 100%
              )
            `,
          }}
        />

        {/* Subtle grain */}
        <div
          className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
            backgroundRepeat: 'repeat',
          }}
        />
      </div>

      {/* 404 Card */}
      <div className="relative z-10 w-full max-w-md text-center">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[rgba(1,32,23,0.65)] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
          {/* Ambient card glows */}
          <div
            className="pointer-events-none absolute -left-24 -top-24 h-48 w-48 rounded-full bg-gold/10 blur-3xl"
            aria-hidden="true"
          />

          <div
            className="pointer-events-none absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative z-10 flex flex-col items-center px-2 py-4">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-gold/20 bg-gold/10 text-gold">
              <Hourglass size={24} strokeWidth={1.8} />
            </div>

            <h1 className="mb-2 font-sans text-lg font-medium tracking-normal text-white/80 md:text-xl">
              This page is currently not available
            </h1>

            <p className="mx-auto mb-6 max-w-sm font-sans text-xs font-normal leading-relaxed text-emerald-100/60 md:text-sm">
              The requested content is currently not available or is temporarily inactive. 
            </p>

            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-5 py-2.5 font-display text-xs font-semibold uppercase tracking-wider text-forest shadow-md shadow-gold/20 transition-all hover:bg-gold-deep"
            >
              <Home size={16} />
              Return to Homepage
            </Link>
          </div>
        </div>

        {/* Support */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 font-sans text-xs text-emerald-200/50">
          <span>Need urgent assistance?</span>
          <span className="font-medium text-gold">+960 7330981</span>
          <span>•</span>
          <span className="font-medium text-gold">
            student.union@ium.edu.mv
          </span>
        </div>
      </div>
    </main>
  );
}