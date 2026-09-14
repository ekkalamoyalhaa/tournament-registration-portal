import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { createPresignedUploadUrl } from '@/lib/r2/upload';
import { extensionFromMime } from '@/lib/r2/validation';

const ALLOWED_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
]);

const MAX_SIZE =
  10 * 1024 * 1024;

export async function POST(
  request: Request
) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json(
      {
        error: 'Unauthorized',
      },
      {
        status: 401,
      }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: 'Invalid JSON',
      },
      {
        status: 400,
      }
    );
  }

  if (
    !body ||
    typeof body !== 'object'
  ) {
    return NextResponse.json(
      {
        error: 'Invalid request body',
      },
      {
        status: 400,
      }
    );
  }

  const {
    registrationId,
    filename,
    contentType,
    size,
  } = body as {
    registrationId?: string;
    filename?: string;
    contentType?: string;
    size?: number;
  };

  if (
    !registrationId ||
    !filename ||
    !contentType ||
    typeof size !== 'number'
  ) {
    return NextResponse.json(
      {
        error:
          'registrationId, filename, contentType and size are required.',
      },
      {
        status: 400,
      }
    );
  }

  if (
    !ALLOWED_TYPES.has(
      contentType
    )
  ) {
    return NextResponse.json(
      {
        error:
          'Payment receipt must be a PDF, PNG, or JPEG file.',
      },
      {
        status: 400,
      }
    );
  }

  if (
    !Number.isInteger(size) ||
    size <= 0
  ) {
    return NextResponse.json(
      {
        error: 'Invalid file size.',
      },
      {
        status: 400,
      }
    );
  }

  if (size > MAX_SIZE) {
    return NextResponse.json(
      {
        error:
          'Payment receipt cannot exceed 10 MB.',
      },
      {
        status: 400,
      }
    );
  }

  const user =
    await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    });

  if (!user) {
    return NextResponse.json(
      {
        error: 'User not found.',
      },
      {
        status: 404,
      }
    );
  }

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
    return NextResponse.json(
      {
        error:
          'Registration not found or you do not have access to it.',
      },
      {
        status: 404,
      }
    );
  }

  if (
    registration.phase !==
    'PHASE_2'
  ) {
    return NextResponse.json(
      {
        error:
          'Payment is only available after slot approval.',
      },
      {
        status: 400,
      }
    );
  }

  if (
    ![
      'SUBMITTED',
      'UNDER_REVIEW',
      'RESUBMITTED',
    ].includes(registration.status)
  ) {
    return NextResponse.json(
      {
        error:
          'Payment is not available for this registration yet.',
      },
      {
        status: 400,
      }
    );
  }

  if (
    ![
      'PENDING',
      'REJECTED',
    ].includes(
      registration.paymentStatus
    )
  ) {
    return NextResponse.json(
      {
        error:
          'A payment receipt cannot be uploaded in the current payment status.',
      },
      {
        status: 400,
      }
    );
  }

  const extension =
    extensionFromMime(
      contentType
    );

  const storageKey =
    [
      'tournaments',
      registration.tournamentId,
      'teams',
      registration.teamId,
      'payment-receipts',
      `${crypto.randomUUID()}.${extension}`,
    ].join('/');

  /*
   * Local development fallback.
   */
  if (
    !process.env.R2_ACCOUNT_ID ||
    !process.env.R2_ACCESS_KEY_ID ||
    !process.env.R2_SECRET_ACCESS_KEY
  ) {
    return NextResponse.json({
      uploadUrl:
        '/api/uploads/dev-mock',
      key: storageKey,
    });
  }

  const uploadUrl =
    await createPresignedUploadUrl({
      bucket: 'private',
      storageKey,
      mimeType: contentType,
      size,
    });

  return NextResponse.json({
    uploadUrl,
    key: storageKey,
  });
}