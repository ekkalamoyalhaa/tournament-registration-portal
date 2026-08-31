import { prisma } from '@/lib/db/prisma';

// PRD §35 — do not rely on roles alone; enforce ownership on every
// team-scoped read/write. Example: GET /team/:teamId/players must check
// the requesting user actually belongs to that team.

export async function userBelongsToTeam(userId: string, teamId: string) {
  const membership = await prisma.teamMembership.findUnique({
    where: { userId_teamId: { userId, teamId } },
  });
  return membership !== null;
}

export async function assertUserBelongsToTeam(userId: string, teamId: string) {
  const belongs = await userBelongsToTeam(userId, teamId);
  if (!belongs) {
    throw new AuthorizationError(`User ${userId} does not belong to team ${teamId}`);
  }
}

export class AuthorizationError extends Error {
  status = 403 as const;
}

// Admin-role checks are cheap role lookups; ownership checks above are the
// part that's easy to forget and the part PRD §35 calls out specifically.
export function isAdminRole(role: string) {
  return role === 'TOURNAMENT_ADMIN' || role === 'SUPER_ADMIN';
}
