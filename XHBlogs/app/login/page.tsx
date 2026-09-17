import Link from 'next/link';
import { AuthError } from 'next-auth';
import { redirect } from 'next/navigation';
import { auth, signIn, signOut } from '@/auth';
import { authConfigured } from '@/lib/auth-config';
import Navbar from '@/components/Navbar';
import { siteConfig } from '@/siteConfig';

export const metadata = { title: `登录 | ${siteConfig.authorName}` };
export const dynamic = 'force-dynamic';

const githubIcon = 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12';

export default async function LoginPage({ searchParams }: {
  searchParams: Promise<{ returnTo?: string; error?: string }>;
}) {
  const params = await searchParams;
  const returnTo = typeof params.returnTo === 'string' && /^\/(?![\\/])/.test(params.returnTo) ? params.returnTo : '/';
  const configured = authConfigured();
  const session = configured ? await auth() : null;
  const login = session?.user?.name || '';
  const buttonClass = 'w-full rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50';

  async function loginAction() {
    'use server';
    if (!authConfigured()) redirect('/login?error=Configuration');
    try {
      await signIn('github', { redirectTo: returnTo });
    } catch (error) {
      if (error instanceof AuthError) redirect(`/login?error=OAuth&returnTo=${encodeURIComponent(returnTo)}`);
      throw error;
    }
  }

  async function logout() {
    'use server';
    await signOut({ redirectTo: '/login' });
  }

  return (
    <div className="min-h-screen px-4 pb-20 pt-28 text-slate-800 dark:text-slate-100">
      <Navbar />
      <main className="relative z-10 mx-auto max-w-md rounded-3xl border border-white/50 bg-white/60 p-7 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60 space-y-6">
        {session ? (
          <>
            <header className="flex items-center gap-4">
              <img src={session.user?.image || `https://github.com/${encodeURIComponent(login)}.png?size=160`} alt="" width={64} height={64} className="h-16 w-16 flex-shrink-0 rounded-2xl bg-white object-cover shadow-md dark:bg-white/10" />
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-bold">{login}</h1>
                <p className="text-sm text-slate-600 dark:text-slate-300">已通过 GitHub 授权</p>
              </div>
            </header>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">现在可以在任意页面发表评论，头像和用户名会一起显示在评论上。</p>
            <div className="space-y-3">
              <Link href={returnTo} className="block rounded-xl bg-indigo-600 px-5 py-3 text-center font-semibold text-white hover:bg-indigo-700">返回浏览</Link>
              <form action={logout}><button className="w-full rounded-xl border border-slate-300/70 px-5 py-3 font-semibold text-slate-700 hover:border-red-400 hover:text-red-600 dark:border-slate-600/70 dark:text-slate-200">退出登录</button></form>
            </div>
          </>
        ) : (
          <>
            <header className="space-y-2">
              <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-300">{siteConfig.authorName}</p>
              <h1 className="text-3xl font-bold">欢迎登录</h1>
              <p className="text-sm text-slate-600 dark:text-slate-300">评论用 GitHub 身份，无需另设密码。</p>
            </header>
            {!configured && <p role="status" className="rounded-xl bg-amber-100 p-4 text-sm text-amber-950 dark:bg-amber-950 dark:text-amber-100">站长尚未配置 GitHub 登录，暂时无法授权。浏览网站不受影响。</p>}
            {params.error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">登录未完成，请重试；如持续失败，请联系站长检查 OAuth 配置。</p>}
            <form action={loginAction}>
              <button disabled={!configured} className={`${buttonClass} flex items-center justify-center gap-3`}>
                <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5 fill-current"><path d={githubIcon} /></svg>
                使用 GitHub 登录
              </button>
            </form>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">仅请求 read:user 权限确认身份，不读取仓库。评论保存在本站数据库，用户名与头像会公开展示。</p>
          </>
        )}
        <Link href="/" className="inline-block text-sm text-slate-600 underline dark:text-slate-300">返回首页</Link>
      </main>
    </div>
  );
}
