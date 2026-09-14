import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Plus,
  AlertTriangle,
  CheckCircle,
  Pencil,
} from 'lucide-react';

import { SignOutButton } from '@/components/auth/SignOutButton';

import {
  getTeamDashboardData,
  startNewTeamRegistration,
} from '@/lib/registration/actions';

export default async function TeamDashboardPage() {
  const teams = await getTeamDashboardData();

  if (teams.length === 0) {
    redirect('/team/register');
  }

  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#00dbe915] via-background to-background opacity-50" />

      <main className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-4 pb-8 pt-20 md:px-10">
        <div className="mb-12 flex w-full items-center justify-between">
          <h1 className="font-sans text-5xl font-bold tracking-tight text-primary">
            Dashboard
          </h1>

          <SignOutButton />
        </div>

        <div className="flex w-full flex-col gap-6">
          {/* Register another team */}
          <form
            action={startNewTeamRegistration}
            className="self-start"
          >
            <button
              type="submit"
              className="flex flex-col items-start gap-1 rounded-xl bg-primary-container px-6 py-4 text-on-primary-container shadow-[0_0_20px_rgba(0,240,255,0.2)] transition-all duration-300 hover:bg-primary"
            >
              <Plus size={20} />

              <span className="font-sans text-body-md font-medium">
                Register another team
              </span>
            </button>
          </form>

          {teams.map(({ team, registration }) => {
            const players = team.players ?? [];
            const latestEvent = registration?.events?.[0];

            const isPhase1Draft =
              registration?.phase === 'PHASE_1' &&
              registration?.status === 'DRAFT';

            const isPhase1Submitted =
              registration?.phase === 'PHASE_1' &&
              registration?.status === 'SUBMITTED';

            const isSlotApproved =
              registration?.phase === 'PHASE_2';

            const isPhase2Draft =
              isSlotApproved &&
              registration?.status === 'DRAFT';

            const isPhase2Submitted =
              isSlotApproved &&
              registration?.status != null &&
              [
                'SUBMITTED',
                'UNDER_REVIEW',
                'RESUBMITTED',
              ].includes(registration.status);

            const isApproved =
              registration?.status === 'APPROVED';

            const isRejected =
              registration?.status === 'REJECTED';

            const isChangesRequested =
              registration?.status === 'CHANGES_REQUESTED';

            /*
             * CHANGES_REQUESTED is intentionally NOT included here.
             *
             * A changes-requested registration must remain editable.
             */
            const isSubmitted =
              registration?.status === 'SUBMITTED' ||
              isPhase2Submitted ||
              isApproved ||
              isRejected;

            return (
              <div
                key={team.id}
                className={`relative flex flex-col gap-6 overflow-hidden rounded-xl p-6 ${
                  isSubmitted
                    ? 'border border-primary-container/30 bg-white/[0.03] backdrop-blur-3xl'
                    : 'border border-white/10 bg-white/[0.03] backdrop-blur-3xl'
                }`}
              >
                <div
                  className={`absolute left-0 right-0 top-0 h-[1px] bg-gradient-to-r from-transparent ${
                    isSubmitted
                      ? 'via-primary-container/50'
                      : 'via-white/20'
                  } to-transparent`}
                />

                {/* Team header */}
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-2">
                    <h2 className="font-sans text-2xl font-semibold text-on-surface">
                      {team.name === 'Draft Team'
                        ? 'Untitled team'
                        : team.name}
                    </h2>

                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-xs uppercase ${
                          isSubmitted
                            ? 'border-primary-container/20 bg-black/20 text-primary-container'
                            : 'border-white/5 bg-black/20 text-on-surface-variant'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isSubmitted
                              ? 'bg-primary-container shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                              : 'bg-outline-variant'
                          }`}
                        />

                        {registration?.status ?? 'DRAFT'}
                      </span>

                      <span className="font-mono text-xs text-outline">
                        {registration?.phase === 'PHASE_1'
                          ? 'Tournament Participation'
                          : 'Team Details Submission'}

                        {registration?.division &&
                          ` · ${
                            registration.division === 'MENS'
                              ? "Men's"
                              : "Women's"
                          }`}
                      </span>
                    </div>

                    {team.institutionType && (
                      <div className="mt-2 flex items-center gap-4">
                        <span className="font-mono text-xs uppercase tracking-wider text-outline">
                          {team.institutionType.replace(/_/g, ' ')}
                        </span>

                        {registration?.division && (
                          <span className="font-mono text-xs uppercase tracking-wider text-outline">
                            {registration.division === 'MENS'
                              ? "Men's Division"
                              : "Women's Division"}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="font-mono text-xs uppercase tracking-wider text-outline">
                      Players
                    </span>

                    <span className="font-sans text-2xl font-semibold text-on-surface">
                      {players.length}
                    </span>
                  </div>
                </div>

                {/* Latest admin/event message */}
                {latestEvent?.note && (
                  <div className="rounded-lg border border-white/5 bg-black/20 p-4 font-sans text-body-md text-on-surface">
                    {latestEvent.note}
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  {/* PHASE 1 DRAFT */}
                  {isPhase1Draft && (
                    <Link
                      href={`/team/register?registrationId=${encodeURIComponent(
                        registration.id
                      )}`}
                      className="w-full rounded-lg bg-primary-container py-3 text-center font-sans text-body-md font-semibold text-on-primary-container shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-colors hover:bg-primary"
                    >
                      Complete Tournament Participation
                    </Link>
                  )}

                  {/* PHASE 1 SUBMITTED */}
                  {isPhase1Submitted && (
                    <div className="relative flex items-center justify-center overflow-hidden rounded-lg border border-primary-container/30 bg-primary-container/10 p-4">
                      <div className="absolute inset-0 animate-pulse bg-primary-container/5" />

                      <span className="relative z-10 font-sans text-body-md font-medium text-primary-container drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">
                        Pending verification.
                      </span>
                    </div>
                  )}

                  {/* PHASE 2 DRAFT */}
                  {isSlotApproved && isPhase2Draft && (
                    <>
                      <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-center font-sans text-body-md text-green-400">
                        <CheckCircle
                          size={14}
                          className="mr-1 inline"
                        />
                        Slot approved!
                      </div>

                      <Link
                        href={`/team/register/officials?registrationId=${encodeURIComponent(
                          registration.id
                        )}`}
                        className="w-full rounded-lg bg-primary-container py-3 text-center font-sans text-body-md font-semibold text-on-primary-container shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-colors hover:bg-primary"
                      >
                        Continue Team Details Submission
                      </Link>
                    </>
                  )}

                  {/* PHASE 2 SUBMITTED / UNDER REVIEW / RESUBMITTED */}
                  {isPhase2Submitted && (
                    <div className="relative flex items-center justify-center overflow-hidden rounded-lg border border-primary-container/30 bg-primary-container/10 p-4">
                      <div className="absolute inset-0 animate-pulse bg-primary-container/5" />

                      <span className="relative z-10 font-sans text-body-md font-medium text-primary-container">
                        Full registration under review.
                      </span>
                    </div>
                  )}

                  {/* APPROVED */}
                  {isApproved && (
                    <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-center font-sans text-body-md text-green-400">
                      Fully approved for the tournament.
                    </div>
                  )}

                  {/* REJECTED */}
                  {isRejected && (
                    <div className="rounded-lg border border-error/30 bg-error/10 p-3 text-center font-sans text-body-md text-error">
                      Rejected. Contact the tournament organizer.
                    </div>
                  )}

                  {/* CHANGES REQUESTED */}
                  {isChangesRequested && (
                    <div className="flex flex-col gap-3">
                      <div className="rounded-lg border border-tertiary/30 bg-tertiary/10 p-4">
                        <div className="flex items-start gap-3">
                          <AlertTriangle
                            size={18}
                            className="mt-0.5 shrink-0 text-tertiary"
                          />

                          <div className="flex flex-col gap-1">
                            <span className="font-sans font-semibold text-tertiary">
                              Changes requested
                            </span>

                            <span className="font-sans text-sm text-on-surface">
                              The tournament administrator has
                              requested changes to your registration.
                            </span>

                            <span className="font-sans text-sm text-on-surface-variant">
                              Edit your submission and resubmit it for review.
                            </span>
                          </div>
                        </div>
                      </div>

                      <Link
                        href={`/team/register/officials?registrationId=${encodeURIComponent(
                          registration.id
                        )}`}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-container py-3 text-center font-sans text-body-md font-semibold text-on-primary-container shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-colors hover:bg-primary"
                      >
                        <Pencil size={17} />
                        Edit Submission
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}