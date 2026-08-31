import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// Public read endpoint (PRD §5). No auth required — never include private
// player info or document links here.
export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const tournament = await prisma.tournament.findUnique({
    where: { slug: params.slug },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      venue: true,
      startDate: true,
      endDate: true,
      registrationOpensAt: true,
      registrationClosesAt: true,
      status: true,
      rules: true,
      eligibility: true,
      availableTeamSlots: true,
      minPlayers: true,
      maxPlayers: true,
      announcements: { where: { status: 'PUBLISHED' }, orderBy: { publishedAt: 'desc' }, take: 10 },
    },
  });

  if (!tournament) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(tournament);
}
