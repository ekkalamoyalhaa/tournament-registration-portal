import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileText,
  MapPin,
  Pencil,
  ShieldCheck,
  Trophy,
  Users,
  UserRoundCog,
  WalletCards,
} from 'lucide-react';

import { SignOutButton } from '@/components/auth/SignOutButton';
import { TeamSwitcher } from '@/components/team/TeamSwitcher';

import {
  getTeamDashboardData,
} from '@/lib/registration/actions';

type DashboardPageProps = {
  searchParams: {
    registrationId?: string;
  };
};

function formatDate(
  value: Date | string | null | undefined,
  includeTime = false
) {
  if (!value) return 'Not scheduled';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Not scheduled';
  }

  return new Intl.DateTimeFormat('en-MV', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(includeTime
      ? {
          hour: '2-digit',
          minute: '2-digit',
        }
      : {}),
  }).format(date);
}

function statusLabel(status: string) {
  return status.replace(/_/g, ' ');
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const styles =
    status === 'APPROVED'
      ? 'border-green-500/30 bg-green-500/10 text-green-400'
      : status === 'CHANGES_REQUESTED'
        ? 'border-tertiary/30 bg-tertiary/10 text-tertiary'
        : status === 'SUBMITTED' ||
            status === 'UNDER_REVIEW' ||
            status === 'RESUBMITTED'
          ? 'border-primary-container/30 bg-primary-container/10 text-primary-container'
          : 'border-white/10 bg-white/[0.04] text-on-surface-variant';

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-wider ${styles}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {statusLabel(status)}
    </span>
  );
}

function SectionHeader({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-primary-container">
          {icon}
        </div>

        <div>
          <h2 className="font-sans text-lg font-semibold text-on-surface">
            {title}
          </h2>

          {description && (
            <p className="mt-1 font-sans text-sm text-on-surface-variant">
              {description}
            </p>
          )}
        </div>
      </div>

      {action}
    </div>
  );
}

function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-2xl ${className}`}
    >
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      {children}
    </div>
  );
}

export default async function TeamDashboardPage({
  searchParams,
}: DashboardPageProps) {
  const data = await getTeamDashboardData(
    searchParams.registrationId
  );

  if (!data.active) {
    redirect('/team/register');
  }

  const {
    team,
    registration,
    fixtures,
    announcements,
  } = data.active;

  const players = team.players ?? [];
  const playerCount = players.length;

  const officialRoles = [
    {
      label: 'Manager',
      name: registration.managerName,
      email: registration.managerEmail,
      photo: registration.managerPhotoKey,
      idDocument: registration.managerIdDocKey,
    },
    {
      label: 'Coach',
      name: registration.coachName,
      email: registration.coachEmail,
      photo: registration.coachPhotoKey,
      idDocument: registration.coachIdDocKey,
    },
    {
      label: 'Medical / Physio',
      name: registration.medicName,
      email: registration.medicEmail,
      photo: registration.medicPhotoKey,
      idDocument: registration.medicIdDocKey,
    },
    {
      label: 'Other Official',
      name: registration.officialName,
      email: registration.officialEmail,
      photo: registration.officialPhotoKey,
      idDocument: registration.officialIdDocKey,
    },
  ];

  const officialCount =
    officialRoles.filter(
      (official) => official.name
    ).length;

  const playerDocumentCount =
    players.reduce(
      (total, player) =>
        total + player.documents.length,
      0
    );

  const teamDocumentCount =
    team.documents?.length ?? 0;

  const officialDocumentCount =
    officialRoles.reduce(
      (total, official) =>
        total +
        (official.photo ? 1 : 0) +
        (official.idDocument ? 1 : 0),
      0
    );

  const totalDocumentCount =
    playerDocumentCount +
    teamDocumentCount +
    officialDocumentCount;

  const isPhase1 =
    registration.phase === 'PHASE_1';

  const isPhase2 =
    registration.phase === 'PHASE_2';

  const isEditable =
    registration.status === 'DRAFT' ||
    registration.status === 'CHANGES_REQUESTED';

  const isPending =
    registration.status === 'SUBMITTED' ||
    registration.status === 'UNDER_REVIEW' ||
    registration.status === 'RESUBMITTED';

  const isApproved =
    registration.status === 'APPROVED';

  const isRejected =
    registration.status === 'REJECTED';

  const progressSteps = [
    {
      label: 'Participation Form',
      complete:
        !isPhase1 ||
        registration.status !== 'DRAFT',
      active: isPhase1,
    },
    {
      label: 'Team Verification',
      complete: isPhase2,
      active:
        registration.status ===
          'SUBMITTED' ||
        registration.status ===
          'UNDER_REVIEW' ||
        registration.status ===
          'RESUBMITTED',
    },
    {
      label: 'Player Roster',
      complete:
        playerCount >=
        (registration.tournament
          .minPlayers ?? 8),
      active: isPhase2,
    },
    {
      label: 'Officials List',
      complete: officialCount >= 4,
      active: isPhase2,
    },
    {
      label: 'Documents',
      complete: totalDocumentCount > 0,
      active: isPhase2,
    },
    {
      label: 'Payment',
      complete: false,
      active: false,
      unavailable: true,
    },
    {
      label: 'Final Approval',
      complete: isApproved,
      active: isPending || isApproved,
    },
  ];

  const nextAction =
    registration.status ===
      'CHANGES_REQUESTED'
      ? {
          title: 'Changes are required',
          description:
            'The tournament administrator has requested changes to this submission.',
          href: isPhase1
            ? `/team/register?registrationId=${encodeURIComponent(
                registration.id
              )}`
            : `/team/register/officials?registrationId=${encodeURIComponent(
                registration.id
              )}`,
          label: 'Edit submission',
          icon: Pencil,
        }
      : registration.status === 'DRAFT' &&
          isPhase1
        ? {
            title:
              'Complete your participation form',
            description:
              'Your tournament participation information has not been submitted yet.',
            href: `/team/register?registrationId=${encodeURIComponent(
              registration.id
            )}`,
            label: 'Continue registration',
            icon: ArrowRight,
          }
        : registration.status ===
              'DRAFT' &&
            isPhase2
          ? {
              title:
                'Complete your team details',
              description:
                'Add your players, officials and required documents before submitting.',
              href: `/team/register/officials?registrationId=${encodeURIComponent(
                registration.id
              )}`,
              label: 'Continue team details',
              icon: ArrowRight,
            }
          : isApproved
            ? {
                title:
                  'Registration approved',
                description:
                  'Your team is officially approved for the tournament.',
                href: '#fixtures',
                label: 'View tournament',
                icon: Trophy,
              }
            : isRejected
              ? {
                  title:
                    'Registration rejected',
                  description:
                    'Please contact the tournament organizer if you need clarification.',
                  href: '#contact',
                  label: 'Tournament contact',
                  icon: AlertTriangle,
                }
              : {
                  title:
                    'Registration under review',
                  description:
                    'Your submission is currently being reviewed by the tournament administration.',
                  href: '#progress',
                  label: 'View progress',
                  icon: Clock3,
                };

  const NextActionIcon = nextAction.icon;

  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#00dbe915] via-background to-background opacity-50" />

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-16 pt-10 md:px-8 lg:px-10">
        {/* Header */}
        <header className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-primary-container">
              Team Portal
            </p>

            <h1 className="font-sans text-4xl font-bold tracking-tight text-on-surface md:text-5xl">
              Dashboard
            </h1>

            <p className="mt-2 max-w-2xl font-sans text-sm text-on-surface-variant">
              Manage your tournament submission,
              team roster, officials and match
              information from one place.
            </p>
          </div>

          <SignOutButton />
        </header>

        {/* Team selector */}
        <div className="mb-8 max-w-2xl">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-outline">
              Active team
            </p>

            <span className="font-mono text-[10px] text-outline">
              {data.teams.length}{' '}
              {data.teams.length === 1
                ? 'registration'
                : 'registrations'}
            </span>
          </div>

          <TeamSwitcher
            teams={data.teams}
            activeRegistrationId={
              registration.id
            }
          />
        </div>

        {/* Active team identity */}
        <section className="mb-8">
          <Card className="p-6 md:p-7">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <StatusBadge
                    status={
                      registration.status
                    }
                  />

                  <span className="font-mono text-[10px] uppercase tracking-wider text-outline">
                    {registration.phase ===
                    'PHASE_1'
                      ? 'Tournament Participation'
                      : 'Team Details'}
                  </span>
                </div>

                <h2 className="break-words font-sans text-3xl font-bold text-on-surface">
                  {team.name === 'Draft Team'
                    ? 'Untitled team'
                    : team.name}
                </h2>

                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
                  {team.institutionType && (
                    <span className="font-mono text-xs uppercase tracking-wider text-on-surface-variant">
                      {team.institutionType.replace(
                        /_/g,
                        ' '
                      )}
                    </span>
                  )}

                  {registration.division && (
                    <span className="font-mono text-xs uppercase tracking-wider text-on-surface-variant">
                      {registration.division ===
                      'MENS'
                        ? "Men's Division"
                        : "Women's Division"}
                    </span>
                  )}

                  {team.city && (
                    <span className="flex items-center gap-1.5 font-mono text-xs text-outline">
                      <MapPin size={12} />
                      {team.city}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-white/5 bg-black/20 px-5 py-4 text-center">
                  <Users
                    size={16}
                    className="mx-auto mb-2 text-primary-container"
                  />
                  <p className="font-mono text-[10px] uppercase tracking-wider text-outline">
                    Players
                  </p>
                  <p className="mt-1 font-sans text-2xl font-semibold text-on-surface">
                    {playerCount}
                  </p>
                </div>

                <div className="rounded-lg border border-white/5 bg-black/20 px-5 py-4 text-center">
                  <UserRoundCog
                    size={16}
                    className="mx-auto mb-2 text-primary-container"
                  />
                  <p className="font-mono text-[10px] uppercase tracking-wider text-outline">
                    Officials
                  </p>
                  <p className="mt-1 font-sans text-2xl font-semibold text-on-surface">
                    {officialCount}
                  </p>
                </div>

                <div className="col-span-2 rounded-lg border border-white/5 bg-black/20 px-5 py-4 text-center sm:col-span-1">
                  <FileCheck2
                    size={16}
                    className="mx-auto mb-2 text-primary-container"
                  />
                  <p className="font-mono text-[10px] uppercase tracking-wider text-outline">
                    Documents
                  </p>
                  <p className="mt-1 font-sans text-2xl font-semibold text-on-surface">
                    {totalDocumentCount}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Next action */}
        <section className="mb-10">
          <div className="overflow-hidden rounded-xl border border-primary-container/20 bg-primary-container/[0.06] backdrop-blur-2xl">
            <div className="h-px bg-gradient-to-r from-transparent via-primary-container/60 to-transparent" />

            <div className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-container/10 text-primary-container">
                  <NextActionIcon
                    size={21}
                  />
                </div>

                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary-container">
                    Current status
                  </p>

                  <h2 className="mt-1 font-sans text-xl font-semibold text-on-surface">
                    {nextAction.title}
                  </h2>

                  <p className="mt-1 max-w-2xl font-sans text-sm text-on-surface-variant">
                    {nextAction.description}
                  </p>
                </div>
              </div>

              <Link
                href={nextAction.href}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary-container px-5 py-3 font-sans text-sm font-semibold text-on-primary-container transition hover:bg-primary"
              >
                {nextAction.label}
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        {/* Registration progress */}
        <section
          id="progress"
          className="mb-10"
        >
          <SectionHeader
            icon={<FileText size={19} />}
            title="Registration Progress"
            description="Track each part of your tournament submission."
          />

          <Card>
            <div className="grid gap-2 md:grid-cols-7">
              {progressSteps.map(
                (step, index) => (
                  <div
                    key={step.label}
                    className="relative rounded-lg border border-white/5 bg-black/10 p-4"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <span className="font-mono text-[10px] text-outline">
                        0{index + 1}
                      </span>

                      {step.unavailable ? (
                        <span className="rounded-full bg-white/5 px-2 py-1 font-mono text-[9px] uppercase text-outline">
                          Not configured
                        </span>
                      ) : step.complete ? (
                        <CheckCircle2
                          size={16}
                          className="text-green-400"
                        />
                      ) : step.active ? (
                        <Clock3
                          size={16}
                          className="text-primary-container"
                        />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-outline-variant" />
                      )}
                    </div>

                    <p className="font-sans text-sm font-medium text-on-surface">
                      {step.label}
                    </p>

                    <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-outline">
                      {step.unavailable
                        ? 'Unavailable'
                        : step.complete
                          ? 'Complete'
                          : step.active
                            ? 'In progress'
                            : 'Pending'}
                    </p>
                  </div>
                )
              )}
            </div>
          </Card>
        </section>

        {/* Team management */}
        <div className="mb-10 grid gap-6 lg:grid-cols-2">
          {/* Roster */}
          <section>
            <SectionHeader
              icon={<Users size={19} />}
              title="Team Roster"
              description={`${playerCount}/${
                registration.tournament
                  .maxPlayers ?? 10
              } players registered.`}
              action={
                isPhase2 && isEditable ? (
                  <Link
                    href={`/team/register/officials?registrationId=${encodeURIComponent(
                      registration.id
                    )}`}
                    className="font-mono text-[10px] uppercase tracking-wider text-primary-container hover:text-primary"
                  >
                    Manage
                  </Link>
                ) : undefined
              }
            />

            <Card className="p-0">
              {players.length === 0 ? (
                <div className="p-8 text-center">
                  <Users
                    size={24}
                    className="mx-auto mb-3 text-outline"
                  />
                  <p className="font-sans text-sm text-on-surface">
                    No players added yet.
                  </p>
                  <p className="mt-1 font-sans text-xs text-outline">
                    Players will appear here once
                    they are added to this team.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {players.map(
                    (player, index) => (
                      <div
                        key={player.id}
                        className="flex items-center gap-4 px-5 py-4"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] font-mono text-xs text-outline">
                          {String(
                            player.jerseyNumber ??
                              index + 1
                          ).padStart(2, '0')}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate font-sans text-sm font-medium text-on-surface">
                            {player.firstName}{' '}
                            {player.middleName
                              ? `${player.middleName} `
                              : ''}
                            {player.lastName}
                          </p>

                          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-outline">
                            {player.position ??
                              'Player'}
                          </p>
                        </div>

                        <span
                          className={`font-mono text-[9px] uppercase tracking-wider ${
                            player.documents
                              .length > 0
                              ? 'text-green-400'
                              : 'text-tertiary'
                          }`}
                        >
                          {player.documents
                            .length > 0
                            ? 'Document'
                            : 'Missing document'}
                        </span>
                      </div>
                    )
                  )}
                </div>
              )}
            </Card>
          </section>

          {/* Officials */}
          <section>
            <SectionHeader
              icon={<ShieldCheck size={19} />}
              title="Team Officials"
              description={`${officialCount}/4 officials registered.`}
              action={
                isPhase2 && isEditable ? (
                  <Link
                    href={`/team/register/officials?registrationId=${encodeURIComponent(
                      registration.id
                    )}`}
                    className="font-mono text-[10px] uppercase tracking-wider text-primary-container hover:text-primary"
                  >
                    Manage
                  </Link>
                ) : undefined
              }
            />

            <Card className="p-0">
              <div className="divide-y divide-white/5">
                {officialRoles.map(
                  (official) => (
                    <div
                      key={official.label}
                      className="flex items-center gap-4 px-5 py-4"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-outline">
                        <UserRoundCog
                          size={16}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-[9px] uppercase tracking-wider text-outline">
                          {official.label}
                        </p>

                        <p className="truncate font-sans text-sm font-medium text-on-surface">
                          {official.name ??
                            'Not assigned'}
                        </p>

                        {official.email && (
                          <p className="truncate font-mono text-[10px] text-outline">
                            {official.email}
                          </p>
                        )}
                      </div>

                      <span
                        className={`font-mono text-[9px] uppercase ${
                          official.name
                            ? 'text-green-400'
                            : 'text-outline'
                        }`}
                      >
                        {official.name
                          ? 'Added'
                          : 'Pending'}
                      </span>
                    </div>
                  )
                )}
              </div>
            </Card>
          </section>
        </div>

        {/* Documents / Payment */}
        <div className="mb-10 grid gap-6 lg:grid-cols-2">
          <section>
            <SectionHeader
              icon={<FileCheck2 size={19} />}
              title="Documents"
              description="Documents associated with this team submission."
            />

            <Card>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-white/5 bg-black/10 p-4">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-outline">
                    Player documents
                  </p>
                  <p className="mt-2 font-sans text-2xl font-semibold text-on-surface">
                    {playerDocumentCount}
                  </p>
                </div>

                <div className="rounded-lg border border-white/5 bg-black/10 p-4">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-outline">
                    Official documents
                  </p>
                  <p className="mt-2 font-sans text-2xl font-semibold text-on-surface">
                    {officialDocumentCount}
                  </p>
                </div>

                <div className="col-span-2 rounded-lg border border-white/5 bg-black/10 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-outline">
                        Team documents
                      </p>
                      <p className="mt-1 font-sans text-sm text-on-surface">
                        {teamDocumentCount}{' '}
                        uploaded
                      </p>
                    </div>

                    <FileText
                      size={18}
                      className="text-primary-container"
                    />
                  </div>
                </div>
              </div>

              {totalDocumentCount === 0 && (
                <div className="mt-4 rounded-lg border border-tertiary/20 bg-tertiary/5 p-4">
                  <p className="font-sans text-sm text-tertiary">
                    No documents have been uploaded
                    yet.
                  </p>
                </div>
              )}
            </Card>
          </section>

          <section>
            <SectionHeader
              icon={<WalletCards size={19} />}
              title="Payment"
              description="Payment tracking for this tournament."
            />

            <Card>
              <div className="flex min-h-[180px] flex-col items-center justify-center text-center">
                <WalletCards
                  size={28}
                  className="mb-3 text-outline"
                />

                <p className="font-sans text-sm font-medium text-on-surface">
                  Payment tracking is not
                  configured
                </p>

                <p className="mt-1 max-w-sm font-sans text-xs text-outline">
                  Payment status, fees and receipts
                  will appear here when payment
                  tracking is enabled for this
                  tournament.
                </p>
              </div>
            </Card>
          </section>
        </div>

        {/* Tournament information */}
        <section className="mb-10">
          <SectionHeader
            icon={<Trophy size={19} />}
            title="Tournament Information"
            description="General information for this tournament."
          />

          <Card>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-outline">
                  Tournament
                </p>
                <p className="mt-2 font-sans text-sm font-medium text-on-surface">
                  {registration.tournament.name}
                </p>
              </div>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-outline">
                  Registration closes
                </p>
                <p className="mt-2 font-sans text-sm font-medium text-on-surface">
                  {formatDate(
                    registration.tournament
                      .registrationClosesAt
                  )}
                </p>
              </div>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-outline">
                  Tournament dates
                </p>
                <p className="mt-2 font-sans text-sm font-medium text-on-surface">
                  {formatDate(
                    registration.tournament
                      .startDate
                  )}{' '}
                  –{' '}
                  {formatDate(
                    registration.tournament
                      .endDate
                  )}
                </p>
              </div>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-outline">
                  Venue
                </p>
                <p className="mt-2 flex items-center gap-1.5 font-sans text-sm font-medium text-on-surface">
                  <MapPin size={14} />
                  {registration.tournament
                    .venue ?? 'To be announced'}
                </p>
              </div>
            </div>

            {(registration.tournament.description ||
              registration.tournament.rules) && (
              <div className="mt-6 grid gap-4 border-t border-white/5 pt-6 lg:grid-cols-2">
                {registration.tournament
                  .description && (
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-outline">
                      About
                    </p>
                    <p className="mt-2 whitespace-pre-line font-sans text-sm leading-6 text-on-surface-variant">
                      {
                        registration.tournament
                          .description
                      }
                    </p>
                  </div>
                )}

                {registration.tournament
                  .rules && (
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-outline">
                      Rules / Handbook
                    </p>
                    <p className="mt-2 whitespace-pre-line font-sans text-sm leading-6 text-on-surface-variant">
                      {
                        registration.tournament
                          .rules
                      }
                    </p>
                  </div>
                )}
              </div>
            )}
          </Card>
        </section>

        {/* Fixtures */}
        <section
          id="fixtures"
          className="mb-10"
        >
          <SectionHeader
            icon={<CalendarDays size={19} />}
            title="Fixtures & Results"
            description="Published fixtures for your active team."
          />

          <Card className="p-0">
            {fixtures.length === 0 ? (
              <div className="flex min-h-[190px] flex-col items-center justify-center p-8 text-center">
                <CalendarDays
                  size={28}
                  className="mb-3 text-outline"
                />

                <p className="font-sans text-sm font-medium text-on-surface">
                  Fixtures are not available yet
                </p>

                <p className="mt-1 max-w-md font-sans text-xs text-outline">
                  Fixtures will appear here once
                  the tournament draw and schedule
                  have been published.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {fixtures.map((fixture) => (
                  <div
                    key={fixture.id}
                    className="flex flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        {fixture.group && (
                          <span className="font-mono text-[10px] uppercase tracking-wider text-primary-container">
                            Group {fixture.group}
                          </span>
                        )}

                        {fixture.round && (
                          <span className="font-mono text-[10px] uppercase tracking-wider text-outline">
                            {fixture.round}
                          </span>
                        )}

                        {fixture.matchNumber && (
                          <span className="font-mono text-[10px] uppercase tracking-wider text-outline">
                            Match #
                            {fixture.matchNumber}
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex items-center gap-3">
                        <span className="font-sans text-sm font-semibold text-on-surface">
                          {team.name ===
                          'Draft Team'
                            ? 'Your team'
                            : team.name}
                        </span>

                        <span className="font-mono text-xs text-outline">
                          vs
                        </span>

                        <span className="font-sans text-sm font-semibold text-on-surface">
                          {fixture.opponent
                            ?.name ??
                            'Opponent TBA'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-5">
                      <div className="text-right">
                        <p className="font-mono text-[10px] uppercase tracking-wider text-outline">
                          Kickoff
                        </p>

                        <p className="mt-1 font-sans text-sm text-on-surface">
                          {formatDate(
                            fixture.kickoffAt,
                            true
                          )}
                        </p>
                      </div>

                      <div className="rounded-lg border border-white/5 bg-black/20 px-4 py-2 font-mono text-xs text-on-surface-variant">
                        {fixture.status.replace(
                          /_/g,
                          ' '
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </section>

        {/* Announcements / Notifications */}
        <div className="mb-10 grid gap-6 lg:grid-cols-2">
          <section>
            <SectionHeader
              icon={<FileText size={19} />}
              title="Tournament Announcements"
              description="Updates published for this tournament."
            />

            <Card className="p-0">
              {announcements.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="font-sans text-sm text-on-surface">
                    No announcements yet.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {announcements.map(
                    (announcement) => (
                      <div
                        key={announcement.id}
                        className="p-5"
                      >
                        <p className="font-sans text-sm font-semibold text-on-surface">
                          {announcement.title}
                        </p>

                        <p className="mt-2 whitespace-pre-line font-sans text-sm leading-6 text-on-surface-variant">
                          {announcement.body}
                        </p>

                        {announcement.publishedAt && (
                          <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-outline">
                            {formatDate(
                              announcement.publishedAt
                            )}
                          </p>
                        )}
                      </div>
                    )
                  )}
                </div>
              )}
            </Card>
          </section>

          <section>
            <SectionHeader
              icon={<Clock3 size={19} />}
              title="Notifications"
              description="Account notifications and registration updates."
            />

            <Card className="p-0">
              {data.notifications.length ===
              0 ? (
                <div className="p-8 text-center">
                  <p className="font-sans text-sm text-on-surface">
                    No notifications.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {data.notifications.map(
                    (notification) => (
                      <div
                        key={notification.id}
                        className="p-5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <p className="font-sans text-sm font-medium text-on-surface">
                            {notification.type.replace(
                              /_/g,
                              ' '
                            )}
                          </p>

                          {!notification.readAt && (
                            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary-container shadow-[0_0_10px_rgba(0,240,255,0.5)]" />
                          )}
                        </div>

                        <p className="mt-2 font-mono text-[10px] text-outline">
                          {formatDate(
                            notification.createdAt,
                            true
                          )}
                        </p>
                      </div>
                    )
                  )}
                </div>
              )}
            </Card>
          </section>
        </div>

        {/* Contact */}
        <section
          id="contact"
          className="mb-4"
        >
          <SectionHeader
            icon={<MapPin size={19} />}
            title="Tournament Contact"
            description="Contact the tournament secretariat for registration or event assistance."
          />

          <Card>
            {registration.tournament
              .contactInfo ? (
              <p className="whitespace-pre-line font-sans text-sm leading-7 text-on-surface-variant">
                {
                  registration.tournament
                    .contactInfo
                }
              </p>
            ) : (
              <div className="flex items-center gap-3">
                <AlertTriangle
                  size={18}
                  className="text-outline"
                />

                <p className="font-sans text-sm text-on-surface-variant">
                  Tournament contact information
                  has not been configured yet.
                </p>
              </div>
            )}
          </Card>
        </section>
      </main>
    </>
  );
}