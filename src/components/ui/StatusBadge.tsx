import { cn } from '@/lib/cn';

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-white/5 text-outline border-white/10',
  SUBMITTED: 'bg-primary-container/10 text-primary-container border-primary-container/20',
  UNDER_REVIEW: 'bg-secondary-container/10 text-secondary border-secondary/20',
  CHANGES_REQUESTED: 'bg-tertiary-container/10 text-tertiary border-tertiary/20',
  RESUBMITTED: 'bg-primary-container/10 text-primary-container border-primary-container/20',
  APPROVED: 'bg-green-500/10 text-green-400 border-green-500/20',
  REJECTED: 'bg-error/10 text-error border-error/20',
};

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.DRAFT;
  const label = status.replaceAll('_', ' ').toLowerCase();
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 font-mono text-label-sm font-medium uppercase tracking-wider',
        style
      )}
    >
      {label}
    </span>
  );
}