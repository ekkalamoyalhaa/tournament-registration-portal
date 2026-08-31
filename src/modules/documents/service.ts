import { prisma } from '@/lib/db/prisma';
import { assertUserBelongsToTeam } from '@/lib/security/authorization';
import { validateUploadRequest, buildStorageKey, type UploadKind } from '@/lib/r2/validation';
import { createPresignedUploadUrl } from '@/lib/r2/upload';
import { createSignedDownloadUrl } from '@/lib/r2/signed-url';

// PRD §17 — called from the presign Route Handler after auth + authorization.
// Returns a short-lived PUT URL; the browser uploads directly to R2.
export async function requestUploadUrl(params: {
  userId: string;
  teamId: string;
  tournamentId: string;
  playerId?: string;
  kind: UploadKind;
  mimeType: string;
  size: number;
}) {
  const { userId, teamId, tournamentId, playerId, kind, mimeType, size } = params;
  await assertUserBelongsToTeam(userId, teamId);
  validateUploadRequest({ kind, mimeType, size });

  const extension = mimeType.split('/')[1] ?? 'bin';
  const isPublic = kind === 'team-logo';
  const storageKey = buildStorageKey({
    tournamentId,
    teamId,
    playerId,
    category: kind === 'team-logo' ? 'logos' : kind === 'player-photo' ? 'player-photos' : 'documents',
    extension,
  });

  return createPresignedUploadUrl({
    bucket: isPublic ? 'public' : 'private',
    storageKey,
    mimeType,
  });
}

// PRD §16 — admin viewing a private player document. Authorization for
// "is this user an admin" happens in the calling Route Handler / Server Action.
export async function getPlayerDocumentUrl(documentId: string) {
  const doc = await prisma.playerDocument.findUniqueOrThrow({ where: { id: documentId } });
  const url = await createSignedDownloadUrl(doc.storageKey, 60);
  return { url, expiresInSeconds: 60 };
}
