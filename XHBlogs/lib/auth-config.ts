import type { NextAuthConfig } from 'next-auth';
import GitHub from 'next-auth/providers/github';

export function authConfigured() {
  try {
    const url = new URL(process.env.AUTH_URL || '');
    return Boolean(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET &&
      process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 32 &&
      !url.username && !url.password && url.pathname === '/' && !url.search && !url.hash &&
      (url.protocol === 'https:' || (process.env.NODE_ENV !== 'production' &&
        url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))));
  } catch {
    return false;
  }
}

export function githubIdentity(token: Record<string, unknown> | null) {
  if (typeof token?.githubId !== 'string' || !/^[1-9]\d{0,19}$/.test(token.githubId) ||
    typeof token.githubLogin !== 'string' || !/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38})$/.test(token.githubLogin)) return null;
  return { id: token.githubId, login: token.githubLogin };
}

export const authConfig = {
  pages: { signIn: '/login', error: '/login' },
  providers: [GitHub({
    authorization: { params: { scope: 'read:user' } },
    checks: ['pkce', 'state'],
  })],
  session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 },
  callbacks: {
    signIn() {
      return authConfigured();
    },
    jwt({ token, account, profile }) {
      if (account) {
        if (account.provider !== 'github' || !profile ||
          (typeof profile.id !== 'string' && !(typeof profile.id === 'number' && Number.isSafeInteger(profile.id)))) return null;
        const identity = githubIdentity({ githubId: String(profile.id), githubLogin: profile.login });
        if (!identity) return null;
        return { githubId: identity.id, githubLogin: identity.login, name: identity.login,
          sub: identity.id, picture: typeof profile.avatar_url === 'string' ? profile.avatar_url : null };
      }
      const identity = githubIdentity(token);
      if (!identity) return null;
      return { githubId: identity.id, githubLogin: identity.login, name: identity.login,
        sub: identity.id, picture: token.picture };
    },
    session({ session, token }) {
      return {
        expires: session.expires,
        user: { name: token.name, image: token.picture },
      };
    },
    redirect({ url, baseUrl }) {
      const origin = process.env.AUTH_URL || baseUrl;
      try {
        const target = new URL(url, origin);
        return target.origin === new URL(origin).origin ? target.href : origin;
      } catch {
        return origin;
      }
    },
  },
} satisfies NextAuthConfig;
