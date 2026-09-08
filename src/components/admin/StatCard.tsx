import { cn } from '@/lib/cn';

export function StatCard({
  label,
  total,
  breakdown,
  className,
}: {
  label: string;
  total: number;
  breakdown: { label: string; value: number; highlight?: boolean }[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        'glass-panel flex h-full flex-col justify-between rounded-xl p-6 transition-transform duration-300 hover:-translate-y-1',
        className
      )}
    >
      <h3 className="font-mono text-label-md uppercase tracking-wider text-outline">{label}</h3>
      <p className="my-8 text-[64px] font-display font-bold leading-none tracking-tighter text-primary-container">
        {total}
      </p>
      <dl className="flex flex-col gap-3 border-t border-primary-container/15 pt-4">
        {breakdown.map((item) => (
          <div key={item.label} className="flex items-center justify-between font-mono text-label-sm">
            <dt className="text-outline">{item.label}</dt>
            <dd
              className={
                item.highlight
                  ? 'font-bold text-primary-container drop-shadow-[0_0_8px_rgba(217,160,67,0.35)]'
                  : 'text-white'
              }
            >
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}