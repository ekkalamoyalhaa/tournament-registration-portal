import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { WizardSteps } from '@/components/registration/WizardSteps';

// PRD §21 — the frontend summary is a convenience; submitRegistration() in
// modules/registrations/service.ts re-validates completeness server-side
// regardless of what this screen shows.
export default function ReviewStepPage() {
  const checklist = [
    { label: 'Team', detail: 'Complete', done: true },
    { label: 'Manager', detail: 'Complete', done: true },
    { label: 'Players', detail: '18 players', done: true },
    { label: 'Documents', detail: '18 player photos, 18 ID documents', done: true },
  ];
  const readyToSubmit = checklist.every((item) => item.done);

  return (
    <main className="mx-auto max-w-2xl px-6 py-section">
      <WizardSteps currentStep={7} />

      <GlassCard className="mt-8">
        <h1 className="text-h1 font-bold">Registration review</h1>
        <p className="mt-2 text-small text-white/60">
          Check everything below before submitting — you can still edit any section.
        </p>

        <div className="mt-6 divide-y divide-glass-border">
          {checklist.map((item) => (
            <div key={item.label} className="flex items-center justify-between py-4">
              <span className="font-medium">{item.label}</span>
              <span className={item.done ? 'text-neutral' : 'text-tertiary'}>
                {item.done ? '✓ ' : '! '}
                {item.detail}
              </span>
            </div>
          ))}
        </div>

        <div
          className={`mt-6 rounded-control border px-4 py-3 text-center text-small font-medium ${
            readyToSubmit
              ? 'border-neutral/40 bg-neutral/10 text-neutral'
              : 'border-tertiary/40 bg-tertiary/10 text-tertiary'
          }`}
        >
          {readyToSubmit ? 'Ready to submit' : 'Some sections still need attention'}
        </div>

        <div className="mt-8 flex justify-between border-t border-glass-border pt-6">
          <Link href="/team/register/documents">
            <GlassButton type="button" variant="ghost">Back</GlassButton>
          </Link>
          <div className="flex gap-3">
            <GlassButton type="button" variant="ghost">Save draft</GlassButton>
            <GlassButton type="submit" disabled={!readyToSubmit}>
              Submit registration
            </GlassButton>
          </div>
        </div>
      </GlassCard>
    </main>
  );
}
