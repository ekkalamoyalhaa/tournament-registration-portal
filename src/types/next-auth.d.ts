import { DefaultSession } from 'next-auth';
declare module 'next-auth' {
interface Session {
user: {
role?: string;
emailVerified: Date | null;
} & DefaultSession['user'];
}

interface User {
role?: string;
emailVerified: Date | null;
}
}

declare module 'next-auth/jwt' {
interface JWT {
role?: string;
emailVerified: Date | null;
}
}