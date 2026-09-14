'use server';

import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  InstitutionType,
  Division,
  RegistrationStatus,
} from '@prisma/client';

/* =========================================================
   HELPERS
   ========================================================= */

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
  let tournament = await prisma.tournament.findFirst({
    where: {
      status: 'OPEN_FOR_REGISTRATION',
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!tournament) {
    tournament = await prisma.tournament.create({
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

  return tournament;
}

/* =========================================================
   REGISTRATION ACCESS
   ========================================================= */

/**
 * Get one specific registration.
 *
 * IMPORTANT:
 * registrationId MUST belong to a team that the currently
 * authenticated user is a member of.
 *
 * This is the main authorization boundary for the
 * multi-team registration system.
 */
async function getRegistrationById(
  registrationId: string
) {
  const user = await getUser();

  const registration =
    await prisma.teamRegistration.findFirst({
      where: {
        id: registrationId,

        team: {
          members: {
            some: {
              userId: user.id,
            },
          },
        },
      },

      include: {
        tournament: true,

        team: {
          include: {
            players: {
              include: {
                documents: true,
              },

              orderBy: {
                createdAt: 'desc',
              },
            },
          },
        },
      },
    });

  if (!registration) {
    throw new Error(
      'Registration not found or you do not have access to it.'
    );
  }

  return {
    team: registration.team,
    registration,
  };
}

/**
 * Get an existing registration when an ID is supplied.
 *
 * Without an ID:
 * - Find exactly one Phase 1 DRAFT registration.
 * - If multiple exist, DO NOT guess.
 * - If none exist, create a new Phase 1 registration.
 *
 * This prevents one user with multiple teams from
 * accidentally editing the wrong team.
 */
export async function getOrCreateDraftRegistration(
  registrationId?: string
) {
  /* ---------------------------------------------------------
     SPECIFIC REGISTRATION
     --------------------------------------------------------- */

  if (registrationId) {
    return getRegistrationById(registrationId);
  }

  /* ---------------------------------------------------------
     NO REGISTRATION ID
     --------------------------------------------------------- */

  const user = await getUser();

  /*
   * Find ALL Phase 1 draft registrations belonging to teams
   * that this user is a member of.
   */
  const memberships =
    await prisma.teamMembership.findMany({
      where: {
        userId: user.id,

        team: {
          registrations: {
            some: {
              status: RegistrationStatus.DRAFT,
              phase: 'PHASE_1',
            },
          },
        },
      },

      include: {
        team: {
          include: {
            registrations: {
              where: {
                status: RegistrationStatus.DRAFT,
                phase: 'PHASE_1',
              },

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

  const draftRegistrations = memberships
    .map((membership) => {
      const registration =
        membership.team.registrations[0];

      if (!registration) {
        return null;
      }

      return {
        team: membership.team,
        registration,
      };
    })
    .filter(
      (
        value
      ): value is NonNullable<typeof value> =>
        value !== null
    );

  /* ---------------------------------------------------------
     EXACTLY ONE DRAFT
     --------------------------------------------------------- */

  if (draftRegistrations.length === 1) {
    return draftRegistrations[0];
  }

  /* ---------------------------------------------------------
     MULTIPLE DRAFTS
     --------------------------------------------------------- */

  if (draftRegistrations.length > 1) {
    throw new Error(
      'Multiple team registrations found. Please select a team from the dashboard.'
    );
  }

  /* ---------------------------------------------------------
     NO DRAFT — CREATE NEW PHASE 1 TEAM
     --------------------------------------------------------- */

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
        status: RegistrationStatus.DRAFT,
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

/* =========================================================
   START NEW TEAM
   ========================================================= */

export async function startNewTeamRegistration() {
  const { registration } =
    await createNewTeamRegistration();

  /*
   * IMPORTANT:
   * Carry the newly-created registration ID into the
   * registration page.
   *
   * This prevents the page from selecting another draft
   * when the user already has multiple teams.
   */
  redirect(
    `/team/register?registrationId=${encodeURIComponent(
      registration.id
    )}`
  );
}

/* =========================================================
   PHASE 1 — TEAM INFORMATION
   ========================================================= */

export async function saveTeamInfo(
  formData: FormData,
  registrationId?: string
) {
  const {
    team,
    registration,
  } = await getOrCreateDraftRegistration(
    registrationId
  );

  if (registration.phase !== 'PHASE_1') {
    throw new Error(
      'Team information can only be edited in Phase 1.'
    );
  }

  if (
    registration.status !==
    RegistrationStatus.DRAFT
  ) {
    throw new Error(
      'This registration cannot be edited in its current status.'
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
          String(
            formData.get('name') || ''
          ).trim(),

        shortName:
          String(
            formData.get('shortName') || ''
          ).trim() || null,

        institutionType:
          institutionType as
            | InstitutionType
            | null,

        country:
          String(
            formData.get('country') || ''
          ).trim() || null,

        city:
          String(
            formData.get('city') || ''
          ).trim() || null,

        contactEmail:
          String(
            formData.get('contactEmail') || ''
          ).trim() || null,

        contactPhone:
          String(
            formData.get('contactPhone') || ''
          ).trim() || null,
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
  revalidatePath('/team/dashboard');

  return {
    success: true,
    team: updated,
  };
}

/* =========================================================
   PHASE 1 SUBMISSION
   ========================================================= */

export async function submitPhase1(
  registrationId?: string
) {
  const {
    team,
    registration,
  } = await getOrCreateDraftRegistration(
    registrationId
  );

  if (registration.phase !== 'PHASE_1') {
    return {
      error: 'Not in Phase 1.',
    };
  }

  if (
    registration.status !==
    RegistrationStatus.DRAFT
  ) {
    return {
      error:
        'This registration cannot be submitted in its current status.',
    };
  }

  if (
    !team.name ||
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
        status:
          RegistrationStatus.SUBMITTED,

        submittedAt:
          new Date(),
      },
    });

  await prisma.registrationEvent.create({
    data: {
      teamRegistrationId:
        registration.id,

      fromStatus:
        RegistrationStatus.DRAFT,

      toStatus:
        RegistrationStatus.SUBMITTED,

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

/* =========================================================
   DASHBOARD
   ========================================================= */

export async function getTeamDashboardData() {
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

                  take: 5,
                },
              },

              orderBy: {
                createdAt: 'desc',
              },

              take: 1,
            },

            players: {
              include: {
                documents: true,
              },

              orderBy: {
                createdAt: 'desc',
              },
            },
          },
        },
      },

      orderBy: {
        invitedAt: 'desc',
      },
    });

  return memberships.map(
    (membership) => ({
      team: membership.team,

      registration:
        membership.team.registrations[0] ??
        null,
    })
  );
}

/* =========================================================
   CREATE NEW TEAM
   ========================================================= */

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
        status: RegistrationStatus.DRAFT,
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

/* =========================================================
   PHASE 2 — MANAGER
   ========================================================= */

export async function saveManagerInfo(
  formData: FormData,
  registrationId: string
) {
  const {
    registration,
  } =
    await getRegistrationById(
      registrationId
    );

  if (
    registration.phase !== 'PHASE_2'
  ) {
    throw new Error(
      'Manager information can only be edited in Phase 2.'
    );
  }

  /*
   * Explicit enum comparisons are used here instead
   * of Array.includes() so TypeScript does not narrow
   * the array to only two string literals.
   */
  if (
    registration.status !==
      RegistrationStatus.DRAFT &&
    registration.status !==
      RegistrationStatus.CHANGES_REQUESTED
  ) {
    throw new Error(
      'This registration cannot be edited in its current status.'
    );
  }

  const updated =
    await prisma.teamRegistration.update({
      where: {
        id: registration.id,
      },

      data: {
        managerName:
          String(
            formData.get('managerName') || ''
          ).trim() || null,

        managerPosition:
          String(
            formData.get('managerPosition') || ''
          ).trim() || null,

        managerEmail:
          String(
            formData.get('managerEmail') || ''
          ).trim() || null,

        managerPhone:
          String(
            formData.get('managerPhone') || ''
          ).trim() || null,

        managerCountry:
          String(
            formData.get('managerCountry') || ''
          ).trim() || null,

        assistantManagerName:
          String(
            formData.get(
              'assistantManagerName'
            ) || ''
          ).trim() || null,
      },
    });

  revalidatePath(
    '/team/register/manager'
  );

  revalidatePath(
    '/team/register/officials'
  );

  revalidatePath(
    '/team/register/review'
  );

  revalidatePath(
    '/team/dashboard'
  );

  return {
    success: true,
    registration: updated,
  };
}

/* =========================================================
   PHASE 2 — OFFICIALS
   ========================================================= */

export async function saveOfficialsInfo(
  formData: FormData,
  registrationId: string
) {
  const {
    registration,
  } =
    await getRegistrationById(
      registrationId
    );

  if (
    registration.phase !== 'PHASE_2'
  ) {
    throw new Error(
      'Officials can only be edited in Phase 2.'
    );
  }

  /*
   * Explicit enum comparisons.
   */
  if (
    registration.status !==
      RegistrationStatus.DRAFT &&
    registration.status !==
      RegistrationStatus.CHANGES_REQUESTED
  ) {
    throw new Error(
      'This registration cannot be edited in its current status.'
    );
  }

  const updated =
    await prisma.teamRegistration.update({
      where: {
        id: registration.id,
      },

      data: {
        managerName:
          String(
            formData.get('managerName') || ''
          ).trim() || null,

        managerEmail:
          String(
            formData.get('managerEmail') || ''
          ).trim() || null,

        managerPhone:
          String(
            formData.get('managerPhone') || ''
          ).trim() || null,

        managerIdNumber:
          String(
            formData.get('managerIdNumber') || ''
          ).trim() || null,

        coachName:
          String(
            formData.get('coachName') || ''
          ).trim() || null,

        coachEmail:
          String(
            formData.get('coachEmail') || ''
          ).trim() || null,

        coachPhone:
          String(
            formData.get('coachPhone') || ''
          ).trim() || null,

        coachIdNumber:
          String(
            formData.get('coachIdNumber') || ''
          ).trim() || null,

        medicName:
          String(
            formData.get('medicName') || ''
          ).trim() || null,

        medicEmail:
          String(
            formData.get('medicEmail') || ''
          ).trim() || null,

        medicPhone:
          String(
            formData.get('medicPhone') || ''
          ).trim() || null,

        medicIdNumber:
          String(
            formData.get('medicIdNumber') || ''
          ).trim() || null,

        officialName:
          String(
            formData.get('officialName') || ''
          ).trim() || null,

        officialEmail:
          String(
            formData.get('officialEmail') || ''
          ).trim() || null,

        officialPhone:
          String(
            formData.get('officialPhone') || ''
          ).trim() || null,

        officialIdNumber:
          String(
            formData.get('officialIdNumber') || ''
          ).trim() || null,
      },
    });

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
    registration: updated,
  };
}

/* =========================================================
   PLAYERS
   ========================================================= */

export async function getPlayers(
  registrationId: string
) {
  const {
    team,
    registration,
  } =
    await getRegistrationById(
      registrationId
    );

  if (
    registration.phase !== 'PHASE_2'
  ) {
    throw new Error(
      'Players are only available in Phase 2.'
    );
  }

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
    registrationId: registration.id,
    players,
  };
}

export async function addPlayer(
  formData: FormData,
  registrationId: string
) {
  const {
    team,
    registration,
  } =
    await getRegistrationById(
      registrationId
    );

  if (
    registration.phase !== 'PHASE_2'
  ) {
    throw new Error(
      'Players can only be added in Phase 2.'
    );
  }

  if (
    registration.status !==
      RegistrationStatus.DRAFT &&
    registration.status !==
      RegistrationStatus.CHANGES_REQUESTED
  ) {
    throw new Error(
      'Players cannot be edited in the current registration status.'
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
      'Maximum 10 players allowed.'
    );
  }

  const firstName =
    String(
      formData.get('firstName') || ''
    ).trim();

  const lastName =
    String(
      formData.get('lastName') || ''
    ).trim();

  const idNumber =
    String(
      formData.get('idNumber') || ''
    ).trim();

  const position =
    String(
      formData.get('position') || ''
    )
      .trim()
      .toUpperCase();

  const jerseyNumber =
    Number(
      formData.get('jerseyNumber')
    );

  if (!firstName) {
    throw new Error(
      'First name is required.'
    );
  }

  if (!lastName) {
    throw new Error(
      'Last name is required.'
    );
  }

  if (!idNumber) {
    throw new Error(
      'ID number is required.'
    );
  }

  if (
    !Number.isInteger(
      jerseyNumber
    ) ||
    jerseyNumber < 1
  ) {
    throw new Error(
      'Valid jersey number is required.'
    );
  }

  const existingJersey =
    await prisma.player.findFirst({
      where: {
        teamId: team.id,
        jerseyNumber,
      },
    });

  if (existingJersey) {
    throw new Error(
      `Jersey number ${jerseyNumber} is already in use.`
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
  };
}

export async function removePlayer(
  playerId: string,
  registrationId: string
) {
  const {
    team,
    registration,
  } =
    await getRegistrationById(
      registrationId
    );

  if (
    registration.phase !== 'PHASE_2'
  ) {
    throw new Error(
      'Players can only be edited in Phase 2.'
    );
  }

  if (
    registration.status !==
      RegistrationStatus.DRAFT &&
    registration.status !==
      RegistrationStatus.CHANGES_REQUESTED
  ) {
    throw new Error(
      'Players cannot be edited in the current registration status.'
    );
  }

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

/* =========================================================
   DOCUMENTS
   ========================================================= */

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
  registrationId: string
) {
  const {
    team,
    registration,
  } =
    await getRegistrationById(
      registrationId
    );

  if (
    registration.phase !== 'PHASE_2'
  ) {
    throw new Error(
      'Documents can only be uploaded in Phase 2.'
    );
  }

  if (
    registration.status !==
      RegistrationStatus.DRAFT &&
    registration.status !==
      RegistrationStatus.CHANGES_REQUESTED
  ) {
    throw new Error(
      'Documents cannot be edited in the current status.'
    );
  }

  /* -------------------------------------------------------
     PLAYER DOCUMENT
     ------------------------------------------------------- */

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
        'Player not found.'
      );
    }
  }

  /* -------------------------------------------------------
     OFFICIAL DOCUMENT
     ------------------------------------------------------- */

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
        'Invalid official role.'
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
        'Invalid official document type.'
      );
    }
  }

  /* -------------------------------------------------------
     CREATE DOCUMENT
     ------------------------------------------------------- */

  const doc =
    await prisma.playerDocument.create({
      data: {
        playerId:
          data.playerId ||
          null,

        officialRole:
          data.officialRole ||
          null,

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

  /* -------------------------------------------------------
     OFFICIAL STORAGE KEY
     ------------------------------------------------------- */

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

/* =========================================================
   REVIEW
   ========================================================= */

export async function getReviewData(
  registrationId: string
) {
  const {
    team,
    registration,
  } =
    await getRegistrationById(
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

          orderBy: {
            createdAt: 'desc',
          },
        },

        registrations: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

  const playerIds =
    fullTeam?.players?.map(
      (player) => player.id
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
    (
      key
    ): key is string =>
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

/* =========================================================
   FINAL SUBMISSION
   ========================================================= */

export async function submitRegistration(
  registrationId: string
) {
  const {
    team,
    registration,
  } =
    await getRegistrationById(
      registrationId
    );

  if (
    registration.phase !== 'PHASE_2'
  ) {
    return {
      error: 'Not in Phase 2.',
    };
  }

  const isResubmission =
    registration.status ===
    RegistrationStatus.CHANGES_REQUESTED;

  if (
    registration.status !==
      RegistrationStatus.DRAFT &&
    registration.status !==
      RegistrationStatus.CHANGES_REQUESTED
  ) {
    return {
      error:
        'This registration cannot be submitted in its current status.',
    };
  }

  /* -------------------------------------------------------
     OFFICIAL VALIDATION
     ------------------------------------------------------- */

  const officialNames = [
    registration.managerName,
    registration.coachName,
    registration.medicName,
    registration.officialName,
  ].filter(Boolean);

  if (
    officialNames.length !== 4
  ) {
    return {
      error:
        'Complete all four official positions before submitting.',
    };
  }

  /* -------------------------------------------------------
     PLAYERS
     ------------------------------------------------------- */

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

  /* -------------------------------------------------------
     PLAYER DOCUMENTS
     ------------------------------------------------------- */

  const playerIds =
    players.map(
      (player) => player.id
    );

  const playerDocumentCount =
    playerIds.length > 0
      ? await prisma.playerDocument.count({
          where: {
            playerId: {
              in: playerIds,
            },
          },
        })
      : 0;

  if (
    playerDocumentCount === 0
  ) {
    return {
      error:
        'Upload at least one player document before submitting.',
    };
  }

  /* -------------------------------------------------------
     STATUS TRANSITION
     ------------------------------------------------------- */

  const newStatus =
    isResubmission
      ? RegistrationStatus.RESUBMITTED
      : RegistrationStatus.SUBMITTED;

  const fromStatus =
    isResubmission
      ? RegistrationStatus.CHANGES_REQUESTED
      : RegistrationStatus.DRAFT;

  const eventNote =
    isResubmission
      ? 'Team resubmitted registration after making requested changes'
      : 'Team submitted Team Details Submission for final review';

  /* -------------------------------------------------------
     UPDATE SAME REGISTRATION
     ------------------------------------------------------- */

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

  revalidatePath(
    '/team/dashboard'
  );

  revalidatePath(
    '/team/register'
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

/* =========================================================
   PHASE 1 COMBINED SUBMIT
   ========================================================= */

export async function saveAndSubmitPhase1(
  formData: FormData,
  registrationId?: string
) {
  /*
   * Both operations receive the SAME registration ID.
   *
   * This is important for multiple-team users.
   */
  await saveTeamInfo(
    formData,
    registrationId
  );

  return submitPhase1(
    registrationId
  );
}

