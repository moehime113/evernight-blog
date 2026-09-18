"use client";

// 站尾：签名 + 快速通道 + 站点状态，顺带把「正在听」接进页脚
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { siteConfig } from '../siteConfig';
import { useMusic } from './MusicProvider';

const QUICK_LINKS = [
  { name: '首页', href: '/' },
  { name: '照片墙', href: '/photowall' },
  { name: '说说', href: '/moments' },
  { name: '音乐', href: '/music' },
  { name: '归档', href: '/timeline' },
  { name: '友链', href: '/friends' },
  { name: '关于', href: '/about' },
];

function useUptimeDays() {
  const [days, setDays] = useState<number | null>(null);
  useEffect(() => {
    const start = new Date(siteConfig.buildDate).getTime();
    if (!Number.isFinite(start)) return;
    const tick = () => {
      const diff = Date.now() - start;
      if (diff > 0) setDays(Math.floor(diff / 86400000));
    };
    tick();
    const timer = setInterval(tick, 60000);
    return () => clearInterval(timer);
  }, []);
  return days;
}

export default function SiteFooter() {
  const { currentSong, isPlaying, togglePlay } = useMusic();
  const days = useUptimeDays();
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-20 px-4 sm:px-6 lg:px-10 pb-10">
      <div className="mx-auto w-full max-w-6xl">
        {/* 顶部发丝线：从中间亮起 */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>

        <div className="mt-7 grid gap-6 rounded-[28px] md:rounded-[36px] border border-white/40 dark:border-white/10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl shadow-lg p-6 md:p-8 md:grid-cols-[1.5fr_1fr_1fr]">

          {/* 1. 签名 + 正在听 */}
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 p-[2px] shadow-md flex-shrink-0">
                <img src={siteConfig.avatarUrl} alt="" className="w-full h-full rounded-[14px] object-cover bg-white" />
              </div>
              <div className="min-w-0">
                <p className="text-base font-black text-slate-900 dark:text-white truncate">
                  {siteConfig.navTitle || siteConfig.authorName}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{siteConfig.bio}</p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/50 dark:border-white/5 bg-white/40 dark:bg-white/5 px-3 py-2.5">
              <div className={`w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border border-white/60 dark:border-white/10 shadow-sm ${isPlaying ? 'animate-[spin_8s_linear_infinite]' : ''}`}>
                {currentSong?.cover ? (
                  <img src={currentSong.cover} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-500/60 to-purple-500/60"></div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 dark:text-indigo-400">
                  {isPlaying ? '正在听' : '今日歌单'}
                </p>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                  {currentSong ? `${currentSong.title} — ${currentSong.artist}` : '点一下，从云端放首歌'}
                </p>
              </div>
              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? '暂停' : '播放'}
                className="w-9 h-9 flex-shrink-0 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/30 hover:bg-indigo-600 active:scale-95 transition-all"
              >
                {isPlaying ? (
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg>
                )}
              </button>
            </div>
          </div>

          {/* 2. 快速通道 */}
          <nav className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-3">快速通道</p>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
              {QUICK_LINKS.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="group inline-flex items-center gap-1.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 group-hover:bg-indigo-500 group-hover:scale-150 transition-all"></span>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* 3. 站点状态 */}
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-3">站点状态</p>
            <div className="space-y-2 text-xs font-bold text-slate-600 dark:text-slate-300">
              <p className="flex items-center gap-2">
                <span className="relative flex w-2 h-2">
                  <span className="absolute inline-flex w-full h-full rounded-full bg-green-400 opacity-75 animate-ping"></span>
                  <span className="relative inline-flex w-2 h-2 rounded-full bg-green-500"></span>
                </span>
                持续运行中{days !== null && <> · 已 {days} 天</>}
              </p>
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                {(siteConfig.footerBadges || []).map(badge => (
                  <span key={badge.name} className={`inline-flex items-center gap-1 ${badge.color}`}>
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: badge.svg }} />
                    {badge.name}
                  </span>
                ))}
              </p>
            </div>

            <div className="mt-4 flex items-center gap-2">
              {siteConfig.social?.github && (
                <a href={siteConfig.social.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub"
                  className="w-8 h-8 rounded-xl bg-white/60 dark:bg-white/5 border border-white/50 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-white hover:bg-indigo-500 hover:border-indigo-500 transition-all">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg>
                </a>
              )}
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-black text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-6 6m6-6l6 6" /></svg>
                回到顶部
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <span>© {year} {siteConfig.authorName} · 保留所有权利</span>
          <span className="flex items-center gap-1.5">
            用
            <span className="text-pink-500 animate-pulse">♥</span>
            和 Next.js 手搓
            {siteConfig.icpConfig?.name && (
              <>
                <span className="text-slate-300 dark:text-slate-600">|</span>
                <a href={siteConfig.icpConfig.link} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-500 transition-colors">{siteConfig.icpConfig.name}</a>
              </>
            )}
          </span>
        </div>
      </div>
    </footer>
  );
}
