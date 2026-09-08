import Link from 'next/link';
import { redirect } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { getAdminStats } from '@/lib/admin/actions';
import { Users, FileText, CheckCircle, AlertTriangle, Clock, XCircle } from 'lucide-react';

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();

  const cards = [
    { label: 'Total teams', value: stats.totalTeams, icon: Users, color: 'text-primary-container' },
    { label: 'Pending review', value: stats.pending, icon: Clock, color: 'text-yellow-400' },
    { label: 'Approved', value: stats.approved, icon: CheckCircle, color: 'text-green-400' },
    { label: 'Changes requested', value: stats.changesRequested, icon: AlertTriangle, color: 'text-tertiary' },
    { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'text-error' },
    { label: 'Total players', value: stats.totalPlayers, icon: Users, color: 'text-secondary-container' },
    { label: 'Documents uploaded', value: stats.totalDocuments, icon: FileText, color: 'text-outline' },
  ];

  return (
    <main className="mx-auto max-w-6xl px-[16px] md:px-[40px] py-[32px]">
      <h1 className="font-sans text-headline-lg font-bold text-on-surface tracking-tight">
        Tournament admin
      </h1>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <GlassCard key={c.label} className="flex items-center gap-4">
            <c.icon size={28} className={c.color} />
            <div>
              <p className="font-sans text-headline-sm font-bold text-on-surface">{c.value}</p>
              <p className="font-sans text-body-md text-outline">{c.label}</p>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="mt-8">
        <Link
          href="/admin/teams"
          className="inline-flex items-center gap-2 rounded-lg border border-primary-container/30 bg-primary-container/10 px-6 py-3 font-sans text-body-md font-medium text-primary-container hover:bg-primary-container/20 transition-colors"
        >
          Review team registrations →
        </Link>
      </div>
    </main>
  );
}