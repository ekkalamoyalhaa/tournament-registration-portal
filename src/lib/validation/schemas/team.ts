import { z } from 'zod';

// PRD §9
export const teamInfoSchema = z.object({
  name: z.string().min(2).max(150),
  shortName: z.string().max(30).optional(),
  clubRegistrationNumber: z.string().max(50).optional(),
  country: z.string().max(60).optional(),
  region: z.string().max(60).optional(),
  city: z.string().max(60).optional(),
  address: z.string().max(255).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(30).optional(),
  website: z.string().url().optional(),
  socialMedia: z.string().max(255).optional(),
  description: z.string().max(2000).optional(),
});

// PRD §11
export const managerInfoSchema = z.object({
  managerName: z.string().min(2).max(150),
  managerPosition: z.string().max(60).optional(),
  managerEmail: z.string().email(),
  managerPhone: z.string().max(30).optional(),
  managerCountry: z.string().max(60).optional(),
  assistantManagerName: z.string().max(150).optional(),
  assistantManagerEmail: z.string().email().optional(),
  assistantManagerPhone: z.string().max(30).optional(),
});

// PRD §8
export const accountSignupSchema = z
  .object({
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    email: z.string().email(),
    phone: z.string().max(30).optional(),
    password: z.string().min(10).max(128),
    confirmPassword: z.string(),
    acceptedTerms: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the terms to continue.' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });
