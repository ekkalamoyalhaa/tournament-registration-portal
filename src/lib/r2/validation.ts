const ALLOWED_DOCUMENTS = new Set(['application/pdf', 'image/png', 'image/jpeg']);
const ALLOWED_LOGOS = new Set(['image/png', 'image/jpeg', 'image/webp']);

const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
const MAX_LOGO_BYTES = 5 * 1024 * 1024;

const SIGNATURES: Record<string, number[]> = {
  'image/png': [0x89, 0x50, 0x4e, 0x47],
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/webp': [0x52, 0x49, 0x46, 0x46],
  'application/pdf': [0x25, 0x50, 0x44, 0x46],
};

export function validateUpload({
  kind,
  mimeType,
  size,
  buffer,
}: {
  kind: 'logo' | 'document';
  mimeType: string;
  size: number;
  buffer?: Buffer;
}) {
  const allowed = kind === 'logo' ? ALLOWED_LOGOS : ALLOWED_DOCUMENTS;
  const max = kind === 'logo' ? MAX_LOGO_BYTES : MAX_DOCUMENT_BYTES;

  if (!allowed.has(mimeType)) {
    return { valid: false, error: `Type ${mimeType} not allowed for ${kind}` };
  }
  if (size > max) {
    return { valid: false, error: `File exceeds ${max / 1024 / 1024} MB` };
  }
  if (buffer && buffer.length > 0) {
    const sig = SIGNATURES[mimeType];
    if (sig && !sig.every((byte, i) => buffer[i] === byte)) {
      return { valid: false, error: 'File signature mismatch' };
    }
  }
  return { valid: true };
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