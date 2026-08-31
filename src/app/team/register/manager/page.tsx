import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { WizardSteps } from '@/components/registration/WizardSteps';
import { FormField as Field } from '@/components/ui/FormField';

// PRD §11 — team manager + optional assistant manager.
export default function ManagerInfoPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-section">
      <WizardSteps currentStep={4} />

      <GlassCard className="mt-8">
        <h1 className="text-h1 font-bold">Manager information</h1>
        <p className="mt-2 text-small text-white/60">
          The manager is the main point of contact for this team&apos;s registration.
        </p>

        <form className="mt-8 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <Field label="Full name" name="managerName" required />
            <Field label="Position" name="managerPosition" />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <Field label="Email" name="managerEmail" type="email" required />
            <Field label="Phone" name="managerPhone" type="tel" />
          </div>
          <Field label="Country" name="managerCountry" />

          <div className="border-t border-glass-border pt-6">
            <p className="text-small font-medium text-white/85">Assistant manager (optional)</p>
            <div className="mt-4 grid grid-cols-2 gap-6">
              <Field label="Full name" name="assistantManagerName" />
              <Field label="Email" name="assistantManagerEmail" type="email" />
            </div>
          </div>

          <div className="flex justify-between border-t border-glass-border pt-6">
            <Link href="/team/register">
              <GlassButton type="button" variant="ghost">Back</GlassButton>
            </Link>
            <Link href="/team/register/players">
              <GlassButton type="button">Continue to players</GlassButton>
            </Link>
          </div>
        </form>
      </GlassCard>
    </main>
  );
}
