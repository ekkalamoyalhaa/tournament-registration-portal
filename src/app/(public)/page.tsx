import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { CalendarDays, MapPin, ArrowRight, ClipboardList, ListOrdered, ShieldCheck } from 'lucide-react';

export default async function HomePage() {
  const tournament = {
    name: '2026 Island Championship',
    startDate: '12 December',
    endDate: '20 December 2026',
    venue: 'National Stadium',
    registrationDeadline: '30 November 2026',
  };

  const teamCount = await prisma.teamRegistration.count({ where: { status: 'APPROVED' } });
  const totalSlots = 42;

  return (
    <main className="pt-[120px] px-[16px] md:px-[40px] max-w-[1440px] mx-auto pb-[24px] min-h-screen flex flex-col justify-center">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-[24px] mt-12 items-center">
        {/* Left Column: Hero Content */}
        <div className="lg:col-span-8 flex flex-col gap-[24px]">
          <div className="flex flex-col gap-[4px]">
            <p className="font-mono text-label-md text-on-surface-variant flex items-center gap-2">
              <CalendarDays size={18} className="text-primary-container" />
              {tournament.startDate} — {tournament.endDate}
              <span className="mx-2 opacity-30">|</span>
              <MapPin size={18} className="text-primary-container" />
              {tournament.venue}
            </p>
            <h1 className="font-sans text-display-lg text-on-surface mt-2 tracking-tight">
              {tournament.name}
            </h1>
          </div>
          <p className="font-sans text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
            Register your team, submit your player list, and track every step of review in one place.
            Registration closes {tournament.registrationDeadline}.
          </p>
          <div className="flex flex-wrap gap-[12px] mt-4">
            <Link
              href="/team/register"
              className="bg-gradient-to-r from-primary-container to-primary-fixed-dim text-on-primary-container font-mono text-label-md px-6 py-3 rounded shadow-glow-primary hover:opacity-90 transition-opacity flex items-center gap-2 font-bold"
            >
              Register your team
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/fixtures"
              className="glass-panel text-primary-container font-mono text-label-md px-6 py-3 rounded hover:bg-white/5 transition-colors flex items-center gap-2"
            >
              View fixtures
              <CalendarDays size={18} />
            </Link>
          </div>
        </div>

        {/* Right Column: Stats Card */}
        <div className="lg:col-span-4 mt-8 lg:mt-0">
          <div className="glass-panel rounded-xl p-[32px] flex flex-col gap-[24px]">
            <div className="grid grid-cols-2 gap-[24px]">
              <div>
                <p className="font-mono text-label-md text-on-surface-variant mb-1">Teams confirmed</p>
                <p className="font-sans text-headline-lg text-primary-container">{teamCount}</p>
              </div>
              <div>
                <p className="font-mono text-label-md text-on-surface-variant mb-1">Slots available</p>
                <p className="font-sans text-headline-lg text-primary-container">{totalSlots - teamCount}</p>
              </div>
            </div>
            <div className="h-px w-full bg-white/10" />
            <div>
              <p className="font-mono text-label-md text-on-surface-variant mb-1">Registration closes</p>
              <p className="font-sans text-body-md text-on-surface">{tournament.registrationDeadline}</p>
            </div>
            {/* Decorative Map Placeholder */}
            <div className="w-full h-32 rounded border border-white/5 opacity-50 grayscale mt-2 overflow-hidden relative bg-surface-container-high">
              <div className="absolute inset-0 bg-primary-container/10 mix-blend-overlay" />
              <div className="absolute inset-0 flex items-center justify-center">
                <MapPin size={32} className="text-outline/30" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[24px] mt-24">
        {/* Feature 1 */}
        <div className="glass-panel rounded-lg p-[32px] hover:bg-white/5 transition-colors group cursor-pointer relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-container/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center text-primary-container border border-white/5">
              <ClipboardList size={16} />
            </div>
            <h3 className="font-sans text-headline-md text-on-surface">Team registration</h3>
          </div>
          <p className="font-sans text-body-md text-on-surface-variant">
            A guided, multi-step process — save a draft and come back anytime before the deadline.
          </p>
        </div>

        {/* Feature 2 */}
        <div className="glass-panel rounded-lg p-[32px] hover:bg-white/5 transition-colors group cursor-pointer relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-container/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center text-primary-container border border-white/5">
              <ListOrdered size={16} />
            </div>
            <h3 className="font-sans text-headline-md text-on-surface">Fixtures</h3>
          </div>
          <p className="font-sans text-body-md text-on-surface-variant">
            Match schedules are published here as soon as they&apos;re confirmed by the organizers.
          </p>
        </div>

        {/* Feature 3 */}
        <div className="glass-panel rounded-lg p-[32px] hover:bg-white/5 transition-colors group cursor-pointer relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-container/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center text-primary-container border border-white/5">
              <ShieldCheck size={16} />
            </div>
            <h3 className="font-sans text-headline-md text-on-surface">Approved teams</h3>
          </div>
          <p className="font-sans text-body-md text-on-surface-variant">
            Once a registration clears review, the team appears on the public roster.
          </p>
        </div>
      </div>
    </main>
  );
}