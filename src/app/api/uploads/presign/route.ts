import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { requestUploadUrl } from '@/modules/documents/service';

// PRD §17 route: Browser -> Next.js (auth + authorize + validate) -> presigned
// R2 URL -> Browser uploads directly to R2.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { teamId, tournamentId, playerId, kind, mimeType, size } = body;

  try {
    const result = await requestUploadUrl({
      userId: (session.user as { id: string }).id,
      teamId,
      tournamentId,
      playerId,
      kind,
      mimeType,
      size,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload request failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
