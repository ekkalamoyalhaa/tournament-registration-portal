import { cn } from '@/lib/cn';

// PRD §7 wizard: Account -> Verify -> Team -> Manager -> Players -> Documents
// -> Review -> Submit. This IS a real sequence, so numbered steps are
// appropriate here (unlike decorative 01/02/03 markers elsewhere).
const STEPS = [
  'Account',
  'Verify email',
  'Team',
  'Manager',
  'Players',
  'Documents',
  'Review',
] as const;

export function WizardSteps({ currentStep }: { currentStep: number }) {
  return (
    <ol className="flex flex-wrap gap-x-2 gap-y-3">
      {STEPS.map((label, i) => {
        const stepNumber = i + 1;
        const isDone = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full border text-small',
                isCurrent && 'border-primary bg-primary text-white',
                isDone && 'border-neutral bg-neutral/20 text-neutral',
                !isCurrent && !isDone && 'border-glass-border text-white/50'
              )}
            >
              {isDone ? '✓' : stepNumber}
            </span>
            <span className={cn('text-small', isCurrent ? 'text-white' : 'text-white/50')}>
              {label}
            </span>
            {stepNumber < STEPS.length && <span className="text-white/20">/</span>}
          </li>
        );
      })}
    </ol>
  );
}
