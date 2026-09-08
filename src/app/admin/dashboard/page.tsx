import Link from 'next/link';
import { StatCard } from '@/components/admin/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  getAdminStats,
  getPendingTeamReviews,
  getPendingPlayerReviews,
  getRecentActivity,
} from '@/lib/admin/actions';
import { ArrowRight } from 'lucide-react';

type PendingTeam = Awaited<ReturnType<typeof getPendingTeamReviews>>[number];
type PendingPlayer = Awaited<ReturnType<typeof getPendingPlayerReviews>>[number];
type ActivityEvent = Awaited<ReturnType<typeof getRecentActivity>>[number];

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  const units: [number, string][] = [
    [60, 'second'],
    [60, 'minute'],
    [24, 'hour'],
    [7, 'day'],
    [4.345, 'week'],
    [12, 'month'],
  ];
  let value = seconds;
  let unit = 'second';
  for (const [amount, name] of units) {
    if (value < amount) break;
    value = Math.floor(value / amount);
    unit = name;
  }
  return value <= 1 ? 'just now' : `${value} ${unit}${value === 1 ? '' : 's'} ago`;
}

function ViewAllLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1 font-mono text-label-sm text-primary-container transition-all hover:text-white hover:drop-shadow-[0_0_8px_rgba(217,160,67,0.5)]"
    >
      View all <ArrowRight size={16} />
    </Link>
  );
}

export default async function AdminDashboardPage() {
  const [stats, pendingTeams, pendingPlayers, activity] = await Promise.all([
    getAdminStats(),
    getPendingTeamReviews(),
    getPendingPlayerReviews(),
    getRecentActivity(),
  ]);

  return (
    <div className="mt-6">
      {/* Page Header */}
      <header className="mb-12">
        <h2 className="font-display text-display-lg font-bold tracking-tight text-primary-container">
          Tournament dashboard
        </h2>
        <p className="mt-2 font-sans text-body-md text-outline">
          Overview of all registrations and reviews for {stats.tournamentName}
        </p>
      </header>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
        <StatCard
          label="Teams"
          total={stats.totalTeams}
          breakdown={[
            { label: 'Approved', value: stats.approved },
            { label: 'Pending', value: stats.pendingTeams, highlight: true },
            { label: 'Changes requested', value: stats.changesRequested },
          ]}
        />
        <StatCard
          label="Players"
          total={stats.totalPlayers}
          breakdown={[
            { label: 'Approved', value: stats.approvedPlayers },
            { label: 'Pending', value: stats.pendingPlayers, highlight: true },
            { label: 'Changes requested', value: stats.playerChangesRequested },
          ]}
        />
        <StatCard
          label="Documents"
          total={stats.totalDocs}
          breakdown={[{ label: 'Uploaded', value: stats.totalDocs }]}
        />
      </div>

      {/* Secondary Grid: Pending Reviews */}
      <div className="mb-8 grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
        {/* Pending Team Reviews */}
        <div className="glass-panel flex h-full min-h-[220px] flex-col rounded-xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-mono text-label-md uppercase tracking-wider text-outline">
              Pending team reviews
            </h3>
            <ViewAllLink href="/admin/teams" />
          </div>
          <div className="mt-2 flex-1 border-t border-primary-container/15">
            {pendingTeams.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="font-sans text-body-md italic text-outline/60">No teams pending review</p>
              </div>
            ) : (
              <ul className="divide-y divide-white/5">
                {pendingTeams.map((reg: PendingTeam) => (
                  <li key={reg.id} className="flex items-center justify-between py-3">
                    <Link
                      href={`/admin/teams/${reg.id}`}
                      className="font-sans text-body-md text-white hover:text-primary-container"
                    >
                      {reg.team.name}
                    </Link>
                    <StatusBadge status={reg.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Pending Player Reviews */}
        <div className="glass-panel flex h-full min-h-[220px] flex-col rounded-xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-mono text-label-md uppercase tracking-wider text-outline">
              Pending player reviews
            </h3>
            <ViewAllLink href="/admin/players" />
          </div>
          <div className="mt-2 flex-1 border-t border-primary-container/15">
            {pendingPlayers.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="font-sans text-body-md italic text-outline/60">No players pending review</p>
              </div>
            ) : (
              <ul className="divide-y divide-white/5">
                {pendingPlayers.map((player: PendingPlayer) => (
                  <li key={player.id} className="flex items-center justify-between py-3">
                    <Link
                      href={`/admin/players/${player.id}`}
                      className="font-sans text-body-md text-white hover:text-primary-container"
                    >
                      {player.firstName} {player.lastName}
                      <span className="ml-2 font-mono text-label-sm text-outline">{player.team.name}</span>
                    </Link>
                    <StatusBadge status={player.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Full Width Row: Recent Activity */}
      <div className="glass-panel flex min-h-[280px] flex-col rounded-xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-mono text-label-md uppercase tracking-wider text-outline">Recent activity</h3>
        </div>
        <div className="group relative mt-2 flex-1 overflow-hidden border-t border-primary-container/15">
          {activity.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-primary-container/5 opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
              <p className="z-10 font-sans text-body-md italic text-outline/60">No activity yet</p>
            </div>
          ) : (
            <ul className="divide-y divide-white/5">
              {activity.map((event: ActivityEvent) => (
                <li key={event.id} className="flex items-center justify-between py-3">
                  <p className="font-sans text-body-md text-white">
                    <span className="font-medium">{event.teamName}</span>{' '}
                    <span className="text-outline">
                      {event.note ?? `moved to ${event.toStatus.replaceAll('_', ' ').toLowerCase()}`}
                    </span>
                  </p>
                  <span className="whitespace-nowrap font-mono text-label-sm text-outline">
                    {timeAgo(event.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}