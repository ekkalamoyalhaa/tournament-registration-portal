import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.emailVerified = user.emailVerified;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.role =
          token.role as string | undefined;

        session.user.emailVerified =
          (token.emailVerified as Date | null | undefined) ?? null;
      }

      return session;
    },
  },
});