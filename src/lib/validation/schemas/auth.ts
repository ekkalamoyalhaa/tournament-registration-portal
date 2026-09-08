import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const registerSchema = z.object({
  firstName: z.string().min(2).max(100),
  lastName: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(5).max(20),
  password: z.string().min(8).max(100),
  terms: z.literal('on', {
    errorMap: () => ({ message: 'You must accept the terms and conditions' }),
  }),
});