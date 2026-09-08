import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { createPresignedUploadUrl } from '@/lib/r2/presign';
import { validateUpload, extensionFromMime } from '@/lib/r2/validation';
import { randomUUID } from 'crypto';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { kind, mimeType, size, playerId, teamId, officialRole } = body;
  if (!kind || !mimeType || !size || !teamId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const membership = await prisma.teamMembership.findFirst({
    where: { userId: user.id, teamId },
  });
  if (!membership) {
    return NextResponse.json({ error: 'Not authorized for this team' }, { status: 403 });
  }

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { registrations: { include: { tournament: true } } },
  });
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });

  const tournamentId = team.registrations[0]?.tournamentId ?? 'default';

  const ext = extensionFromMime(mimeType);
  const uuid = randomUUID();
  let key: string;

  if (kind === 'logo') {
    const validation = validateUpload({ kind: 'logo', mimeType, size });
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    key = `tournaments/${tournamentId}/teams/${teamId}/logos/${uuid}.${ext}`;
  } else if (kind === 'document') {
    if (playerId) {
      const player = await prisma.player.findFirst({ where: { id: playerId, teamId } });
      if (!player) {
        return NextResponse.json({ error: 'Player not found on this team' }, { status: 404 });
      }
      const validation = validateUpload({ kind: 'document', mimeType, size });
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
      key = `tournaments/${tournamentId}/teams/${teamId}/players/${playerId}/documents/${uuid}.${ext}`;
    } else if (officialRole) {
      const validation = validateUpload({ kind: 'document', mimeType, size });
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
      key = `tournaments/${tournamentId}/teams/${teamId}/officials/${officialRole}/documents/${uuid}.${ext}`;
    } else {
      return NextResponse.json({ error: 'playerId or officialRole required for documents' }, { status: 400 });
    }
  } else {
    return NextResponse.json({ error: 'Invalid kind' }, { status: 400 });
  }

  if (!process.env.R2_ACCOUNT_ID) {
    return NextResponse.json({ uploadUrl: '/api/uploads/dev-mock', key });
  }

  const bucket = kind === 'logo' ? 'public' : 'private';
  const uploadUrl = await createPresignedUploadUrl({ bucket, key, mimeType, size });
  return NextResponse.json({ uploadUrl, key });
}