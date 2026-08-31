import { prisma } from '@/lib/db/prisma';
import { assertUserBelongsToTeam } from '@/lib/security/authorization';
import { assertValidRegistrationTransition, type RegistrationStatus } from './state-machine';

// PRD §21 — the backend performs final validation regardless of what the
// frontend's review screen shows as "ready to submit".
export async function submitRegistration(userId: string, teamRegistrationId: string) {
  const registration = await prisma.teamRegistration.findUniqueOrThrow({
    where: { id: teamRegistrationId },
    include: { team: { include: { players: { include: { documents: true } } } }, tournament: true },
  });

  await assertUserBelongsToTeam(userId, registration.teamId);
  assertValidRegistrationTransition(registration.status as RegistrationStatus, 'SUBMITTED');

  const requirements = await prisma.tournamentRequirement.findMany({
    where: { tournamentId: registration.tournamentId, isRequired: true },
  });

  const missing = validateCompleteness(registration, requirements);
  if (missing.length > 0) {
    throw new Error(`Registration incomplete: ${missing.join(', ')}`);
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.teamRegistration.update({
      where: { id: teamRegistrationId },
      data: { status: 'SUBMITTED', submittedAt: new Date() },
    });
    await tx.registrationEvent.create({
      data: {
        teamRegistrationId,
        fromStatus: registration.status,
        toStatus: 'SUBMITTED',
        actorUserId: userId,
      },
    });
    return updated;
  });
}

function validateCompleteness(
  registration: Awaited<ReturnType<typeof prisma.teamRegistration.findUniqueOrThrow>> & {
    team: { players: { documents: { documentType: string }[] }[] };
  },
  requirements: { fieldKey: string; fieldLabel: string; category: string }[]
) {
  const missing: string[] = [];
  if (!registration.managerName || !registration.managerEmail) {
    missing.push('Manager information');
  }
  if (registration.team.players.length === 0) {
    missing.push('At least one player');
  }

  const requiredDocs = requirements.filter((r) => r.category === 'document');
  for (const player of registration.team.players) {
    const uploaded = new Set(player.documents.map((d) => d.documentType));
    for (const doc of requiredDocs) {
      if (!uploaded.has(doc.fieldKey)) {
        missing.push(`${doc.fieldLabel} for a player`);
      }
    }
  }
  return [...new Set(missing)];
}

// PRD §23 — admin actions on a team registration.
export async function reviewTeamRegistration(params: {
  adminUserId: string;
  teamRegistrationId: string;
  action: 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT';
  note?: string;
}) {
  const { adminUserId, teamRegistrationId, action, note } = params;
  const toStatus: RegistrationStatus =
    action === 'APPROVE' ? 'APPROVED' : action === 'REJECT' ? 'REJECTED' : 'CHANGES_REQUESTED';

  const registration = await prisma.teamRegistration.findUniqueOrThrow({
    where: { id: teamRegistrationId },
  });

  assertValidRegistrationTransition(registration.status as RegistrationStatus, toStatus);

  return prisma.$transaction(async (tx) => {
    const updated = await tx.teamRegistration.update({
      where: { id: teamRegistrationId },
      data: {
        status: toStatus,
        reviewedAt: new Date(),
        approvedAt: toStatus === 'APPROVED' ? new Date() : undefined,
        internalNotes: note ?? registration.internalNotes,
      },
    });
    await tx.registrationEvent.create({
      data: {
        teamRegistrationId,
        fromStatus: registration.status,
        toStatus,
        actorUserId: adminUserId,
        note,
      },
    });
    await tx.auditLog.create({
      data: {
        userId: adminUserId,
        action: `registration.${action.toLowerCase()}`,
        resourceType: 'TeamRegistration',
        resourceId: teamRegistrationId,
        previousState: { status: registration.status },
        newState: { status: toStatus },
      },
    });
    return updated;
  });
}
