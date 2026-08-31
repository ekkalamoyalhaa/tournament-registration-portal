import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';

// PRD §4 homepage, using the PRD's own worked example (2026 Island
// Championship) as real content rather than placeholder lorem ipsum.
// Layout: split-screen hero per design.md ("text left, visual right").
export default function HomePage() {
  const tournament = {
    name: '2026 Island Championship',
    startDate: '12 December',
    endDate: '20 December 2026',
    venue: 'National Stadium',
    registrationDeadline: '30 November 2026',
    teamsRegistered: 31,
    slotsAvailable: 42,
  };

  return (
    <main className="mx-auto max-w-container px-6">
      <section className="grid min-h-[70dvh] grid-cols-1 items-center gap-12 py-section md:grid-cols-2">
        <div>
          <p className="text-small text-white/60">
            {tournament.startDate} — {tournament.endDate} · {tournament.venue}
          </p>
          <h1 className="mt-3 text-hero font-bold leading-[1.05] tracking-tight">
            {tournament.name}
          </h1>
          <p className="mt-6 max-w-[52ch] text-body text-white/75">
            Register your team, submit your player list, and track every step of review
            in one place. Registration closes {tournament.registrationDeadline}.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/team/register">
              <GlassButton>Register your team</GlassButton>
            </Link>
            <Link href="/fixtures">
              <GlassButton variant="ghost">View fixtures</GlassButton>
            </Link>
          </div>
        </div>

        <GlassCard className="justify-self-center md:justify-self-end">
          <dl className="grid grid-cols-2 gap-6">
            <div>
              <dt className="text-small text-white/60">Teams confirmed</dt>
              <dd className="mt-1 text-h1 font-bold text-primary">{tournament.teamsRegistered}</dd>
            </div>
            <div>
              <dt className="text-small text-white/60">Slots available</dt>
              <dd className="mt-1 text-h1 font-bold text-neutral">{tournament.slotsAvailable}</dd>
            </div>
            <div className="col-span-2 border-t border-glass-border pt-4">
              <dt className="text-small text-white/60">Registration closes</dt>
              <dd className="mt-1 text-body font-medium">{tournament.registrationDeadline}</dd>
            </div>
          </dl>
        </GlassCard>
      </section>

      <section className="grid grid-cols-1 gap-6 pb-section md:grid-cols-3">
        <GlassCard>
          <h2 className="text-h2 font-semibold">Team registration</h2>
          <p className="mt-2 text-small text-white/70">
            A guided, multi-step process — save a draft and come back anytime before
            the deadline.
          </p>
        </GlassCard>
        <GlassCard>
          <h2 className="text-h2 font-semibold">Fixtures</h2>
          <p className="mt-2 text-small text-white/70">
            Match schedules are published here as soon as they&apos;re confirmed by the
            organizers.
          </p>
        </GlassCard>
        <GlassCard>
          <h2 className="text-h2 font-semibold">Approved teams</h2>
          <p className="mt-2 text-small text-white/70">
            Once a registration clears review, the team appears on the public roster.
          </p>
        </GlassCard>
      </section>
    </main>
  );
}
