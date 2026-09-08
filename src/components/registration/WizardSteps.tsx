import { cn } from '@/lib/cn';
import { Check } from 'lucide-react';

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
    <ol className="flex flex-wrap gap-x-3 gap-y-3">
      {STEPS.map((label, i) => {
        const stepNumber = i + 1;
        const isDone = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full border text-label-sm font-mono',
                isCurrent && 'border-primary-container bg-primary-container/20 text-primary-container',
                isDone && 'border-green-500/30 bg-green-500/10 text-green-400',
                !isCurrent && !isDone && 'border-white/10 text-outline'
              )}
            >
              {isDone ? <Check size={14} /> : stepNumber}
            </span>
            <span
              className={cn(
                'text-label-sm font-mono uppercase tracking-wider',
                isCurrent ? 'text-on-surface' : 'text-outline'
              )}
            >
              {label}
            </span>
            {stepNumber < STEPS.length && (
              <span className="text-outline/30 mx-1">/</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}