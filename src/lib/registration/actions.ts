'use server';

import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { InstitutionType, Division, RegistrationStatus } from '@prisma/client';



/* ---------- helpers ---------- */

async function getUser() {
  const session = await auth();
  if (!session?.user?.email) throw new Error('Unauthorized');
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) throw new Error('User not found');
  return user;
}

async function getOpenTournament() {
  let t = await prisma.tournament.findFirst({
    where: { status: 'OPEN_FOR_REGISTRATION' },
    orderBy: { createdAt: 'desc' },
  });
  if (!t) {
    t = await prisma.tournament.create({
      data: {
        slug: '2026-gaafu-championship',
        name: '2026 Gaafu Championship',
        status: 'OPEN_FOR_REGISTRATION',
        startDate: new Date('2026-12-12'),
        endDate: new Date('2026-12-20'),
        registrationClosesAt: new Date('2026-11-30'),
        availableTeamSlots: 42,
        minPlayers: 8,
        maxPlayers: 10,
      },
    });
  }
  return t;
}

export async function getOrCreateDraftRegistration() {
  const user = await getUser();

  const membership = await prisma.teamMembership.findFirst({
    where: { userId: user.id },
    include: {
      team: {
        include: {
          registrations: {
            include: { tournament: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      },
    },
    orderBy: { invitedAt: 'desc' },
  });

  if (membership?.team) {
    const reg = membership.team.registrations[0];
    if (reg) return { team: membership.team, registration: reg };
  }

  const tournament = await getOpenTournament();

  const team = await prisma.team.create({
    data: {
      name: 'Draft Team',
      contactEmail: user.email,
    },
  });

  await prisma.teamMembership.create({
    data: { userId: user.id, teamId: team.id, role: 'TEAM_MANAGER' },
  });

  const registration = await prisma.teamRegistration.create({
    data: {
      teamId: team.id,
      tournamentId: tournament.id,
      status: 'DRAFT',
      phase: 'PHASE_1',
    },
    include: { tournament: true },
  });

  return { team, registration };
}

export async function startNewTeamRegistration() {
  'use server';
  await createNewTeamRegistration();
  redirect('/team/register');
}

/* ---------- phase 1: team info ---------- */

export async function saveTeamInfo(formData: FormData) {
  const { team, registration } = await getOrCreateDraftRegistration();

  if (registration.phase !== 'PHASE_1') {
    throw new Error('Team info can only be edited in Phase 1');
  }

  const institutionTypeValue = formData.get('institutionType');
  const divisionValue = formData.get('division');

  const institutionType =
    institutionTypeValue === 'UNIVERSITY' ||
    institutionTypeValue === 'COLLEGE' ||
    institutionTypeValue === 'HIGHER_EDUCATION_INSTITUTE'
      ? institutionTypeValue
      : null;

  const division =
    divisionValue === 'MENS' || divisionValue === 'WOMENS'
      ? divisionValue
      : null;

  const updated = await prisma.team.update({
    where: { id: team.id },
    data: {
      name: (formData.get('name') as string) || '',
      shortName: (formData.get('shortName') as string) || null,
      institutionType: institutionType as InstitutionType | null,
      country: (formData.get('country') as string) || null,
      city: (formData.get('city') as string) || null,
      contactEmail: (formData.get('contactEmail') as string) || null,
      contactPhone: (formData.get('contactPhone') as string) || null,
    },
  });

  await prisma.teamRegistration.update({
    where: { id: registration.id },
    data: {
      division: division as Division | null,
    },
  });

  revalidatePath('/team/register');

  return {
    success: true,
    team: updated,
  };
}



export async function submitPhase1() {
  const { registration } = await getOrCreateDraftRegistration();

  if (registration.phase !== 'PHASE_1') {
    return { error: 'Not in Phase 1' };
  }

  const team = await prisma.team.findUnique({
    where: { id: registration.teamId },
  });

  if (!team?.name || team.name === 'Draft Team' || !team.institutionType || !registration.division) {
    return { error: 'Complete all required fields before submitting.' };
  }

  const updated = await prisma.teamRegistration.update({
    where: { id: registration.id },
    data: { status: 'SUBMITTED', submittedAt: new Date() },
  });

  await prisma.registrationEvent.create({
    data: {
      teamRegistrationId: registration.id,
      fromStatus: 'DRAFT',
      toStatus: 'SUBMITTED',
      note: 'Team submitted Tournament Participation Form for Approval',
    },
  });

  revalidatePath('/team/dashboard');
  return { success: true, registration: updated };
}

/* ---------- dashboard (all teams) ---------- */

export async function getTeamDashboardData() {
  const user = await getUser();

  const memberships = await prisma.teamMembership.findMany({
    where: { userId: user.id },
    include: {
      team: {
        include: {
          registrations: {
            include: { tournament: true, events: { orderBy: { createdAt: 'desc' }, take: 5 } },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          players: { include: { documents: true }, orderBy: { createdAt: 'desc' } },
        },
      },
    },
    orderBy: { invitedAt: 'desc' },
  });

  return memberships.map((m) => ({
    team: m.team,
    registration: m.team.registrations[0] ?? null,
  }));
}

export async function createNewTeamRegistration() {
  const user = await getUser();
  const tournament = await getOpenTournament();

  const team = await prisma.team.create({
    data: {
      name: 'Draft Team',
      contactEmail: user.email,
    },
  });

  await prisma.teamMembership.create({
    data: { userId: user.id, teamId: team.id, role: 'TEAM_MANAGER' },
  });

  const registration = await prisma.teamRegistration.create({
    data: {
      teamId: team.id,
      tournamentId: tournament.id,
      status: 'DRAFT',
      phase: 'PHASE_1',
    },
    include: { tournament: true },
  });

  return { team, registration };
}

export async function resubmitRegistrationById(registrationId: string) {
  const reg = await prisma.teamRegistration.findUnique({ where: { id: registrationId } });
  if (!reg || reg.status !== 'CHANGES_REQUESTED') {
    throw new Error('Cannot resubmit');
  }

  await prisma.teamRegistration.update({
    where: { id: registrationId },
    data: { status: 'RESUBMITTED', submittedAt: new Date() },
  });

  await prisma.registrationEvent.create({
    data: {
      teamRegistrationId: registrationId,
      fromStatus: 'CHANGES_REQUESTED',
      toStatus: 'RESUBMITTED',
      note: 'Team resubmitted after changes',
    },
  });

  revalidatePath('/team/dashboard');
}

/* ---------- phase 2: officials ---------- */

export async function saveManagerInfo(formData: FormData) {
  const { registration } = await getOrCreateDraftRegistration();

  if (registration.phase !== 'PHASE_2') {
    throw new Error('Manager information can only be edited in Phase 2');
  }

  const updated = await prisma.teamRegistration.update({
    where: { id: registration.id },
    data: {
      managerName: (formData.get('managerName') as string) || null,
      managerPosition: (formData.get('managerPosition') as string) || null,
      managerEmail: (formData.get('managerEmail') as string) || null,
      managerPhone: (formData.get('managerPhone') as string) || null,
      managerCountry: (formData.get('managerCountry') as string) || null,
      assistantManagerName:
        (formData.get('assistantManagerName') as string) || null,
    },
  });

  revalidatePath('/team/register/manager');

  return { success: true, registration: updated };
}

export async function saveOfficialsInfo(formData: FormData) {
  const { registration } = await getOrCreateDraftRegistration();

  if (registration.phase !== 'PHASE_2') {
    throw new Error('Officials can only be edited in Phase 2');
  }

  const updated = await prisma.teamRegistration.update({
    where: { id: registration.id },
    data: {
      managerName: (formData.get('managerName') as string) || null,
      managerEmail: (formData.get('managerEmail') as string) || null,
      managerPhone: (formData.get('managerPhone') as string) || null,
      managerIdNumber: (formData.get('managerIdNumber') as string) || null,
      coachName: (formData.get('coachName') as string) || null,
      coachEmail: (formData.get('coachEmail') as string) || null,
      coachPhone: (formData.get('coachPhone') as string) || null,
      coachIdNumber: (formData.get('coachIdNumber') as string) || null,
      medicName: (formData.get('medicName') as string) || null,
      medicEmail: (formData.get('medicEmail') as string) || null,
      medicPhone: (formData.get('medicPhone') as string) || null,
      medicIdNumber: (formData.get('medicIdNumber') as string) || null,
      officialName: (formData.get('officialName') as string) || null,
      officialEmail: (formData.get('officialEmail') as string) || null,
      officialPhone: (formData.get('officialPhone') as string) || null,
      officialIdNumber: (formData.get('officialIdNumber') as string) || null,
    },
  });

  revalidatePath('/team/register/officials');
  return { success: true, registration: updated };
}

/* ---------- players ---------- */

export async function getPlayers() {
  const { team } = await getOrCreateDraftRegistration();
  return prisma.player.findMany({
    where: { teamId: team.id },
    include: { documents: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function addPlayer(formData: FormData) {
  const { team, registration } = await getOrCreateDraftRegistration();

  if (registration.phase !== 'PHASE_2') {
    throw new Error('Players can only be added in Phase 2');
  }

  const currentCount = await prisma.player.count({ where: { teamId: team.id } });
  if (currentCount >= 10) {
    throw new Error('Maximum 10 players allowed');
  }

  const player = await prisma.player.create({
    data: {
      teamId: team.id,
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      position: (formData.get('position') as string)?.toUpperCase() || null,
      jerseyNumber: Number(formData.get('jerseyNumber')) || null,
      status: 'DRAFT',
    },
  });

  revalidatePath('/team/register/players');
  return { success: true, player };
}

export async function removePlayer(playerId: string) {
  const { team } = await getOrCreateDraftRegistration();
  await prisma.player.deleteMany({ where: { id: playerId, teamId: team.id } });
  revalidatePath('/team/register/players');
  return { success: true };
}

/* ---------- documents ---------- */

export async function saveDocumentRecord(data: {
  playerId?: string;
  officialRole?: string;
  documentType: string;
  storageKey: string;
  originalFilename: string;
  mimeType: string;
  size: number;
}) {
  const { team, registration } = await getOrCreateDraftRegistration();

  if (registration.phase !== 'PHASE_2') {
    throw new Error('Documents can only be uploaded in Phase 2');
  }

  if (data.playerId) {
    const player = await prisma.player.findFirst({
      where: { id: data.playerId, teamId: team.id },
    });
    if (!player) throw new Error('Player not found');
  }

  const doc = await prisma.playerDocument.create({
    data: {
      playerId: data.playerId || null,
      documentType: data.documentType,
      storageKey: data.storageKey,
      originalFilename: data.originalFilename,
      mimeType: data.mimeType,
      size: data.size,
    },
  });

  revalidatePath('/team/register/documents');
  return { success: true, document: doc };
}

/* ---------- review & submit ---------- */

export async function getReviewData() {
  const { team, registration } = await getOrCreateDraftRegistration();

  const fullTeam = await prisma.team.findUnique({
    where: { id: team.id },
    include: {
      players: { include: { documents: true } },
      registrations: true,
    },
  });

  // Count all documents for this team (player docs + official docs)
  const allDocs = await prisma.playerDocument.findMany({
    where: {
      OR: [
        { player: { teamId: team.id } },
        { officialRole: { not: null } },
      ],
    },
  });

  // Filter to only docs belonging to this team's players or officials
  const playerIds = fullTeam?.players?.map((p: any) => p.id) ?? [];
  const teamDocs = allDocs.filter(
    (d) => playerIds.includes(d.playerId ?? '') || d.officialRole !== null
  );

  return {
    team: fullTeam,
    registration,
    totalDocCount: teamDocs.length,
  };
}

export async function submitRegistration() {
  const { team, registration } = await getOrCreateDraftRegistration();

  if (registration.phase !== 'PHASE_2') {
    return { error: 'Not in Phase 2' };
  }

  const players = await prisma.player.findMany({ where: { teamId: team.id } });
  if (players.length < 8) {
    return { error: 'Add at least 8 players before submitting.' };
  }
  if (players.length > 10) {
    return { error: 'Team cannot exceed 10 players.' };
  }

  const hasDocs = await prisma.playerDocument.count({
    where: { playerId: { in: players.map((p) => p.id) } },
  });
  if (hasDocs === 0) {
    return { error: 'Upload at least one player document before submitting.' };
  }

  const updated = await prisma.teamRegistration.update({
    where: { id: registration.id },
    data: { status: 'SUBMITTED', submittedAt: new Date() },
  });

  await prisma.registrationEvent.create({
    data: {
      teamRegistrationId: registration.id,
      fromStatus: 'DRAFT',
      toStatus: 'SUBMITTED',
      note: 'Team submitted Team Details Submission for final review',
    },
  });

  revalidatePath('/team/register/review');
  return { success: true, registration: updated };
}

export async function saveAndSubmitPhase1(formData: FormData) {
  'use server';
  await saveTeamInfo(formData);
  return await submitPhase1();
}