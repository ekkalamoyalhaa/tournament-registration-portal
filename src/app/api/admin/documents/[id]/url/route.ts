import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth/auth';
import { createSignedDownloadUrl } from '@/lib/r2/signed-url';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const role = session?.user?.role as string | undefined;
  if (role !== 'TOURNAMENT_ADMIN' && role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const doc = await prisma.playerDocument.findUnique({
    where: { id: params.id },
  });

  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const url = await createSignedDownloadUrl(doc.storageKey, 60);
  return NextResponse.json({ url });
}