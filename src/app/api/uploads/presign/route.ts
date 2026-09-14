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

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON' },
      { status: 400 }
    );
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const {
    kind,
    mimeType,
    size,
    playerId,
    teamId,
    officialRole,
  } = body as {
    kind?: string;
    mimeType?: string;
    size?: number;
    playerId?: string;
    teamId?: string;
    officialRole?: string;
  };

  if (
    !kind ||
    !mimeType ||
    typeof size !== 'number' ||
    !teamId
  ) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  const validKinds: UploadKind[] = [
    'team-logo',
    'player-photo',
    'document',
  ];

  if (!validKinds.includes(kind as UploadKind)) {
    return NextResponse.json(
      { error: 'Invalid upload kind' },
      { status: 400 }
    );
  }

  const uploadKind = kind as UploadKind;

  const user = await prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }

  const membership = await prisma.teamMembership.findFirst({
    where: {
      userId: user.id,
      teamId,
    },
  });

  if (!membership) {
    return NextResponse.json(
      { error: 'Not authorized for this team' },
      { status: 403 }
    );
  }

  const team = await prisma.team.findUnique({
    where: {
      id: teamId,
    },
    include: {
      registrations: {
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      },
    },
  });

  if (!team) {
    return NextResponse.json(
      { error: 'Team not found' },
      { status: 404 }
    );
  }

  const registration = team.registrations[0];

  if (!registration) {
    return NextResponse.json(
      { error: 'Team has no registration' },
      { status: 400 }
    );
  }

  const tournamentId = registration.tournamentId;

  const validation = validateUpload({
    kind: uploadKind,
    mimeType,
    size,
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.error },
      { status: 400 }
    );
  }

  if (uploadKind === 'document' || uploadKind === 'player-photo') {
  if (playerId) {
    const player = await prisma.player.findFirst({
      where: {
        id: playerId,
        teamId,
      },
    });

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found on this team' },
        { status: 404 }
      );
    }
  } else if (uploadKind === 'document' && !officialRole) {
    return NextResponse.json(
      {
        error: 'playerId or officialRole required for documents',
      },
      { status: 400 }
    );
  } else if (uploadKind === 'player-photo') {
    return NextResponse.json(
      {
        error: 'playerId required for player photos',
      },
      { status: 400 }
    );
  }
}

  const extension = extensionFromMime(mimeType);

  const category =
    uploadKind === 'team-logo'
      ? 'logos'
      : uploadKind === 'player-photo'
        ? 'player-photos'
        : 'documents';

  const key = buildStorageKey({
    tournamentId,
    teamId,
    playerId,
    category,
    extension,
  });

  /*
   * Development fallback.
   *
   * This allows the rest of the application to run when
   * R2 credentials are not configured locally.
   */
  if (
    !process.env.R2_ACCOUNT_ID ||
    !process.env.R2_ACCESS_KEY_ID ||
    !process.env.R2_SECRET_ACCESS_KEY
  ) {
    return NextResponse.json({
      uploadUrl: '/api/uploads/dev-mock',
      key,
    });
  }

  const bucket =
    uploadKind === 'team-logo'
      ? 'public'
      : 'private';

  const uploadUrl = await createPresignedUploadUrl({
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