import { getToken } from 'next-auth/jwt';
import { authConfigured, githubIdentity } from './auth-config';

export async function githubSession(request: Request) {
  if (!authConfigured()) return null;
  const token = await getToken({
    req: { headers: new Headers({ cookie: request.headers.get('cookie') || '' }) },
    secret: process.env.AUTH_SECRET!,
    secureCookie: new URL(process.env.AUTH_URL!).protocol === 'https:',
  });
  return githubIdentity(token);
}
