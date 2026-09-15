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
    error?: string;
  }>;
};

export default async function TeamRegistrationPage({
  searchParams,
}: TeamRegistrationPageProps) {
  const params = await searchParams;

  const registrationId = params.registrationId;
  const error = params.error;

  const { team, registration } =
    await getOrCreateDraftRegistration(registrationId);

  /*
   * Phase 2 registrations belong to the other registration
   * screens. Do not allow this Phase 1 page to render for them.
   */
  if (registration.phase !== 'PHASE_1') {
    redirect(
      `/team/dashboard?registrationId=${encodeURIComponent(
        registration.id
      )}`
    );
  }

  /*
   * Only DRAFT and CHANGES_REQUESTED registrations may be
   * edited from the team side.
   *
   * SUBMITTED / UNDER_REVIEW / RESUBMITTED / APPROVED / REJECTED
   * must never render an editable form.
   */
  const isEditable =
    registration.status === 'DRAFT' ||
    registration.status === 'CHANGES_REQUESTED';

  /*
   * Pending Phase 1 statuses.
   */
  const isPending =
    registration.status === 'SUBMITTED' ||
    registration.status === 'UNDER_REVIEW' ||
    registration.status === 'RESUBMITTED';

  const isApproved =
    registration.status === 'APPROVED';

  const isRejected =
    registration.status === 'REJECTED';

  /*
   * CHANGES_REQUESTED is the only non-DRAFT state that is
   * intentionally editable.
   */
  if (!isEditable) {
    return (
      <main className="flex min-h-screen w-full flex-col items-center justify-center p-margin-mobile py-stack-lg md:p-margin-desktop">
        <div className="mx-auto w-full max-w-4xl">
          <div className="mb-stack-lg flex justify-end">
            <SignOutButton />
          </div>

          <div className="mb-stack-lg">
            <p className="mb-2 font-display text-label-md uppercase text-gold">
              Tournament Participation
            </p>

            <h2 className="mb-stack-sm font-display text-display-lg text-white">
              {isPending
                ? 'Submission under review'
                : isApproved
                  ? 'Slot approved'
                  : isRejected
                    ? 'Registration rejected'
                    : 'Registration status'}
            </h2>

            <p className="max-w-2xl font-sans text-body-lg text-on-surface-variant">
              {isPending
                ? 'Your Tournament Participation Form has already been submitted. You cannot make changes while it is under review.'
                : isApproved
                  ? 'Your team has been approved for the tournament. Continue from the team dashboard.'
                  : isRejected
                    ? 'This registration has been rejected. Please contact the tournament organizer for further information.'
                    : 'This registration is not currently available for editing.'}
            </p>
          </div>

          <div className="glass-card relative overflow-hidden rounded-xl p-container-padding">
            <div className="absolute left-0 right-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

            {isPending && (
              <div className="relative overflow-hidden rounded-lg border border-primary-container/30 bg-primary-container/10 p-6 text-center">
                <div className="absolute inset-0 animate-pulse bg-primary-container/5" />

                <div className="relative z-10">
                  <div className="mb-2 font-display text-label-md uppercase tracking-wider text-primary-container">
                    {registration.status.replace(/_/g, ' ')}
                  </div>

                  <p className="font-sans text-body-md text-on-surface-variant">
                    Your submission is waiting for tournament administrator
                    review.
                  </p>
                </div>
              </div>
            )}

            {isApproved && (
              <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-6 text-center">
                <p className="font-display text-label-md uppercase tracking-wider text-green-400">
                  Slot approved
                </p>

                <p className="mt-2 font-sans text-body-md text-on-surface-variant">
                  Your team can continue with the remaining registration
                  requirements from the dashboard.
                </p>
              </div>
            )}

            {isRejected && (
              <div className="rounded-lg border border-error/30 bg-error/10 p-6 text-center">
                <p className="font-display text-label-md uppercase tracking-wider text-error">
                  Registration rejected
                </p>

                <p className="mt-2 font-sans text-body-md text-on-surface-variant">
                  Please contact the tournament organizer if you need
                  clarification.
                </p>
              </div>
            )}

            {!isPending && !isApproved && !isRejected && (
              <div className="rounded-lg border border-white/10 bg-black/20 p-6 text-center">
                <p className="font-sans text-body-md text-on-surface-variant">
                  This registration cannot currently be edited.
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 text-center">
            <Link
              href={`/team/dashboard?registrationId=${encodeURIComponent(
                registration.id
              )}`}
              className="font-sans text-body-md text-gold hover:text-primary"
            >
              ← Back to dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  /*
   * Phase 1 submission.
   *
   * The exact registration ID is always passed through.
   * This is important because one user can manage multiple teams.
   */
  async function handleSubmit(formData: FormData) {
    'use server';

    const result = await saveAndSubmitPhase1(
      formData,
      registration.id
    );

    /*
     * Server-side validation failed.
     * Return to the exact registration rather than relying
     * on the dashboard to determine which team is active.
     */
    if (result.error) {
      redirect(
        `/team/register?registrationId=${encodeURIComponent(
          registration.id
        )}&error=${encodeURIComponent(result.error)}`
      );
    }

    /*
     * Submission succeeded.
     *
     * IMPORTANT:
     * Preserve the exact registrationId when going to the
     * dashboard so the correct team is displayed.
     */
    redirect(
      `/team/dashboard?registrationId=${encodeURIComponent(
        registration.id
      )}`
    );
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

        {/* Server-side validation error */}
        {error && (
          <div className="mb-6 rounded-lg border border-error/30 bg-error/10 p-4">
            <p className="font-sans text-body-md text-error">
              {error}
            </p>
          </div>
        )}

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
                  team.name === 'Draft Team'
                    ? ''
                    : team.name ?? ''
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
                    defaultValue={
                      team.institutionType ?? ''
                    }
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
                    defaultValue={
                      registration.division ?? ''
                    }
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
                  defaultValue={
                    team.contactEmail ?? ''
                  }
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
                  defaultValue={
                    team.contactPhone ?? ''
                  }
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
                {registration.status === 'CHANGES_REQUESTED'
                  ? 'Resubmit for approval'
                  : 'Submit for slot approval'}
              </button>
            </div>
          </form>
        </div>

        {/* Back to dashboard */}
        <div className="mt-6 text-center">
          <Link
            href={`/team/dashboard?registrationId=${encodeURIComponent(
              registration.id
            )}`}
            className="font-sans text-body-md text-gold hover:text-primary"
          >
            ← Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}