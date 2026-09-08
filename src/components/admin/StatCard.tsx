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
  const accentMap: Record<string, string> = {
    primary: 'text-primary-container',
    secondary: 'text-secondary',
    tertiary: 'text-tertiary',
    neutral: 'text-on-surface-variant',
  };

  return (
    <GlassCard>
      <p className="font-mono text-label-sm uppercase tracking-widest text-on-surface-variant">{label}</p>
      <p className="mt-2 text-display-lg font-bold leading-none text-primary-container">{total}</p>
      <dl className="mt-6 space-y-2">
        {breakdown.map((item) => (
          <div key={item.label} className="flex items-center justify-between text-body-md">
            <dt className="text-on-surface-variant">{item.label}</dt>
            <dd className={`font-mono text-label-md font-medium ${accentMap[item.accent ?? 'neutral']}`}>{item.value}</dd>
          </div>
        ))}
      </dl>
    </GlassCard>
  );
}