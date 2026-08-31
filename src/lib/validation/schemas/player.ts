import { z } from 'zod';

// PRD §13, §36. Which fields are actually required is configurable per
// tournament (TournamentRequirement) — this schema covers shape/type only;
// apply per-tournament required-field checks in the registration service.
export const playerSchema = z.object({
  firstName: z.string().min(2).max(100),
  middleName: z.string().max(100).optional(),
  lastName: z.string().min(2).max(100),
  preferredName: z.string().max(100).optional(),
  dateOfBirth: z.coerce.date().optional(),
  nationality: z.string().length(3).optional(), // ISO 3166-1 alpha-3
  countryOfResidence: z.string().length(3).optional(),
  gender: z.string().max(30).optional(),
  jerseyNumber: z.number().int().min(1).max(99).optional(),
  position: z.enum(['GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'FORWARD']).optional(),
  height: z.number().int().min(100).max(230).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email().optional(),
  emergencyContact: z.string().max(150).optional(),
  emergencyContactPhone: z.string().max(30).optional(),
});

export type PlayerInput = z.infer<typeof playerSchema>;
