'use server';

import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth/auth';
import { revalidatePath } from 'next/cache';
import { RegistrationStatus } from '@prisma/client';

async function assertAdmin() {
  const session = await auth();
  const role = session?.user?.role as string | undefined;
  if (role !== 'TOURNAMENT_ADMIN' && role !== 'SUPER_ADMIN') {
    throw new Error('Unauthorized');
  }
  return session;
}

/* ---------- dashboard stats ---------- */

export async function getAdminStats() {
  await assertAdmin();

  const [totalTeams, pendingPhase1, pendingPhase2, approved, changesRequested, rejected, totalPlayers, totalDocs] =
    await Promise.all([
      prisma.teamRegistration.count(),
      prisma.teamRegistration.count({ where: { phase: 'PHASE_1', status: 'SUBMITTED' } }),
      prisma.teamRegistration.count({
        where: { phase: 'PHASE_2', status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'RESUBMITTED'] } },
      }),
      prisma.teamRegistration.count({ where: { status: 'APPROVED' } }),
      prisma.teamRegistration.count({ where: { status: 'CHANGES_REQUESTED' } }),
      prisma.teamRegistration.count({ where: { status: 'REJECTED' } }),
      prisma.player.count(),
      prisma.playerDocument.count(),
    ]);

  return {
    totalTeams,
    pendingPhase1,
    pendingPhase2,
    approved,
    changesRequested,
    rejected,
    totalPlayers,
    totalDocs,
  };
}

/* ---------- team list ---------- */

export async function getTeams(filters?: { status?: string; phase?: string }) {
  await assertAdmin();

  const where: any = {};
  if (filters?.status) where.status = filters.status;
  if (filters?.phase) where.phase = filters.phase;

  return prisma.teamRegistration.findMany({
    where,
    include: { team: true, tournament: true },
    orderBy: { createdAt: 'desc' },
  });
}

/* ---------- team detail ---------- */

export async function getTeamDetail(id: string) {
  await assertAdmin();

  return prisma.teamRegistration.findUnique({
    where: { id },
    include: {
      team: {
        include: {
          players: { include: { documents: true }, orderBy: { createdAt: 'desc' } },
          members: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        },
      },
      tournament: true,
      events: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  });
}

/* ---------- slot approval (phase 1) ---------- */

export async function approveSlot(registrationId: string, note?: string) {
  await assertAdmin();

  const reg = await prisma.teamRegistration.findUnique({ where: { id: registrationId } });
  if (!reg) throw new Error('Registration not found');
  if (reg.phase !== 'PHASE_1' || reg.status !== 'SUBMITTED') {
    throw new Error('Registration is not pending slot approval');
  }

  const session = await auth();
  const updated = await prisma.teamRegistration.update({
    where: { id: registrationId },
    data: {
      phase: 'PHASE_2',
      status: RegistrationStatus.DRAFT,
      slotApprovedAt: new Date(),
      slotApprovedBy: session?.user?.email ?? 'admin',
    },
  });

  await prisma.registrationEvent.create({
    data: {
      teamRegistrationId: registrationId,
      fromStatus: RegistrationStatus.SUBMITTED,
      toStatus: RegistrationStatus.DRAFT,
      note: note || 'Slot approved — team may proceed to Team Details Submission',
    },
  });

  revalidatePath('/admin/teams');
  revalidatePath(`/admin/teams/${registrationId}`);
  return { success: true, registration: updated };
}

export async function rejectSlot(registrationId: string, reason: string) {
  await assertAdmin();

  const reg = await prisma.teamRegistration.findUnique({ where: { id: registrationId } });
  if (!reg) throw new Error('Registration not found');
  if (reg.phase !== 'PHASE_1') throw new Error('Not a Phase 1 registration');

  const updated = await prisma.teamRegistration.update({
    where: { id: registrationId },
    data: { status: RegistrationStatus.REJECTED, slotRejectionReason: reason },
  });

  await prisma.registrationEvent.create({
    data: {
      teamRegistrationId: registrationId,
      fromStatus: reg.status,
      toStatus: RegistrationStatus.REJECTED,
      note: reason || 'Slot rejected',
    },
  });

  revalidatePath('/admin/teams');
  revalidatePath(`/admin/teams/${registrationId}`);
  return { success: true, registration: updated };
}

/* ---------- final review (phase 2) ---------- */

const VALID_TRANSITIONS: Record<RegistrationStatus, RegistrationStatus[]> = {
  [RegistrationStatus.DRAFT]: [
    RegistrationStatus.SUBMITTED,
    RegistrationStatus.APPROVED,
    RegistrationStatus.REJECTED,
    RegistrationStatus.CHANGES_REQUESTED,
  ],
  [RegistrationStatus.SUBMITTED]: [
    RegistrationStatus.UNDER_REVIEW,
    RegistrationStatus.APPROVED,
    RegistrationStatus.REJECTED,
    RegistrationStatus.CHANGES_REQUESTED,
  ],
  [RegistrationStatus.UNDER_REVIEW]: [
    RegistrationStatus.APPROVED,
    RegistrationStatus.REJECTED,
    RegistrationStatus.CHANGES_REQUESTED,
  ],
  [RegistrationStatus.CHANGES_REQUESTED]: [RegistrationStatus.RESUBMITTED],
  [RegistrationStatus.RESUBMITTED]: [
    RegistrationStatus.UNDER_REVIEW,
    RegistrationStatus.APPROVED,
    RegistrationStatus.REJECTED,
  ],
  [RegistrationStatus.APPROVED]: [],
  [RegistrationStatus.REJECTED]: [],
};

export async function reviewTeamRegistration(
  registrationId: string,
  action: 'approve' | 'reject' | 'request_changes',
  note?: string
) {
  await assertAdmin();

  const reg = await prisma.teamRegistration.findUnique({ where: { id: registrationId } });
  if (!reg) throw new Error('Registration not found');
  if (reg.phase !== 'PHASE_2') throw new Error('Can only review Phase 2 registrations here');

  const statusMap: Record<string, RegistrationStatus> = {
    approve: RegistrationStatus.APPROVED,
    reject: RegistrationStatus.REJECTED,
    request_changes: RegistrationStatus.CHANGES_REQUESTED,
  };

  const nextStatus = statusMap[action];
  const allowed = VALID_TRANSITIONS[reg.status];

  if (!allowed || !allowed.includes(nextStatus)) {
    throw new Error(`Invalid transition: ${reg.status} → ${nextStatus}`);
  }

  const updated = await prisma.teamRegistration.update({
    where: { id: registrationId },
    data: { status: nextStatus },
  });

  await prisma.registrationEvent.create({
    data: {
      teamRegistrationId: registrationId,
      fromStatus: reg.status,
      toStatus: nextStatus,
      note: note || `${action} by admin`,
    },
  });

  revalidatePath('/admin/teams');
  revalidatePath(`/admin/teams/${registrationId}`);
  return { success: true, registration: updated };
}

export async function reviewPlayer(
  playerId: string,
  action: 'approve' | 'reject' | 'request_changes',
  note?: string
) {
  await assertAdmin();

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) throw new Error('Player not found');

  const statusMap = {
    approve: 'APPROVED',
    reject: 'REJECTED',
    request_changes: 'CHANGES_REQUESTED',
  } as const;

  const nextStatus = statusMap[action];

  await prisma.player.update({
    where: { id: playerId },
    data: { status: nextStatus },
  });

  revalidatePath('/admin/teams');
  return { success: true };
}