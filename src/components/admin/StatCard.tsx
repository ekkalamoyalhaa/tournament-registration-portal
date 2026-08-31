import { GlassCard } from '@/components/ui/GlassCard';

export function StatCard({
  label,
  total,
  breakdown,
}: {
  label: string;
  total: number;
  breakdown: { label: string; value: number; accent?: 'primary' | 'secondary' | 'tertiary' | 'neutral' }[];
}) {
  return (
    <GlassCard>
      <p className="text-small text-white/60">{label}</p>
      <p className="mt-1 text-hero font-bold leading-none">{total}</p>
      <dl className="mt-6 space-y-2">
        {breakdown.map((item) => (
          <div key={item.label} className="flex items-center justify-between text-small">
            <dt className="text-white/70">{item.label}</dt>
            <dd className={`font-semibold text-${item.accent ?? 'neutral'}`}>{item.value}</dd>
          </div>
        ))}
      </dl>
    </GlassCard>
  );
}
