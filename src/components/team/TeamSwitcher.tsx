'use client';

import { useRouter } from 'next/navigation';
import { ChevronDown, Plus, CheckCircle2, Clock3, AlertTriangle } from 'lucide-react';

type TeamOption = {
  registrationId: string;
  teamId: string;
  teamName: string;
  status: string;
  phase: string;
};

type TeamSwitcherProps = {
  teams: TeamOption[];
  activeRegistrationId: string;
};

function getStatusLabel(status: string) {
  switch (status) {
    case 'DRAFT':
      return 'Draft';
    case 'SUBMITTED':
      return 'Submitted';
    case 'UNDER_REVIEW':
      return 'Under Review';
    case 'RESUBMITTED':
      return 'Resubmitted';
    case 'CHANGES_REQUESTED':
      return 'Changes Requested';
    case 'APPROVED':
      return 'Approved';
    case 'REJECTED':
      return 'Rejected';
    default:
      return status.replace(/_/g, ' ');
  }
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'APPROVED') {
    return <CheckCircle2 size={14} />;
  }

  if (status === 'CHANGES_REQUESTED') {
    return <AlertTriangle size={14} />;
  }

  if (
    status === 'SUBMITTED' ||
    status === 'UNDER_REVIEW' ||
    status === 'RESUBMITTED'
  ) {
    return <Clock3 size={14} />;
  }

  return null;
}

export function TeamSwitcher({
  teams,
  activeRegistrationId,
}: TeamSwitcherProps) {
  const router = useRouter();

  const activeTeam =
    teams.find(
      (team) => team.registrationId === activeRegistrationId
    ) ?? teams[0];

  if (!activeTeam) {
    return null;
  }

  function selectTeam(registrationId: string) {
    if (registrationId === activeRegistrationId) {
      return;
    }

    router.push(
      `/team/dashboard?registrationId=${encodeURIComponent(
        registrationId
      )}`
    );
  }

  return (
    <div className="relative w-full">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-xl transition hover:border-primary-container/30 hover:bg-white/[0.06]">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-container/10 text-primary-container">
              <span className="font-mono text-sm font-bold">
                {activeTeam.teamName
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
            </div>

            <div className="min-w-0">
              <p className="truncate font-sans text-sm font-semibold text-on-surface">
                {activeTeam.teamName === 'Draft Team'
                  ? 'Untitled team'
                  : activeTeam.teamName}
              </p>

              <div className="mt-1 flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">
                  {getStatusLabel(activeTeam.status)}
                </span>

                {activeTeam.phase === 'PHASE_2' && (
                  <>
                    <span className="text-outline">·</span>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-outline">
                      Phase 2
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <ChevronDown
            size={18}
            className="shrink-0 text-on-surface-variant transition-transform group-open:rotate-180"
          />
        </summary>

        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-white/10 bg-[#101817]/95 shadow-2xl backdrop-blur-2xl">
          <div className="border-b border-white/5 px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-outline">
              Your registrations
            </p>
          </div>

          <div className="max-h-80 overflow-y-auto p-2">
            {teams.map((team) => {
              const isActive =
                team.registrationId === activeRegistrationId;

              return (
                <button
                  key={team.registrationId}
                  type="button"
                  onClick={() =>
                    selectTeam(team.registrationId)
                  }
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition ${
                    isActive
                      ? 'bg-primary-container/10 text-primary-container'
                      : 'text-on-surface hover:bg-white/[0.05]'
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      isActive
                        ? 'bg-primary-container/15'
                        : 'bg-white/[0.05]'
                    }`}
                  >
                    <span className="font-mono text-xs font-bold">
                      {team.teamName
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-sans text-sm font-medium">
                      {team.teamName === 'Draft Team'
                        ? 'Untitled team'
                        : team.teamName}
                    </p>

                    <div className="mt-1 flex items-center gap-1.5">
                      <span
                        className={`flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider ${
                          team.status === 'APPROVED'
                            ? 'text-green-400'
                            : team.status ===
                                'CHANGES_REQUESTED'
                              ? 'text-tertiary'
                              : team.status ===
                                    'UNDER_REVIEW' ||
                                  team.status === 'SUBMITTED' ||
                                  team.status === 'RESUBMITTED'
                                ? 'text-primary-container'
                                : 'text-on-surface-variant'
                        }`}
                      >
                        <StatusIcon status={team.status} />
                        {getStatusLabel(team.status)}
                      </span>
                    </div>
                  </div>

                  {isActive && (
                    <div className="h-2 w-2 rounded-full bg-primary-container shadow-[0_0_10px_rgba(0,240,255,0.6)]" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="border-t border-white/5 p-2">
            <button
              type="button"
              onClick={() => router.push('/team/register')}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-primary-container transition hover:bg-primary-container/10"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-container/10">
                <Plus size={17} />
              </div>

              <div>
                <p className="font-sans text-sm font-medium">
                  Register another team
                </p>
                <p className="font-mono text-[10px] uppercase tracking-wider text-outline">
                  Start a new submission
                </p>
              </div>
            </button>
          </div>
        </div>
      </details>
    </div>
  );
}