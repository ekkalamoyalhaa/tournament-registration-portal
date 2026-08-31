import { StatCard } from '@/components/admin/StatCard';

// PRD §22 admin dashboard summary tiles.
export default function AdminDashboardPage() {
  return (
    <main className="mx-auto max-w-container px-6 py-section">
      <h1 className="text-h1 font-bold">2026 Island Championship</h1>
      <p className="mt-1 text-small text-white/60">Tournament dashboard</p>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <StatCard
          label="Teams"
          total={42}
          breakdown={[
            { label: 'Approved', value: 31, accent: 'neutral' },
            { label: 'Pending', value: 7, accent: 'primary' },
            { label: 'Changes requested', value: 4, accent: 'tertiary' },
          ]}
        />
        <StatCard
          label="Players"
          total={684}
          breakdown={[
            { label: 'Approved', value: 601, accent: 'neutral' },
            { label: 'Pending', value: 43, accent: 'primary' },
            { label: 'Changes requested', value: 40, accent: 'tertiary' },
          ]}
        />
        <StatCard
          label="Documents"
          total={1204}
          breakdown={[
            { label: 'Uploaded', value: 1204, accent: 'neutral' },
            { label: 'Pending review', value: 12, accent: 'primary' },
          ]}
        />
      </div>
    </main>
  );
}
