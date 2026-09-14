import Link from 'next/link';
import { redirect } from 'next/navigation';

import {
  getPlayers,
  getOrCreateDraftRegistration,
} from '@/lib/registration/actions';

import { PlayerManager } from '@/components/registration/PlayerManager';

type PlayersPageProps = {
  searchParams: Promise<{
    registrationId?: string;
  }>;
};

export default async function PlayersPage({
  searchParams,
}: PlayersPageProps) {
  const params =
    await searchParams;

  const registrationId =
    params.registrationId;

  /*
   * A specific registration must always be provided.
   * This is critical because one user can manage
   * multiple teams.
   */
  if (!registrationId) {
    redirect('/team/dashboard');
  }

  const registrationIdValue: string =
    registrationId;

  const {
    team,
    registration,
  } =
    await getOrCreateDraftRegistration(
      registrationIdValue
    );

  const editableStatuses = [
    'DRAFT',
    'CHANGES_REQUESTED',
  ];

  const canEdit =
    registration.phase ===
      'PHASE_2' &&
    editableStatuses.includes(
      registration.status
    );

  if (!canEdit) {
    redirect('/team/dashboard');
  }

  const { players } =
    await getPlayers(
      registrationIdValue
    );

  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-background px-margin-mobile py-12 md:px-margin-desktop">
      <div className="w-full max-w-4xl">
        {/* HEADER */}
        <header className="mb-10">
          <p className="mb-2 font-label-sm text-label-sm uppercase tracking-wider text-primary">
            Team Details Submission — Step
            2 of 3
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-display-lg text-display-lg text-on-surface">
                Team Players
              </h1>

              <p className="mt-4 max-w-2xl font-body-md text-body-md text-on-surface-variant">
                Build your tournament squad by
                adding 8 to 10 players. Player
                documents can be uploaded and
                managed directly from each player.
              </p>
            </div>

            <div className="shrink-0 rounded-lg border border-outline-variant/20 bg-white/[0.02] px-4 py-3">
              <p className="font-mono text-[10px] uppercase tracking-wider text-outline">
                Team
              </p>

              <p className="mt-1 max-w-[220px] truncate font-semibold text-on-surface">
                {team.name}
              </p>
            </div>
          </div>
        </header>

        <PlayerManager
          players={players}
          teamId={team.id}
          registrationId={
            registrationIdValue
          }
        />

        {/* NAVIGATION */}
        <div className="mt-12 flex items-center justify-between border-t border-outline-variant/20 pt-8">
          <Link
            href={`/team/register/officials?registrationId=${encodeURIComponent(
              registrationIdValue
            )}`}
            className="btn-ghost rounded-lg px-6 py-3 font-label-md text-label-md font-bold"
          >
            Back
          </Link>

          <Link
            href={`/team/register/review?registrationId=${encodeURIComponent(
              registrationIdValue
            )}`}
            className="btn-primary rounded-lg px-8 py-3 font-label-md text-label-md font-bold"
          >
            Continue to review
          </Link>
        </div>
      </div>
    </main>
  );
}