import { Role } from '@prisma/client';
import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface User {
    id: string;
    username: string;
    fullName: string;
    role: Role;
    mustChangePassword: boolean;
    sessionRecordId?: string;
  }

  interface Session {
    user: {
      id: string;
      username: string;
      fullName: string;
      role: Role;
      mustChangePassword: boolean;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    username: string;
    fullName: string;
    role: Role;
    mustChangePassword: boolean;
    sessionRecordId?: string;
  }
}
