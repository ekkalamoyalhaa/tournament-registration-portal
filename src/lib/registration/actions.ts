'use server';

import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  InstitutionType,
  Division,
} from '@prisma/client';

/* ---------- helpers ---------- */

async function getUser() {
  const session = await auth();

  if (!session?.user?.email) {
    throw new Error('Unauthorized');
  }

  const user = await prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
}

async function getOpenTournament() {
  let t = await prisma.tournament.findFirst({
    where: {
      status: 'OPEN_FOR_REGISTRATION',
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!t) {
    t = await prisma.tournament.create({
      data: {
        slug: '2026-gaafu-championship',
        name: 'IUMSU Beach Handball Fiesta 2026',
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

/* ---------- registration resolver ---------- */

export async function getOrCreateDraftRegistration(
  registrationId?: string
) {
  const user = await getUser();

  /*
   * ---------------------------------------------------------
   * EXACT REGISTRATION
   * ---------------------------------------------------------
   *
   * A user may belong to multiple teams.
   *
   * When registrationId is provided, always use that exact
   * registration and verify access through TeamMembership.
   */
  if (registrationId) {
    const registration =
      await prisma.teamRegistration.findUnique({
        where: {
          id: registrationId,
        },
        include: {
          tournament: true,
          team: true,
        },
      });

    if (!registration) {
      throw new Error(
        'Registration not found'
      );
    }

    const membership =
      await prisma.teamMembership.findUnique({
        where: {
          userId_teamId: {
            userId: user.id,
            teamId: registration.teamId,
          },
        },
      });

    if (!membership) {
      throw new Error(
        'You do not have access to this registration'
      );
    }

    return {
      team: registration.team,
      registration,
    };
  }

  /*
   * ---------------------------------------------------------
   * LEGACY / DEFAULT REGISTRATION
   * ---------------------------------------------------------
   */
  const membership =
    await prisma.teamMembership.findFirst({
      where: {
        userId: user.id,
      },

      include: {
        team: {
          include: {
            registrations: {
              include: {
                tournament: true,
              },

              orderBy: {
                createdAt: 'desc',
              },

              take: 1,
            },
          },
        },
      },

      orderBy: {
        invitedAt: 'desc',
      },
    });

  if (membership?.team) {
    const reg =
      membership.team.registrations[0];

    if (reg) {
      return {
        team: membership.team,
        registration: reg,
      };
    }
  }

  /*
   * ---------------------------------------------------------
   * CREATE NEW TEAM / REGISTRATION
   * ---------------------------------------------------------
   */
  const tournament =
    await getOpenTournament();

  const team =
    await prisma.team.create({
      data: {
        name: 'Draft Team',
        contactEmail: user.email,
      },
    });

  await prisma.teamMembership.create({
    data: {
      userId: user.id,
      teamId: team.id,
      role: 'TEAM_MANAGER',
    },
  });

  const registration =
    await prisma.teamRegistration.create({
      data: {
        teamId: team.id,
        tournamentId: tournament.id,
        status: 'DRAFT',
        phase: 'PHASE_1',
      },

      include: {
        tournament: true,
      },
    });

  return {
    team,
    registration,
  };
}

export async function startNewTeamRegistration() {
  'use server';

  await createNewTeamRegistration();

  redirect('/team/register');
}

/* ---------- phase 1: team info ---------- */

export async function saveTeamInfo(
  formData: FormData,
  registrationId?: string
) {
  const { team, registration } =
    await getOrCreateDraftRegistration(
      registrationId
    );

  if (registration.phase !== 'PHASE_1') {
    throw new Error(
      'Team info can only be edited in Phase 1'
    );
  }

  const institutionTypeValue =
    formData.get('institutionType');

  const divisionValue =
    formData.get('division');

  const institutionType =
    institutionTypeValue === 'UNIVERSITY' ||
    institutionTypeValue === 'COLLEGE' ||
    institutionTypeValue ===
      'HIGHER_EDUCATION_INSTITUTE'
      ? institutionTypeValue
      : null;

  const division =
    divisionValue === 'MENS' ||
    divisionValue === 'WOMENS'
      ? divisionValue
      : null;

  const updated =
    await prisma.team.update({
      where: {
        id: team.id,
      },

      data: {
        name:
          (formData.get('name') as string) ||
          '',

        shortName:
          (formData.get('shortName') as string) ||
          null,

        institutionType:
          institutionType as InstitutionType | null,

        country:
          (formData.get('country') as string) ||
          null,

        city:
          (formData.get('city') as string) ||
          null,

        contactEmail:
          (formData.get('contactEmail') as string) ||
          null,

        contactPhone:
          (formData.get('contactPhone') as string) ||
          null,
      },
    });

  await prisma.teamRegistration.update({
    where: {
      id: registration.id,
    },

    data: {
      division:
        division as Division | null,
    },
  });

  revalidatePath('/team/register');

  return {
    success: true,
    team: updated,
  };
}

export async function submitPhase1(
  registrationId?: string
) {
  const { registration } =
    await getOrCreateDraftRegistration(
      registrationId
    );

  if (registration.phase !== 'PHASE_1') {
    return {
      error: 'Not in Phase 1',
    };
  }

  const team =
    await prisma.team.findUnique({
      where: {
        id: registration.teamId,
      },
    });

  if (
    !team?.name ||
    team.name === 'Draft Team' ||
    !team.institutionType ||
    !registration.division
  ) {
    return {
      error:
        'Complete all required fields before submitting.',
    };
  }

  const updated =
    await prisma.teamRegistration.update({
      where: {
        id: registration.id,
      },

      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
    });

  await prisma.registrationEvent.create({
    data: {
      teamRegistrationId:
        registration.id,

      fromStatus: 'DRAFT',

      toStatus: 'SUBMITTED',

      note:
        'Team submitted Tournament Participation Form for Approval',
    },
  });

  revalidatePath('/team/dashboard');
  revalidatePath('/team/register');

  return {
    success: true,
    registration: updated,
  };
}

/* ---------- dashboard ---------- */

export async function getTeamDashboardData(
  registrationId?: string
) {
  const user = await getUser();

  const memberships =
    await prisma.teamMembership.findMany({
      where: {
        userId: user.id,
      },

      include: {
        team: {
          include: {
            registrations: {
              include: {
                tournament: true,

                events: {
                  orderBy: {
                    createdAt: 'desc',
                  },

                  /*
                   * Keep enough history for the dashboard
                   * while avoiding an unnecessarily large query.
                   *
                   * The active registration is selected below
                   * using the exact registrationId.
                   */
                  take: 20,
                },
              },

              orderBy: {
                createdAt: 'desc',
              },
            },

            players: {
              include: {
                documents: true,
              },

              orderBy: {
                createdAt: 'desc',
              },
            },

            documents: true,
          },
        },
      },

      orderBy: {
        invitedAt: 'desc',
      },
    });

  const registrationEntries =
    memberships.flatMap(
      (membership) =>
        membership.team.registrations.map(
          (registration) => ({
            team: membership.team,
            registration,
          })
        )
    );

  /*
   * ---------------------------------------------------------
   * TEAM SWITCHER DATA
   * ---------------------------------------------------------
   *
   * Every registration remains addressable by its own ID.
   */
  const teams = registrationEntries.map(
    ({ team, registration }) => ({
      registrationId: registration.id,
      teamId: team.id,
      teamName: team.name,
      status: registration.status,
      phase: registration.phase,
    })
  );

  /*
   * ---------------------------------------------------------
   * ACTIVE REGISTRATION
   * ---------------------------------------------------------
   *
   * If registrationId is supplied, ONLY that registration
   * may become active.
   */
  let active:
    | {
        team: (typeof registrationEntries)[number]['team'];
        registration: (typeof registrationEntries)[number]['registration'];
      }
    | null = null;

  if (registrationId) {
    const selected =
      registrationEntries.find(
        (item) =>
          item.registration.id ===
          registrationId
      );

    if (selected) {
      active = {
        team: selected.team,
        registration: selected.registration,
      };
    }
  } else {
    const editable =
      registrationEntries.filter(
        (item) =>
          item.registration.phase ===
            'PHASE_1' &&
          (
            item.registration.status ===
              'DRAFT' ||
            item.registration.status ===
              'CHANGES_REQUESTED'
          )
      );

    const selected =
      editable.length === 1
        ? editable[0]
        : registrationEntries.length === 1
          ? registrationEntries[0]
          : null;

    if (selected) {
      active = {
        team: selected.team,
        registration: selected.registration,
      };
    }
  }

  /*
   * ---------------------------------------------------------
   * USER NOTIFICATIONS
   * ---------------------------------------------------------
   *
   * These remain account-level notifications.
   * Registration-specific history is returned separately
   * below from RegistrationEvent.
   */
  const notifications =
    await prisma.notification.findMany({
      where: {
        userId: user.id,
      },

      orderBy: {
        createdAt: 'desc',
      },

      take: 20,
    });

  /*
   * ---------------------------------------------------------
   * REGISTRATION UPDATES
   * ---------------------------------------------------------
   *
   * IMPORTANT:
   *
   * Only expose events belonging to the exact active
   * registration. This prevents Team A's history from
   * appearing while Team B is selected.
   */
  const registrationUpdates =
    active?.registration.events ?? [];

  return {
    teams,
    notifications,
    registrationUpdates,
    active,
  };
}

export async function createNewTeamRegistration() {
  const user = await getUser();

  const tournament =
    await getOpenTournament();

  const team =
    await prisma.team.create({
      data: {
        name: 'Draft Team',
        contactEmail: user.email,
      },
    });

  await prisma.teamMembership.create({
    data: {
      userId: user.id,
      teamId: team.id,
      role: 'TEAM_MANAGER',
    },
  });

  const registration =
    await prisma.teamRegistration.create({
      data: {
        teamId: team.id,
        tournamentId: tournament.id,
        status: 'DRAFT',
        phase: 'PHASE_1',
      },

      include: {
        tournament: true,
      },
    });

  return {
    team,
    registration,
  };
}

export async function resubmitRegistrationById(
  registrationId: string
) {
  const user = await getUser();

  const reg =
    await prisma.teamRegistration.findUnique({
      where: {
        id: registrationId,
      },
    });

  if (
    !reg ||
    reg.status !== 'CHANGES_REQUESTED'
  ) {
    throw new Error('Cannot resubmit');
  }

  const membership =
    await prisma.teamMembership.findUnique({
      where: {
        userId_teamId: {
          userId: user.id,
          teamId: reg.teamId,
        },
      },
    });

  if (!membership) {
    throw new Error(
      'You do not have access to this registration'
    );
  }

  await prisma.teamRegistration.update({
    where: {
      id: registrationId,
    },

    data: {
      status: 'RESUBMITTED',
      submittedAt: new Date(),
    },
  });

  await prisma.registrationEvent.create({
    data: {
      teamRegistrationId:
        registrationId,

      fromStatus:
        'CHANGES_REQUESTED',

      toStatus:
        'RESUBMITTED',

      note:
        'Team resubmitted after changes',
    },
  });

  revalidatePath('/team/dashboard');
  revalidatePath('/team/register');
}

/* ---------- phase 2: manager ---------- */

export async function saveManagerInfo(
  formData: FormData,
  registrationId?: string
) {
  const { registration } =
    await getOrCreateDraftRegistration(
      registrationId
    );

  if (registration.phase !== 'PHASE_2') {
    throw new Error(
      'Manager information can only be edited in Phase 2'
    );
  }

  const updated =
    await prisma.teamRegistration.update({
      where: {
        id: registration.id,
      },

      data: {
        managerName:
          (formData.get('managerName') as string) ||
          null,

        managerPosition:
          (formData.get('managerPosition') as string) ||
          null,

        managerEmail:
          (formData.get('managerEmail') as string) ||
          null,

        managerPhone:
          (formData.get('managerPhone') as string) ||
          null,

        managerCountry:
          (formData.get('managerCountry') as string) ||
          null,

        assistantManagerName:
          (formData.get('assistantManagerName') as string) ||
          null,
      },
    });

  revalidatePath(
    '/team/register/manager'
  );

  revalidatePath(
    '/team/register'
  );

  revalidatePath(
    '/team/dashboard'
  );

  return {
    success: true,
    registration: updated,
  };
}

/* ---------- phase 2: officials ---------- */

export async function saveOfficialsInfo(
  formData: FormData,
  registrationId?: string
) {
  const { registration } =
    await getOrCreateDraftRegistration(
      registrationId
    );

  if (registration.phase !== 'PHASE_2') {
    throw new Error(
      'Officials can only be edited in Phase 2'
    );
  }

  const updated =
    await prisma.teamRegistration.update({
      where: {
        id: registration.id,
      },

      data: {
        managerName:
          (formData.get('managerName') as string) ||
          null,

        managerEmail:
          (formData.get('managerEmail') as string) ||
          null,

        managerPhone:
          (formData.get('managerPhone') as string) ||
          null,

        managerIdNumber:
          (formData.get('managerIdNumber') as string) ||
          null,

        coachName:
          (formData.get('coachName') as string) ||
          null,

        coachEmail:
          (formData.get('coachEmail') as string) ||
          null,

        coachPhone:
          (formData.get('coachPhone') as string) ||
          null,

        coachIdNumber:
          (formData.get('coachIdNumber') as string) ||
          null,

        medicName:
          (formData.get('medicName') as string) ||
          null,

        medicEmail:
          (formData.get('medicEmail') as string) ||
          null,

        medicPhone:
          (formData.get('medicPhone') as string) ||
          null,

        medicIdNumber:
          (formData.get('medicIdNumber') as string) ||
          null,

        officialName:
          (formData.get('officialName') as string) ||
          null,

        officialEmail:
          (formData.get('officialEmail') as string) ||
          null,

        officialPhone:
          (formData.get('officialPhone') as string) ||
          null,

        officialIdNumber:
          (formData.get('officialIdNumber') as string) ||
          null,
      },
    });

  revalidatePath(
    '/team/register/officials'
  );

  revalidatePath(
    '/team/register'
  );

  revalidatePath(
    '/team/dashboard'
  );

  return {
    success: true,
    registration: updated,
  };
}

/* ---------- players ---------- */

export async function getPlayers(
  registrationId?: string
) {
  const { team, registration } =
    await getOrCreateDraftRegistration(
      registrationId
    );

  const players =
    await prisma.player.findMany({
      where: {
        teamId: team.id,
      },

      include: {
        documents: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });

  return {
    teamId: team.id,
    registrationId:
      registration.id,
    players,
  };
}

export async function addPlayer(
  formData: FormData,
  registrationId?: string
) {
  const { team, registration } =
    await getOrCreateDraftRegistration(
      registrationId
    );

  if (registration.phase !== 'PHASE_2') {
    throw new Error(
      'Players can only be added in Phase 2'
    );
  }

  const currentCount =
    await prisma.player.count({
      where: {
        teamId: team.id,
      },
    });

  if (currentCount >= 10) {
    throw new Error(
      'Maximum 10 players allowed'
    );
  }

  const firstName = String(
    formData.get('firstName') || ''
  ).trim();

  const lastName = String(
    formData.get('lastName') || ''
  ).trim();

  const idNumber = String(
    formData.get('idNumber') || ''
  ).trim();

  const position = String(
    formData.get('position') || ''
  ).toUpperCase();

  const jerseyNumber = Number(
    formData.get('jerseyNumber')
  );

  if (!firstName) {
    throw new Error(
      'First name is required'
    );
  }

  if (!lastName) {
    throw new Error(
      'Last name is required'
    );
  }

  if (!idNumber) {
    throw new Error(
      'ID number is required'
    );
  }

  if (
    !Number.isInteger(jerseyNumber) ||
    jerseyNumber < 1
  ) {
    throw new Error(
      'Valid jersey number is required'
    );
  }

  const player =
    await prisma.player.create({
      data: {
        teamId: team.id,

        firstName,

        lastName,

        idNumber,

        position:
          position || null,

        jerseyNumber,

        status: 'DRAFT',
      },

      include: {
        documents: true,
      },
    });

  revalidatePath(
    '/team/register/players'
  );

  revalidatePath(
    '/team/register/review'
  );

  return {
    success: true,
    player,
    teamId: team.id,
    registrationId:
      registration.id,
  };
}

export async function removePlayer(
  playerId: string,
  registrationId?: string
) {
  const { team } =
    await getOrCreateDraftRegistration(
      registrationId
    );

  await prisma.player.deleteMany({
    where: {
      id: playerId,
      teamId: team.id,
    },
  });

  revalidatePath(
    '/team/register/players'
  );

  revalidatePath(
    '/team/register/review'
  );

  return {
    success: true,
  };
}

/* ---------- documents ---------- */

export async function saveDocumentRecord(
  data: {
    playerId?: string;
    officialRole?: string;
    documentType: string;
    storageKey: string;
    originalFilename: string;
    mimeType: string;
    size: number;
  },
  registrationId?: string
) {
  const { team, registration } =
    await getOrCreateDraftRegistration(
      registrationId
    );

  if (registration.phase !== 'PHASE_2') {
    throw new Error(
      'Documents can only be uploaded in Phase 2'
    );
  }

  /*
   * ---------------------------------------------------------
   * PLAYER DOCUMENT VALIDATION
   * ---------------------------------------------------------
   */
  if (data.playerId) {
    const player =
      await prisma.player.findFirst({
        where: {
          id: data.playerId,
          teamId: team.id,
        },
      });

    if (!player) {
      throw new Error(
        'Player not found'
      );
    }
  }

  /*
   * ---------------------------------------------------------
   * OFFICIAL DOCUMENT VALIDATION
   * ---------------------------------------------------------
   */
  if (
    !data.playerId &&
    data.officialRole
  ) {
    const allowedRoles = [
      'manager',
      'coach',
      'medic',
      'official',
    ];

    if (
      !allowedRoles.includes(
        data.officialRole
      )
    ) {
      throw new Error(
        'Invalid official role'
      );
    }

    const allowedDocumentTypes = [
      'manager_id_doc',
      'manager_photo',
      'coach_id_doc',
      'coach_photo',
      'medic_id_doc',
      'medic_photo',
      'official_id_doc',
      'official_photo',
    ];

    if (
      !allowedDocumentTypes.includes(
        data.documentType
      )
    ) {
      throw new Error(
        'Invalid official document type'
      );
    }
  }

  /*
   * ---------------------------------------------------------
   * CREATE DOCUMENT RECORD
   * ---------------------------------------------------------
   */
  const doc =
    await prisma.playerDocument.create({
      data: {
        playerId:
          data.playerId || null,

        officialRole:
          data.officialRole || null,

        documentType:
          data.documentType,

        storageKey:
          data.storageKey,

        originalFilename:
          data.originalFilename,

        mimeType:
          data.mimeType,

        size:
          data.size,
      },
    });

  /*
   * ---------------------------------------------------------
   * OFFICIAL STORAGE KEY
   * ---------------------------------------------------------
   */
  if (
    !data.playerId &&
    data.officialRole
  ) {
    const officialFieldMap: Record<
      string,
      string
    > = {
      'manager:manager_id_doc':
        'managerIdDocKey',

      'manager:manager_photo':
        'managerPhotoKey',

      'coach:coach_id_doc':
        'coachIdDocKey',

      'coach:coach_photo':
        'coachPhotoKey',

      'medic:medic_id_doc':
        'medicIdDocKey',

      'medic:medic_photo':
        'medicPhotoKey',

      'official:official_id_doc':
        'officialIdDocKey',

      'official:official_photo':
        'officialPhotoKey',
    };

    const field =
      officialFieldMap[
        `${data.officialRole}:${data.documentType}`
      ];

    if (field) {
      await prisma.teamRegistration.update({
        where: {
          id: registration.id,
        },

        data: {
          [field]:
            data.storageKey,
        },
      });
    }
  }

  revalidatePath(
    '/team/register/officials'
  );

  revalidatePath(
    '/team/register/players'
  );

  revalidatePath(
    '/team/register/review'
  );

  revalidatePath(
    '/team/dashboard'
  );

  return {
    success: true,
    document: doc,
  };
}

/* ---------- review ---------- */

export async function getReviewData(
  registrationId?: string
) {
  const { team, registration } =
    await getOrCreateDraftRegistration(
      registrationId
    );

  const fullTeam =
    await prisma.team.findUnique({
      where: {
        id: team.id,
      },

      include: {
        players: {
          include: {
            documents: true,
          },
        },

        registrations: true,
      },
    });

  /*
   * ---------------------------------------------------------
   * PLAYER DOCUMENTS
   * ---------------------------------------------------------
   */
  const playerIds =
    fullTeam?.players?.map(
      (p) => p.id
    ) ?? [];

  const playerDocs =
    playerIds.length > 0
      ? await prisma.playerDocument.findMany({
          where: {
            playerId: {
              in: playerIds,
            },
          },
        })
      : [];

  /*
   * ---------------------------------------------------------
   * OFFICIAL DOCUMENTS
   * ---------------------------------------------------------
   */
  const officialStorageKeys = [
    registration.managerIdDocKey,
    registration.managerPhotoKey,

    registration.coachIdDocKey,
    registration.coachPhotoKey,

    registration.medicIdDocKey,
    registration.medicPhotoKey,

    registration.officialIdDocKey,
    registration.officialPhotoKey,
  ].filter(
    (key): key is string =>
      Boolean(key)
  );

  const officialDocs =
    officialStorageKeys.length > 0
      ? await prisma.playerDocument.findMany({
          where: {
            storageKey: {
              in: officialStorageKeys,
            },
          },
        })
      : [];

  const teamDocs = [
    ...playerDocs,
    ...officialDocs,
  ];

  return {
    team: fullTeam,

    registration,

    totalDocCount:
      teamDocs.length,
  };
}

/* ---------- phase 2 submission ---------- */

export async function submitRegistration(
  registrationId?: string
) {
  const { team, registration } =
    await getOrCreateDraftRegistration(
      registrationId
    );

  if (registration.phase !== 'PHASE_2') {
    return {
      error: 'Not in Phase 2',
    };
  }

  /*
   * ---------------------------------------------------------
   * DETERMINE SUBMISSION TYPE
   * ---------------------------------------------------------
   */
  const isResubmission =
    registration.status ===
    'CHANGES_REQUESTED';

  const allowedStatuses = [
    'DRAFT',
    'CHANGES_REQUESTED',
  ];

  if (
    !allowedStatuses.includes(
      registration.status
    )
  ) {
    return {
      error:
        'This registration cannot be submitted in its current status.',
    };
  }

  /*
   * ---------------------------------------------------------
   * VALIDATE PLAYERS
   * ---------------------------------------------------------
   */
  const players =
    await prisma.player.findMany({
      where: {
        teamId: team.id,
      },
    });

  if (players.length < 8) {
    return {
      error:
        'Add at least 8 players before submitting.',
    };
  }

  if (players.length > 10) {
    return {
      error:
        'Team cannot exceed 10 players.',
    };
  }

  /*
   * ---------------------------------------------------------
   * VALIDATE PLAYER DOCUMENTS
   * ---------------------------------------------------------
   */
  const playerIds =
    players.map(
      (player) => player.id
    );

  const hasPlayerDocs =
    playerIds.length > 0
      ? await prisma.playerDocument.count({
          where: {
            playerId: {
              in: playerIds,
            },
          },
        })
      : 0;

  if (hasPlayerDocs === 0) {
    return {
      error:
        'Upload at least one player document before submitting.',
    };
  }

  /*
   * ---------------------------------------------------------
   * STATUS
   * ---------------------------------------------------------
   */
  const newStatus =
    isResubmission
      ? 'RESUBMITTED'
      : 'SUBMITTED';

  const fromStatus =
    isResubmission
      ? 'CHANGES_REQUESTED'
      : 'DRAFT';

  const eventNote =
    isResubmission
      ? 'Team resubmitted registration after making requested changes'
      : 'Team submitted Team Details Submission for final review';

  /*
   * ---------------------------------------------------------
   * UPDATE REGISTRATION
   *
   * Payment is deliberately NOT requested here.
   *
   * Phase 2 submission goes to tournament administration.
   *
   * Admin must explicitly call sendRegistrationToPayment().
   * ---------------------------------------------------------
   */
  const updated =
    await prisma.teamRegistration.update({
      where: {
        id: registration.id,
      },

      data: {
        status: newStatus,

        submittedAt:
          new Date(),

        reviewedAt:
          null,
      },
    });

  /*
   * ---------------------------------------------------------
   * REGISTRATION EVENT
   * ---------------------------------------------------------
   */
  await prisma.registrationEvent.create({
    data: {
      teamRegistrationId:
        registration.id,

      fromStatus,

      toStatus:
        newStatus,

      note:
        eventNote,
    },
  });

  /*
   * ---------------------------------------------------------
   * REVALIDATE
   * ---------------------------------------------------------
   */
  revalidatePath(
    '/team/dashboard'
  );

  revalidatePath(
    '/team/register'
  );

  revalidatePath(
    '/team/register/manager'
  );

  revalidatePath(
    '/team/register/officials'
  );

  revalidatePath(
    '/team/register/players'
  );

  revalidatePath(
    '/team/register/review'
  );

  return {
    success: true,
    registration: updated,
  };
}

export async function saveAndSubmitPhase1(
  formData: FormData,
  registrationId?: string
) {
  'use server';

  await saveTeamInfo(
    formData,
    registrationId
  );

  return await submitPhase1(
    registrationId
  );
}