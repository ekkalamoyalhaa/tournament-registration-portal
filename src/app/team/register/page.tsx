import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SignOutButton } from '@/components/auth/SignOutButton';
import {
  getOrCreateDraftRegistration,
  saveAndSubmitPhase1,
} from '@/lib/registration/actions';

type TeamRegistrationPageProps = {
  searchParams: Promise<{
    registrationId?: string;
  }>;
};

export default async function TeamRegistrationPage({
  searchParams,
}: TeamRegistrationPageProps) {
  const params = await searchParams;
  const registrationId = params.registrationId;

  const { team, registration } =
    await getOrCreateDraftRegistration(registrationId);

  if (registration.phase !== 'PHASE_1') {
    redirect('/team/dashboard');
  }

  async function handleSubmit(formData: FormData) {
    'use server';

    const result = await saveAndSubmitPhase1(
      formData,
      registration.id
    );

    if (result.error) {
      redirect(
        `/team/register?registrationId=${encodeURIComponent(
          registration.id
        )}&error=${encodeURIComponent(result.error)}`
      );
    }

    redirect('/team/dashboard');
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center p-margin-mobile py-stack-lg md:p-margin-desktop">
      <div className="mx-auto w-full max-w-4xl">
        {/* Sign out */}
        <div className="mb-stack-lg flex justify-end">
          <SignOutButton />
        </div>

        {/* Page Header */}
        <div className="mb-stack-lg">
          <p className="mb-2 font-display text-label-md uppercase text-gold">
            Tournament Participation
          </p>

          <h2 className="mb-stack-sm font-display text-display-lg text-white">
            Team information
          </h2>

          <p className="max-w-2xl font-sans text-body-lg text-on-surface-variant">
            Submit your team details for slot approval. You cannot add
            players until your slot is approved.
          </p>
        </div>

        {/* Registration Form Card */}
        <div className="glass-card relative overflow-hidden rounded-xl p-container-padding">
          {/* Subtle top glow */}
          <div className="absolute left-0 right-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

          <form action={handleSubmit} className="space-y-stack-lg">
            {/* Team Name */}
            <div className="space-y-2">
              <label className="block font-display text-label-md text-on-surface">
                Club or team name <span className="text-gold">*</span>
              </label>

              <input
                name="name"
                required
                defaultValue={
                  team.name === 'Draft Team' ? '' : team.name ?? ''
                }
                placeholder="Enter team name"
                className="glass-input w-full rounded-lg px-4 py-3 font-sans text-body-md text-on-surface placeholder:text-sand/40"
              />
            </div>

            {/* Institution & Division Row */}
            <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
              <div className="space-y-2">
                <label className="block font-display text-label-md text-on-surface">
                  Institution type <span className="text-gold">*</span>
                </label>

                <div className="relative">
                  <select
                    name="institutionType"
                    required
                    defaultValue={team.institutionType ?? ''}
                    className="glass-input w-full appearance-none rounded-lg px-4 py-3 pr-10 font-sans text-body-md text-on-surface"
                  >
                    <option value="" disabled>
                      Select institution type
                    </option>

                    <option value="UNIVERSITY">
                      University
                    </option>

                    <option value="COLLEGE">
                      College
                    </option>

                    <option value="HIGHER_EDUCATION_INSTITUTE">
                      Higher Education Institute
                    </option>
                  </select>

                  <svg
                    className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gold"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block font-display text-label-md text-on-surface">
                  Division <span className="text-gold">*</span>
                </label>

                <div className="relative">
                  <select
                    name="division"
                    required
                    defaultValue={registration.division ?? ''}
                    className="glass-input w-full appearance-none rounded-lg px-4 py-3 pr-10 font-sans text-body-md text-on-surface"
                  >
                    <option value="" disabled>
                      Select division
                    </option>

                    <option value="MENS">
                      Men&apos;s Division
                    </option>

                    <option value="WOMENS">
                      Women&apos;s Division
                    </option>
                  </select>

                  <svg
                    className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gold"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Contact Row */}
            <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
              <div className="space-y-2">
                <label className="block font-display text-label-md text-on-surface">
                  Contact email <span className="text-gold">*</span>
                </label>

                <input
                  name="contactEmail"
                  type="email"
                  required
                  defaultValue={team.contactEmail ?? ''}
                  className="glass-input w-full rounded-lg px-4 py-3 font-sans text-body-md text-on-surface placeholder:text-sand/40"
                />
              </div>

              <div className="space-y-2">
                <label className="block font-display text-label-md text-on-surface">
                  Contact phone
                </label>

                <input
                  name="contactPhone"
                  type="tel"
                  defaultValue={team.contactPhone ?? ''}
                  className="glass-input w-full rounded-lg px-4 py-3 font-sans text-body-md text-on-surface placeholder:text-sand/40"
                />
              </div>
            </div>

            {/* Divider */}
            <div className="h-px w-full bg-gold/10" />

            {/* Single action */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                className="btn-primary rounded-lg px-8 py-3 font-display text-label-md font-bold transition-all duration-300 hover:-translate-y-0.5"
              >
                Submit for slot approval
              </button>
            </div>
          </form>
        </div>

        {/* Back to dashboard */}
        <div className="mt-6 text-center">
          <Link
            href="/team/dashboard"
            className="font-sans text-body-md text-gold hover:text-primary"
          >
            ← Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}