import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getBackendApiBaseUrl } from '@/lib/backend-url';

const RAW_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

function getServerApiBaseUrl(): string {
  const backendApiBaseUrl = process.env.BACKEND_API_URL;
  if (backendApiBaseUrl) {
    return backendApiBaseUrl.replace(/\/$/, '').endsWith('/api')
      ? backendApiBaseUrl.replace(/\/$/, '')
      : `${backendApiBaseUrl.replace(/\/$/, '')}/api`;
  }

  if (RAW_API_BASE_URL.startsWith('http://') || RAW_API_BASE_URL.startsWith('https://')) {
    return RAW_API_BASE_URL.replace(/\/$/, '').endsWith('/api')
      ? RAW_API_BASE_URL.replace(/\/$/, '')
      : `${RAW_API_BASE_URL.replace(/\/$/, '')}/api`;
  }

  return getBackendApiBaseUrl();
}

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const apiBase = getServerApiBaseUrl();
          const response = await fetch(`${apiBase}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!response.ok) {
            return null;
          }

          const data = await response.json();
          if (!data?.user || !data?.token) {
            return null;
          }

          return {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            role: data.user.role,
            token: data.token,
          } as any;
        } catch (error) {
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.accessToken = (user as any).token;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
      }
      (session as any).accessToken = token.accessToken as string;
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
