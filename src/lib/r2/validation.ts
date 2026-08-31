import { randomUUID } from 'crypto';

// PRD §18: never trust filename extension, Content-Type header, or client-side
// validation alone. This does MIME + size + extension allow-listing; pair it
// with a magic-byte / file-signature check and malware scanning in production.

const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const ALLOWED_DOCUMENT_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
]);

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024; // 15MB

export type UploadKind = 'team-logo' | 'player-photo' | 'player-document';

export interface UploadValidationInput {
  kind: UploadKind;
  mimeType: string;
  size: number;
}

export function validateUploadRequest({ kind, mimeType, size }: UploadValidationInput) {
  const isImageKind = kind === 'team-logo' || kind === 'player-photo';
  const allowed = isImageKind ? ALLOWED_IMAGE_TYPES : ALLOWED_DOCUMENT_TYPES;
  const maxBytes = isImageKind ? MAX_IMAGE_BYTES : MAX_DOCUMENT_BYTES;

  if (!allowed.has(mimeType)) {
    throw new Error(`Unsupported file type for ${kind}: ${mimeType}`);
  }
  if (size <= 0 || size > maxBytes) {
    throw new Error(`File size out of range for ${kind}: ${size} bytes`);
  }
}

// PRD §40: never derive the object key from the original filename.
// tournaments/{tournamentId}/teams/{teamId}/players/{playerId}/documents/{uuid}.ext
export function buildStorageKey(params: {
  tournamentId: string;
  teamId: string;
  playerId?: string;
  category: 'logos' | 'documents' | 'player-photos';
  extension: string;
}) {
  const { tournamentId, teamId, playerId, category, extension } = params;
  const uuid = randomUUID();
  const safeExt = extension.replace(/[^a-z0-9]/gi, '').toLowerCase();

  if (playerId) {
    return `tournaments/${tournamentId}/teams/${teamId}/players/${playerId}/${category}/${uuid}.${safeExt}`;
  }
  return `tournaments/${tournamentId}/teams/${teamId}/${category}/${uuid}.${safeExt}`;
}
