'use server';

import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';
import { registerSchema } from '@/lib/validation/schemas/auth';
import { GlobalRole } from '@prisma/client';
import crypto from 'crypto';
import { headers } from 'next/headers';
import { sendVerificationEmail } from '@/lib/email/resend';

export async function registerUser(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = registerSchema.safeParse(raw);

  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => i.message).join(', ');
    return { error: issues || 'Invalid input. Please check your details.' };
  }

  const { firstName, lastName, email, phone, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: 'An account with this email already exists.' };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
      phone,
      role: GlobalRole.TEAM_MANAGER,
    },
  });

  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.verificationToken.create({
    data: { email, token, expires },
  });

  const h = headers();
  const host = h.get('host') ?? 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const verifyUrl = `${protocol}://${host}/verify-email?token=${token}`;

  // Fire email — don't block registration if it fails
  const emailResult = await sendVerificationEmail({
    to: email,
    firstName,
    verifyUrl,
  });

  if (!emailResult.success) {
    // Still return success to user, but include the URL as fallback
    return {
      success: true,
      verifyUrl,
      warning: 'Email could not be sent — use the link below to verify.',
    };
  }

  return { success: true };
}