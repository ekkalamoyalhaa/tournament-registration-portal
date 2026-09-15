'use server';

import {
  PutObjectCommand,
} from '@aws-sdk/client-s3';

import {
  getSignedUrl,
} from '@aws-sdk/s3-request-presigner';

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

const PAYMENT_RECEIPT_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
] as const;

const MAX_PAYMENT_RECEIPT_SIZE =
  10 * 1024 * 1024;

type PaymentReceiptUploadInput = {
  registrationId: string;
  filename: string;
  mimeType: string;
  size: number;
};

async function getCurrentUser() {
  const session = await auth();

  if (!session?.user?.email) {
    throw new Error('Unauthorized');
  }

  const user =
    await prisma.user.findUnique({
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
  const user =
    await getCurrentUser();

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

function getFileExtension(
  mimeType: string
) {
  switch (mimeType) {
    case 'application/pdf':
      return 'pdf';

    case 'image/png':
      return 'png';

    case 'image/jpeg':
      return 'jpg';

    default:
      throw new Error(
        'Payment receipt must be a PDF, PNG, or JPEG file.'
      );
  }
}

export async function getPaymentReceiptUploadUrl(
  input: PaymentReceiptUploadInput
) {
  const {
    registrationId,
    filename,
    mimeType,
    size,
  } = input;

  const {
    registration,
  } = await getRegistrationAccess(
    registrationId
  );

  if (
    registration.phase !==
    'PHASE_2'
  ) {
    throw new Error(
      'Payment is only available during Phase 2.'
    );
  }

  const allowedRegistrationStatuses:
    RegistrationStatus[] = [
      RegistrationStatus.SUBMITTED,
      RegistrationStatus.UNDER_REVIEW,
      RegistrationStatus.RESUBMITTED,
    ];

  if (
    !allowedRegistrationStatuses.includes(
      registration.status
    )
  ) {
    throw new Error(
      'Payment is not available for this registration yet.'
    );
  }

  const allowedPaymentStatuses:
    PaymentStatus[] = [
      PaymentStatus.PENDING,
      PaymentStatus.REJECTED,
    ];

  if (
    !allowedPaymentStatuses.includes(
      registration.paymentStatus
    )
  ) {
    throw new Error(
      'A payment receipt cannot be uploaded in the current payment status.'
    );
  }

  if (!filename?.trim()) {
    throw new Error(
      'Payment receipt filename is required.'
    );
  }

  if (
    !Number.isInteger(size) ||
    size <= 0
  ) {
    throw new Error(
      'Invalid payment receipt size.'
    );
  }

  if (
    size >
    MAX_PAYMENT_RECEIPT_SIZE
  ) {
    throw new Error(
      'Payment receipt cannot exceed 10 MB.'
    );
  }

  if (
    !PAYMENT_RECEIPT_MIME_TYPES.includes(
      mimeType as
        (typeof PAYMENT_RECEIPT_MIME_TYPES)[number]
    )
  ) {
    throw new Error(
      'Payment receipt must be a PDF, PNG, or JPEG file.'
    );
  }

  const paymentDeadline =
    registration.paymentDeadline ??
    registration.tournament
      .paymentDeadline ??
    null;

  if (!paymentDeadline) {
    throw new Error(
      'Payment deadline has not been configured.'
    );
  }

  if (
    paymentDeadline.getTime() <=
    Date.now()
  ) {
    throw new Error(
      'The payment deadline has passed.'
    );
  }

  const extension =
    getFileExtension(mimeType);

  /*
   * Generate the storage key on the server.
   *
   * The browser never gets to choose an arbitrary
   * registration/team path.
   */
  const storageKey = [
    'tournaments',
    registration.tournamentId,
    'teams',
    registration.teamId,
    'payment-receipts',
    `${crypto.randomUUID()}.${extension}`,
  ].join('/');

  const command =
    new PutObjectCommand({
      Bucket:
        R2_PRIVATE_BUCKET,

      Key:
        storageKey,

      ContentType:
        mimeType,
    });

  const uploadUrl =
    await getSignedUrl(
      r2PrivateClient,
      command,
      {
        expiresIn: 900,
      }
    );

  return {
    success: true,

    registrationId:
      registration.id,

    uploadUrl,

    storageKey,

    expiresIn: 900,
  };
}