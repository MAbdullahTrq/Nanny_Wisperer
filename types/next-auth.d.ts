import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface User {
    id?: string;
    userType?: string;
    ghlContactId?: string;
    airtableHostId?: string;
    airtableNannyId?: string;
  }

  interface Session {
    user: {
      userId?: string;
      userType?: string;
      ghlContactId?: string;
      airtableHostId?: string;
      airtableNannyId?: string;
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
  }
}
