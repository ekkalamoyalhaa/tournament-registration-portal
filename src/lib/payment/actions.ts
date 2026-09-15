
'use server';

import {
  GetObjectCommand,
} from '@aws-sdk/client-s3';

import {
  getSignedUrl,
} from '@aws-sdk/s3-request-presigner';

import { revalidatePath } from 'next/cache';

import {
  PaymentStatus,
  RegistrationStatus,
} from '@prisma/client';

import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth/auth';

import {
  r2PrivateClient,
  R2_PRIVATE_BUCKET,
} from '@/lib/r2/client';

/* =========================================================
   TYPES
========================================================= */

type PaymentReceiptData = {
  storageKey: string;
  originalFilename: string;
  mimeType: string;
  size: number;
};

/* =========================================================
   AUTH HELPERS
========================================================= */

async function getCurrentUser() {
  const session = await auth();

  if (!session?.user?.email) {
    throw new Error('Unauthorized');
  }

  const user = await prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
  });

  if (!user) {
    throw new Error('User not found.');
  }

  return user;
}

async function getRegistrationAccess(
  registrationId: string
) {
  const user = await getCurrentUser();

  const registration =
    await prisma.teamRegistration.findFirst({
      where: {
        id: registrationId,

        team: {
          members: {
            some: {
              userId: user.id,
            },
          },
        },
      },

      include: {
        tournament: true,
        team: true,
      },
    });

  if (!registration) {
    throw new Error(
      'Registration not found or you do not have access to it.'
    );
  }

  return {
    user,
    registration,
  };
}

async function assertAdmin() {
  const session = await auth();

  if (!session?.user?.email) {
    throw new Error('Unauthorized');
  }

  const role =
    session.user.role as string | undefined;

  if (
    role !== 'TOURNAMENT_ADMIN' &&
    role !== 'SUPER_ADMIN'
  ) {
    throw new Error('Unauthorized');
  }

  const user = await prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
  });

  if (!user) {
    throw new Error('User not found.');
  }

  return user;
}

/* =========================================================
   VALIDATION
========================================================= */

const PAYMENT_RECEIPT_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
] as const;

const MAX_PAYMENT_RECEIPT_SIZE =
  10 * 1024 * 1024;

function validatePaymentReceipt(
  data: PaymentReceiptData
) {
  if (!data.storageKey) {
    throw new Error(
      'Payment receipt storage key is required.'
    );
  }

  if (!data.originalFilename?.trim()) {
    throw new Error(
      'Payment receipt filename is required.'
    );
  }

  if (
    !Number.isInteger(data.size) ||
    data.size <= 0
  ) {
    throw new Error(
      'Invalid payment receipt size.'
    );
  }

  if (
    data.size >
    MAX_PAYMENT_RECEIPT_SIZE
  ) {
    throw new Error(
      'Payment receipt cannot exceed 10 MB.'
    );
  }

  if (
    !PAYMENT_RECEIPT_MIME_TYPES.includes(
      data.mimeType as
        (typeof PAYMENT_RECEIPT_MIME_TYPES)[number]
    )
  ) {
    throw new Error(
      'Payment receipt must be a PDF, PNG, or JPEG file.'
    );
  }
}

/* =========================================================
   PAYMENT DATA
========================================================= */

/**
 * Get payment information for one exact registration.
 *
 * This is intentionally registration-specific because
 * a user may have multiple teams.
 */
export async function getPaymentData(
  registrationId: string
) {
  const { registration } =
    await getRegistrationAccess(
      registrationId
    );

  const fee =
    registration.paymentAmount ??
    registration.tournament
      .registrationFeeAmount ??
    null;

  const deadline =
    registration.paymentDeadline ??
    registration.tournament
      .paymentDeadline ??
    null;

  return {
    registrationId:
      registration.id,

    tournamentName:
      registration.tournament.name,

    paymentAmount:
      fee?.toString() ?? null,

    paymentStatus:
      registration.paymentStatus,

    paymentDeadline:
      deadline,

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

    registrationStatus:
      registration.status,

    phase:
      registration.phase,
  };
}

/* =========================================================
   TEAM — SUBMIT RECEIPT
========================================================= */

/**
 * Save a payment receipt against the exact registration.
 *
 * This does NOT approve the payment.
 *
 * Flow:
 *
 * PENDING
 *    ↓
 * UNDER_REVIEW
 *
 * Admin must approve separately.
 */
export async function submitPaymentReceipt(
  registrationId: string,
  data: PaymentReceiptData
) {
  const { user, registration } =
    await getRegistrationAccess(
      registrationId
    );

  if (
    registration.phase !==
    'PHASE_2'
  ) {
    throw new Error(
      'Payment is only available after slot approval and during Phase 2.'
    );
  }

  const allowedStatuses:
    RegistrationStatus[] = [
      RegistrationStatus.SUBMITTED,
      RegistrationStatus.UNDER_REVIEW,
      RegistrationStatus.RESUBMITTED,
    ];

  if (
    !allowedStatuses.includes(
      registration.status
    )
  ) {
    throw new Error(
      'Payment is not available for this registration yet.'
    );
  }

  const allowedPaymentStatuses: PaymentStatus[] =
    [
      PaymentStatus.PENDING,
      PaymentStatus.REJECTED,
    ];

  if (
    !allowedPaymentStatuses.includes(
      registration.paymentStatus
    )
  ) {
    throw new Error(
      'A payment receipt cannot be submitted in the current payment status.'
    );
  }

  validatePaymentReceipt(data);

  /*
   * Prevent users from attaching an arbitrary R2 key
   * belonging to another registration/team.
   */
  const expectedPrefix =
    [
      'tournaments',
      registration.tournamentId,
      'teams',
      registration.teamId,
      'payment-receipts',
    ].join('/') + '/';

  if (
    !data.storageKey.startsWith(
      expectedPrefix
    )
  ) {
    throw new Error(
      'Invalid payment receipt storage key.'
    );
  }

  const paymentAmount =
    registration.paymentAmount ??
    registration.tournament
      .registrationFeeAmount ??
    null;

  const paymentDeadline =
    registration.paymentDeadline ??
    registration.tournament
      .paymentDeadline ??
    null;

  const updated =
    await prisma.teamRegistration.update({
      where: {
        id: registration.id,
      },

      data: {
        paymentStatus:
          PaymentStatus.UNDER_REVIEW,

        paymentAmount,

        paymentDeadline,

        paymentReceiptKey:
          data.storageKey,

        paymentReceiptName:
          data.originalFilename.trim(),

        paymentReceiptMimeType:
          data.mimeType,

        paymentReceiptSize:
          data.size,

        paymentSubmittedAt:
          new Date(),

        paymentVerifiedAt:
          null,

        paymentVerifiedBy:
          null,

        paymentRejectionReason:
          null,
      },
    });

  /*
   * Audit the payment action.
   *
   * Payment status is deliberately kept separate
   * from RegistrationStatus.
   */
  await prisma.auditLog.create({
    data: {
      userId: user.id,

      action:
        'PAYMENT_RECEIPT_SUBMITTED',

      resourceType:
        'TeamRegistration',

      resourceId:
        registration.id,

      previousState: {
        paymentStatus:
          registration.paymentStatus,
      },

      newState: {
        paymentStatus:
          PaymentStatus.UNDER_REVIEW,
      },

      metadata: {
        filename:
          data.originalFilename.trim(),

        mimeType:
          data.mimeType,

        size:
          data.size,
      },
    },
  });

  revalidatePath(
    '/team/dashboard'
  );

  revalidatePath(
    `/team/register/payment?registrationId=${encodeURIComponent(
      registrationId
    )}`
  );

  revalidatePath(
    `/team/register/review?registrationId=${encodeURIComponent(
      registrationId
    )}`
  );

  return {
    success: true,

    registrationId:
      updated.id,

    paymentStatus:
      updated.paymentStatus,
  };
}

/* =========================================================
   VIEW PAYMENT RECEIPT
========================================================= */

/**
 * Generate a temporary signed URL for the private
 * payment receipt.
 *
 * Access is allowed for:
 *
 * 1. Team members belonging to the registration's team
 * 2. TOURNAMENT_ADMIN
 * 3. SUPER_ADMIN
 *
 * The registration ID is always used to locate the
 * exact receipt. The client never supplies an arbitrary
 * R2 object key.
 */
export async function getPaymentReceiptUrl(
  registrationId: string
) {
  const session = await auth();

  if (!session?.user?.email) {
    throw new Error('Unauthorized');
  }

  const user =
    await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },

      select: {
        id: true,
        email: true,
        role: true,
      },
    });

  if (!user) {
    throw new Error('User not found.');
  }

  /*
   * Fetch the exact registration.
   */
  const registration =
    await prisma.teamRegistration.findUnique({
      where: {
        id: registrationId,
      },

      select: {
        id: true,
        teamId: true,
        tournamentId: true,

        paymentReceiptKey: true,
        paymentReceiptName: true,
        paymentReceiptMimeType: true,

        team: {
          select: {
            members: {
              where: {
                userId: user.id,
              },

              select: {
                id: true,
              },
            },
          },
        },
      },
    });

  if (!registration) {
    throw new Error(
      'Registration not found.'
    );
  }

  /*
   * Administrators may view payment receipts
   * from the admin registration review screen.
   */
  const isAdmin =
    user.role === 'TOURNAMENT_ADMIN' ||
    user.role === 'SUPER_ADMIN';

  /*
   * Team members may only view receipts belonging
   * to their own team.
   */
  const isTeamMember =
    registration.team.members.length > 0;

  if (
    !isAdmin &&
    !isTeamMember
  ) {
    throw new Error(
      'You do not have access to this payment receipt.'
    );
  }

  if (
    !registration.paymentReceiptKey
  ) {
    throw new Error(
      'No payment receipt has been uploaded.'
    );
  }

  /*
   * The receipt must be inside the exact
   * tournament/team payment-receipts directory.
   *
   * This prevents an authenticated user or admin
   * from turning this action into an arbitrary
   * R2 object downloader.
   */
  const expectedPrefix =
    [
      'tournaments',
      registration.tournamentId,
      'teams',
      registration.teamId,
      'payment-receipts',
    ].join('/') + '/';

  if (
    !registration.paymentReceiptKey.startsWith(
      expectedPrefix
    )
  ) {
    throw new Error(
      'Invalid payment receipt.'
    );
  }

  /*
   * Generate a temporary signed GET URL.
   */
  const command =
    new GetObjectCommand({
      Bucket:
        R2_PRIVATE_BUCKET,

      Key:
        registration.paymentReceiptKey,

      ResponseContentDisposition:
        `inline; filename="${encodeURIComponent(
          registration.paymentReceiptName ??
            'payment-receipt'
        )}"`,

      ResponseContentType:
        registration.paymentReceiptMimeType ??
        'application/octet-stream',
    });

  return getSignedUrl(
    r2PrivateClient,
    command,
    {
      expiresIn: 900,
    }
  );
}

/* =========================================================
   ADMIN — APPROVE PAYMENT
========================================================= */

/**
 * Approve payment only.
 *
 * IMPORTANT:
 * This DOES NOT approve the registration.
 *
 * Payment approval:
 *
 * UNDER_REVIEW
 *      ↓
 * APPROVED
 *
 * Registration remains in its current review status
 * until the administrator performs FINAL APPROVAL.
 */
export async function approveRegistrationPayment(
  registrationId: string
) {
  const admin =
    await assertAdmin();

  const registration =
    await prisma.teamRegistration.findUnique({
      where: {
        id: registrationId,
      },
    });

  if (!registration) {
    throw new Error(
      'Registration not found.'
    );
  }

  if (
    registration.phase !==
    'PHASE_2'
  ) {
    throw new Error(
      'Payment can only be approved for Phase 2 registrations.'
    );
  }

  if (
    registration.paymentStatus !==
    PaymentStatus.UNDER_REVIEW
  ) {
    throw new Error(
      'Payment is not currently awaiting verification.'
    );
  }

  if (
    !registration.paymentReceiptKey
  ) {
    throw new Error(
      'No payment receipt has been uploaded.'
    );
  }

  const updated =
    await prisma.teamRegistration.update({
      where: {
        id: registration.id,
      },

      data: {
        paymentStatus:
          PaymentStatus.APPROVED,

        paymentVerifiedAt:
          new Date(),

        paymentVerifiedBy:
          admin.email,

        paymentRejectionReason:
          null,
      },
    });

  await prisma.auditLog.create({
    data: {
      userId:
        admin.id,

      action:
        'PAYMENT_APPROVED',

      resourceType:
        'TeamRegistration',

      resourceId:
        registration.id,

      previousState: {
        paymentStatus:
          registration.paymentStatus,
      },

      newState: {
        paymentStatus:
          PaymentStatus.APPROVED,
      },

      metadata: {
        verifiedBy:
          admin.email,
      },
    },
  });

  revalidatePath(
    `/admin/teams/${registrationId}`
  );

  revalidatePath(
    '/admin/teams'
  );

  revalidatePath(
    '/admin'
  );

  revalidatePath(
    '/team/dashboard'
  );

  return {
    success: true,

    registrationId:
      updated.id,

    paymentStatus:
      updated.paymentStatus,
  };
}

/* =========================================================
   ADMIN — REJECT PAYMENT
========================================================= */

/**
 * Reject payment.
 *
 * Flow:
 *
 * UNDER_REVIEW
 *      ↓
 * REJECTED
 *
 * The team can then upload a replacement receipt.
 */
export async function rejectRegistrationPayment(
  registrationId: string,
  reason: string
) {
  const admin =
    await assertAdmin();

  const cleanReason =
    reason.trim();

  if (!cleanReason) {
    throw new Error(
      'A rejection reason is required.'
    );
  }

  if (
    cleanReason.length >
    2000
  ) {
    throw new Error(
      'Payment rejection reason is too long.'
    );
  }

  const registration =
    await prisma.teamRegistration.findUnique({
      where: {
        id: registrationId,
      },
    });

  if (!registration) {
    throw new Error(
      'Registration not found.'
    );
  }

  if (
    registration.paymentStatus !==
    PaymentStatus.UNDER_REVIEW
  ) {
    throw new Error(
      'Payment is not currently awaiting verification.'
    );
  }

  const updated =
    await prisma.teamRegistration.update({
      where: {
        id: registration.id,
      },

      data: {
        paymentStatus:
          PaymentStatus.REJECTED,

        paymentVerifiedAt:
          null,

        paymentVerifiedBy:
          null,

        paymentRejectionReason:
          cleanReason,
      },
    });

  await prisma.auditLog.create({
    data: {
      userId:
        admin.id,

      action:
        'PAYMENT_REJECTED',

      resourceType:
        'TeamRegistration',

      resourceId:
        registration.id,

      previousState: {
        paymentStatus:
          registration.paymentStatus,
      },

      newState: {
        paymentStatus:
          PaymentStatus.REJECTED,

        reason:
          cleanReason,
      },

      metadata: {
        rejectedBy:
          admin.email,
      },
    },
  });

  revalidatePath(
    `/admin/teams/${registrationId}`
  );

  revalidatePath(
    '/admin/teams'
  );

  revalidatePath(
    '/admin'
  );

  revalidatePath(
    '/team/dashboard'
  );

  return {
    success: true,

    registrationId:
      updated.id,

    paymentStatus:
      updated.paymentStatus,

    rejectionReason:
      updated.paymentRejectionReason,
  };
}
