import { cn } from '@/lib/cn';

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-white/10 text-white/70 border-white/20',
  SUBMITTED: 'bg-primary/20 text-primary border-primary/40',
  UNDER_REVIEW: 'bg-secondary/20 text-secondary border-secondary/40',
  CHANGES_REQUESTED: 'bg-tertiary/20 text-tertiary border-tertiary/40',
  RESUBMITTED: 'bg-secondary/20 text-secondary border-secondary/40',
  APPROVED: 'bg-neutral/20 text-neutral border-neutral/40',
  REJECTED: 'bg-red-500/20 text-red-300 border-red-500/40',
};

// design.md forbids ALL-CAPS labels as a "generic tell" — we keep the enum
// value but render it in sentence case so it reads as a status, not a shout.
export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.DRAFT;
  const label = status.replaceAll('_', ' ').toLowerCase();

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-small font-medium capitalize',
        style
      )}
    >
      {label}
    </span>
  );
}
