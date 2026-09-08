import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      role?: string;
      emailVerified?: boolean;
    } & DefaultSession['user'];
  }

  interface User {
    role?: string;
    emailVerified?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;
    emailVerified?: boolean;
  }
}