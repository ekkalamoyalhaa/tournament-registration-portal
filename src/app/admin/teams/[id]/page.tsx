'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { StatusBadge } from '@/components/ui/StatusBadge';

import {
  getTeamDetail,
  approveSlot,
  rejectSlot,
  reviewTeamRegistration,
  reviewPlayer,
  deleteTeamRegistration,
  getAdminDocumentUrl,
  sendRegistrationToPayment,
} from '@/lib/admin/actions';

import {
  approveRegistrationPayment,
  rejectRegistrationPayment,
  getPaymentReceiptUrl,
} from '@/lib/payment/actions';

type TeamDetail = Awaited<
  ReturnType<typeof getTeamDetail>
>;

export default function AdminTeamReviewPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();

  const [data, setData] =
    useState<TeamDetail | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [paymentActionLoading, setPaymentActionLoading] =
    useState(false);

  const [deleteLoading, setDeleteLoading] =
    useState(false);

  const [showDeleteDialog, setShowDeleteDialog] =
    useState(false);

  const [note, setNote] = useState('');

  const [paymentRejectReason, setPaymentRejectReason] =
    useState('');

  const [actionError, setActionError] =
    useState('');

  const [actionSuccess, setActionSuccess] =
    useState('');

  /* =========================================================
     LOAD REGISTRATION
  ========================================================= */

  useEffect(() => {
    let mounted = true;

    async function loadTeam() {
      try {
        setLoading(true);
        setActionError('');

        const result =
          await getTeamDetail(params.id);

        if (mounted) {
          setData(result);
        }
      } catch (error) {
        console.error(
          'Failed to load team:',
          error
        );

        if (mounted) {
          setActionError(
            error instanceof Error
              ? error.message
              : 'Failed to load registration.'
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadTeam();

    return () => {
      mounted = false;
    };
  }, [params.id]);

  /* =========================================================
     REFRESH DATA
  ========================================================= */

  async function refreshTeam() {
    const refreshed =
      await getTeamDetail(params.id);

    setData(refreshed);

    router.refresh();
  }

  /* =========================================================
     VIEW DOCUMENT
  ========================================================= */

  async function handleDocumentView(
    documentId: string
  ) {
    try {
      setActionError('');
      setActionSuccess('');

      const result =
        await getAdminDocumentUrl(
          params.id,
          documentId
        );

      window.open(
        result.url,
        '_blank',
        'noopener,noreferrer'
      );
    } catch (error) {
      console.error(
        'Document view failed:',
        error
      );

      setActionError(
        error instanceof Error
          ? error.message
          : 'Unable to open document.'
      );
    }
  }

  /* =========================================================
     VIEW PAYMENT RECEIPT
  ========================================================= */

  async function handlePaymentReceiptView() {
    try {
      setPaymentActionLoading(true);
      setActionError('');
      setActionSuccess('');

      const url =
        await getPaymentReceiptUrl(
          params.id
        );

      if (!url) {
        throw new Error(
          'Payment receipt is not available.'
        );
      }

      window.open(
        url,
        '_blank',
        'noopener,noreferrer'
      );
    } catch (error) {
      console.error(
        'Payment receipt view failed:',
        error
      );

      setActionError(
        error instanceof Error
          ? error.message
          : 'Unable to open payment receipt.'
      );
    } finally {
      setPaymentActionLoading(false);
    }
  }

  /* =========================================================
     APPROVE PAYMENT
  ========================================================= */

  async function handleApprovePayment() {
    setPaymentActionLoading(true);
    setActionError('');
    setActionSuccess('');

    try {
      const result =
        await approveRegistrationPayment(
          params.id
        );

      if (!result?.success) {
        throw new Error(
          'The payment approval action failed.'
        );
      }

      setActionSuccess(
        'Payment approved successfully. The registration still requires final tournament administrator approval.'
      );

      setPaymentRejectReason('');

      await refreshTeam();
    } catch (error) {
      console.error(
        'Payment approval failed:',
        error
      );

      setActionError(
        error instanceof Error
          ? error.message
          : 'Unable to approve the payment.'
      );
    } finally {
      setPaymentActionLoading(false);
    }
  }

  /* =========================================================
     REJECT PAYMENT
  ========================================================= */

  async function handleRejectPayment() {
    setPaymentActionLoading(true);
    setActionError('');
    setActionSuccess('');

    try {
      const reason =
        paymentRejectReason.trim() ||
        'Payment receipt rejected by tournament administrator.';

      const result =
        await rejectRegistrationPayment(
          params.id,
          reason
        );

      if (!result?.success) {
        throw new Error(
          'The payment rejection action failed.'
        );
      }

      setActionSuccess(
        'Payment rejected successfully. The team can submit a new payment receipt.'
      );

      setPaymentRejectReason('');

      await refreshTeam();
    } catch (error) {
      console.error(
        'Payment rejection failed:',
        error
      );

      setActionError(
        error instanceof Error
          ? error.message
          : 'Unable to reject the payment.'
      );
    } finally {
      setPaymentActionLoading(false);
    }
  }

  /* =========================================================
     SLOT APPROVAL — PHASE 1
  ========================================================= */

  async function handleSlotApprove() {
    setActionLoading(true);
    setActionError('');
    setActionSuccess('');

    try {
      const result =
        await approveSlot(
          params.id,
          note.trim() || undefined
        );

      if (!result?.success) {
        throw new Error(
          'The slot approval action failed.'
        );
      }

      setActionSuccess(
        'Slot approved successfully. The team can now continue with Phase 2.'
      );

      setNote('');

      await refreshTeam();
    } catch (error) {
      console.error(
        'Slot approval failed:',
        error
      );

      setActionError(
        error instanceof Error
          ? error.message
          : 'Unable to approve the slot.'
      );
    } finally {
      setActionLoading(false);
    }
  }

  /* =========================================================
     SLOT REJECTION — PHASE 1
  ========================================================= */

  async function handleSlotReject() {
    setActionLoading(true);
    setActionError('');
    setActionSuccess('');

    try {
      const reason =
        note.trim() ||
        'Slot rejected by tournament administrator';

      const result =
        await rejectSlot(
          params.id,
          reason
        );

      if (!result?.success) {
        throw new Error(
          'The slot rejection action failed.'
        );
      }

      setActionSuccess(
        'Slot rejected successfully.'
      );

      setNote('');

      await refreshTeam();
    } catch (error) {
      console.error(
        'Slot rejection failed:',
        error
      );

      setActionError(
        error instanceof Error
          ? error.message
          : 'Unable to reject the slot.'
      );
    } finally {
      setActionLoading(false);
    }
  }

  /* =========================================================
     SEND TO PAYMENT — PHASE 2
  ========================================================= */

  async function handleSendToPayment() {
    setActionLoading(true);
    setActionError('');
    setActionSuccess('');

    try {
      const result =
        await sendRegistrationToPayment(
          params.id,
          note.trim() || undefined
        );

      if (!result?.success) {
        throw new Error(
          'The payment transition failed.'
        );
      }

      setActionSuccess(
        'Registration sent to payment successfully. The team can now submit their payment receipt.'
      );

      setNote('');

      await refreshTeam();
    } catch (error) {
      console.error(
        'Send to payment failed:',
        error
      );

      setActionError(
        error instanceof Error
          ? error.message
          : 'Unable to send the registration to payment.'
      );
    } finally {
      setActionLoading(false);
    }
  }

  /* =========================================================
     FINAL TEAM REVIEW
  ========================================================= */

  async function handleTeamAction(
    action:
      | 'approve'
      | 'reject'
      | 'request_changes'
  ) {
    setActionLoading(true);
    setActionError('');
    setActionSuccess('');

    try {
      const result =
        await reviewTeamRegistration(
          params.id,
          action,
          note.trim() || undefined
        );

      if (!result?.success) {
        throw new Error(
          'The registration review action failed.'
        );
      }

      const successMessage =
        action === 'approve'
          ? 'Registration approved successfully.'
          : action === 'reject'
            ? 'Registration rejected successfully.'
            : 'Changes requested successfully.';

      setActionSuccess(successMessage);

      setNote('');

      await refreshTeam();
    } catch (error) {
      console.error(
        'Team review failed:',
        error
      );

      setActionError(
        error instanceof Error
          ? error.message
          : 'Unable to update the registration.'
      );
    } finally {
      setActionLoading(false);
    }
  }

  /* =========================================================
     PLAYER REVIEW
  ========================================================= */

  async function handlePlayerAction(
    playerId: string,
    action:
      | 'approve'
      | 'reject'
      | 'request_changes'
  ) {
    setActionLoading(true);
    setActionError('');
    setActionSuccess('');

    try {
      const result =
        await reviewPlayer(
          playerId,
          action,
          note.trim() || undefined
        );

      if (!result?.success) {
        throw new Error(
          'The player review action failed.'
        );
      }

      const successMessage =
        action === 'approve'
          ? 'Player approved successfully.'
          : action === 'reject'
            ? 'Player rejected successfully.'
            : 'Changes requested for player.';

      setActionSuccess(successMessage);

      setNote('');

      await refreshTeam();
    } catch (error) {
      console.error(
        'Player review failed:',
        error
      );

      setActionError(
        error instanceof Error
          ? error.message
          : 'Unable to update the player.'
      );
    } finally {
      setActionLoading(false);
    }
  }

  /* =========================================================
     DELETE TEAM
  ========================================================= */

  async function handleDeleteTeam() {
    setDeleteLoading(true);
    setActionError('');
    setActionSuccess('');

    try {
      const result =
        await deleteTeamRegistration(
          params.id
        );

      if (!result?.success) {
        throw new Error(
          'Failed to delete the team registration.'
        );
      }

      setShowDeleteDialog(false);

      router.push('/admin/teams');
      router.refresh();
    } catch (error) {
      console.error(
        'Team deletion failed:',
        error
      );

      setActionError(
        error instanceof Error
          ? error.message
          : 'Unable to delete the team registration.'
      );

      setDeleteLoading(false);
    }
  }

  /* =========================================================
     DOCUMENT LABELS
  ========================================================= */

  function getDocumentLabel(
    documentType: string
  ) {
    switch (documentType) {
      case 'PLAYER_ID':
        return 'ID Document';

      case 'PASSPORT_PHOTO':
        return 'Passport Photo';

      case 'manager_id_doc':
        return 'Manager — ID Document';

      case 'manager_photo':
        return 'Manager — Photo';

      case 'coach_id_doc':
        return 'Coach — ID Document';

      case 'coach_photo':
        return 'Coach — Photo';

      case 'medic_id_doc':
        return 'Medic — ID Document';

      case 'medic_photo':
        return 'Medic — Photo';

      case 'official_id_doc':
        return 'Official — ID Document';

      case 'official_photo':
        return 'Official — Photo';

      default:
        return documentType;
    }
  }

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <GlassCard>
            <div className="py-12 text-center">
              <p className="font-sans text-body-md text-white/60">
                Loading registration...
              </p>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  /* =========================================================
     NOT FOUND
  ========================================================= */

  if (!data) {
    return (
      <div className="min-h-screen bg-transparent px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <GlassCard>
            <div className="py-12 text-center">
              <h1 className="font-sans text-headline-md font-bold text-white">
                Registration not found
              </h1>

              {actionError && (
                <p className="mt-3 font-sans text-body-md text-error">
                  {actionError}
                </p>
              )}

              <div className="mt-6">
                <Link href="/admin/teams">
                  <GlassButton type="button">
                    Back to teams
                  </GlassButton>
                </Link>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  /* =========================================================
     DERIVED STATE
  ========================================================= */

  const isPhase1 =
    data.phase === 'PHASE_1';

  const isPhase2 =
    data.phase === 'PHASE_2';

  const isApproved =
    data.status === 'APPROVED';

  const isRejected =
    data.status === 'REJECTED';

  const isReviewable =
    isPhase2 &&
    (
      data.status === 'SUBMITTED' ||
      data.status === 'UNDER_REVIEW' ||
      data.status === 'RESUBMITTED'
    );

  const isWaitingForTeam =
    isPhase2 &&
    data.status === 'DRAFT';

  const isChangesRequested =
    isPhase2 &&
    data.status === 'CHANGES_REQUESTED';

  const paymentApproved =
    data.paymentStatus === 'APPROVED';

  const paymentPending =
    data.paymentStatus === 'PENDING';

  const paymentUnderReview =
    data.paymentStatus === 'UNDER_REVIEW';

  const paymentRejected =
    data.paymentStatus === 'REJECTED';

  const canSendToPayment =
    isReviewable &&
    !paymentApproved &&
    !paymentPending &&
    !paymentUnderReview;

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <div className="min-h-screen bg-transparent px-6 py-10">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="mb-8">
          <div className="mb-4">
            <Link
              href="/admin/teams"
              className="font-sans text-body-sm text-white/50 transition hover:text-white"
            >
              ← Back to teams
            </Link>
          </div>

          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">

            <div>
              <h1 className="font-sans text-display-sm font-bold text-white">
                {data.team.name}
              </h1>

              {data.team.shortName && (
                <p className="mt-1 font-sans text-body-md text-white/50">
                  {data.team.shortName}
                </p>
              )}

              <p className="mt-2 break-all font-sans text-body-sm text-white/40">
                Registration ID: {data.id}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">

              <StatusBadge
                status={data.status}
              />

              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-sans text-body-sm text-white/60">
                {data.phase}
              </span>

              <GlassButton
                type="button"
                onClick={() => {
                  setActionError('');
                  setActionSuccess('');
                  setShowDeleteDialog(true);
                }}
                disabled={
                  actionLoading ||
                  paymentActionLoading ||
                  deleteLoading
                }
                className="border-error/30 bg-error/10 text-error hover:bg-error/20"
              >
                Delete team
              </GlassButton>

            </div>
          </div>
        </div>

        {/* FEEDBACK */}

        {actionError && (
          <div className="mb-6 rounded-lg border border-error/30 bg-error/10 px-4 py-3">
            <p className="font-sans text-body-md text-error">
              {actionError}
            </p>
          </div>
        )}

        {actionSuccess && (
          <div className="mb-6 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3">
            <p className="font-sans text-body-md text-green-400">
              {actionSuccess}
            </p>
          </div>
        )}

        {/* REGISTRATION STATUS */}

        <GlassCard className="mb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>
              <h2 className="font-sans text-headline-sm font-bold text-white">
                Registration status
              </h2>

              <p className="mt-1 font-sans text-body-md text-white/50">
                Current phase: {data.phase}
              </p>
            </div>

            <StatusBadge
              status={data.status}
            />

          </div>

          {data.submittedAt && (
            <div className="mt-5 border-t border-white/10 pt-5">
              <p className="font-sans text-body-sm text-white/40">
                Submitted
              </p>

              <p className="mt-1 font-sans text-body-md text-white">
                {new Date(
                  data.submittedAt
                ).toLocaleString()}
              </p>
            </div>
          )}

          {data.reviewedAt && (
            <div className="mt-4">
              <p className="font-sans text-body-sm text-white/40">
                Last reviewed
              </p>

              <p className="mt-1 font-sans text-body-md text-white">
                {new Date(
                  data.reviewedAt
                ).toLocaleString()}
              </p>
            </div>
          )}

          {data.internalNotes && (
            <div className="mt-4">
              <p className="font-sans text-body-sm text-white/40">
                Internal notes
              </p>

              <p className="mt-1 whitespace-pre-wrap font-sans text-body-md text-white/80">
                {data.internalNotes}
              </p>
            </div>
          )}
        </GlassCard>

        {/* TEAM INFORMATION */}

        <GlassCard className="mb-6">
          <h2 className="font-sans text-headline-sm font-bold text-white">
            Team information
          </h2>

          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">

            <div>
              <p className="font-sans text-body-sm text-white/40">
                Team name
              </p>

              <p className="mt-1 font-sans text-body-md text-white">
                {data.team.name || '—'}
              </p>
            </div>

            <div>
              <p className="font-sans text-body-sm text-white/40">
                Short name
              </p>

              <p className="mt-1 font-sans text-body-md text-white">
                {data.team.shortName || '—'}
              </p>
            </div>

            <div>
              <p className="font-sans text-body-sm text-white/40">
                Institution type
              </p>

              <p className="mt-1 font-sans text-body-md text-white">
                {data.team.institutionType || '—'}
              </p>
            </div>

            <div>
              <p className="font-sans text-body-sm text-white/40">
                Registration number
              </p>

              <p className="mt-1 font-sans text-body-md text-white">
                {data.team.clubRegistrationNumber || '—'}
              </p>
            </div>

            <div>
              <p className="font-sans text-body-sm text-white/40">
                Country
              </p>

              <p className="mt-1 font-sans text-body-md text-white">
                {data.team.country || '—'}
              </p>
            </div>

            <div>
              <p className="font-sans text-body-sm text-white/40">
                Region
              </p>

              <p className="mt-1 font-sans text-body-md text-white">
                {data.team.region || '—'}
              </p>
            </div>

            <div>
              <p className="font-sans text-body-sm text-white/40">
                City
              </p>

              <p className="mt-1 font-sans text-body-md text-white">
                {data.team.city || '—'}
              </p>
            </div>

            <div>
              <p className="font-sans text-body-sm text-white/40">
                Contact email
              </p>

              <p className="mt-1 break-all font-sans text-body-md text-white">
                {data.team.contactEmail || '—'}
              </p>
            </div>

            <div>
              <p className="font-sans text-body-sm text-white/40">
                Contact phone
              </p>

              <p className="mt-1 font-sans text-body-md text-white">
                {data.team.contactPhone || '—'}
              </p>
            </div>

          </div>

          {data.team.address && (
            <div className="mt-5">
              <p className="font-sans text-body-sm text-white/40">
                Address
              </p>

              <p className="mt-1 font-sans text-body-md text-white">
                {data.team.address}
              </p>
            </div>
          )}

          {data.team.description && (
            <div className="mt-5">
              <p className="font-sans text-body-sm text-white/40">
                Description
              </p>

              <p className="mt-1 whitespace-pre-wrap font-sans text-body-md text-white/80">
                {data.team.description}
              </p>
            </div>
          )}
        </GlassCard>

        {/* TOURNAMENT */}

        <GlassCard className="mb-6">
          <h2 className="font-sans text-headline-sm font-bold text-white">
            Tournament
          </h2>

          <div className="mt-6 grid gap-5 md:grid-cols-2">

            <div>
              <p className="font-sans text-body-sm text-white/40">
                Tournament
              </p>

              <p className="mt-1 font-sans text-body-md text-white">
                {data.tournament.name}
              </p>
            </div>

            <div>
              <p className="font-sans text-body-sm text-white/40">
                Division
              </p>

              <p className="mt-1 font-sans text-body-md text-white">
                {data.division || '—'}
              </p>
            </div>

          </div>
        </GlassCard>

        {/* PHASE 1 SLOT REVIEW */}

        {isPhase1 &&
          data.status === 'SUBMITTED' && (
            <GlassCard className="mb-6">

              <h2 className="font-sans text-headline-sm font-bold text-white">
                Slot review
              </h2>

              <p className="mt-2 font-sans text-body-md text-white/50">
                Review the team&apos;s Phase 1
                registration and approve or
                reject their tournament slot.
              </p>

              <textarea
                value={note}
                onChange={(event) =>
                  setNote(event.target.value)
                }
                placeholder="Add a note or rejection reason..."
                rows={4}
                className="mt-6 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 font-sans text-body-md text-white outline-none placeholder:text-white/30 focus:border-white/30"
              />

              <div className="mt-4 flex flex-wrap gap-3">

                <GlassButton
                  type="button"
                  onClick={
                    handleSlotApprove
                  }
                  disabled={actionLoading}
                  className="border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20"
                >
                  {actionLoading
                    ? 'Processing...'
                    : 'Approve slot'}
                </GlassButton>

                <GlassButton
                  type="button"
                  onClick={handleSlotReject}
                  disabled={actionLoading}
                  className="border-error/30 bg-error/10 text-error hover:bg-error/20"
                >
                  {actionLoading
                    ? 'Processing...'
                    : 'Reject slot'}
                </GlassButton>

              </div>
            </GlassCard>
          )}

        {/* PHASE 1 PROCESSED */}

        {isPhase1 &&
          data.status !== 'SUBMITTED' && (
            <GlassCard className="mb-6">

              <h2 className="font-sans text-headline-sm font-bold text-white">
                Slot review
              </h2>

              <p className="mt-2 font-sans text-body-md text-white/50">
                This Phase 1 registration is
                currently{' '}
                <span className="text-white">
                  {data.status}
                </span>
                .
              </p>

            </GlassCard>
          )}

        {/* MANAGER */}

        {isPhase2 && (
          <GlassCard className="mb-6">

            <h2 className="font-sans text-headline-sm font-bold text-white">
              Team manager
            </h2>

            <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">

              <div>
                <p className="font-sans text-body-sm text-white/40">
                  Name
                </p>

                <p className="mt-1 font-sans text-body-md text-white">
                  {data.managerName || '—'}
                </p>
              </div>

              <div>
                <p className="font-sans text-body-sm text-white/40">
                  Position
                </p>

                <p className="mt-1 font-sans text-body-md text-white">
                  {data.managerPosition || '—'}
                </p>
              </div>

              <div>
                <p className="font-sans text-body-sm text-white/40">
                  Email
                </p>

                <p className="mt-1 break-all font-sans text-body-md text-white">
                  {data.managerEmail || '—'}
                </p>
              </div>

              <div>
                <p className="font-sans text-body-sm text-white/40">
                  Phone
                </p>

                <p className="mt-1 font-sans text-body-md text-white">
                  {data.managerPhone || '—'}
                </p>
              </div>

              <div>
                <p className="font-sans text-body-sm text-white/40">
                  Country
                </p>

                <p className="mt-1 font-sans text-body-md text-white">
                  {data.managerCountry || '—'}
                </p>
              </div>

              <div>
                <p className="font-sans text-body-sm text-white/40">
                  ID number
                </p>

                <p className="mt-1 font-sans text-body-md text-white">
                  {data.managerIdNumber || '—'}
                </p>
              </div>

            </div>

            {/* MANAGER DOCUMENTS */}

            <div className="mt-6 border-t border-white/10 pt-5">

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                <div>
                  <h3 className="font-sans text-body-lg font-semibold text-white">
                    Manager documents
                  </h3>

                  <p className="mt-1 font-sans text-body-sm text-white/40">
                    Identification documents uploaded by the team manager.
                  </p>
                </div>

                {data.managerDocuments &&
                  data.managerDocuments.length > 0 && (
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-sans text-xs text-white/50">
                      {data.managerDocuments.length}{' '}
                      document
                      {data.managerDocuments.length === 1
                        ? ''
                        : 's'}
                    </span>
                  )}

              </div>

              {data.managerDocuments &&
              data.managerDocuments.length > 0 ? (
                <div className="mt-5 grid gap-3 md:grid-cols-2">

                  {data.managerDocuments.map(
                    (document) => (
                      <div
                        key={document.id}
                        className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >

                        <div className="min-w-0">

                          <p className="font-sans text-body-md font-medium text-white">
                            {getDocumentLabel(
                              document.documentType
                            )}
                          </p>

                          <p className="mt-1 truncate font-sans text-body-sm text-white/40">
                            {document.originalFilename}
                          </p>

                          <div className="mt-2 flex flex-wrap gap-2">

                            <span className="rounded-full border border-white/10 bg-black/10 px-2.5 py-1 font-sans text-xs text-white/40">
                              {document.mimeType}
                            </span>

                            {document.size && (
                              <span className="rounded-full border border-white/10 bg-black/10 px-2.5 py-1 font-sans text-xs text-white/40">
                                {Math.round(
                                  document.size / 1024
                                )}{' '}
                                KB
                              </span>
                            )}

                          </div>

                        </div>

                        <GlassButton
                          type="button"
                          onClick={() =>
                            handleDocumentView(
                              document.id
                            )
                          }
                          disabled={
                            actionLoading ||
                            paymentActionLoading
                          }
                          className="shrink-0 border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
                        >
                          View
                        </GlassButton>

                      </div>
                    )
                  )}

                </div>
              ) : (
                <div className="mt-5 rounded-lg border border-white/10 bg-black/10 px-4 py-4">
                  <p className="font-sans text-body-sm text-white/40">
                    No manager documents uploaded.
                  </p>
                </div>
              )}

            </div>

          </GlassCard>
        )}

        {/* OFFICIALS */}

        {isPhase2 && (
          <GlassCard className="mb-6">

            <h2 className="font-sans text-headline-sm font-bold text-white">
              Officials
            </h2>

            <div className="mt-6 grid gap-6 md:grid-cols-2">

              <div className="rounded-lg border border-white/10 bg-white/5 p-5">
                <h3 className="font-sans text-body-lg font-semibold text-white">
                  Coach
                </h3>

                <div className="mt-4 space-y-3">

                  <div>
                    <p className="font-sans text-body-sm text-white/40">
                      Name
                    </p>

                    <p className="font-sans text-body-md text-white">
                      {data.coachName || '—'}
                    </p>
                  </div>

                  <div>
                    <p className="font-sans text-body-sm text-white/40">
                      Email
                    </p>

                    <p className="break-all font-sans text-body-md text-white">
                      {data.coachEmail || '—'}
                    </p>
                  </div>

                  <div>
                    <p className="font-sans text-body-sm text-white/40">
                      Phone
                    </p>

                    <p className="font-sans text-body-md text-white">
                      {data.coachPhone || '—'}
                    </p>
                  </div>

                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/5 p-5">
                <h3 className="font-sans text-body-lg font-semibold text-white">
                  Medic
                </h3>

                <div className="mt-4 space-y-3">

                  <div>
                    <p className="font-sans text-body-sm text-white/40">
                      Name
                    </p>

                    <p className="font-sans text-body-md text-white">
                      {data.medicName || '—'}
                    </p>
                  </div>

                  <div>
                    <p className="font-sans text-body-sm text-white/40">
                      Email
                    </p>

                    <p className="break-all font-sans text-body-md text-white">
                      {data.medicEmail || '—'}
                    </p>
                  </div>

                  <div>
                    <p className="font-sans text-body-sm text-white/40">
                      Phone
                    </p>

                    <p className="font-sans text-body-md text-white">
                      {data.medicPhone || '—'}
                    </p>
                  </div>

                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/5 p-5">
                <h3 className="font-sans text-body-lg font-semibold text-white">
                  Official
                </h3>

                <div className="mt-4 space-y-3">

                  <div>
                    <p className="font-sans text-body-sm text-white/40">
                      Name
                    </p>

                    <p className="font-sans text-body-md text-white">
                      {data.officialName || '—'}
                    </p>
                  </div>

                  <div>
                    <p className="font-sans text-body-sm text-white/40">
                      Email
                    </p>

                    <p className="break-all font-sans text-body-md text-white">
                      {data.officialEmail || '—'}
                    </p>
                  </div>

                  <div>
                    <p className="font-sans text-body-sm text-white/40">
                      Phone
                    </p>

                    <p className="font-sans text-body-md text-white">
                      {data.officialPhone || '—'}
                    </p>
                  </div>

                </div>
              </div>

            </div>
          </GlassCard>
        )}

        {/* PLAYERS */}

        {isPhase2 && (
          <GlassCard className="mb-6">

            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">

              <div>
                <h2 className="font-sans text-headline-sm font-bold text-white">
                  Players
                </h2>

                <p className="mt-1 font-sans text-body-sm text-white/40">
                  {data.team.players.length}{' '}
                  player
                  {data.team.players.length === 1
                    ? ''
                    : 's'} registered
                </p>
              </div>

            </div>

            {data.team.players.length === 0 ? (
              <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-6 text-center">
                <p className="font-sans text-body-md text-white/50">
                  No players have been added yet.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-4">

                {data.team.players.map(
                  (player) => (
                    <div
                      key={player.id}
                      className="rounded-xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">

                        <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                          <div>
                            <p className="font-sans text-body-sm text-white/40">
                              Player
                            </p>

                            <p className="mt-1 font-sans text-body-md font-medium text-white">
                              {player.firstName}{' '}
                              {player.lastName}
                            </p>
                          </div>

                          <div>
                            <p className="font-sans text-body-sm text-white/40">
                              Jersey number
                            </p>

                            <p className="mt-1 font-sans text-body-md text-white/70">
                              {player.jerseyNumber ?? '—'}
                            </p>
                          </div>

                          <div>
                            <p className="font-sans text-body-sm text-white/40">
                              Position
                            </p>

                            <p className="mt-1 font-sans text-body-md text-white/70">
                              {player.position || '—'}
                            </p>
                          </div>

                          <div>
                            <p className="font-sans text-body-sm text-white/40">
                              Status
                            </p>

                            <div className="mt-1">
                              <StatusBadge
                                status={player.status}
                              />
                            </div>
                          </div>

                        </div>

                        <div className="flex flex-wrap gap-2 xl:justify-end">

                          {player.status !== 'APPROVED' &&
                            player.status !== 'REJECTED' && (
                              <>
                                <GlassButton
                                  type="button"
                                  onClick={() =>
                                    handlePlayerAction(
                                      player.id,
                                      'approve'
                                    )
                                  }
                                  disabled={
                                    actionLoading
                                  }
                                  className="border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20"
                                >
                                  Approve
                                </GlassButton>

                                <GlassButton
                                  type="button"
                                  onClick={() =>
                                    handlePlayerAction(
                                      player.id,
                                      'request_changes'
                                    )
                                  }
                                  disabled={
                                    actionLoading
                                  }
                                  className="border-tertiary/30 bg-tertiary/10 text-tertiary hover:bg-tertiary/20"
                                >
                                  Changes
                                </GlassButton>

                                <GlassButton
                                  type="button"
                                  onClick={() =>
                                    handlePlayerAction(
                                      player.id,
                                      'reject'
                                    )
                                  }
                                  disabled={
                                    actionLoading
                                  }
                                  className="border-error/30 bg-error/10 text-error hover:bg-error/20"
                                >
                                  Reject
                                </GlassButton>
                              </>
                            )}

                        </div>
                      </div>

                      {/* PLAYER DOCUMENTS */}

                      <div className="mt-5 border-t border-white/10 pt-4">

                        <div className="mb-3 flex items-center justify-between gap-3">

                          <div>
                            <p className="font-sans text-body-sm font-medium text-white">
                              Player documents
                            </p>

                            <p className="mt-0.5 font-sans text-xs text-white/40">
                              {player.documents.length}{' '}
                              document
                              {player.documents.length === 1
                                ? ''
                                : 's'} uploaded
                            </p>
                          </div>

                        </div>

                        {player.documents.length === 0 ? (
                          <div className="rounded-lg border border-white/10 bg-black/10 px-4 py-3">
                            <p className="font-sans text-body-sm text-white/30">
                              No player documents uploaded.
                            </p>
                          </div>
                        ) : (
                          <div className="grid gap-3 md:grid-cols-2">

                            {player.documents.map(
                              (document) => (
                                <div
                                  key={document.id}
                                  className="flex flex-col gap-3 rounded-lg border border-white/10 bg-black/10 p-3 sm:flex-row sm:items-center sm:justify-between"
                                >

                                  <div className="min-w-0">

                                    <p className="font-sans text-body-sm font-medium text-white">
                                      {getDocumentLabel(
                                        document.documentType
                                      )}
                                    </p>

                                    <p className="mt-1 truncate font-sans text-xs text-white/40">
                                      {document.originalFilename}
                                    </p>

                                    <p className="mt-1 font-sans text-xs text-white/25">
                                      {document.mimeType}
                                    </p>

                                  </div>

                                  <GlassButton
                                    type="button"
                                    onClick={() =>
                                      handleDocumentView(
                                        document.id
                                      )
                                    }
                                    disabled={
                                      actionLoading ||
                                      paymentActionLoading
                                    }
                                    className="shrink-0 border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
                                  >
                                    View
                                  </GlassButton>

                                </div>
                              )
                            )}

                          </div>
                        )}

                      </div>

                    </div>
                  )
                )}

              </div>
            )}

          </GlassCard>
        )}

        {/* OFFICIAL DOCUMENTS */}

        {isPhase2 && (
          <GlassCard className="mb-6">

            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">

              <div>
                <h2 className="font-sans text-headline-sm font-bold text-white">
                  Official documents
                </h2>

                <p className="mt-1 font-sans text-body-sm text-white/40">
                  Coach, medic and official identification documents.
                </p>
              </div>

              {data.officialDocuments &&
                data.officialDocuments.length > 0 && (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-sans text-xs text-white/50">
                    {data.officialDocuments.length}{' '}
                    document
                    {data.officialDocuments.length === 1
                      ? ''
                      : 's'}
                  </span>
                )}

            </div>

            {data.officialDocuments &&
            data.officialDocuments.length > 0 ? (
              <div className="mt-6 space-y-3">

                {data.officialDocuments.map(
                  (document) => (
                    <div
                      key={document.id}
                      className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/5 p-4 md:flex-row md:items-center md:justify-between"
                    >

                      <div className="min-w-0">

                        <p className="font-sans text-body-md font-medium text-white">
                          {getDocumentLabel(
                            document.documentType
                          )}
                        </p>

                        <p className="mt-1 truncate font-sans text-body-sm text-white/40">
                          {document.originalFilename}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">

                          <span className="rounded-full border border-white/10 bg-black/10 px-2.5 py-1 font-sans text-xs text-white/40">
                            {document.mimeType}
                          </span>

                          {document.officialRole && (
                            <span className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 font-sans text-xs text-primary/70">
                              {document.officialRole}
                            </span>
                          )}

                        </div>

                      </div>

                      <GlassButton
                        type="button"
                        onClick={() =>
                          handleDocumentView(
                            document.id
                          )
                        }
                        disabled={
                          actionLoading ||
                          paymentActionLoading
                        }
                        className="shrink-0 border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
                      >
                        View
                      </GlassButton>

                    </div>
                  )
                )}

              </div>
            ) : (
              <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-6 text-center">
                <p className="font-sans text-body-md text-white/50">
                  No official documents found.
                </p>
              </div>
            )}

          </GlassCard>
        )}

        {/* =====================================================
            PAYMENT STATUS
        ===================================================== */}

        {isPhase2 && (
          <GlassCard className="mb-6">

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div>
                <h2 className="font-sans text-headline-sm font-bold text-white">
                  Payment
                </h2>

                <p className="mt-1 font-sans text-body-sm text-white/40">
                  Registration payment status.
                </p>
              </div>

              <span
                className={`rounded-full border px-3 py-1 font-sans text-body-sm ${
                  paymentApproved
                    ? 'border-green-500/30 bg-green-500/10 text-green-400'
                    : paymentUnderReview
                      ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
                      : paymentRejected
                        ? 'border-error/30 bg-error/10 text-error'
                        : paymentPending
                          ? 'border-primary/30 bg-primary/10 text-primary'
                          : 'border-white/10 bg-white/5 text-white/50'
                }`}
              >
                {data.paymentStatus
                  ? data.paymentStatus.replace(
                      /_/g,
                      ' '
                    )
                  : 'NOT REQUIRED'}
              </span>

            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-3">

              <div>
                <p className="font-sans text-body-sm text-white/40">
                  Registration fee
                </p>

                <p className="mt-1 font-sans text-body-lg font-semibold text-white">
                  {data.paymentAmount
                    ? `MVR ${data.paymentAmount.toString()}`
                    : data.tournament.registrationFeeAmount
                      ? `MVR ${data.tournament.registrationFeeAmount.toString()}`
                      : 'Not configured'}
                </p>
              </div>

              <div>
                <p className="font-sans text-body-sm text-white/40">
                  Payment deadline
                </p>

                <p className="mt-1 font-sans text-body-md text-white">
                  {data.paymentDeadline
                    ? new Date(
                        data.paymentDeadline
                      ).toLocaleDateString()
                    : data.tournament.paymentDeadline
                      ? new Date(
                          data.tournament.paymentDeadline
                        ).toLocaleDateString()
                      : 'Not configured'}
                </p>
              </div>

              <div>
                <p className="font-sans text-body-sm text-white/40">
                  Receipt
                </p>

                <div className="mt-1 flex flex-wrap items-center gap-2">

                  <p className="font-sans text-body-md text-white">
                    {data.paymentReceiptKey
                      ? 'Uploaded'
                      : 'Not uploaded'}
                  </p>

                  {data.paymentReceiptKey && (
                    <GlassButton
                      type="button"
                      onClick={
                        handlePaymentReceiptView
                      }
                      disabled={
                        paymentActionLoading
                      }
                      className="border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
                    >
                      {paymentActionLoading
                        ? 'Opening...'
                        : 'View receipt'}
                    </GlassButton>
                  )}

                </div>
              </div>

            </div>

            {data.paymentReceiptName && (
              <div className="mt-5 rounded-lg border border-white/10 bg-white/5 px-4 py-3">

                <p className="font-sans text-body-sm text-white/40">
                  Receipt file
                </p>

                <p className="mt-1 break-all font-sans text-body-md text-white">
                  {data.paymentReceiptName}
                </p>

                {data.paymentReceiptMimeType && (
                  <p className="mt-1 font-sans text-xs text-white/30">
                    {data.paymentReceiptMimeType}
                    {data.paymentReceiptSize
                      ? ` • ${Math.round(
                          data.paymentReceiptSize /
                            1024
                        )} KB`
                      : ''}
                  </p>
                )}

              </div>
            )}

            {data.paymentSubmittedAt && (
              <div className="mt-5">

                <p className="font-sans text-body-sm text-white/40">
                  Receipt submitted
                </p>

                <p className="mt-1 font-sans text-body-md text-white">
                  {new Date(
                    data.paymentSubmittedAt
                  ).toLocaleString()}
                </p>

              </div>
            )}

            {data.paymentVerifiedAt && (
              <div className="mt-4">

                <p className="font-sans text-body-sm text-white/40">
                  Payment verified
                </p>

                <p className="mt-1 font-sans text-body-md text-white">
                  {new Date(
                    data.paymentVerifiedAt
                  ).toLocaleString()}
                </p>

              </div>
            )}

            {paymentRejected &&
              data.paymentRejectionReason && (
                <div className="mt-5 rounded-lg border border-error/20 bg-error/10 p-4">

                  <p className="font-sans text-body-sm text-error">
                    Payment rejection reason
                  </p>

                  <p className="mt-1 whitespace-pre-wrap font-sans text-body-md text-white/80">
                    {data.paymentRejectionReason}
                  </p>

                </div>
              )}

            {/* PAYMENT VERIFICATION CONTROLS */}

            {paymentUnderReview && (
              <div className="mt-6 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-5">

                <div>
                  <p className="font-sans text-body-md font-medium text-yellow-400">
                    Payment verification required
                  </p>

                  <p className="mt-1 font-sans text-body-sm text-white/60">
                    The team has submitted its payment
                    receipt. Review the receipt before
                    approving or rejecting the payment.
                  </p>
                </div>

                <textarea
                  value={paymentRejectReason}
                  onChange={(event) =>
                    setPaymentRejectReason(
                      event.target.value
                    )
                  }
                  placeholder="Add a rejection reason if the payment is invalid or cannot be verified..."
                  rows={4}
                  className="mt-5 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 font-sans text-body-md text-white outline-none placeholder:text-white/30 focus:border-white/30"
                />

                <div className="mt-4 flex flex-wrap gap-3">

                  <GlassButton
                    type="button"
                    onClick={
                      handleApprovePayment
                    }
                    disabled={
                      paymentActionLoading
                    }
                    className="border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20"
                  >
                    {paymentActionLoading
                      ? 'Processing...'
                      : 'Approve Payment'}
                  </GlassButton>

                  <GlassButton
                    type="button"
                    onClick={
                      handleRejectPayment
                    }
                    disabled={
                      paymentActionLoading
                    }
                    className="border-error/30 bg-error/10 text-error hover:bg-error/20"
                  >
                    {paymentActionLoading
                      ? 'Processing...'
                      : 'Reject Payment'}
                  </GlassButton>

                </div>

              </div>
            )}

            {paymentPending && (
              <div className="mt-5 rounded-lg border border-primary/20 bg-primary/5 p-4">

                <p className="font-sans text-body-md font-medium text-primary">
                  Awaiting payment receipt
                </p>

                <p className="mt-1 font-sans text-body-sm text-white/60">
                  The payment request has been sent to
                  the team. The team must upload its
                  payment receipt before payment can be
                  verified.
                </p>

              </div>
            )}

            {paymentRejected && (
              <div className="mt-5 rounded-lg border border-error/20 bg-error/5 p-4">

                <p className="font-sans text-body-md font-medium text-error">
                  Payment rejected
                </p>

                <p className="mt-1 font-sans text-body-sm text-white/60">
                  The team can submit a new payment
                  receipt after correcting the payment
                  issue.
                </p>

              </div>
            )}

            {paymentApproved && (
              <div className="mt-5 rounded-lg border border-green-500/20 bg-green-500/10 p-4">

                <p className="font-sans text-body-md font-medium text-green-400">
                  Payment approved
                </p>

                <p className="mt-1 font-sans text-body-sm text-white/60">
                  Payment has been verified. The
                  registration still requires final
                  tournament administrator approval.
                </p>

              </div>
            )}

          </GlassCard>
        )}

        {/* =====================================================
            FINAL REVIEW
        ===================================================== */}

        {isPhase2 && (
          <GlassCard className="mb-10">

            <h2 className="font-sans text-headline-sm font-bold text-white">
              Final review
            </h2>

            <p className="mt-2 font-sans text-body-md text-white/50">
              Review the completed Phase 2
              registration before moving it to
              payment or making the final decision.
            </p>

            {/* WAITING FOR TEAM */}

            {isWaitingForTeam && (
              <div className="mt-6 rounded-lg border border-white/10 bg-white/5 px-5 py-4">

                <p className="font-sans text-body-md font-medium text-white">
                  Awaiting team submission
                </p>

                <p className="mt-1 font-sans text-body-sm text-white/50">
                  The team has been approved for
                  the tournament slot but has not
                  yet submitted its completed
                  Phase 2 registration.
                </p>

              </div>
            )}

            {/* CHANGES REQUESTED */}

            {isChangesRequested && (
              <div className="mt-6 rounded-lg border border-tertiary/30 bg-tertiary/10 px-5 py-4">

                <p className="font-sans text-body-md font-medium text-tertiary">
                  Changes requested
                </p>

                <p className="mt-1 font-sans text-body-sm text-white/60">
                  The team must update the
                  registration and resubmit it
                  before it can be reviewed again.
                </p>

                {data.internalNotes && (
                  <div className="mt-4 border-t border-tertiary/20 pt-4">

                    <p className="font-sans text-body-sm text-white/40">
                      Review note
                    </p>

                    <p className="mt-1 whitespace-pre-wrap font-sans text-body-md text-white/80">
                      {data.internalNotes}
                    </p>

                  </div>
                )}

              </div>
            )}

            {/* APPROVED */}

            {isApproved && (
              <div className="mt-6 rounded-lg border border-green-500/30 bg-green-500/10 px-5 py-4">

                <p className="font-sans text-body-md font-medium text-green-400">
                  Registration approved
                </p>

                <p className="mt-1 font-sans text-body-sm text-white/60">
                  This registration has already
                  received final approval.
                </p>

              </div>
            )}

            {/* REJECTED */}

            {isRejected && (
              <div className="mt-6 rounded-lg border border-error/30 bg-error/10 px-5 py-4">

                <p className="font-sans text-body-md font-medium text-error">
                  Registration rejected
                </p>

                <p className="mt-1 font-sans text-body-sm text-white/60">
                  This registration has already
                  been rejected.
                </p>

              </div>
            )}

            {/* PAYMENT TRANSITION */}

            {canSendToPayment && (
              <>

                <div className="mt-6 rounded-lg border border-primary/20 bg-primary/5 px-5 py-4">

                  <p className="font-sans text-body-md font-medium text-primary">
                    Registration ready for payment
                  </p>

                  <p className="mt-1 font-sans text-body-sm text-white/60">
                    Once you send this registration to
                    payment, the team will be able to
                    submit its registration fee receipt.
                  </p>

                  {paymentRejected && (
                    <p className="mt-3 font-sans text-body-sm text-error/80">
                      The previous payment was rejected.
                      Sending to payment again will allow
                      the team to submit a new receipt.
                    </p>
                  )}

                </div>

                <textarea
                  value={note}
                  onChange={(event) =>
                    setNote(event.target.value)
                  }
                  placeholder="Add a payment instruction or note (optional)…"
                  rows={4}
                  className="mt-6 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 font-sans text-body-md text-white outline-none placeholder:text-white/30 focus:border-white/30"
                />

                <div className="mt-4 flex flex-wrap gap-3">

                  <GlassButton
                    type="button"
                    onClick={
                      handleSendToPayment
                    }
                    disabled={
                      actionLoading
                    }
                    className="border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
                  >
                    {actionLoading
                      ? 'Processing...'
                      : paymentRejected
                        ? 'Send to Payment Again'
                        : 'Send to Payment'}
                  </GlassButton>

                  <GlassButton
                    type="button"
                    onClick={() =>
                      handleTeamAction(
                        'request_changes'
                      )
                    }
                    disabled={actionLoading}
                    className="border-tertiary/30 bg-tertiary/10 text-tertiary hover:bg-tertiary/20"
                  >
                    {actionLoading
                      ? 'Processing...'
                      : 'Request changes'}
                  </GlassButton>

                  <GlassButton
                    type="button"
                    onClick={() =>
                      handleTeamAction(
                        'reject'
                      )
                    }
                    disabled={actionLoading}
                    className="border-error/30 bg-error/10 text-error hover:bg-error/20"
                  >
                    {actionLoading
                      ? 'Processing...'
                      : 'Reject'}
                  </GlassButton>

                </div>

              </>
            )}

            {/* PAYMENT ALREADY APPROVED → FINAL APPROVAL */}

            {isReviewable &&
              paymentApproved && (
                <>

                  <div className="mt-6 rounded-lg border border-green-500/30 bg-green-500/10 px-5 py-4">

                    <p className="font-sans text-body-md font-medium text-green-400">
                      Payment approved
                    </p>

                    <p className="mt-1 font-sans text-body-sm text-white/60">
                      Payment has been verified.
                      This registration is now ready
                      for final approval.
                    </p>

                  </div>

                  <textarea
                    value={note}
                    onChange={(event) =>
                      setNote(event.target.value)
                    }
                    placeholder="Add a final approval note (optional)…"
                    rows={4}
                    className="mt-6 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 font-sans text-body-md text-white outline-none placeholder:text-white/30 focus:border-white/30"
                  />

                  <div className="mt-4 flex flex-wrap gap-3">

                    <GlassButton
                      type="button"
                      onClick={() =>
                        handleTeamAction(
                          'approve'
                        )
                      }
                      disabled={actionLoading}
                      className="border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20"
                    >
                      {actionLoading
                        ? 'Processing...'
                        : 'Approve Registration'}
                    </GlassButton>

                    <GlassButton
                      type="button"
                      onClick={() =>
                        handleTeamAction(
                          'request_changes'
                        )
                      }
                      disabled={actionLoading}
                      className="border-tertiary/30 bg-tertiary/10 text-tertiary hover:bg-tertiary/20"
                    >
                      {actionLoading
                        ? 'Processing...'
                        : 'Request changes'}
                    </GlassButton>

                    <GlassButton
                      type="button"
                      onClick={() =>
                        handleTeamAction(
                          'reject'
                        )
                      }
                      disabled={actionLoading}
                      className="border-error/30 bg-error/10 text-error hover:bg-error/20"
                    >
                      {actionLoading
                        ? 'Processing...'
                        : 'Reject'}
                    </GlassButton>

                  </div>

                </>
              )}

          </GlassCard>
        )}

      </div>

      {/* =====================================================
          DELETE CONFIRMATION
      ===================================================== */}

      {showDeleteDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-transparent/80 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-team-title"
        >

          <div className="w-full max-w-md rounded-2xl border border-error/20 bg-neutral-950 p-6 shadow-2xl">

            <h2
              id="delete-team-title"
              className="font-sans text-headline-sm font-bold text-white"
            >
              Delete team?
            </h2>

            <p className="mt-3 font-sans text-body-md leading-relaxed text-white/60">
              You are about to permanently
              delete{' '}
              <span className="font-semibold text-white">
                {data.team.name}
              </span>
              .
            </p>

            <p className="mt-3 font-sans text-body-sm leading-relaxed text-error/80">
              This will remove the team,
              registration, and related records.
              This action cannot be undone.
            </p>

            {actionError && (
              <div className="mt-4 rounded-lg border border-error/30 bg-error/10 px-4 py-3">
                <p className="font-sans text-body-sm text-error">
                  {actionError}
                </p>
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

              <GlassButton
                type="button"
                onClick={() =>
                  setShowDeleteDialog(false)
                }
                disabled={deleteLoading}
                className="border-white/10 bg-white/5 text-white hover:bg-white/10"
              >
                Cancel
              </GlassButton>

              <GlassButton
                type="button"
                onClick={handleDeleteTeam}
                disabled={deleteLoading}
                className="border-error/30 bg-error/10 text-error hover:bg-error/20"
              >
                {deleteLoading
                  ? 'Deleting...'
                  : 'Yes, delete team'}
              </GlassButton>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}