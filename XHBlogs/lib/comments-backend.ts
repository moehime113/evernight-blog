import { neon } from '@neondatabase/serverless';
import { CommentsError, validatePage } from './comments-policy';
import type { githubIdentity } from './auth-config';

type CommentRow = { id: string | number; body: string; github_login: string; created_at: string | Date };

export function commentsDatabase() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new CommentsError(503, 'Comments database is not configured');
  return neon(url, { fetchOptions: { cache: 'no-store', signal: AbortSignal.timeout(10000) } });
}

export function publicComment(comment: CommentRow) {
  const id = Number(comment.id);
  if (!Number.isSafeInteger(id) || id < 1) throw new CommentsError(502, 'Invalid comment ID');
  return { id, body: comment.body, user: { login: comment.github_login }, created_at: new Date(comment.created_at).toISOString() };
}

export function commentsBackend() {
  const sql = commentsDatabase();
  return {
    async read(thread: string, page: number) {
      validatePage(String(page));
      const comments = await sql`
        SELECT id, body, github_login, created_at
        FROM comments WHERE thread = ${thread}
        ORDER BY created_at ASC, id ASC LIMIT 31 OFFSET ${(page - 1) * 30}
      ` as CommentRow[];
      return {
        comments: comments.slice(0, 30).map(publicComment),
        nextPage: comments.length > 30 && page < 99999 ? page + 1 : null,
        initialized: true,
      };
    },
    async post(thread: string, body: string, identity: NonNullable<ReturnType<typeof githubIdentity>>) {
      const comments = await sql`
        WITH admitted AS (
          INSERT INTO comment_rate_limits (github_user_id, last_posted_at)
          VALUES (${identity.id}, statement_timestamp())
          ON CONFLICT (github_user_id) DO UPDATE
          SET last_posted_at = EXCLUDED.last_posted_at
          WHERE comment_rate_limits.last_posted_at <= EXCLUDED.last_posted_at - INTERVAL '60 seconds'
          RETURNING github_user_id, last_posted_at
        )
        INSERT INTO comments (thread, body, github_user_id, github_login, created_at)
        SELECT ${thread}, ${body}, github_user_id, ${identity.login}, last_posted_at FROM admitted
        RETURNING id, body, github_login, created_at
      ` as CommentRow[];
      if (!comments.length) throw new CommentsError(429, 'Please wait at least 60 seconds between comments.');
      return publicComment(comments[0]);
    },
  };
}
