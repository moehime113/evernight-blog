"use client";

import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export type PublicComment = {
  id: number;
  body: string;
  user: { login: string };
  created_at: string;
};

type CommentsPage = { comments: PublicComment[]; nextPage: number | null; initialized: boolean };
type Session = { user: { name?: string | null; image?: string | null }; expires: string } | null;

export function GithubAvatar({ login, image, size = 36 }: { login?: string | null; image?: string | null; size?: number }) {
  const [failed, setFailed] = useState(false);
  // 头像优先用 GitHub 返回的地址，只有用户名时用 github.com/<login>.png
  const src = image || (login ? `https://github.com/${encodeURIComponent(login)}.png?size=${size * 2}` : '');
  const style = { width: size, height: size };
  if (!src || failed) {
    return (
      <span aria-hidden style={style} className="flex flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-xs font-bold text-white">
        {(login || '?').slice(0, 1).toUpperCase()}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" width={size} height={size} style={style} loading="lazy" onError={() => setFailed(true)} className="flex-shrink-0 rounded-full bg-white/60 object-cover dark:bg-white/10" />
  );
}

async function responseData(response: Response) {
  const data = await response.json();
  if (!response.ok) throw new Error(typeof data?.error === 'string' ? data.error : `请求失败 (${response.status})`);
  return data;
}

export async function fetchCommentsPage(thread: string, page: number, signal: AbortSignal): Promise<CommentsPage> {
  const query = new URLSearchParams({ thread, page: String(page) });
  return responseData(await fetch(`/api/comments?${query}`, { signal, cache: 'no-store' }));
}

function ThreadComments({ thread, pathname }: { thread: string; pathname: string }) {
  const id = useId();
  const [comments, setComments] = useState<PublicComment[]>([]);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [initialized, setInitialized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [failedPage, setFailedPage] = useState(1);
  const [session, setSession] = useState<Session>();
  const [sessionError, setSessionError] = useState('');
  const [sessionAttempt, setSessionAttempt] = useState(0);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const pageRequest = useRef<AbortController | null>(null);
  const postRequest = useRef<AbortController | null>(null);

  const loadPage = useCallback(async (page: number) => {
    pageRequest.current?.abort();
    const controller = new AbortController();
    pageRequest.current = controller;
    setLoading(true);
    setError('');
    try {
      const data = await fetchCommentsPage(thread, page, controller.signal);
      if (controller.signal.aborted) return;
      setComments(previous => {
        const merged = new Map((page === 1 ? [] : previous).map(comment => [comment.id, comment]));
        data.comments.forEach(comment => merged.set(comment.id, comment));
        return [...merged.values()];
      });
      setNextPage(data.nextPage);
      setInitialized(data.initialized);
    } catch (error) {
      if (!controller.signal.aborted) {
        setError(error instanceof Error ? error.message : '评论加载失败，请重试。');
        setFailedPage(page);
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [thread]);

  useEffect(() => {
    void loadPage(1);
    return () => {
      pageRequest.current?.abort();
      postRequest.current?.abort();
    };
  }, [loadPage]);

  useEffect(() => {
    const controller = new AbortController();
    async function loadSession() {
      try {
        const response = await fetch('/api/auth/session', { signal: controller.signal, cache: 'no-store' });
        if (response.status === 503) throw new Error('GitHub 登录尚未配置，暂时无法发表评论。');
        const data: Session = await responseData(response);
        if (!controller.signal.aborted) setSession(data);
      } catch (error) {
        if (!controller.signal.aborted) setSessionError(error instanceof Error ? error.message : '登录状态加载失败。');
      }
    }
    void loadSession();
    return () => controller.abort();
  }, [sessionAttempt]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || loading || initialized === null || !body.trim() || body.length > 2000 || postRequest.current) return;
    const controller = new AbortController();
    postRequest.current = controller;
    setSubmitting(true);
    setSubmitError('');
    setSubmitted(false);
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thread, body }),
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      if (response.status === 401) setSession(null);
      const comment: PublicComment = await responseData(response);
      if (controller.signal.aborted) return;
      setComments(previous => [...previous.filter(item => item.id !== comment.id), comment]);
      setInitialized(true);
      setBody('');
      setSubmitted(true);
      window.dispatchEvent(new CustomEvent('comments:updated', { detail: { thread } }));
    } catch (error) {
      if (!controller.signal.aborted) setSubmitError(error instanceof Error ? error.message : '发表失败，请重试。');
    } finally {
      if (!controller.signal.aborted) {
        setSubmitting(false);
        postRequest.current = null;
      }
    }
  }

  const buttonClass = 'rounded-xl px-4 py-2 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <section aria-labelledby={`${id}-heading`} className="w-full relative my-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md p-4 sm:p-6 text-slate-800 dark:text-slate-200 space-y-5">
      <h3 id={`${id}-heading`} className="text-lg font-bold">评论</h3>
      <div aria-busy={loading} className="space-y-4">
        {comments.map(comment => (
          <article key={comment.id} className="flex gap-3 rounded-2xl border border-slate-200/50 dark:border-white/10 bg-white/30 dark:bg-white/5 p-4">
            <GithubAvatar login={comment.user.login} />
            <div className="min-w-0 flex-1">
              <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
                <span className="font-semibold text-indigo-700 dark:text-indigo-300">{comment.user.login}</span>
                <time dateTime={comment.created_at} className="text-xs text-slate-600 dark:text-slate-400">{comment.created_at.replace('T', ' ').replace(/Z$/, ' UTC')}</time>
              </header>
              <p className="mt-2 whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-sm leading-relaxed">{comment.body}</p>
            </div>
          </article>
        ))}
        {loading && <p role="status" className="text-sm">正在加载评论…</p>}
        {!loading && !error && initialized === false && <p role="status" className="text-sm">评论服务暂未就绪，请稍后重试。</p>}
        {!loading && !error && initialized && comments.length === 0 && <p role="status" className="text-sm">暂无评论，欢迎留下你的想法。</p>}
      </div>
      {error && <div role="alert" className="space-y-2 text-sm"><p className="text-red-700 dark:text-red-300">{error}</p><button type="button" disabled={loading || submitting} onClick={() => void loadPage(failedPage)} className={buttonClass}>重试加载评论</button></div>}
      {nextPage !== null && !error && <button type="button" disabled={loading || submitting} onClick={() => void loadPage(nextPage)} className={buttonClass}>加载更多评论</button>}
      {sessionError ? (
        <div role="alert" className="space-y-2 text-sm">
          <p className="text-red-700 dark:text-red-300">{sessionError}</p>
          <button type="button" onClick={() => { setSessionError(''); setSessionAttempt(attempt => attempt + 1); }} className={buttonClass}>重试登录状态</button>
        </div>
      ) : session === undefined ? (
        <p role="status" className="text-sm">正在检查登录状态…</p>
      ) : session === null ? (
        <Link
          href={`/login?returnTo=${encodeURIComponent(pathname)}`}
          className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-300/70 bg-white/30 p-3 text-sm font-medium text-slate-700 transition-colors hover:border-indigo-400 hover:text-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:border-slate-600/70 dark:bg-white/5 dark:text-slate-200 dark:hover:text-indigo-300"
        >
          <svg viewBox="0 0 24 24" aria-hidden className="h-8 w-8 flex-shrink-0 fill-slate-800 dark:fill-slate-100"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
          <span className="flex-1">使用 GitHub 登录后发表评论<span className="mt-0.5 block text-xs font-normal text-slate-500 dark:text-slate-400">登录只用来确认身份，头像和用户名会一起显示在评论上。</span></span>
        </Link>
      ) : (
        <form onSubmit={submit} aria-busy={submitting} className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor={`${id}-body`} className="flex items-center gap-2 text-sm font-medium">
              <GithubAvatar image={session.user.image} login={session.user.name} size={28} />
              以 {session.user.name || 'GitHub 用户'} 的身份发表评论
            </label>
            <Link href="/login" className="flex-shrink-0 text-xs text-slate-500 underline underline-offset-4 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">账号</Link>
          </div>
          <textarea id={`${id}-body`} value={body} onChange={event => { setBody(event.target.value); setSubmitted(false); }} maxLength={2000} required disabled={submitting} rows={4} aria-describedby={`${id}-count`} className="w-full resize-y rounded-2xl border border-slate-300/70 dark:border-slate-600/70 bg-white/40 dark:bg-white/5 p-3 text-sm focus-visible:outline-2 focus-visible:outline-indigo-500 disabled:opacity-50" />
          <div className="flex items-center justify-between gap-3">
            <span id={`${id}-count`} className="text-xs text-slate-600 dark:text-slate-400">{body.length}/2000 字符</span>
            <button type="submit" disabled={submitting || loading || initialized === null || !body.trim() || body.length > 2000} className={buttonClass}>{submitting ? '正在发表…' : '发表评论'}</button>
          </div>
        </form>
      )}
      {submitError && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{submitError}</p>}
      {submitted && <p role="status" className="text-sm">评论已发表。</p>}
    </section>
  );
}

export default function Comments({ thread }: { thread?: string }) {
  const pathname = usePathname();
  const threadKey = (thread || pathname).replace(/\/$/, '') || '/';
  return <ThreadComments key={threadKey} thread={threadKey} pathname={pathname} />;
}
