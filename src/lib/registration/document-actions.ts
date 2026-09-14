'use server';

import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth/auth';
import { revalidatePath } from 'next/cache';
import { RegistrationStatus } from '@prisma/client';
import { createSignedDownloadUrl } from '@/lib/r2/signed-url';
import {
  r2PrivateClient,
  R2_PRIVATE_BUCKET,
} from '@/lib/r2/client';

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

async function getRegistrationAccess(
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
        team: true,
      },
    });

  if (!registration) {
    throw new Error(
      'Registration not found or you do not have access to it.'
    );
  }

  return {
    user,
    registration,
    team: registration.team,
  };
}

function assertEditable(
  registration: {
    phase: string;
    status: RegistrationStatus;
  }
) {
  if (registration.phase !== 'PHASE_2') {
    throw new Error(
      'Documents can only be managed in Phase 2.'
    );
  }

  if (
    registration.status !==
      RegistrationStatus.DRAFT &&
    registration.status !==
      RegistrationStatus.CHANGES_REQUESTED
  ) {
    throw new Error(
      'Documents cannot be edited in the current registration status.'
    );
  }
}

/**
 * Find the currently saved document for one upload slot.
 *
 * A slot is uniquely identified by:
 *
 * player:
 *   playerId + documentType
 *
 * official:
 *   officialRole + documentType
 */
export async function getRegistrationDocument(
  registrationId: string,
  params: {
    playerId?: string;
    officialRole?: string;
    documentType: string;
  }
) {
  const { team } =
    await getRegistrationAccess(
      registrationId
    );

  if (params.playerId) {
    const player =
      await prisma.player.findFirst({
        where: {
          id: params.playerId,
          teamId: team.id,
        },
        select: {
          id: true,
        },
      });

    if (!player) {
      throw new Error('Player not found.');
    }

    return prisma.playerDocument.findFirst({
      where: {
        playerId: params.playerId,
        documentType: params.documentType,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        documentType: true,
        originalFilename: true,
        mimeType: true,
        size: true,
        createdAt: true,
      },
    });
  }

  if (params.officialRole) {
    const allowedRoles = [
      'manager',
      'coach',
      'medic',
      'official',
    ];

    if (
      !allowedRoles.includes(
        params.officialRole
      )
    ) {
      throw new Error(
        'Invalid official role.'
      );
    }

    return prisma.playerDocument.findFirst({
      where: {
        playerId: null,
        officialRole:
          params.officialRole,
        documentType:
          params.documentType,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        documentType: true,
        originalFilename: true,
        mimeType: true,
        size: true,
        createdAt: true,
      },
    });
  }

  throw new Error(
    'playerId or officialRole is required.'
  );
}

/**
 * Save an uploaded document.
 *
 * If the same logical document already exists, the old
 * database record and R2 object are replaced.
 */
export async function saveRegistrationDocument(
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
    registration,
    team,
  } =
    await getRegistrationAccess(
      registrationId
    );

  assertEditable(registration);

  if (
    !data.playerId &&
    !data.officialRole
  ) {
    throw new Error(
      'A player or official must be specified.'
    );
  }

  if (
    data.playerId &&
    data.officialRole
  ) {
    throw new Error(
      'A document cannot belong to both a player and an official.'
    );
  }

  let existingDocument:
    | {
        id: string;
        storageKey: string;
      }
    | null = null;

  if (data.playerId) {
    const player =
      await prisma.player.findFirst({
        where: {
          id: data.playerId,
          teamId: team.id,
        },
        select: {
          id: true,
        },
      });

    if (!player) {
      throw new Error(
        'Player not found.'
      );
    }

    existingDocument =
      await prisma.playerDocument.findFirst({
        where: {
          playerId: data.playerId,
          documentType:
            data.documentType,
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          storageKey: true,
        },
      });
  }

  if (data.officialRole) {
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

    existingDocument =
      await prisma.playerDocument.findFirst({
        where: {
          playerId: null,
          officialRole:
            data.officialRole,
          documentType:
            data.documentType,
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          storageKey: true,
        },
      });
  }

  const document =
    await prisma.$transaction(
      async (tx) => {
        if (existingDocument) {
          await tx.playerDocument.delete({
            where: {
              id: existingDocument.id,
            },
          });
        }

        const created =
          await tx.playerDocument.create({
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
              size: data.size,
            },
          });

        if (
          data.officialRole
        ) {
          const officialFieldMap:
            Record<string, string> = {
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
            await tx.teamRegistration.update({
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

        return created;
      }
    );

  /*
   * Delete the replaced R2 object after the database
   * transaction succeeds.
   *
   * If this cleanup fails, the new document is still
   * valid and saved. We only log the cleanup failure.
   */
  if (
    existingDocument &&
    existingDocument.storageKey !==
      data.storageKey
  ) {
    try {
      await r2PrivateClient.send(
        new DeleteObjectCommand({
          Bucket:
            R2_PRIVATE_BUCKET,
          Key:
            existingDocument.storageKey,
        })
      );
    } catch (error) {
      console.error(
        '[DOCUMENT] Failed to delete replaced R2 object:',
        error
      );
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
    document,
  };
}

/**
 * Generate a short-lived signed URL for a document
 * belonging to the authenticated user's registration.
 */
export async function getRegistrationDocumentUrl(
  registrationId: string,
  documentId: string
) {
  const {
    team,
  } =
    await getRegistrationAccess(
      registrationId
    );

  const document =
    await prisma.playerDocument.findFirst({
      where: {
        id: documentId,
        OR: [
          {
            player: {
              teamId: team.id,
            },
          },
          {
            playerId: null,
            officialRole: {
              not: null,
            },
          },
        ],
      },
    });

  if (!document) {
    throw new Error(
      'Document not found.'
    );
  }

  /*
   * Extra ownership check for official documents:
   * the document must correspond to this registration's
   * current official storage key.
   */
  if (
    !document.playerId &&
    document.officialRole
  ) {
    const registration =
      await prisma.teamRegistration.findUnique({
        where: {
          id: registrationId,
        },
        select: {
          managerIdDocKey: true,
          managerPhotoKey: true,
          coachIdDocKey: true,
          coachPhotoKey: true,
          medicIdDocKey: true,
          medicPhotoKey: true,
          officialIdDocKey: true,
          officialPhotoKey: true,
        },
      });

    const validKeys = [
      registration?.managerIdDocKey,
      registration?.managerPhotoKey,
      registration?.coachIdDocKey,
      registration?.coachPhotoKey,
      registration?.medicIdDocKey,
      registration?.medicPhotoKey,
      registration?.officialIdDocKey,
      registration?.officialPhotoKey,
    ].filter(
      (key): key is string =>
        Boolean(key)
    );

    if (
      !validKeys.includes(
        document.storageKey
      )
    ) {
      throw new Error(
        'Document does not belong to this registration.'
      );
    }
  }

  const url =
    await createSignedDownloadUrl(
      document.storageKey,
      300
    );

  return {
    url,
    expiresInSeconds: 300,
  };
}