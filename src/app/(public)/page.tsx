import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import {
  CalendarDays,
  MapPin,
  ArrowRight,
  ClipboardList,
  ListOrdered,
  ShieldCheck,
} from 'lucide-react';

export default async function HomePage() {
  const tournament = {
    name: 'IUMSU Beach Handball Fiesta 2026',
    startDate: '12 December',
    endDate: '20 December 2026',
    venue: 'National Stadium',
    registrationDeadline: '30 November 2026',
  };

  const teamCount = await prisma.teamRegistration.count({
    where: { status: 'APPROVED' },
  });

  const totalSlots = 42;

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#061911]">
      {/* Atmospheric background */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(
                circle at 85% 15%,
                rgba(229, 184, 75, 0.14) 0%,
                transparent 45%
              ),
              radial-gradient(
                circle at 15% 50%,
                rgba(20, 61, 43, 0.6) 0%,
                transparent 60%
              ),
              linear-gradient(
                160deg,
                #0a2419 0%,
                #061911 50%,
                #030d09 100%
              )
            `,
          }}
        />

        {/* Subtle ambient glow */}
        <div className="absolute -top-40 right-[-8%] h-[520px] w-[520px] rounded-full bg-gold/10 blur-[140px]" />
        <div className="absolute -bottom-48 -left-32 h-[620px] w-[620px] rounded-full bg-forest-raised/30 blur-[150px]" />

        {/* Micro-grain / dithering */}
        <div
          className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
          }}
        />
      </div>

      {/* Page content */}
      <div className="relative z-10">
        <div className="pt-[120px] px-margin-mobile md:px-margin-desktop max-w-[1440px] mx-auto pb-stack-lg min-h-screen flex flex-col justify-center">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter mt-12 items-center">
            {/* Left Column: Hero Content */}
            <div className="lg:col-span-8 flex flex-col gap-stack-lg">
              <div className="flex flex-col gap-stack-sm">
                <p className="font-display text-label-md uppercase text-gold flex items-center gap-2">
                  <CalendarDays size={18} />
                  {tournament.startDate} — {tournament.endDate}
                  <span className="mx-2 opacity-30">|</span>
                  <MapPin size={18} />
                  {tournament.venue}
                </p>

                <h1 className="font-display text-display-hero-mobile md:text-display-hero text-white mt-2">
                  {tournament.name}
                </h1>
              </div>

              <p className="font-sans text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
                Register your team, submit your player list, and track every
                step of review in one place. Registration closes{' '}
                {tournament.registrationDeadline}.
              </p>

              <div className="flex flex-wrap gap-stack-md mt-4">
                <Link
                  href="/team/register"
                  className="bg-gold text-forest font-display text-label-lg uppercase px-6 py-3 rounded-lg shadow-[0_0_24px_rgba(217,160,67,0.35)] hover:bg-gold-deep transition-colors flex items-center gap-2 font-semibold"
                >
                  Register your team
                  <ArrowRight size={18} />
                </Link>

                <Link
                  href="/fixtures"
                  className="glass-panel text-gold font-display text-label-lg uppercase px-6 py-3 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-2"
                >
                  View fixtures
                  <CalendarDays size={18} />
                </Link>
              </div>
            </div>

            {/* Right Column: Stats Card */}
            <div className="lg:col-span-4 mt-8 lg:mt-0">
              <div className="glass-panel rounded-xl p-container-padding flex flex-col gap-stack-lg">
                <div className="grid grid-cols-2 gap-stack-lg">
                  <div>
                    <p className="font-display text-label-md uppercase text-on-surface-variant mb-1">
                      Teams confirmed
                    </p>
                    <p className="font-display text-headline-lg text-gold">
                      {teamCount}
                    </p>
                  </div>

                  <div>
                    <p className="font-display text-label-md uppercase text-on-surface-variant mb-1">
                      Slots available
                    </p>
                    <p className="font-display text-headline-lg text-gold">
                      {totalSlots - teamCount}
                    </p>
                  </div>
                </div>

                <div className="h-px w-full bg-gold/20" />

                <div>
                  <p className="font-display text-label-md uppercase text-on-surface-variant mb-1">
                    Registration closes
                  </p>
                  <p className="font-sans text-body-md text-white">
                    {tournament.registrationDeadline}
                  </p>
                </div>

                <div className="w-full h-32 rounded-lg border border-gold/20 opacity-70 grayscale mt-2 overflow-hidden relative bg-forest-raised">
                  <div className="absolute inset-0 bg-gold/10 mix-blend-overlay" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <MapPin size={32} className="text-outline/40" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter mt-24">
            {[
              {
                icon: <ClipboardList size={16} />,
                title: 'Team registration',
                body: 'A guided, multi-step process — save a draft and come back anytime before the deadline.',
              },
              {
                icon: <ListOrdered size={16} />,
                title: 'Fixtures',
                body: 'Match schedules are published here as soon as they’re confirmed by the organizers.',
              },
              {
                icon: <ShieldCheck size={16} />,
                title: 'Approved teams',
                body: 'Once a registration clears review, the team appears on the public roster.',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="glass-panel rounded-lg p-container-padding hover:bg-white/5 transition-colors group cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-forest-raised flex items-center justify-center text-gold border border-gold/30">
                    {feature.icon}
                  </div>

                  <h3 className="font-display text-headline-md text-white">
                    {feature.title}
                  </h3>
                </div>

                <p className="font-sans text-body-md text-on-surface-variant">
                  {feature.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
