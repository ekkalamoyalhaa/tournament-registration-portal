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

  const reg = await prisma.teamRegistration.findUnique({
    where: { id: params.id },
    include: {
      team: { include: { players: true, documents: true } },
      events: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!reg) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(reg);
}