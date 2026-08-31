import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { WizardSteps } from '@/components/registration/WizardSteps';
import { FormField as Field } from '@/components/ui/FormField';

// Step 3 of the wizard (Team information, PRD §9) shown as the representative
// screen. Steps 1-2 (account/verify) and 4-7 follow the same shell.
export default function TeamRegistrationPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-section">
      <WizardSteps currentStep={3} />

      <GlassCard className="mt-8">
        <h1 className="text-h1 font-bold">Team information</h1>
        <p className="mt-2 text-small text-white/60">
          You can save this as a draft and come back before the registration deadline.
        </p>

        <form className="mt-8 space-y-6">
          <Field label="Club or team name" name="name" required />
          <Field label="Short name" name="shortName" hint="Shown on fixtures and standings" />
          <div className="grid grid-cols-2 gap-6">
            <Field label="Country" name="country" required />
            <Field label="City" name="city" />
          </div>
          <Field label="Contact email" name="contactEmail" type="email" required />
          <Field label="Contact phone" name="contactPhone" type="tel" />

          <div className="flex justify-between border-t border-glass-border pt-6">
            <GlassButton type="button" variant="ghost">Save draft</GlassButton>
            <Link href="/team/register/manager">
              <GlassButton type="button">Continue to manager</GlassButton>
            </Link>
          </div>
        </form>
      </GlassCard>
    </main>
  );
}
