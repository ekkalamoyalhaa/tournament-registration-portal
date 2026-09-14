import Link from 'next/link';
import { redirect } from 'next/navigation';

import { SignOutButton } from '@/components/auth/SignOutButton';
import { DocumentUploadCard } from '@/components/registration/DocumentUploadCard';

import {
  getOrCreateDraftRegistration,
  saveOfficialsInfo,
} from '@/lib/registration/actions';

type OfficialsPageProps = {
  searchParams: Promise<{
    registrationId?: string;
  }>;
};

export default async function OfficialsPage({
  searchParams,
}: OfficialsPageProps) {
  const params = await searchParams;
  const registrationId = params.registrationId;

  /*
   * Editing an existing team must always specify which
   * registration is being edited.
   */
  if (!registrationId) {
    redirect('/team/dashboard');
  }

  /*
   * Keep a guaranteed string value.
   * This is also safe to capture inside the server action below.
   */
  const registrationIdValue: string = registrationId;

  const { team, registration } =
    await getOrCreateDraftRegistration(
      registrationIdValue
    );

  const editableStatuses = [
    'DRAFT',
    'CHANGES_REQUESTED',
  ];

  const canEdit =
    registration.phase === 'PHASE_2' &&
    editableStatuses.includes(
      registration.status
    );

  if (!canEdit) {
    redirect('/team/dashboard');
  }

  async function handleSubmit(formData: FormData) {
    'use server';

    await saveOfficialsInfo(
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
    <main className="flex min-h-screen w-full flex-col items-center bg-background py-12 px-margin-mobile md:px-margin-desktop">
      <div className="w-full max-w-4xl">

        {/* =================================================
            HEADER
            ================================================= */}

        <header className="mb-12 flex items-start justify-between">
          <div>
            <p className="mb-2 font-label-sm text-label-sm uppercase tracking-wider text-primary">
              Team Details Submission — Step 1 of 3
            </p>

            <h1 className="font-display-lg text-display-lg text-on-surface">
              Managers &amp; Officials
            </h1>

            <p className="mt-4 font-body-md text-body-md text-on-surface-variant">
              Provide details for all team officials.
              Documents are uploaded below.
            </p>
          </div>

          <SignOutButton />
        </header>

        <form
          action={handleSubmit}
          className="space-y-12"
        >

          {/* =================================================
              TEAM MANAGER
              ================================================= */}

          <section className="space-y-6">
            <h2 className="font-headline-md text-headline-md text-on-surface">
              Team Manager
            </h2>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

              <input
                name="managerName"
                placeholder="Full name"
                required
                defaultValue={
                  registration.managerName ?? ''
                }
                className="input-glass w-full rounded-lg px-4 py-3 font-body-md text-body-md text-on-surface placeholder:text-white/40"
              />

              <input
                name="managerEmail"
                type="email"
                placeholder="Email"
                required
                defaultValue={
                  registration.managerEmail ?? ''
                }
                className="input-glass w-full rounded-lg px-4 py-3 font-body-md text-body-md text-on-surface placeholder:text-white/40"
              />

              <input
                name="managerPhone"
                type="tel"
                placeholder="Phone"
                defaultValue={
                  registration.managerPhone ?? ''
                }
                className="input-glass w-full rounded-lg px-4 py-3 font-body-md text-body-md text-on-surface placeholder:text-white/40"
              />

              <input
                name="managerIdNumber"
                placeholder="ID Card / Passport Number"
                defaultValue={
                  registration.managerIdNumber ?? ''
                }
                className="input-glass w-full rounded-lg px-4 py-3 font-body-md text-body-md text-on-surface placeholder:text-white/40"
              />

            </div>

            <div className="mt-4">
              <p className="mb-3 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                Required Documents
              </p>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                <DocumentUploadCard
                  teamId={team.id}
                  registrationId={registrationIdValue}
                  officialRole="manager"
                  documentType="manager_id_doc"
                  label="ID CARD / Passport Copy"
                  icon="id"
                />

                <DocumentUploadCard
                  teamId={team.id}
                  registrationId={registrationIdValue}
                  officialRole="manager"
                  documentType="manager_photo"
                  label="PP Size Photo"
                  icon="photo"
                />

              </div>
            </div>
          </section>

          {/* =================================================
              COACH
              ================================================= */}

          <section className="space-y-6">
            <h2 className="font-headline-md text-headline-md text-on-surface">
              Team Coach
            </h2>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

              <input
                name="coachName"
                placeholder="Full name"
                required
                defaultValue={
                  registration.coachName ?? ''
                }
                className="input-glass w-full rounded-lg px-4 py-3 font-body-md text-body-md text-on-surface placeholder:text-white/40"
              />

              <input
                name="coachEmail"
                type="email"
                placeholder="Email"
                required
                defaultValue={
                  registration.coachEmail ?? ''
                }
                className="input-glass w-full rounded-lg px-4 py-3 font-body-md text-body-md text-on-surface placeholder:text-white/40"
              />

              <input
                name="coachPhone"
                type="tel"
                placeholder="Phone"
                defaultValue={
                  registration.coachPhone ?? ''
                }
                className="input-glass w-full rounded-lg px-4 py-3 font-body-md text-body-md text-on-surface placeholder:text-white/40"
              />

              <input
                name="coachIdNumber"
                placeholder="ID Card / Passport Number"
                defaultValue={
                  registration.coachIdNumber ?? ''
                }
                className="input-glass w-full rounded-lg px-4 py-3 font-body-md text-body-md text-on-surface placeholder:text-white/40"
              />

            </div>

            <div className="mt-4">
              <p className="mb-3 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                Required Documents
              </p>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                <DocumentUploadCard
                  teamId={team.id}
                  registrationId={registrationIdValue}
                  officialRole="coach"
                  documentType="coach_id_doc"
                  label="ID CARD / Passport Copy"
                  icon="id"
                />

                <DocumentUploadCard
                  teamId={team.id}
                  registrationId={registrationIdValue}
                  officialRole="coach"
                  documentType="coach_photo"
                  label="PP Size Photo"
                  icon="photo"
                />

              </div>
            </div>
          </section>

          {/* =================================================
              MEDIC
              ================================================= */}

          <section className="space-y-6">
            <h2 className="font-headline-md text-headline-md text-on-surface">
              Medic (Official)
            </h2>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

              <input
                name="medicName"
                placeholder="Full name"
                required
                defaultValue={
                  registration.medicName ?? ''
                }
                className="input-glass w-full rounded-lg px-4 py-3 font-body-md text-body-md text-on-surface placeholder:text-white/40"
              />

              <input
                name="medicEmail"
                type="email"
                placeholder="Email"
                required
                defaultValue={
                  registration.medicEmail ?? ''
                }
                className="input-glass w-full rounded-lg px-4 py-3 font-body-md text-body-md text-on-surface placeholder:text-white/40"
              />

              <input
                name="medicPhone"
                type="tel"
                placeholder="Phone"
                defaultValue={
                  registration.medicPhone ?? ''
                }
                className="input-glass w-full rounded-lg px-4 py-3 font-body-md text-body-md text-on-surface placeholder:text-white/40"
              />

              <input
                name="medicIdNumber"
                placeholder="ID Card / Passport Number"
                defaultValue={
                  registration.medicIdNumber ?? ''
                }
                className="input-glass w-full rounded-lg px-4 py-3 font-body-md text-body-md text-on-surface placeholder:text-white/40"
              />

            </div>

            <div className="mt-4">
              <p className="mb-3 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                Required Documents
              </p>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                <DocumentUploadCard
                  teamId={team.id}
                  registrationId={registrationIdValue}
                  officialRole="medic"
                  documentType="medic_id_doc"
                  label="ID CARD / Passport Copy"
                  icon="id"
                />

                <DocumentUploadCard
                  teamId={team.id}
                  registrationId={registrationIdValue}
                  officialRole="medic"
                  documentType="medic_photo"
                  label="PP Size Photo"
                  icon="photo"
                />

              </div>
            </div>
          </section>

          {/* =================================================
              OFFICIAL
              ================================================= */}

          <section className="space-y-6">
            <h2 className="font-headline-md text-headline-md text-on-surface">
              Official
            </h2>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

              <input
                name="officialName"
                placeholder="Full name"
                required
                defaultValue={
                  registration.officialName ?? ''
                }
                className="input-glass w-full rounded-lg px-4 py-3 font-body-md text-body-md text-on-surface placeholder:text-white/40"
              />

              <input
                name="officialEmail"
                type="email"
                placeholder="Email"
                required
                defaultValue={
                  registration.officialEmail ?? ''
                }
                className="input-glass w-full rounded-lg px-4 py-3 font-body-md text-body-md text-on-surface placeholder:text-white/40"
              />

              <input
                name="officialPhone"
                type="tel"
                placeholder="Phone"
                defaultValue={
                  registration.officialPhone ?? ''
                }
                className="input-glass w-full rounded-lg px-4 py-3 font-body-md text-body-md text-on-surface placeholder:text-white/40"
              />

              <input
                name="officialIdNumber"
                placeholder="ID Card / Passport Number"
                defaultValue={
                  registration.officialIdNumber ?? ''
                }
                className="input-glass w-full rounded-lg px-4 py-3 font-body-md text-body-md text-on-surface placeholder:text-white/40"
              />

            </div>

            <div className="mt-4">
              <p className="mb-3 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                Required Documents
              </p>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                <DocumentUploadCard
                  teamId={team.id}
                  registrationId={registrationIdValue}
                  officialRole="official"
                  documentType="official_id_doc"
                  label="ID CARD / Passport Copy"
                  icon="id"
                />

                <DocumentUploadCard
                  teamId={team.id}
                  registrationId={registrationIdValue}
                  officialRole="official"
                  documentType="official_photo"
                  label="PP Size Photo"
                  icon="photo"
                />

              </div>
            </div>
          </section>

          {/* =================================================
              ACTIONS
              ================================================= */}

          <div className="mt-12 flex items-center justify-between border-t border-outline-variant/20 pt-8">

            <Link
              href="/team/dashboard"
              className="btn-ghost rounded-lg px-6 py-3 font-label-md text-label-md font-bold"
            >
              Back to dashboard
            </Link>

            <button
              type="submit"
              className="btn-primary rounded-lg px-8 py-3 font-label-md text-label-md font-bold text-on-primary-fixed"
            >
              Continue to players
            </button>

          </div>
        </form>
      </div>
    </main>
  );
}