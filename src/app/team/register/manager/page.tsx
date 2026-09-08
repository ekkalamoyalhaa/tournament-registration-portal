import Link from 'next/link';
import { redirect } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { WizardSteps } from '@/components/registration/WizardSteps';
import { FormField } from '@/components/ui/FormField';
import { getOrCreateDraftRegistration, saveManagerInfo } from '@/lib/registration/actions';

export default async function ManagerInfoPage() {
  const { registration } = await getOrCreateDraftRegistration();

  async function handleSubmit(formData: FormData) {
    'use server';
    await saveManagerInfo(formData);
    redirect('/team/register/players');
  }

  return (
    <main className="mx-auto max-w-2xl px-[16px] md:px-[40px] py-[32px]">
      <WizardSteps currentStep={4} />

      <GlassCard className="mt-8">
        <h1 className="font-sans text-headline-lg font-bold text-on-surface tracking-tight">
          Manager information
        </h1>
        <p className="mt-2 font-sans text-body-md text-outline">
          The manager is the main point of contact for this team&apos;s registration.
        </p>

        <form action={handleSubmit} className="mt-8 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <FormField label="Full name" name="managerName" required defaultValue={registration.managerName ?? ''} />
            <FormField label="Position" name="managerPosition" defaultValue={registration.managerPosition ?? ''} />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <FormField label="Email" name="managerEmail" type="email" required defaultValue={registration.managerEmail ?? ''} />
            <FormField label="Phone" name="managerPhone" type="tel" defaultValue={registration.managerPhone ?? ''} />
          </div>
          <FormField label="Country" name="managerCountry" defaultValue={registration.managerCountry ?? ''} />

          <div className="border-t border-white/10 pt-6">
            <p className="font-sans text-body-md font-medium text-on-surface">Assistant manager (optional)</p>
            <div className="mt-4 grid grid-cols-2 gap-6">
              <FormField label="Full name" name="assistantManagerName" defaultValue={registration.assistantManagerName ?? ''} />
            </div>
          </div>

          <div className="flex justify-between border-t border-white/10 pt-6">
            <Link href="/team/register">
              <GlassButton type="button" variant="ghost">Back</GlassButton>
            </Link>
            <GlassButton type="submit">Continue to players</GlassButton>
          </div>
        </form>
      </GlassCard>
    </main>
  );
}