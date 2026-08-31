// PRD §19 — team registration status transitions. The backend must reject
// invalid transitions regardless of what the frontend believes the state is.

export type RegistrationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'RESUBMITTED'
  | 'APPROVED'
  | 'REJECTED';

const REGISTRATION_TRANSITIONS: Record<RegistrationStatus, RegistrationStatus[]> = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['UNDER_REVIEW'],
  UNDER_REVIEW: ['CHANGES_REQUESTED', 'APPROVED', 'REJECTED'],
  CHANGES_REQUESTED: ['RESUBMITTED'],
  RESUBMITTED: ['UNDER_REVIEW'],
  APPROVED: [],
  REJECTED: [],
};

export function canTransitionRegistration(from: RegistrationStatus, to: RegistrationStatus) {
  return REGISTRATION_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertValidRegistrationTransition(from: RegistrationStatus, to: RegistrationStatus) {
  if (!canTransitionRegistration(from, to)) {
    throw new Error(`Invalid registration transition: ${from} -> ${to}`);
  }
}

// PRD §20 — an individual player has its own workflow, decoupled from the
// team's, so admins can request corrections for one player without
// rejecting the whole team.
export type PlayerStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'APPROVED'
  | 'REJECTED';

const PLAYER_TRANSITIONS: Record<PlayerStatus, PlayerStatus[]> = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['UNDER_REVIEW'],
  UNDER_REVIEW: ['CHANGES_REQUESTED', 'APPROVED', 'REJECTED'],
  CHANGES_REQUESTED: ['UNDER_REVIEW'], // §25: corrected doc -> back to UNDER_REVIEW
  APPROVED: [],
  REJECTED: [],
};

export function canTransitionPlayer(from: PlayerStatus, to: PlayerStatus) {
  return PLAYER_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertValidPlayerTransition(from: PlayerStatus, to: PlayerStatus) {
  if (!canTransitionPlayer(from, to)) {
    throw new Error(`Invalid player transition: ${from} -> ${to}`);
  }
}
