import { z } from 'zod';

// PRD §5 — configurable tournament detail fields (admin-facing).
export const tournamentDetailSchema = z.object({
  name: z.string().min(2).max(150),
  slug: z.string().min(2).max(150).regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers, and hyphens only.'),
  description: z.string().max(5000).optional(),
  venue: z.string().max(150).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  registrationOpensAt: z.coerce.date().optional(),
  registrationClosesAt: z.coerce.date().optional(),
  availableTeamSlots: z.number().int().min(1).optional(),
  minPlayers: z.number().int().min(1).optional(),
  maxPlayers: z.number().int().min(1).optional(),
  rules: z.string().max(20000).optional(),
  eligibility: z.string().max(10000).optional(),
  contactInfo: z.string().max(1000).optional(),
});
