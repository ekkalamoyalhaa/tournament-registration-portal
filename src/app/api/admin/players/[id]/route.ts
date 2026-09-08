import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth/auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const role = session?.user?.role as string | undefined;
  if (role !== 'TOURNAMENT_ADMIN' && role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const player = await prisma.player.findUnique({
    where: { id: params.id },
    include: { team: true, documents: true },
  });

  if (!player) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(player);
}