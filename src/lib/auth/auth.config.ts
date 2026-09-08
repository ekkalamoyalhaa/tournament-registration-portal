import type { NextAuthConfig } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';
import { loginSchema } from '@/lib/validation/schemas/auth';
export const authConfig = {
adapter: PrismaAdapter(prisma),
session: { strategy: 'jwt' },
pages: { signIn: '/login' },
providers: [
Credentials({
name: 'credentials',
credentials: {
email: { label: 'Email', type: 'email' },
password: { label: 'Password', type: 'password' },
},
async authorize(credentials) {
const parsed = loginSchema.safeParse(credentials);
if (!parsed.success) return null;

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });

    if (!user || !user.passwordHash) return null;

    const valid = await bcrypt.compare(
      parsed.data.password,
      user.passwordHash
    );

    if (!valid) return null;

    return {
      id: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role,
      emailVerified: user.emailVerifiedAt,
    };
  },
}),

],
} satisfies NextAuthConfig;