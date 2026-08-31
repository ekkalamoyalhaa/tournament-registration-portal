import { prisma } from '@/lib/db/prisma';
import { assertUserBelongsToTeam } from '@/lib/security/authorization';
import { assertValidPlayerTransition, type PlayerStatus } from '../registrations/state-machine';
import { playerSchema, type PlayerInput } from '@/lib/validation/schemas/player';

export async function addPlayer(userId: string, teamId: string, input: PlayerInput) {
  await assertUserBelongsToTeam(userId, teamId);
  const data = playerSchema.parse(input);
  return prisma.player.create({ data: { ...data, teamId } });
}

export async function updatePlayer(userId: string, playerId: string, input: Partial<PlayerInput>) {
  const player = await prisma.player.findUniqueOrThrow({ where: { id: playerId } });
  await assertUserBelongsToTeam(userId, player.teamId);
  const data = playerSchema.partial().parse(input);
  return prisma.player.update({ where: { id: playerId }, data });
}

// PRD §25 — admin requests changes to a specific player without touching the
// rest of the team's registration.
export async function reviewPlayer(params: {
  adminUserId: string;
  playerId: string;
  action: 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT';
  note?: string;
}) {
  const { adminUserId, playerId, action, note } = params;
  const player = await prisma.player.findUniqueOrThrow({ where: { id: playerId } });

  const toStatus: PlayerStatus =
    action === 'APPROVE' ? 'APPROVED' : action === 'REJECT' ? 'REJECTED' : 'CHANGES_REQUESTED';

  assertValidPlayerTransition(player.status as PlayerStatus, toStatus);

  return prisma.$transaction(async (tx) => {
    const updated = await tx.player.update({ where: { id: playerId }, data: { status: toStatus } });
    await tx.auditLog.create({
      data: {
        userId: adminUserId,
        action: `player.${action.toLowerCase()}`,
        resourceType: 'Player',
        resourceId: playerId,
        previousState: { status: player.status },
        newState: { status: toStatus },
        metadata: note ? { note } : undefined,
      },
    });
    return updated;
  });
}

// PRD §25 — after the team manager uploads a replacement document, the
// player returns to UNDER_REVIEW rather than staying CHANGES_REQUESTED.
export async function resubmitPlayerDocument(userId: string, playerId: string) {
  const player = await prisma.player.findUniqueOrThrow({ where: { id: playerId } });
  await assertUserBelongsToTeam(userId, player.teamId);
  assertValidPlayerTransition(player.status as PlayerStatus, 'UNDER_REVIEW');
  return prisma.player.update({ where: { id: playerId }, data: { status: 'UNDER_REVIEW' } });
}
