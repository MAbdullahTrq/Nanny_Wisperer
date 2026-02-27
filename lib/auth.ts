import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { getUserByEmail, getUserById } from '@/lib/airtable/users';
import { verifyPassword, validateEmail } from '@/lib/auth/password';
import { sendLoginNotificationEmail } from '@/lib/email';
import { config } from '@/lib/config';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Email and Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        if (!validateEmail(credentials.email)) return null;

        try {
          const user = await getUserByEmail(credentials.email);
          if (!user?.passwordHash) return null;
          if (user.locked) return null;

          const valid = await verifyPassword(credentials.password, user.passwordHash);
          if (!valid) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name ?? undefined,
            userType: user.userType,
            ghlContactId: user.ghlContactId ?? undefined,
            airtableHostId: user.airtableHostId ?? undefined,
            airtableNannyId: user.airtableNannyId ?? undefined,
            isAdmin: user.isAdmin ?? false,
            isMatchmaker: user.isMatchmaker ?? false,
          };
        } catch (e) {
          console.error('Auth credentials error:', e instanceof Error ? e.message : e);
          return null;
        }
      },
    }),
    // Impersonation: admin uses token from /api/admin/impersonate to sign in as another user
    CredentialsProvider({
      id: 'impersonation',
      name: 'Impersonation',
      credentials: {
        impersonationToken: { label: 'Token', type: 'text' },
      },
      async authorize(credentials) {
        const token = credentials?.impersonationToken;
        if (!token || typeof token !== 'string') return null;
        try {
          const { verifyImpersonationToken } = await import('@/lib/auth/impersonation');
          const payload = verifyImpersonationToken(token);
          if (!payload?.targetUserId) return null;
          const user = await getUserById(payload.targetUserId);
          if (!user || user.locked) return null;
          return {
            id: user.id,
            email: user.email,
            name: user.name ?? undefined,
            userType: user.userType,
            ghlContactId: user.ghlContactId ?? undefined,
            airtableHostId: user.airtableHostId ?? undefined,
            airtableNannyId: user.airtableNannyId ?? undefined,
            isAdmin: user.isAdmin ?? false,
            isMatchmaker: user.isMatchmaker ?? false,
          };
        } catch {
          return null;
        }
      },
    }),
    GoogleProvider({
      clientId: config.google.clientId || 'dummy',
      clientSecret: config.google.clientSecret || 'dummy',
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === 'credentials' || account?.provider === 'impersonation') {
          token.userId = user.id;
          token.userType = (user as { userType?: string }).userType;
          token.ghlContactId = (user as { ghlContactId?: string }).ghlContactId;
          token.airtableHostId = (user as { airtableHostId?: string }).airtableHostId;
          token.airtableNannyId = (user as { airtableNannyId?: string }).airtableNannyId;
          token.isAdmin = (user as { isAdmin?: boolean }).isAdmin ?? false;
          token.isMatchmaker = (user as { isMatchmaker?: boolean }).isMatchmaker ?? false;
        } else if (account?.provider === 'google' && user.email) {
          const { createUser, updateUser } = await import('@/lib/airtable/users');
          const { syncUserToGHL } = await import('@/lib/ghl/sync-user');
          let dbUser = await getUserByEmail(user.email);
          if (!dbUser) {
            dbUser = await createUser({
              email: user.email,
              name: user.name ?? undefined,
              userType: 'Host',
            });
            const ghlContactId = await syncUserToGHL({
              email: user.email,
              name: user.name ?? undefined,
              userType: dbUser.userType,
            });
            if (ghlContactId && dbUser.id) {
              await updateUser(dbUser.id, { ghlContactId });
              dbUser = { ...dbUser, ghlContactId };
            }
          }
          token.userId = dbUser.id;
          token.userType = dbUser.userType;
          token.ghlContactId = dbUser.ghlContactId;
          token.airtableHostId = dbUser.airtableHostId;
          token.airtableNannyId = dbUser.airtableNannyId;
          token.isAdmin = dbUser.isAdmin ?? false;
          token.isMatchmaker = dbUser.isMatchmaker ?? false;
        }
      }
      if (token.userId && !user) {
        const dbUser = await getUserById(token.userId as string);
        if (dbUser?.locked) {
          token.userId = undefined;
          token.userType = undefined;
          token.ghlContactId = undefined;
          token.airtableHostId = undefined;
          token.airtableNannyId = undefined;
          token.isAdmin = false;
          token.isMatchmaker = false;
        } else if (dbUser) {
          token.userType = dbUser.userType;
          token.ghlContactId = dbUser.ghlContactId;
          token.airtableHostId = dbUser.airtableHostId;
          token.airtableNannyId = dbUser.airtableNannyId;
          token.isAdmin = dbUser.isAdmin ?? false;
          token.isMatchmaker = dbUser.isMatchmaker ?? false;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as Record<string, unknown>).userId = token.userId;
        (session.user as Record<string, unknown>).userType = token.userType;
        (session.user as Record<string, unknown>).ghlContactId = token.ghlContactId;
        (session.user as Record<string, unknown>).airtableHostId = token.airtableHostId;
        (session.user as Record<string, unknown>).airtableNannyId = token.airtableNannyId;
        (session.user as Record<string, unknown>).isAdmin = token.isAdmin ?? false;
        (session.user as Record<string, unknown>).isMatchmaker = token.isMatchmaker ?? false;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  events: {
    async signIn({ user, account }) {
      if (account?.provider === 'impersonation') return;
      if (!user.email) return;

      sendLoginNotificationEmail({
        to: user.email,
        name: user.name || user.email,
        ipAddress: 'Unknown',
        userAgent: account?.provider === 'google' ? 'Google OAuth' : 'Email & Password',
      }).catch(() => {});
    },
  },
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: config.auth.nextAuthSecret || 'fallback-dev-secret-change-in-production',
};
