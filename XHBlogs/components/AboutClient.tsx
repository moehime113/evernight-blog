"use client";

import Comments from './Comments';
import { siteConfig } from '../siteConfig';

export default function AboutClient({ contentHtml, coverImage, stats }: { contentHtml: string, coverImage: string, stats: { label: string, value: number }[] }) {

  return (
    <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-[40px] shadow-2xl border border-white/40 dark:border-white/10 overflow-hidden transition-colors duration-700 relative">

      <div className="w-full h-40 sm:h-48 md:h-64 relative bg-slate-200 dark:bg-slate-700 overflow-hidden group">
        <img src={coverImage} alt="About Hero" className="w-full h-full object-cover opacity-90 transition-transform duration-1000 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
      </div>

      <div className="px-5 sm:px-8 md:px-16 pb-10 md:pb-16 relative">
        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white dark:border-slate-800 shadow-2xl overflow-hidden -mt-12 md:-mt-16 relative z-20 bg-white">
          <img src={siteConfig.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
        </div>

        <div className="mt-4 md:mt-6 mb-6 md:mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-1 md:mb-2 transition-colors duration-700">{siteConfig.authorName}</h1>
            <p className="text-[11px] md:text-xs text-slate-500 dark:text-slate-400 font-bold tracking-[0.25em] uppercase transition-colors duration-700">
              自 {new Date(siteConfig.buildDate).getFullYear() || 2026} 年起记录
            </p>
          </div>

          <div className="flex flex-wrap justify-center md:justify-end gap-2">
            {stats.map(item => (
              <span key={item.label} className="px-3 py-1.5 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-white/40 dark:border-white/5 shadow-sm text-[11px] font-black text-slate-500 dark:text-slate-400">
                <span className="text-indigo-600 dark:text-indigo-400 text-sm">{item.value}</span> {item.label}
              </span>
            ))}
            {siteConfig.social?.github && (
              <a href={siteConfig.social.github} target="_blank" rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-indigo-500 text-white text-[11px] font-black shadow-md shadow-indigo-500/30 hover:bg-indigo-600 transition-colors">
                GitHub
              </a>
            )}
          </div>
        </div>

        <div className="w-full h-px bg-slate-300/50 dark:bg-slate-700 mb-6 md:mb-8"></div>

        <div>
              <div className="relative">
                <style>{`
                  .prose h1 { font-size: 1.8rem !important; font-weight: 900 !important; margin-bottom: 1.2rem !important; margin-top: 2rem !important; line-height: 1.3 !important; color: inherit !important; }
                  .prose h2 { font-size: 1.5rem !important; font-weight: 800 !important; margin-bottom: 1rem !important; margin-top: 1.5rem !important; color: inherit !important; }
                  .prose h3 { font-size: 1.2rem !important; font-weight: 700 !important; margin-bottom: 0.8rem !important; color: inherit !important; }
                  .prose p { font-size: 0.95rem !important; line-height: 1.75 !important; color: inherit !important; }
                  .prose ul, .prose ol { padding-left: 1.2rem !important; font-size: 0.95rem !important; }

                  .prose pre {
                    background-color: #282c34 !important; color: #abb2bf !important;
                    padding: 1rem !important; border-radius: 0.75rem !important;
                    overflow-x: auto !important; box-shadow: inset 0 0 10px rgba(0,0,0,0.3) !important;
                    margin-top: 1rem !important; margin-bottom: 1rem !important;
                  }
                  
                  .prose pre code, .prose p code, .prose li code { 
                    font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, ui-monospace, monospace !important; 
                    font-variant-ligatures: contextual !important; 
                  }
                  .prose pre code { 
                    background-color: transparent !important; 
                    padding: 0 !important; 
                    color: inherit !important; 
                    font-size: 0.85em !important; 
                  }
                  
                  .prose code::before, .prose code::after { content: none !important; }
                  .prose p code, .prose li code { background-color: rgba(99, 102, 241, 0.1) !important; color: #6366f1 !important; padding: 0.1rem 0.3rem !important; border-radius: 0.25rem !important; font-weight: 600 !important; font-size: 0.85em !important; }
                  .dark .prose p code, .dark .prose li code { background-color: rgba(99, 102, 241, 0.2) !important; color: #818cf8 !important; }
                  .prose img { display: block !important; margin: 1.5rem auto !important; border-radius: 1rem !important; box-shadow: 0 10px 30px rgba(0,0,0,0.1) !important; max-width: 100% !important; height: auto !important; }

                  .prose pre code .hljs-comment, .prose pre code .hljs-quote { color: #5c6370 !important; font-style: italic !important; }
                  .prose pre code .hljs-doctag, .prose pre code .hljs-keyword, .prose pre code .hljs-formula { color: #c678dd !important; }
                  .prose pre code .hljs-section, .prose pre code .hljs-name, .prose pre code .hljs-selector-tag, .prose pre code .hljs-deletion, .prose pre code .hljs-subst { color: #e06c75 !important; }
                  .prose pre code .hljs-literal { color: #56b6c2 !important; }
                  .prose pre code .hljs-string, .prose pre code .hljs-regexp, .prose pre code .hljs-addition, .prose pre code .hljs-attribute, .prose pre code .hljs-meta-string { color: #98c379 !important; }
                  .prose pre code .hljs-built_in, .prose pre code .hljs-class .hljs-title { color: #e6c07b !important; }
                  .prose pre code .hljs-attr, .prose pre code .hljs-variable, .prose pre code .hljs-template-variable, .prose pre code .hljs-type, .prose pre code .hljs-selector-class, .prose pre code .hljs-selector-attr, .prose pre code .hljs-selector-pseudo, .prose pre code .hljs-number { color: #d19a66 !important; }
                  .prose pre code .hljs-symbol, .prose pre code .hljs-bullet, .prose pre code .hljs-link, .prose pre code .hljs-meta, .prose pre code .hljs-selector-id, .prose pre code .hljs-title { color: #61aeee !important; }

                  @media (min-width: 768px) {
                    .prose h1 { font-size: 3rem !important; font-weight: 950 !important; margin-bottom: 2rem !important; margin-top: 3rem !important; line-height: 1.1 !important; }
                    .prose h2 { font-size: 2.2rem !important; margin-bottom: 1.5rem !important; margin-top: 2rem !important; }
                    .prose p { font-size: 1.15rem !important; }
                    .prose pre { padding: 1.25rem !important; margin-top: 1.5rem !important; margin-bottom: 1.5rem !important; }
                    .prose pre code { font-size: 0.9em !important; }
                  }
                `}</style>
                <div className="prose prose-slate dark:prose-invert prose-base md:prose-lg max-w-none text-slate-800 dark:text-slate-200 font-serif transition-colors duration-700 leading-relaxed scroll-smooth" dangerouslySetInnerHTML={{ __html: contentHtml }} />
              </div>
              <div className="mt-12 md:mt-16"><Comments /></div>
        </div>

      </div>
    </div>
  );
}