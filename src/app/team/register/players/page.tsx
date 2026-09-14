import Link from 'next/link';
import { redirect } from 'next/navigation';

import {
  getPlayers,
  getOrCreateDraftRegistration,
} from '@/lib/registration/actions';

type PlayersPageProps = {
  searchParams: Promise<{
    registrationId?: string;
  }>;
};

export default async function PlayersPage({
  searchParams,
}: PlayersPageProps) {
  const params = await searchParams;
  const registrationId = params.registrationId;

  /*
   * A specific registration must always be provided.
   * Never fall back to another team when the user has
   * multiple registrations.
   */
  if (!registrationId) {
    redirect('/team/dashboard');
  }

  /*
   * Explicitly create a guaranteed string value.
   * This can safely be passed to server actions and
   * nested components.
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

  /*
   * Load players for this exact registration.
   */
  const { players } = await getPlayers(
    registrationIdValue
  );

  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-background py-12 px-margin-mobile md:px-margin-desktop">
      <div className="w-full max-w-4xl">

        {/* =================================================
            HEADER
            ================================================= */}

        <header className="mb-12">
          <p className="mb-2 font-label-sm uppercase tracking-wider text-primary">
            Team Details Submission — Step 2 of 3
          </p>

          <h1 className="font-display-lg text-display-lg text-on-surface">
            Team Players
          </h1>

          <p className="mt-4 font-body-md text-on-surface-variant">
            Add between 8 and 10 players.
          </p>
        </header>

        {/* =================================================
            PLAYER FORM / LIST
            =================================================

            Keep your existing player form/list here.

            IMPORTANT:
            Any server action used by this section must
            receive registrationIdValue.

            Examples:

            addPlayer(formData, registrationIdValue)

            removePlayer(playerId, registrationIdValue)

            saveDocumentRecord(data, registrationIdValue)

            ================================================= */}

        <div className="mt-12 flex items-center justify-between border-t border-outline-variant/20 pt-8">

          {/* =================================================
              BACK TO OFFICIALS
              ================================================= */}

          <Link
            href={`/team/register/officials?registrationId=${encodeURIComponent(
              registrationIdValue
            )}`}
            className="btn-ghost rounded-lg px-6 py-3 font-label-md font-bold"
          >
            Back
          </Link>

          {/* =================================================
              CONTINUE TO REVIEW
              ================================================= */}

          <Link
            href={`/team/register/review?registrationId=${encodeURIComponent(
              registrationIdValue
            )}`}
            className="btn-primary rounded-lg px-8 py-3 font-label-md font-bold"
          >
            Continue to review
          </Link>

        </div>
      </div>
    </main>
  );
}