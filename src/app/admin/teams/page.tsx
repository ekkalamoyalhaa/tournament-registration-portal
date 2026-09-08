import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { getTeams } from '@/lib/admin/actions';
import { ArrowRight } from 'lucide-react';

export default async function AdminTeamsPage({
  searchParams,
}: {
  searchParams: { status?: string; phase?: string };
}) {
  const teams = await getTeams({ status: searchParams.status, phase: searchParams.phase });

  return (
    <main className="mx-auto max-w-6xl px-[16px] md:px-[40px] py-[32px]">
      <h1 className="font-sans text-headline-lg font-bold text-on-surface tracking-tight">
        Team registrations
      </h1>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/admin/teams"
          className={`rounded-full px-4 py-1.5 font-sans text-label-md font-medium transition-colors ${
            !searchParams.status && !searchParams.phase
              ? 'bg-primary-container/20 text-primary-container border border-primary-container/30'
              : 'bg-white/[0.02] text-outline border border-white/10 hover:bg-white/[0.04]'
          }`}
        >
          All
        </Link>
        <Link
          href="/admin/teams?phase=PHASE_1&status=SUBMITTED"
          className={`rounded-full px-4 py-1.5 font-sans text-label-md font-medium transition-colors ${
            searchParams.phase === 'PHASE_1'
              ? 'bg-primary-container/20 text-primary-container border border-primary-container/30'
              : 'bg-white/[0.02] text-outline border border-white/10 hover:bg-white/[0.04]'
          }`}
        >
          Pending Slot Approval
        </Link>
        <Link
          href="/admin/teams?phase=PHASE_2"
          className={`rounded-full px-4 py-1.5 font-sans text-label-md font-medium transition-colors ${
            searchParams.phase === 'PHASE_2' && !searchParams.status
              ? 'bg-primary-container/20 text-primary-container border border-primary-container/30'
              : 'bg-white/[0.02] text-outline border border-white/10 hover:bg-white/[0.04]'
          }`}
        >
          Phase 2
        </Link>
        {['SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED'].map((s) => (
          <Link
            key={s}
            href={`/admin/teams?status=${s}`}
            className={`rounded-full px-4 py-1.5 font-sans text-label-md font-medium transition-colors ${
              searchParams.status === s
                ? 'bg-primary-container/20 text-primary-container border border-primary-container/30'
                : 'bg-white/[0.02] text-outline border border-white/10 hover:bg-white/[0.04]'
            }`}
          >
            {s.replace('_', ' ')}
          </Link>
        ))}
      </div>

      <GlassCard className="mt-6 overflow-hidden p-0">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border">
              <th className="px-6 py-3 font-sans text-label-md font-medium text-outline">Team</th>
              <th className="px-6 py-3 font-sans text-label-md font-medium text-outline">Institution</th>
              <th className="px-6 py-3 font-sans text-label-md font-medium text-outline">Division</th>
              <th className="px-6 py-3 font-sans text-label-md font-medium text-outline">Phase</th>
              <th className="px-6 py-3 font-sans text-label-md font-medium text-outline">Status</th>
              <th className="px-6 py-3 font-sans text-label-md font-medium text-outline"></th>
            </tr>
          </thead>
          <tbody>
            {teams.map((reg) => (
              <tr key={reg.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-sans text-body-md font-medium text-on-surface">{reg.team.name}</p>
                  <p className="font-mono text-label-sm text-outline">{reg.team.contactEmail}</p>
                </td>
                <td className="px-6 py-4 font-sans text-body-md text-on-surface">
                  {reg.team.institutionType?.replace('_', ' ') ?? '—'}
                </td>
                <td className="px-6 py-4 font-sans text-body-md text-on-surface">
                  {reg.division === 'MENS' ? "Men's" : reg.division === 'WOMENS' ? "Women's" : '—'}
                </td>
                <td className="px-6 py-4 font-mono text-label-sm text-outline">
                  {reg.phase === 'PHASE_1' ? 'Tournament Participation' : 'Team Details Submission'}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={reg.status} />
                </td>
                <td className="px-6 py-4 text-right">
                  <Link
                    href={`/admin/teams/${reg.id}`}
                    className="inline-flex items-center gap-1 font-sans text-body-md text-primary-container hover:underline"
                  >
                    Review <ArrowRight size={14} />
                  </Link>
                </td>
              </tr>
            ))}
            {teams.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center font-sans text-body-md text-outline italic">
                  No registrations found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </GlassCard>
    </main>
  );
}