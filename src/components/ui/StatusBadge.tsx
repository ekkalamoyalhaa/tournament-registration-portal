import { cn } from '@/lib/cn';

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-white/5 text-outline border-white/10',
  SUBMITTED: 'bg-gold/15 text-primary border-gold/30',
  UNDER_REVIEW: 'bg-secondary-container/50 text-secondary border-secondary/25',
  CHANGES_REQUESTED: 'bg-tertiary-container/15 text-tertiary border-tertiary/30',
  RESUBMITTED: 'bg-gold/15 text-primary border-gold/30',
  APPROVED: 'bg-secondary/10 text-secondary border-secondary/30',
  REJECTED: 'bg-error/10 text-error border-error/25',
};

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.DRAFT;
  const label = status.replaceAll('_', ' ').toLowerCase();
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 font-display text-label-sm uppercase',
        style
      )}
    >
      {label}
    </span>
  );
}