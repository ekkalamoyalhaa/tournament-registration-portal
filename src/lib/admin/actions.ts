'use server';

import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth/auth';
import { revalidatePath } from 'next/cache';

import {
  Prisma,
  RegistrationStatus,
} from '@prisma/client';

import { createSignedDownloadUrl } from '@/lib/r2/signed-url';

async function assertAdmin() {
  const session = await auth();

  const role = session?.user?.role as
    | string
    | undefined;

  if (
    role !== 'TOURNAMENT_ADMIN' &&
    role !== 'SUPER_ADMIN'
  ) {
    throw new Error('Unauthorized');
  }

  return session;
}

/* =========================================================
   TOURNAMENT PAYMENT CONFIGURATION
========================================================= */

/**
 * Get the payment configuration for the active/latest
 * tournament.
 *
 * Only tournament administrators can access this.
 */
export async function getTournamentPaymentSettings() {
  await assertAdmin();

  const tournament =
    await prisma.tournament.findFirst({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        registrationFeeAmount: true,
        paymentDeadline: true,
      },
    });

  if (!tournament) {
    throw new Error('Tournament not found');
  }

  return {
    id: tournament.id,
    name: tournament.name,
    registrationFeeAmount:
      tournament.registrationFeeAmount?.toString() ?? '',
    paymentDeadline:
      tournament.paymentDeadline?.toISOString() ?? null,
  };
}

/**
 * Configure the tournament-wide registration fee
 * and payment deadline.
 *
 * These values become the source of truth whenever
 * an administrator sends a registration to payment.
 */
export async function updateTournamentPaymentSettings(
  registrationFeeAmount: string,
  paymentDeadline: string
) {
  await assertAdmin();

  const amount = registrationFeeAmount.trim();
  const deadline = paymentDeadline.trim();

  if (!/^\d+(?:\.\d{1,2})?$/.test(amount)) {
    throw new Error(
      'Registration fee must be a valid MVR amount with up to two decimal places.'
    );
  }

  let fee: Prisma.Decimal;

  try {
    fee = new Prisma.Decimal(amount);
  } catch {
    throw new Error('Registration fee is invalid.');
  }

  if (fee.lessThanOrEqualTo(0)) {
    throw new Error(
      'Registration fee must be greater than MVR 0.'
    );
  }

  if (!deadline) {
    throw new Error(
      'Payment deadline is required.'
    );
  }

  const parsedDeadline = new Date(deadline);

  if (Number.isNaN(parsedDeadline.getTime())) {
    throw new Error(
      'Payment deadline is invalid.'
    );
  }

  if (parsedDeadline.getTime() <= Date.now()) {
    throw new Error(
      'Payment deadline must be in the future.'
    );
  }

  const tournament =
    await prisma.tournament.findFirst({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
      },
    });

  if (!tournament) {
    throw new Error('Tournament not found.');
  }

  const updated =
    await prisma.tournament.update({
      where: {
        id: tournament.id,
      },
      data: {
        registrationFeeAmount: fee,
        paymentDeadline: parsedDeadline,
      },
      select: {
        id: true,
        name: true,
        registrationFeeAmount: true,
        paymentDeadline: true,
      },
    });

  revalidatePath('/admin');
  revalidatePath('/admin/teams');
  revalidatePath('/team/dashboard');
  revalidatePath('/team/register');
  revalidatePath('/team/register/review');

  return {
    success: true,
    tournament: {
      id: updated.id,
      name: updated.name,
      registrationFeeAmount:
        updated.registrationFeeAmount?.toString() ?? '',
      paymentDeadline:
        updated.paymentDeadline?.toISOString() ?? null,
    },
  };
}

/* =========================================================
   DASHBOARD STATS
========================================================= */

export async function getAdminStats() {
  await assertAdmin();

  const [
    totalTeams,
    pendingPhase1,
    pendingPhase2,
    approved,
    changesRequested,
    rejected,
    totalPlayers,
    approvedPlayers,
    pendingPlayers,
    playerChangesRequested,
    totalDocs,
    tournament,
  ] = await Promise.all([
    prisma.teamRegistration.count(),

    prisma.teamRegistration.count({
      where: {
        phase: 'PHASE_1',
        status: 'SUBMITTED',
      },
    }),

    prisma.teamRegistration.count({
      where: {
        phase: 'PHASE_2',
        status: {
          in: [
            'SUBMITTED',
            'UNDER_REVIEW',
            'RESUBMITTED',
          ],
        },
      },
    }),

    prisma.teamRegistration.count({
      where: {
        status: 'APPROVED',
      },
    }),

    prisma.teamRegistration.count({
      where: {
        status: 'CHANGES_REQUESTED',
      },
    }),

    prisma.teamRegistration.count({
      where: {
        status: 'REJECTED',
      },
    }),

    prisma.player.count(),

    prisma.player.count({
      where: {
        status: 'APPROVED',
      },
    }),

    prisma.player.count({
      where: {
        status: {
          in: [
            'SUBMITTED',
            'UNDER_REVIEW',
          ],
        },
      },
    }),

    prisma.player.count({
      where: {
        status: 'CHANGES_REQUESTED',
      },
    }),

    prisma.playerDocument.count(),

    prisma.tournament.findFirst({
      orderBy: {
        createdAt: 'desc',
      },
    }),
  ]);

  return {
    totalTeams,
    pendingPhase1,
    pendingPhase2,
    pendingTeams:
      pendingPhase1 + pendingPhase2,
    approved,
    changesRequested,
    rejected,
    totalPlayers,
    approvedPlayers,
    pendingPlayers,
    playerChangesRequested,
    totalDocs,
    tournamentName:
      tournament?.name ?? 'Tournament',
  };
}

/* =========================================================
   PENDING TEAM REVIEWS
========================================================= */

export async function getPendingTeamReviews(
  limit = 5
) {
  await assertAdmin();

  return prisma.teamRegistration.findMany({
    where: {
      OR: [
        {
          phase: 'PHASE_1',
          status: 'SUBMITTED',
        },
        {
          phase: 'PHASE_2',
          status: {
            in: [
              'SUBMITTED',
              'UNDER_REVIEW',
              'RESUBMITTED',
            ],
          },
        },
      ],
    },
    include: {
      team: true,
    },
    orderBy: {
      updatedAt: 'desc',
    },
    take: limit,
  });
}

/* =========================================================
   PENDING PLAYER REVIEWS
========================================================= */

export async function getPendingPlayerReviews(
  limit = 5
) {
  await assertAdmin();

  return prisma.player.findMany({
    where: {
      status: {
        in: [
          'SUBMITTED',
          'UNDER_REVIEW',
        ],
      },
    },
    include: {
      team: true,
    },
    orderBy: {
      updatedAt: 'desc',
    },
    take: limit,
  });
}

/* =========================================================
   RECENT ACTIVITY
========================================================= */

export async function getRecentActivity(
  limit = 8
) {
  await assertAdmin();

  const events =
    await prisma.registrationEvent.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: {
        teamRegistration: {
          include: {
            team: true,
          },
        },
      },
    });

  return events.map(
    (e: (typeof events)[number]) => ({
      id: e.id,
      teamName:
        e.teamRegistration.team.name,
      toStatus: e.toStatus,
      note: e.note,
      createdAt: e.createdAt,
    })
  );
}

/* =========================================================
   TEAM LIST
========================================================= */

export async function getTeams(filters?: {
  status?: string;
  phase?: string;
}) {
  await assertAdmin();

  const where: any = {};

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.phase) {
    where.phase = filters.phase;
  }

  return prisma.teamRegistration.findMany({
    where,
    include: {
      team: true,
      tournament: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/* =========================================================
   TEAM DETAIL
========================================================= */

export async function getTeamDetail(
  registrationId: string
) {
  await assertAdmin();

  const registration =
    await prisma.teamRegistration.findUnique({
      where: {
        id: registrationId,
      },
      include: {
        tournament: true,
        team: {
          include: {
            players: {
              include: {
                documents: true,
              },
              orderBy: {
                createdAt: 'asc',
              },
            },
          },
        },
        events: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

  if (!registration) {
    throw new Error('Registration not found');
  }

  /* ---------------------------------------------------------
     MANAGER DOCUMENTS

     Manager documents are stored in PlayerDocument with:
       playerId = null
       officialRole = 'manager'

     The registration keeps the authoritative storage keys.
  --------------------------------------------------------- */

  const managerStorageKeys = [
    registration.managerIdDocKey,
    registration.managerPhotoKey,
  ].filter(
    (key): key is string => Boolean(key)
  );

  const managerDocuments =
    managerStorageKeys.length > 0
      ? await prisma.playerDocument.findMany({
          where: {
            playerId: null,
            storageKey: {
              in: managerStorageKeys,
            },
            officialRole: 'manager',
          },
          orderBy: {
            createdAt: 'asc',
          },
        })
      : [];

  /* ---------------------------------------------------------
     OFFICIAL DOCUMENTS

     Manager documents are intentionally excluded here because
     they are displayed separately in the Team Manager section.

     This section contains:
       - coach
       - medic
       - official
  --------------------------------------------------------- */

  const officialStorageKeys = [
    registration.coachIdDocKey,
    registration.coachPhotoKey,
    registration.medicIdDocKey,
    registration.medicPhotoKey,
    registration.officialIdDocKey,
    registration.officialPhotoKey,
  ].filter(
    (key): key is string => Boolean(key)
  );

  const officialDocuments =
  officialStorageKeys.length > 0
    ? await prisma.playerDocument.findMany({
        where: {
          playerId: null,
          storageKey: {
            in: officialStorageKeys,
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      })
    : [];

  /* ---------------------------------------------------------
     RETURN ADMIN TEAM DETAIL
  --------------------------------------------------------- */

  return {
    id: registration.id,

    status: registration.status,

    phase: registration.phase,

    /*
     * Division belongs to TeamRegistration, not Team.
     */
    division: registration.division,

    submittedAt:
      registration.submittedAt,

    reviewedAt:
      registration.reviewedAt,

    approvedAt:
      registration.approvedAt,

    internalNotes:
      registration.internalNotes,

    slotApprovedAt:
      registration.slotApprovedAt,

    slotApprovedBy:
      registration.slotApprovedBy,

    slotRejectionReason:
      registration.slotRejectionReason,

    /* -------------------------------------------------------
       PAYMENT
    ------------------------------------------------------- */

    paymentStatus:
      registration.paymentStatus,

    paymentAmount:
      registration.paymentAmount,

    paymentDeadline:
      registration.paymentDeadline,

    paymentReceiptKey:
      registration.paymentReceiptKey,

    paymentReceiptName:
      registration.paymentReceiptName,

    paymentReceiptMimeType:
      registration.paymentReceiptMimeType,

    paymentReceiptSize:
      registration.paymentReceiptSize,

    paymentSubmittedAt:
      registration.paymentSubmittedAt,

    paymentVerifiedAt:
      registration.paymentVerifiedAt,

    paymentVerifiedBy:
      registration.paymentVerifiedBy,

    paymentRejectionReason:
      registration.paymentRejectionReason,

    /* -------------------------------------------------------
       TOURNAMENT
    ------------------------------------------------------- */

    tournament: {
      id:
        registration.tournament.id,

      name:
        registration.tournament.name,

      slug:
        registration.tournament.slug,

      registrationFeeAmount:
        registration.tournament
          .registrationFeeAmount,

      paymentDeadline:
        registration.tournament
          .paymentDeadline,
    },

    /* -------------------------------------------------------
       TEAM
    ------------------------------------------------------- */

    team: {
      ...registration.team,

      players:
        registration.team.players.map(
          (player) => ({
            ...player,

            documents:
              player.documents.map(
                (document) => ({
                  id:
                    document.id,

                  documentType:
                    document.documentType,

                  storageKey:
                    document.storageKey,

                  originalFilename:
                    document.originalFilename,

                  mimeType:
                    document.mimeType,

                  size:
                    document.size,

                  createdAt:
                    document.createdAt,
                })
              ),
          })
        ),
    },

    /* -------------------------------------------------------
       PHASE 2 MANAGER
    ------------------------------------------------------- */

    managerName:
      registration.managerName,

    managerPosition:
      registration.managerPosition,

    managerEmail:
      registration.managerEmail,

    managerPhone:
      registration.managerPhone,

    managerCountry:
      registration.managerCountry,

    managerIdNumber:
      registration.managerIdNumber,

    managerIdDocKey:
      registration.managerIdDocKey,

    managerPhotoKey:
      registration.managerPhotoKey,

    /* -------------------------------------------------------
       MANAGER DOCUMENTS
    ------------------------------------------------------- */

    managerDocuments:
      managerDocuments.map(
        (document) => ({
          id:
            document.id,

          officialRole:
            document.officialRole,

          documentType:
            document.documentType,

          storageKey:
            document.storageKey,

          originalFilename:
            document.originalFilename,

          mimeType:
            document.mimeType,

          size:
            document.size,

          createdAt:
            document.createdAt,
        })
      ),

    /* -------------------------------------------------------
       COACH
    ------------------------------------------------------- */

    coachName:
      registration.coachName,

    coachEmail:
      registration.coachEmail,

    coachPhone:
      registration.coachPhone,

    coachIdDocKey:
      registration.coachIdDocKey,

    coachPhotoKey:
      registration.coachPhotoKey,

    /* -------------------------------------------------------
       MEDIC
    ------------------------------------------------------- */

    medicName:
      registration.medicName,

    medicEmail:
      registration.medicEmail,

    medicPhone:
      registration.medicPhone,

    medicIdNumber:
      registration.medicIdNumber,

    medicIdDocKey:
      registration.medicIdDocKey,

    medicPhotoKey:
      registration.medicPhotoKey,

    /* -------------------------------------------------------
       OTHER OFFICIAL
    ------------------------------------------------------- */

    officialName:
      registration.officialName,

    officialEmail:
      registration.officialEmail,

    officialPhone:
      registration.officialPhone,

    officialIdNumber:
      registration.officialIdNumber,

    officialIdDocKey:
      registration.officialIdDocKey,

    officialPhotoKey:
      registration.officialPhotoKey,

    /* -------------------------------------------------------
       OFFICIAL DOCUMENTS
    ------------------------------------------------------- */

    officialDocuments:
      officialDocuments.map(
        (document) => ({
          id:
            document.id,

          officialRole:
            document.officialRole,

          documentType:
            document.documentType,

          storageKey:
            document.storageKey,

          originalFilename:
            document.originalFilename,

          mimeType:
            document.mimeType,

          size:
            document.size,

          createdAt:
            document.createdAt,
        })
      ),

    /* -------------------------------------------------------
       REGISTRATION HISTORY
    ------------------------------------------------------- */

    events:
      registration.events,
  };
}

/* =========================================================
   ADMIN DOCUMENT VIEW
========================================================= */

export async function getAdminDocumentUrl(
  registrationId: string,
  documentId: string
) {
  await assertAdmin();

  const registration =
    await prisma.teamRegistration.findUnique({
      where: {
        id: registrationId,
      },
      select: {
        id: true,

        managerIdDocKey: true,
        managerPhotoKey: true,

        coachIdDocKey: true,
        coachPhotoKey: true,

        medicIdDocKey: true,
        medicPhotoKey: true,

        officialIdDocKey: true,
        officialPhotoKey: true,

        team: {
          select: {
            players: {
              select: {
                id: true,
                documents: {
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
        },
      },
    });

  if (!registration) {
    throw new Error(
      'Registration not found'
    );
  }

  const document =
    await prisma.playerDocument.findUnique({
      where: {
        id: documentId,
      },
      select: {
        id: true,
        playerId: true,
        storageKey: true,
      },
    });

  if (!document) {
    throw new Error(
      'Document not found'
    );
  }

  const officialKeys = [
    registration.managerIdDocKey,
    registration.managerPhotoKey,

    registration.coachIdDocKey,
    registration.coachPhotoKey,

    registration.medicIdDocKey,
    registration.medicPhotoKey,

    registration.officialIdDocKey,
    registration.officialPhotoKey,
  ].filter(
    (key): key is string =>
      Boolean(key)
  );

  const playerDocumentIds =
    new Set(
      registration.team.players.flatMap(
        (player) =>
          player.documents.map(
            (doc) => doc.id
          )
      )
    );

  const belongsToRegistration =
    officialKeys.includes(
      document.storageKey
    ) ||
    playerDocumentIds.has(
      document.id
    );

  if (!belongsToRegistration) {
    throw new Error(
      'Document does not belong to this registration'
    );
  }

  return {
    url:
      await createSignedDownloadUrl(
        document.storageKey,
        120
      ),
  };
}

/* =========================================================
   SLOT APPROVAL — PHASE 1
========================================================= */

export async function approveSlot(
  registrationId: string,
  note?: string
) {
  await assertAdmin();

  const reg =
    await prisma.teamRegistration.findUnique({
      where: {
        id: registrationId,
      },
    });

  if (!reg) {
    throw new Error(
      'Registration not found'
    );
  }

  if (
    reg.phase !== 'PHASE_1' ||
    reg.status !== 'SUBMITTED'
  ) {
    throw new Error(
      'Registration is not pending slot approval'
    );
  }

  const session = await auth();

  const updated =
    await prisma.teamRegistration.update({
      where: {
        id: registrationId,
      },
      data: {
        phase: 'PHASE_2',
        status:
          RegistrationStatus.DRAFT,
        slotApprovedAt:
          new Date(),
        slotApprovedBy:
          session?.user?.email ??
          'admin',
      },
    });

  await prisma.registrationEvent.create({
    data: {
      teamRegistrationId:
        registrationId,

      fromStatus:
        RegistrationStatus.SUBMITTED,

      toStatus:
        RegistrationStatus.DRAFT,

      note:
        note ||
        'Slot approved — team may proceed to Team Details Submission',
    },
  });

  revalidatePath('/admin');
  revalidatePath('/admin/teams');

  revalidatePath(
    `/admin/teams/${registrationId}`
  );

  revalidatePath(
    '/team/dashboard'
  );

  revalidatePath(
    '/team/register'
  );

  return {
    success: true,
    registration: updated,
  };
}

/* =========================================================
   SLOT REJECTION — PHASE 1
========================================================= */

export async function rejectSlot(
  registrationId: string,
  reason: string
) {
  await assertAdmin();

  const reg =
    await prisma.teamRegistration.findUnique({
      where: {
        id: registrationId,
      },
    });

  if (!reg) {
    throw new Error(
      'Registration not found'
    );
  }

  if (
    reg.phase !== 'PHASE_1'
  ) {
    throw new Error(
      'Not a Phase 1 registration'
    );
  }

  const updated =
    await prisma.teamRegistration.update({
      where: {
        id: registrationId,
      },
      data: {
        status:
          RegistrationStatus.REJECTED,

        slotRejectionReason:
          reason,
      },
    });

  await prisma.registrationEvent.create({
    data: {
      teamRegistrationId:
        registrationId,

      fromStatus:
        reg.status,

      toStatus:
        RegistrationStatus.REJECTED,

      note:
        reason ||
        'Slot rejected',
    },
  });

  revalidatePath('/admin');
  revalidatePath('/admin/teams');

  revalidatePath(
    `/admin/teams/${registrationId}`
  );

  revalidatePath(
    '/team/dashboard'
  );

  return {
    success: true,
    registration: updated,
  };
}

/* =========================================================
   SEND REGISTRATION TO PAYMENT
   PHASE 2
========================================================= */

export async function sendRegistrationToPayment(
  registrationId: string,
  note?: string
) {
  const session =
    await assertAdmin();

  const reg =
    await prisma.teamRegistration.findUnique({
      where: {
        id: registrationId,
      },
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            registrationFeeAmount: true,
            paymentDeadline: true,
          },
        },

        team: {
          select: {
            id: true,

            members: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    });

  if (!reg) {
    throw new Error(
      'Registration not found'
    );
  }

  if (
    reg.phase !== 'PHASE_2'
  ) {
    throw new Error(
      'Only Phase 2 registrations can be sent to payment.'
    );
  }

  const reviewableStatuses:
    RegistrationStatus[] = [
      RegistrationStatus.SUBMITTED,
      RegistrationStatus.UNDER_REVIEW,
      RegistrationStatus.RESUBMITTED,
    ];

  if (
    !reviewableStatuses.includes(
      reg.status
    )
  ) {
    throw new Error(
      `Registration cannot be sent to payment from status ${reg.status}.`
    );
  }

  if (
    reg.paymentStatus === 'PENDING'
  ) {
    throw new Error(
      'A payment request has already been sent for this registration.'
    );
  }

  if (
    reg.paymentStatus === 'UNDER_REVIEW'
  ) {
    throw new Error(
      'This registration already has a payment receipt under review.'
    );
  }

  if (
    reg.paymentStatus === 'APPROVED'
  ) {
    throw new Error(
      'Payment has already been approved for this registration.'
    );
  }

  const paymentAmount =
    reg.tournament
      .registrationFeeAmount;

  const paymentDeadline =
    reg.tournament
      .paymentDeadline;

  if (
    paymentAmount === null
  ) {
    throw new Error(
      'Registration fee has not been configured for this tournament.'
    );
  }

  if (
    paymentDeadline === null
  ) {
    throw new Error(
      'Payment deadline has not been configured for this tournament.'
    );
  }

  if (
    paymentDeadline.getTime() <=
    Date.now()
  ) {
    throw new Error(
      'The configured payment deadline has already passed.'
    );
  }

  const updated =
    await prisma.teamRegistration.update({
      where: {
        id: registrationId,
      },
      data: {
        paymentStatus:
          'PENDING',

        paymentAmount:
          paymentAmount,

        paymentDeadline:
          paymentDeadline,

        paymentRejectionReason:
          null,
      },
    });

  const adminEmail =
    session?.user?.email ??
    'tournament administrator';

  await prisma.registrationEvent.create({
    data: {
      teamRegistrationId:
        registrationId,

      fromStatus:
        reg.status,

      toStatus:
        reg.status,

      note:
        note?.trim() ||
        `Registration reviewed and sent to payment by ${adminEmail}.`,
    },
  });

  const amountText =
    paymentAmount.toString();

  const deadlineText =
    paymentDeadline.toLocaleDateString(
      'en-GB',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    );

  const notificationMessage =
    `A payment of MVR ${amountText} is required for ` +
    `${reg.tournament.name} by ${deadlineText}. ` +
    `Please upload your payment receipt before the deadline.`;

  const memberIds =
    Array.from(
      new Set(
        reg.team.members.map(
          (member) => member.userId
        )
      )
    );

  if (memberIds.length > 0) {
    await prisma.notification.createMany({
      data: memberIds.map(
        (userId) => ({
          userId,

          type:
            'PAYMENT_REQUIRED',

          channel:
            'in_app',

          payload: {
            registrationId:
              registrationId,

            tournamentId:
              reg.tournament.id,

            tournamentName:
              reg.tournament.name,

            title:
              'Payment Required',

            message:
              notificationMessage,

            amount:
              amountText,

            deadline:
              paymentDeadline.toISOString(),
          },

          sentAt:
            new Date(),
        })
      ),
    });
  }

  revalidatePath('/admin');
  revalidatePath('/admin/teams');

  revalidatePath(
    `/admin/teams/${registrationId}`
  );

  revalidatePath(
    '/team/dashboard'
  );

  revalidatePath(
    '/team/register'
  );

  revalidatePath(
    '/team/register/review'
  );

  return {
    success: true,
    registration: updated,
  };
}

/* =========================================================
   FINAL REVIEW — PHASE 2
========================================================= */

const VALID_TRANSITIONS: Record<
  RegistrationStatus,
  RegistrationStatus[]
> = {
  [RegistrationStatus.DRAFT]: [
    RegistrationStatus.SUBMITTED,
    RegistrationStatus.APPROVED,
    RegistrationStatus.REJECTED,
    RegistrationStatus.CHANGES_REQUESTED,
  ],

  [RegistrationStatus.SUBMITTED]: [
    RegistrationStatus.UNDER_REVIEW,
    RegistrationStatus.APPROVED,
    RegistrationStatus.REJECTED,
    RegistrationStatus.CHANGES_REQUESTED,
  ],

  [RegistrationStatus.UNDER_REVIEW]: [
    RegistrationStatus.APPROVED,
    RegistrationStatus.REJECTED,
    RegistrationStatus.CHANGES_REQUESTED,
  ],

  [RegistrationStatus.CHANGES_REQUESTED]: [
    RegistrationStatus.RESUBMITTED,
  ],

  [RegistrationStatus.RESUBMITTED]: [
    RegistrationStatus.UNDER_REVIEW,
    RegistrationStatus.APPROVED,
    RegistrationStatus.REJECTED,
  ],

  [RegistrationStatus.APPROVED]: [],

  [RegistrationStatus.REJECTED]: [],
};

void VALID_TRANSITIONS;

export async function reviewTeamRegistration(
  registrationId: string,
  action:
    | 'approve'
    | 'reject'
    | 'request_changes',
  note?: string
) {
  await assertAdmin();

  const reg =
    await prisma.teamRegistration.findUnique({
      where: {
        id: registrationId,
      },
    });

  if (!reg) {
    throw new Error(
      'Registration not found'
    );
  }

  if (
    reg.phase !== 'PHASE_2'
  ) {
    throw new Error(
      'Can only review Phase 2 registrations here'
    );
  }

  const statusMap: Record<
    | 'approve'
    | 'reject'
    | 'request_changes',
    RegistrationStatus
  > = {
    approve:
      RegistrationStatus.APPROVED,

    reject:
      RegistrationStatus.REJECTED,

    request_changes:
      RegistrationStatus.CHANGES_REQUESTED,
  };

  const nextStatus =
    statusMap[action];

  if (
    reg.status ===
    RegistrationStatus.CHANGES_REQUESTED
  ) {
    throw new Error(
      'This registration is already awaiting changes from the team.'
    );
  }

  const reviewableStatuses:
    RegistrationStatus[] = [
      RegistrationStatus.SUBMITTED,
      RegistrationStatus.UNDER_REVIEW,
      RegistrationStatus.RESUBMITTED,
    ];

  if (
    !reviewableStatuses.includes(
      reg.status
    )
  ) {
    throw new Error(
      `Registration cannot be reviewed from status ${reg.status}.`
    );
  }

  if (
    action === 'approve' &&
    reg.paymentStatus !==
      'APPROVED'
  ) {
    throw new Error(
      'Payment must be approved before the registration can receive final approval.'
    );
  }

  const reviewNote =
    note?.trim() ||
    (
      action ===
      'request_changes'
        ? 'Changes requested by tournament administrator'
        : action === 'approve'
          ? 'Registration approved by tournament administrator'
          : 'Registration rejected by tournament administrator'
    );

  const updated =
    await prisma.teamRegistration.update({
      where: {
        id: registrationId,
      },
      data: {
        status:
          nextStatus,

        reviewedAt:
          new Date(),

        internalNotes:
          action ===
          'request_changes'
            ? reviewNote
            : reg.internalNotes,
      },
    });

  await prisma.registrationEvent.create({
    data: {
      teamRegistrationId:
        registrationId,

      fromStatus:
        reg.status,

      toStatus:
        nextStatus,

      note:
        reviewNote,
    },
  });

  revalidatePath('/admin');
  revalidatePath('/admin/teams');

  revalidatePath(
    `/admin/teams/${registrationId}`
  );

  revalidatePath(
    '/team/dashboard'
  );

  revalidatePath(
    '/team/register/officials'
  );

  revalidatePath(
    '/team/register/players'
  );

  revalidatePath(
    '/team/register/review'
  );

  return {
    success: true,
    registration: updated,
  };
}

/* =========================================================
   PLAYER REVIEW
========================================================= */

export async function reviewPlayer(
  playerId: string,
  action:
    | 'approve'
    | 'reject'
    | 'request_changes',
  note?: string
) {
  await assertAdmin();

  const player =
    await prisma.player.findUnique({
      where: {
        id: playerId,
      },
    });

  if (!player) {
    throw new Error(
      'Player not found'
    );
  }

  const statusMap = {
    approve: 'APPROVED',
    reject: 'REJECTED',
    request_changes:
      'CHANGES_REQUESTED',
  } as const;

  const nextStatus =
    statusMap[action];

  await prisma.player.update({
    where: {
      id: playerId,
    },
    data: {
      status: nextStatus,
    },
  });

  revalidatePath('/admin');
  revalidatePath('/admin/teams');

  return {
    success: true,
  };
}

/* =========================================================
   DELETE TEAM
========================================================= */

export async function deleteTeamRegistration(
  registrationId: string
) {
  await assertAdmin();

  const registration =
    await prisma.teamRegistration.findUnique({
      where: {
        id: registrationId,
      },
      select: {
        id: true,
        teamId: true,
      },
    });

  if (!registration) {
    throw new Error(
      'Registration not found'
    );
  }

  await prisma.teamRegistration.delete({
    where: {
      id: registrationId,
    },
  });

  revalidatePath('/admin');
  revalidatePath('/admin/teams');

  revalidatePath(
    `/admin/teams/${registrationId}`
  );

  return {
    success: true,
    registrationId,
  };
}