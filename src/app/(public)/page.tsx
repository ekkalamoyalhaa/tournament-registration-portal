import Link from 'next/link';
import {
  Users,
  CalendarDays,
  ArrowRight,
  ClipboardList,
  ListOrdered,
  ShieldCheck,
} from 'lucide-react';

export default async function HomePage() {
  const tournament = {
    name: 'IUMSU Beach Handball Fiesta 2026',
    divisions: "Men's & Women's Division",
    registrationDeadline: '25 September 2026',
  };

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#04120c]">
      {/* Atmospheric background */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(circle at 85% 15%, rgba(229, 184, 75, 0.12) 0%, rgba(229, 184, 75, 0.03) 30%, transparent 60%),
              radial-gradient(circle at 18% 35%, rgba(27, 77, 62, 0.45) 0%, rgba(18, 56, 41, 0.25) 35%, transparent 70%),
              radial-gradient(circle at 60% 85%, rgba(13, 48, 34, 0.4) 0%, rgba(4, 18, 12, 0.6) 55%, transparent 80%),
              linear-gradient(rgb(7, 31, 22) 0%, rgb(3, 20, 14) 45%, rgb(1, 10, 6) 100%)
            `,
            backgroundAttachment: 'fixed',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
          }}
        />

        {/* Micro-grain / dithering */}
        <div
          className="absolute inset-0 opacity-40 mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E\")",
            backgroundRepeat: 'repeat',
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
                  <Users size={18} />
                  {tournament.divisions}
                  <span className="mx-2 opacity-30">|</span>
                  <CalendarDays size={18} />
                  Register before {tournament.registrationDeadline}
                </p>

                <h1 className="font-display text-display-hero-mobile md:text-display-hero text-white mt-2">
                  {tournament.name}
                </h1>
              </div>

              <p className="font-sans text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
                Open for Universities, Colleges, Higher Education Institutions,
                and Higher Secondary Schools. Submit your team and player
                roster online before the registration deadline.
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

            {/* Right Column: Event Poster Card */}
            <div className="lg:col-span-4 mt-8 lg:mt-0">
              <div className="glass-panel rounded-xl p-3 border border-gold/30 shadow-glow-gold overflow-hidden flex flex-col items-center justify-center group">
                <div className="w-full rounded-lg overflow-hidden border border-gold/20 shadow-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/notice.jpg"
                    alt={`${tournament.name} Poster`}
                    className="w-full h-auto object-contain transform group-hover:scale-[1.02] transition-all duration-300"
                  />
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
                icon: <ShieldCheck size={16} />,
                title: 'Team Details',
                body: 'Once a registration clears review, the team can submit the details and documents for the team.',
              },
              {
                icon: <ListOrdered size={16} />,
                title: 'Fixtures',
                body: ' Match schedules are published here as soon as they are confirmed by the organizers',
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