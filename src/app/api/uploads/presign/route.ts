import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { createPresignedUploadUrl } from '@/lib/r2/upload';
import {
  validateUpload,
  extensionFromMime,
  buildStorageKey,
  type UploadKind,
} from '@/lib/r2/validation';

type RequestBody = {
  kind?: string;

  // Current DocumentUploadCard fields
  filename?: string;
  contentType?: string;
  registrationId?: string;
  documentType?: string;

  // Existing upload fields
  mimeType?: string;
  size?: number;
  playerId?: string;
  teamId?: string;
  officialRole?: string;
};

const VALID_UPLOAD_KINDS: UploadKind[] = [
  'team-logo',
  'player-photo',
  'document',
];

const OFFICIAL_ROLES = [
  'manager',
  'coach',
  'medic',
  'official',
] as const;

const OFFICIAL_DOCUMENT_TYPES = [
  'manager_id_doc',
  'manager_photo',
  'coach_id_doc',
  'coach_photo',
  'medic_id_doc',
  'medic_photo',
  'official_id_doc',
  'official_photo',
] as const;

function isOfficialRole(
  value: string | undefined
): value is (typeof OFFICIAL_ROLES)[number] {
  return Boolean(
    value &&
      OFFICIAL_ROLES.includes(
        value as (typeof OFFICIAL_ROLES)[number]
      )
  );
}

function isOfficialDocumentType(
  value: string | undefined
): value is (typeof OFFICIAL_DOCUMENT_TYPES)[number] {
  return Boolean(
    value &&
      OFFICIAL_DOCUMENT_TYPES.includes(
        value as (typeof OFFICIAL_DOCUMENT_TYPES)[number]
      )
  );
}

function inferUploadKind(body: RequestBody): UploadKind | null {
  /*
   * The newer DocumentUploadCard sends documentType instead
   * of the old "kind" field.
   *
   * Infer the correct upload kind so both the old uploader
   * and the new uploader continue to work.
   */

  if (body.kind) {
    if (
      VALID_UPLOAD_KINDS.includes(
        body.kind as UploadKind
      )
    ) {
      return body.kind as UploadKind;
    }

    return null;
  }

  if (
    body.documentType === 'player_photo'
  ) {
    return 'player-photo';
  }

  if (
    body.playerId ||
    body.officialRole ||
    isOfficialDocumentType(
      body.documentType
    )
  ) {
    return 'document';
  }

  return null;
}

export async function POST(request: Request) {
  /*
   * ---------------------------------------------------------
   * AUTHENTICATION
   * ---------------------------------------------------------
   */

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

  /*
   * ---------------------------------------------------------
   * PARSE REQUEST
   * ---------------------------------------------------------
   */

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

  const data = body as RequestBody;

  /*
   * ---------------------------------------------------------
   * NORMALIZE OLD + NEW UPLOAD PAYLOADS
   * ---------------------------------------------------------
   */

  const mimeType =
    data.mimeType ??
    data.contentType ??
    '';

  const size = data.size;

  const teamId =
    typeof data.teamId === 'string'
      ? data.teamId
      : '';

  const playerId =
    typeof data.playerId === 'string' &&
    data.playerId.length > 0
      ? data.playerId
      : undefined;

  const officialRole =
    typeof data.officialRole === 'string' &&
    data.officialRole.length > 0
      ? data.officialRole
      : undefined;

  const registrationId =
    typeof data.registrationId === 'string' &&
    data.registrationId.length > 0
      ? data.registrationId
      : undefined;

  const documentType =
    typeof data.documentType === 'string' &&
    data.documentType.length > 0
      ? data.documentType
      : undefined;

  const uploadKind =
    inferUploadKind(data);

  /*
   * ---------------------------------------------------------
   * REQUIRED FIELD VALIDATION
   * ---------------------------------------------------------
   */

  if (
    !mimeType ||
    typeof size !== 'number' ||
    !Number.isFinite(size) ||
    size <= 0 ||
    !teamId ||
    !uploadKind
  ) {
    return NextResponse.json(
      {
        error: 'Missing required fields',
      },
      {
        status: 400,
      }
    );
  }

  if (
    !VALID_UPLOAD_KINDS.includes(
      uploadKind
    )
  ) {
    return NextResponse.json(
      {
        error: 'Invalid upload kind',
      },
      {
        status: 400,
      }
    );
  }

  /*
   * ---------------------------------------------------------
   * USER
   * ---------------------------------------------------------
   */

  const user =
    await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    });

  if (!user) {
    return NextResponse.json(
      {
        error: 'User not found',
      },
      {
        status: 404,
      }
    );
  }

  /*
   * ---------------------------------------------------------
   * TEAM ACCESS
   * ---------------------------------------------------------
   */

  const membership =
    await prisma.teamMembership.findFirst({
      where: {
        userId: user.id,
        teamId,
      },
    });

  if (!membership) {
    return NextResponse.json(
      {
        error:
          'Not authorized for this team',
      },
      {
        status: 403,
      }
    );
  }

  /*
   * ---------------------------------------------------------
   * TEAM
   * ---------------------------------------------------------
   */

  const team =
    await prisma.team.findUnique({
      where: {
        id: teamId,
      },
    });

  if (!team) {
    return NextResponse.json(
      {
        error: 'Team not found',
      },
      {
        status: 404,
      }
    );
  }

  /*
   * ---------------------------------------------------------
   * REGISTRATION
   *
   * If registrationId is supplied, ALWAYS use that exact
   * registration.
   *
   * This is important because one user can have multiple
   * teams / registrations.
   *
   * For older upload callers that don't send registrationId,
   * fall back to the team's latest registration.
   * ---------------------------------------------------------
   */

  let registration;

  if (registrationId) {
    registration =
      await prisma.teamRegistration.findFirst({
        where: {
          id: registrationId,
          teamId,
        },
      });

    if (!registration) {
      return NextResponse.json(
        {
          error:
            'Registration not found or does not belong to this team',
        },
        {
          status: 404,
        }
      );
    }
  } else {
    registration =
      await prisma.teamRegistration.findFirst({
        where: {
          teamId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

    if (!registration) {
      return NextResponse.json(
        {
          error:
            'Team has no registration',
        },
        {
          status: 400,
        }
      );
    }
  }

  const tournamentId =
    registration.tournamentId;

  /*
   * ---------------------------------------------------------
   * REGISTRATION PHASE
   * ---------------------------------------------------------
   */

  if (
    registration.phase !==
    'PHASE_2'
  ) {
    return NextResponse.json(
      {
        error:
          'Documents can only be uploaded in Phase 2',
      },
      {
        status: 400,
      }
    );
  }

  /*
   * ---------------------------------------------------------
   * FILE VALIDATION
   * ---------------------------------------------------------
   */

  const validation =
    validateUpload({
      kind: uploadKind,
      mimeType,
      size,
    });

  if (!validation.valid) {
    return NextResponse.json(
      {
        error: validation.error,
      },
      {
        status: 400,
      }
    );
  }

  /*
   * ---------------------------------------------------------
   * PLAYER / OFFICIAL VALIDATION
   * ---------------------------------------------------------
   */

  if (
    uploadKind === 'player-photo' ||
    uploadKind === 'document'
  ) {
    /*
     * PLAYER DOCUMENT
     */

    if (playerId) {
      const player =
        await prisma.player.findFirst({
          where: {
            id: playerId,
            teamId,
          },
          select: {
            id: true,
          },
        });

      if (!player) {
        return NextResponse.json(
          {
            error:
              'Player not found on this team',
          },
          {
            status: 404,
          }
        );
      }
    }

    /*
     * PLAYER PHOTO
     */

    if (
      uploadKind ===
        'player-photo' &&
      !playerId
    ) {
      return NextResponse.json(
        {
          error:
            'playerId required for player photos',
        },
        {
          status: 400,
        }
      );
    }

    /*
     * OFFICIAL DOCUMENT
     */

    if (
      uploadKind === 'document' &&
      !playerId
    ) {
      if (!officialRole) {
        return NextResponse.json(
          {
            error:
              'playerId or officialRole required for documents',
          },
          {
            status: 400,
          }
        );
      }

      if (
        !isOfficialRole(
          officialRole
        )
      ) {
        return NextResponse.json(
          {
            error:
              'Invalid official role',
          },
          {
            status: 400,
          }
        );
      }

      if (
        !documentType ||
        !isOfficialDocumentType(
          documentType
        )
      ) {
        return NextResponse.json(
          {
            error:
              'Invalid official document type',
          },
          {
            status: 400,
          }
        );
      }

      /*
       * Make sure the document type actually belongs
       * to the supplied official role.
       *
       * manager -> manager_id_doc / manager_photo
       * coach   -> coach_id_doc / coach_photo
       * medic   -> medic_id_doc / medic_photo
       * official -> official_id_doc / official_photo
       */

      const expectedPrefix =
        `${officialRole}_`;

      if (
        !documentType.startsWith(
          expectedPrefix
        )
      ) {
        return NextResponse.json(
          {
            error:
              'Document type does not match official role',
          },
          {
            status: 400,
          }
        );
      }
    }

    /*
     * Player documents must not also identify an official.
     */

    if (
      playerId &&
      officialRole
    ) {
      return NextResponse.json(
        {
          error:
            'A document cannot belong to both a player and an official',
        },
        {
          status: 400,
        }
      );
    }
  }

  /*
   * ---------------------------------------------------------
   * STORAGE KEY
   * ---------------------------------------------------------
   */

  const extension =
    extensionFromMime(mimeType);

  const category =
    uploadKind === 'team-logo'
      ? 'logos'
      : uploadKind ===
          'player-photo'
        ? 'player-photos'
        : 'documents';

  const key =
    buildStorageKey({
      tournamentId,
      teamId,
      playerId,
      category,
      extension,
    });

  /*
   * ---------------------------------------------------------
   * DEVELOPMENT FALLBACK
   * ---------------------------------------------------------
   */

  if (
    !process.env.R2_ACCOUNT_ID ||
    !process.env.R2_ACCESS_KEY_ID ||
    !process.env.R2_SECRET_ACCESS_KEY
  ) {
    return NextResponse.json({
      uploadUrl:
        '/api/uploads/dev-mock',
      key,
    });
  }

  /*
   * ---------------------------------------------------------
   * R2 BUCKET
   * ---------------------------------------------------------
   */

  const bucket =
    uploadKind === 'team-logo'
      ? 'public'
      : 'private';

  /*
   * ---------------------------------------------------------
   * CREATE PRESIGNED URL
   * ---------------------------------------------------------
   */

  const uploadUrl =
    await createPresignedUploadUrl({
      bucket,
      storageKey: key,
      mimeType,
      size,
    });

  return NextResponse.json({
    uploadUrl,
    key,
  });
}