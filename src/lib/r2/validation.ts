export type UploadKind = 'team-logo' | 'player-photo' | 'document';

const ALLOWED_DOCUMENTS = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
]);

const ALLOWED_LOGOS = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
]);

const ALLOWED_PLAYER_PHOTOS = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
]);

const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
const MAX_LOGO_BYTES = 5 * 1024 * 1024;
const MAX_PLAYER_PHOTO_BYTES = 5 * 1024 * 1024;

const SIGNATURES: Record<string, number[]> = {
  'image/png': [0x89, 0x50, 0x4e, 0x47],
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/webp': [0x52, 0x49, 0x46, 0x46],
  'application/pdf': [0x25, 0x50, 0x44, 0x46],
};

function getAllowedTypes(kind: UploadKind): Set<string> {
  switch (kind) {
    case 'team-logo':
      return ALLOWED_LOGOS;

    case 'player-photo':
      return ALLOWED_PLAYER_PHOTOS;

    case 'document':
      return ALLOWED_DOCUMENTS;
  }
}

function getMaxSize(kind: UploadKind): number {
  switch (kind) {
    case 'team-logo':
      return MAX_LOGO_BYTES;

    case 'player-photo':
      return MAX_PLAYER_PHOTO_BYTES;

    case 'document':
      return MAX_DOCUMENT_BYTES;
  }
}

export function validateUpload({
  kind,
  mimeType,
  size,
  buffer,
}: {
  kind: UploadKind;
  mimeType: string;
  size: number;
  buffer?: Buffer;
}): { valid: true } | { valid: false; error: string } {
  const allowed = getAllowedTypes(kind);
  const max = getMaxSize(kind);

  if (!allowed.has(mimeType)) {
    return {
      valid: false,
      error: `Type ${mimeType} not allowed for ${kind}`,
    };
  }

  if (!Number.isFinite(size) || size <= 0) {
    return {
      valid: false,
      error: 'Invalid file size',
    };
  }

  if (size > max) {
    return {
      valid: false,
      error: `File exceeds ${max / 1024 / 1024} MB`,
    };
  }

  if (buffer && buffer.length > 0) {
    const signature = SIGNATURES[mimeType];

    if (
      signature &&
      !signature.every((byte, index) => buffer[index] === byte)
    ) {
      return {
        valid: false,
        error: 'File signature mismatch',
      };
    }
  }

  return { valid: true };
}

export function validateUploadRequest({
  kind,
  mimeType,
  size,
}: {
  kind: UploadKind;
  mimeType: string;
  size: number;
}): void {
  const result = validateUpload({
    kind,
    mimeType,
    size,
  });

  if (!result.valid) {
    throw new Error(result.error);
  }
}

export function extensionFromMime(mimeType: string): string {
  const map: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'application/pdf': 'pdf',
  };

  return map[mimeType] || 'bin';
}

export function buildStorageKey({
  tournamentId,
  teamId,
  playerId,
  category,
  extension,
}: {
  tournamentId: string;
  teamId: string;
  playerId?: string;
  category: 'logos' | 'player-photos' | 'documents';
  extension: string;
}): string {
  const safeExtension =
    extension.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'bin';

  const parts = [
    'tournaments',
    tournamentId,
    'teams',
    teamId,
    category,
  ];

  if (playerId) {
    parts.push('players', playerId);
  }

  const uniqueId = crypto.randomUUID();

  return `${parts.join('/')}/${uniqueId}.${safeExtension}`;
}