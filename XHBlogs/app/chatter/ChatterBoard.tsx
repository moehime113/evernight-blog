"use client";
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { siteConfig } from '../../siteConfig';

type Chatter = {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  mood?: string;
  cover?: string;
  content: string;
};

function readingTime(content: string) {
  return Math.max(1, Math.round(content.replace(/\s/g, '').length / 400));
}

function shortDate(date: string) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function ChatterBoard({ chatters }: { chatters: Chatter[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState("全部");

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    chatters.forEach(c => c.tags?.forEach(t => tags.add(t)));
    return ["全部", ...Array.from(tags)];
  }, [chatters]);

  const filteredChatters = useMemo(() => {
    if (searchQuery.length > 0 && searchQuery.trim() === "") return [];
    const query = searchQuery.trim().toLowerCase();

    return chatters.filter(chatter => {
      const matchSearch = chatter.title.toLowerCase().includes(query) ||
                          chatter.content.toLowerCase().includes(query);
      const matchTag = activeTag === "全部" || chatter.tags?.includes(activeTag);
      return matchSearch && matchTag;
    });
  }, [chatters, searchQuery, activeTag]);

  const [featured, ...rest] = filteredChatters;

  const tagPill = (tag: string, small = false) => (
    <span key={tag} className={`${small ? 'text-[9px] md:text-[10px] px-1.5 md:px-2 py-0.5' : 'text-[10px] md:text-xs px-2 md:px-3 py-1'} font-black rounded-md md:rounded-lg bg-white/10 backdrop-blur-md text-white/90 border border-white/20 uppercase tracking-wider`}>
      #{tag}
    </span>
  );

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-10 py-6 md:py-10 pt-24 md:pt-28 relative z-10">

      <div className="mb-8 md:mb-12 text-center">
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-2 md:mb-4 tracking-tighter">
          {siteConfig.chatterTitle || "云端杂谈"}
        </h1>
        <p className="text-xs md:text-base text-slate-500 dark:text-slate-400 font-medium italic opacity-80">
          “ {siteConfig.chatterDescription || "日常碎片与灵感记录"} ”
        </p>
      </div>

      <div className="mb-8 md:mb-10 flex flex-col items-center gap-5 md:gap-7">
        <div className="relative w-full max-w-lg group">
          <input
            type="text"
            placeholder="搜寻被遗忘的思绪..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/40 dark:border-white/5 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 pl-10 md:pl-14 text-sm md:text-base text-slate-800 dark:text-white shadow-lg md:shadow-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder-slate-400 font-medium"
          />
          <svg className="w-4 h-4 md:w-6 md:h-6 absolute left-4 md:left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        <div className="flex flex-wrap justify-center gap-1.5 md:gap-2">
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`px-3 py-1.5 md:px-5 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black transition-all duration-500 border ${
                activeTag === tag
                ? 'bg-indigo-500 text-white border-indigo-500 shadow-md md:shadow-lg md:shadow-indigo-500/30 scale-105'
                : 'bg-white/30 dark:bg-slate-800/30 text-slate-600 dark:text-slate-400 border-white/20 dark:border-white/5 hover:bg-white/60 dark:hover:bg-slate-700/60'
              }`}
            >
              {tag === "全部" ? tag : `# ${tag}`}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {featured && (
          <motion.div key={`hero-${featured.slug}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.45 }}>
            <Link
              href={`/chatter/${featured.slug}`}
              className="group relative block w-full overflow-hidden rounded-3xl md:rounded-[36px] border border-white/40 dark:border-white/5 shadow-xl md:shadow-2xl mb-8 md:mb-12 min-h-[240px] md:min-h-[380px]"
            >
              {featured.cover ? (
                <img src={featured.cover} alt="cover" className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/40 to-purple-500/40"></div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-slate-950/10"></div>

              <div className="absolute top-3 left-3 md:top-6 md:left-6 flex items-center gap-2">
                <span className="text-[10px] md:text-xs font-black tracking-[0.25em] uppercase text-white bg-indigo-500/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg">Latest</span>
                {featured.mood && (
                  <span className="text-[10px] md:text-xs font-black text-white/95 bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">✨ {featured.mood}</span>
                )}
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-9">
                <div className="flex items-center gap-2 md:gap-3 text-[10px] md:text-xs font-bold text-white/70 mb-2 md:mb-3">
                  <span className="font-mono tracking-widest">{shortDate(featured.date)}</span>
                  <span className="w-1 h-1 rounded-full bg-white/40"></span>
                  <span>约 {readingTime(featured.content)} 分钟</span>
                </div>
                <h2 className="text-xl md:text-4xl font-black text-white leading-tight mb-2 md:mb-4 group-hover:text-indigo-200 transition-colors line-clamp-2 md:line-clamp-1">{featured.title || '无题'}</h2>
                <p className="hidden md:line-clamp-2 text-sm md:text-base text-white/80 font-medium italic max-w-3xl mb-4">{featured.content}</p>
                <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                  {featured.tags?.map(t => tagPill(t))}
                  <span className="ml-auto text-white/80 text-xs md:text-sm font-black tracking-wider group-hover:translate-x-1 transition-transform">阅读全文 →</span>
                </div>
              </div>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {rest.length > 0 && (
        <div className="flex items-center gap-3 mb-4 md:mb-7">
          <span className="text-sm md:text-base font-black text-slate-700 dark:text-slate-200 tracking-widest">往期</span>
          <span className="h-px flex-1 bg-gradient-to-r from-slate-400/40 to-transparent"></span>
          <span className="text-[10px] md:text-xs font-black text-slate-400">{rest.length} 篇</span>
        </div>
      )}

      <motion.div layout className="columns-2 lg:columns-3 gap-3 md:gap-5 space-y-3 md:space-y-5">
        <AnimatePresence mode='popLayout'>
          {rest.map((chatter) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              key={chatter.slug}
              className="break-inside-avoid"
            >
              <Link
                href={`/chatter/${chatter.slug}`}
                className="block rounded-2xl md:rounded-3xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-2xl border border-white/50 dark:border-white/5 shadow-md md:shadow-lg hover:shadow-2xl transition-all duration-500 group relative overflow-hidden"
              >
                {chatter.cover && (
                  <div className="w-full h-24 md:h-36 overflow-hidden relative">
                    <img src={chatter.cover} alt="cover" loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent"></div>
                    {chatter.mood && (
                      <span className="absolute top-2 right-2 md:top-3 md:right-3 bg-white/20 backdrop-blur-md text-white text-[8px] md:text-[10px] font-black px-2 py-0.5 md:px-2.5 md:py-1 rounded-full shadow-sm border border-white/20 uppercase tracking-widest">
                        ✨ {chatter.mood}
                      </span>
                    )}
                  </div>
                )}

                <div className="p-3 md:p-5">
                  <div className="flex items-center gap-2 mb-1.5 md:mb-3">
                    <span className="text-[8px] md:text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 dark:bg-indigo-400/10 px-1.5 py-0.5 md:px-2.5 md:py-1 rounded-md border border-indigo-500/10 tracking-wider">
                      {shortDate(chatter.date)}
                    </span>
                    <span className="text-[8px] md:text-[10px] font-bold text-slate-400">{readingTime(chatter.content)} 分钟</span>
                  </div>

                  {chatter.title && (
                    <h3 className="text-sm md:text-lg font-bold text-slate-800 dark:text-white mb-1.5 md:mb-3 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">{chatter.title}</h3>
                  )}

                  <div className="text-[10px] md:text-xs text-slate-600 dark:text-slate-300 leading-snug md:leading-relaxed line-clamp-3 opacity-90 font-medium italic">
                    {chatter.content}
                  </div>

                  {chatter.tags && chatter.tags.length > 0 && (
                    <div className="mt-2.5 md:mt-4 flex flex-wrap gap-1 md:gap-1.5">
                      {chatter.tags.map(t => (
                        <span key={t} className="text-[8px] md:text-[9px] font-black text-slate-500 dark:text-slate-400 bg-slate-500/5 dark:bg-white/5 px-1.5 py-0.5 md:px-2 md:py-0.5 rounded-md border border-slate-500/10 dark:border-white/5 transition-all group-hover:bg-indigo-500/10 group-hover:text-indigo-500">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {filteredChatters.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 md:py-24 text-center">
          <div className="text-4xl md:text-5xl mb-4 opacity-40">🫧</div>
          <h2 className="text-lg md:text-2xl font-black text-slate-800 dark:text-white mb-2">这里还没有落笔</h2>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium">{searchQuery || activeTag !== '全部' ? '换个关键词或标签再找找看。' : '在 chatters/ 里放一篇 markdown 就会出现在这里。'}</p>
        </div>
      )}
    </div>
  );
}
