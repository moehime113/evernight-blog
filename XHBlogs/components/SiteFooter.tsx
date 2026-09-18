import { siteConfig } from '../siteConfig';

export default function SiteFooter() {
  return (
    <footer className="relative mx-auto mt-12 w-[90%] max-w-6xl pb-8 text-xs text-slate-600 dark:text-slate-400">
      <div className="mb-5 h-px bg-gradient-to-r from-transparent via-slate-400/40 to-transparent" />
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <p>© {new Date().getFullYear()} <span className="font-semibold text-slate-800 dark:text-slate-200">{siteConfig.authorName}</span><span className="mx-2 text-indigo-400" aria-hidden="true">✦</span>把片刻留给永夜</p>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px]">
          <span>基于 <a href="https://github.com/heiehiehi/XinghuisamaBlogs" className="hover:text-indigo-500">XingHuiSama</a> · Evernight 修改</span>
          <a href="https://creativecommons.org/licenses/by-nc/4.0/" className="hover:text-indigo-500">CC BY-NC 4.0</a>
          {siteConfig.icpConfig?.name && <a href={siteConfig.icpConfig.link} rel="noopener noreferrer" target="_blank" className="hover:text-indigo-500">{siteConfig.icpConfig.name}</a>}
        </p>
      </div>
    </footer>
  );
}
