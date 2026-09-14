import Link from 'next/link';
import { redirect } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { WizardSteps } from '@/components/registration/WizardSteps';
import { FormField } from '@/components/ui/FormField';
import {
  getOrCreateDraftRegistration,
  saveManagerInfo,
} from '@/lib/registration/actions';

type ManagerInfoPageProps = {
  searchParams: Promise<{
    registrationId?: string;
  }>;
};

export default async function ManagerInfoPage({
  searchParams,
}: ManagerInfoPageProps) {
  const params = await searchParams;
  const registrationId = params.registrationId;

  if (!registrationId) {
    redirect('/team/dashboard');
  }

  // After the redirect guard, explicitly create a string
  // so TypeScript can safely use it inside the server action.
  const registrationIdValue: string = registrationId;

  const { registration } =
    await getOrCreateDraftRegistration(registrationIdValue);

  async function handleSubmit(formData: FormData) {
    'use server';

    await saveManagerInfo(
      formData,
      registrationIdValue
    );

    redirect(
      `/team/register/players?registrationId=${encodeURIComponent(
        registrationIdValue
      )}`
    );
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
            <FormField
              label="Full name"
              name="managerName"
              required
              defaultValue={registration.managerName ?? ''}
            />

            <FormField
              label="Position"
              name="managerPosition"
              defaultValue={registration.managerPosition ?? ''}
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <FormField
              label="Email"
              name="managerEmail"
              type="email"
              required
              defaultValue={registration.managerEmail ?? ''}
            />

            <FormField
              label="Phone"
              name="managerPhone"
              type="tel"
              defaultValue={registration.managerPhone ?? ''}
            />
          </div>

          <FormField
            label="Country"
            name="managerCountry"
            defaultValue={registration.managerCountry ?? ''}
          />

          <div className="border-t border-white/10 pt-6">
            <p className="font-sans text-body-md font-medium text-on-surface">
              Assistant manager (optional)
            </p>

            <div className="mt-4 grid grid-cols-2 gap-6">
              <FormField
                label="Full name"
                name="assistantManagerName"
                defaultValue={
                  registration.assistantManagerName ?? ''
                }
              />
            </div>
          </div>

          <div className="flex justify-between border-t border-white/10 pt-6">
            <Link
              href={`/team/register?registrationId=${encodeURIComponent(
                registrationIdValue
              )}`}
            >
              <GlassButton type="button" variant="ghost">
                Back
              </GlassButton>
            </Link>

            <GlassButton type="submit">
              Continue to players
            </GlassButton>
          </div>
        </form>
      </GlassCard>
    </main>
  );
}