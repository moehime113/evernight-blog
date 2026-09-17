import { authConfigured } from '@/lib/auth-config';
import { githubSession } from '@/lib/github-session';
import { commentsBackend, commentsDatabase } from '@/lib/comments-backend';
import { allowedThreads, CommentsError, readComment, validateOrigin, validatePage, validateThread } from '@/lib/comments-policy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

function errorResponse(error: unknown) {
  return error instanceof CommentsError ? json({ error: error.message }, error.status) : json({ error: 'Comments service unavailable' }, 502);
}

export async function GET(request: Request) {
  try {
    commentsDatabase();
    const query = new URL(request.url).searchParams;
    const thread = validateThread(query.get('thread'), allowedThreads());
    const page = validatePage(query.get('page'));
    return json(await commentsBackend().read(thread, page));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    commentsDatabase();
    if (!authConfigured()) throw new CommentsError(503, 'GitHub login is not configured');
    validateOrigin(request);
    const input = await readComment(request);
    const thread = validateThread(input.thread, allowedThreads());
    const session = await githubSession(request);
    if (!session) throw new CommentsError(401, 'Sign in with GitHub first');
    return json(await commentsBackend().post(thread, input.body, session), 201);
  } catch (error) {
    return errorResponse(error);
  }
}
