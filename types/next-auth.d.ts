import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface User {
    id?: string;
    userType?: string;
    ghlContactId?: string;
    airtableHostId?: string;
    airtableNannyId?: string;
    isAdmin?: boolean;
    isMatchmaker?: boolean;
  }

  interface Session {
    user: {
      userId?: string;
      userType?: string;
      ghlContactId?: string;
      airtableHostId?: string;
      airtableNannyId?: string;
      isAdmin?: boolean;
      isMatchmaker?: boolean;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string;
    userType?: string;
    ghlContactId?: string;
    airtableHostId?: string;
    airtableNannyId?: string;
    isAdmin?: boolean;
    isMatchmaker?: boolean;
  }
}
