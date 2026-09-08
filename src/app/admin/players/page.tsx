import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { ArrowRight, Search } from 'lucide-react';

export default async function AdminPlayersPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string };
}) {
  const session = await auth();
  if (!session?.user) redirect('/login?callbackUrl=/admin/players');
  const role = session.user.role as string | undefined;
  if (role !== 'TOURNAMENT_ADMIN' && role !== 'SUPER_ADMIN') redirect('/');

  const statusFilter = searchParams.status;
  const search = searchParams.q;

  const where: any = {};
  if (statusFilter) where.status = statusFilter;

  const players = await prisma.player.findMany({
    where,
    include: { team: true },
    orderBy: { updatedAt: 'desc' },
  });

  const filtered = search
    ? players.filter((p) =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase())
      )
    : players;

  const statuses = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED'];

  return (
    <div>
      <header className="mb-8 mt-6">
        <h2 className="font-sans text-display-lg text-secondary-container font-bold tracking-tight mb-2">
          Players
        </h2>
        <p className="text-outline font-sans text-body-md">
          {filtered.length} player{filtered.length !== 1 ? 's' : ''}
        </p>
      </header>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-6">
        <form className="relative flex-1" method="get">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
          <input
            name="q"
            defaultValue={search ?? ''}
            placeholder="Search players..."
            className="w-full rounded-lg border border-white/10 bg-white/[0.02] py-2.5 pl-10 pr-4 font-sans text-body-md text-on-surface outline-none placeholder:text-outline/50 focus:border-primary-container/50 focus:ring-1 focus:ring-primary-container/30"
          />
          {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
        </form>
        <div className="flex flex-wrap gap-2">
          <FilterChip href="/admin/players" active={!statusFilter} label="All" />
          {statuses.map((s) => (
            <FilterChip
              key={s}
              href={`/admin/players?status=${s}${search ? `&q=${search}` : ''}`}
              active={statusFilter === s}
              label={s.replace('_', ' ').toLowerCase()}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="glass-panel rounded-xl p-6">
            <p className="py-8 text-center font-sans text-body-md text-outline/40 italic">No players found</p>
          </div>
        )}
        {filtered.map((player) => (
          <Link
            key={player.id}
            href={`/admin/players/${player.id}`}
            className="flex items-center justify-between rounded-xl glass-panel p-5 transition-all hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-label-sm font-bold text-outline border border-white/10">
                {player.jerseyNumber ?? '—'}
              </div>
              <div>
                <p className="font-sans text-body-md font-medium text-on-surface">
                  {player.firstName} {player.lastName}
                </p>
                <p className="mt-0.5 font-mono text-label-sm text-outline">
                  {player.team.name} · {player.position ?? '—'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <StatusBadge status={player.status} />
              <ArrowRight size={16} className="text-outline" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function FilterChip({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1.5 font-mono text-label-sm uppercase tracking-wider transition-colors ${
        active
          ? 'border-primary-container bg-primary-container/10 text-primary-container'
          : 'border-white/10 text-outline hover:border-white/20 hover:text-on-surface-variant'
      }`}
    >
      {label}
    </Link>
  );
}