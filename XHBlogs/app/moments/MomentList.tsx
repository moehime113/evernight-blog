"use client";

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, MessageSquare, Clock, Sparkles, Search, ArrowDownAZ, ArrowUpZA, ChevronLeft, ChevronRight, Ghost } from 'lucide-react';
import MomentComments from '../../components/MomentComments';

function timeAgo(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return '刚刚';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} 分钟前`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} 小时前`;
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

function stamp(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { day: dateStr, month: '' };
  return { day: String(d.getDate()).padStart(2, '0'), month: `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}` };
}

// 拍立得的手写日期：固定角度，服务端与客户端一致
const TILTS = [-1.4, 1.1, -0.7, 1.6, -1.1, 0.6];

export interface Moment {
  id: string;
  date: string;
  location: string;
  images: string[];
  content: string;
}

export default function MomentList({ moments, authorName, avatarUrl }: { moments: Moment[]; authorName: string; avatarUrl: string }) {
  const [openCommentId, setOpenCommentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [lightbox, setLightbox] = useState<{ images: string[], index: number } | null>(null);

  const processedMoments = useMemo(() => {
    let result = moments ? [...moments] : [];

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter(m =>
        (m.content || '').toLowerCase().includes(query) ||
        (m.location || '').toLowerCase().includes(query)
      );
    }

    result.sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });
    return result;
  }, [moments, searchQuery, sortOrder]);

  const nextImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!lightbox) return;
    setLightbox({ ...lightbox, index: (lightbox.index + 1) % lightbox.images.length });
  };

  const prevImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!lightbox) return;
    setLightbox({ ...lightbox, index: (lightbox.index - 1 + lightbox.images.length) % lightbox.images.length });
  };

  const renderImages = (images: string[]) => {
    if (!images || images.length === 0) return null;
    const count = images.length;

    if (count === 1) {
      return (
        <div className="mt-4 md:mt-5 w-full">
          <div onClick={() => setLightbox({ images, index: 0 })} className="overflow-hidden rounded-lg border border-slate-200/60 dark:border-white/10 cursor-zoom-in group/img">
            <img src={images[0]} alt="moment" loading="lazy" decoding="async" className="w-full h-auto max-h-[420px] object-cover group-hover/img:scale-[1.03] transition-transform duration-500" />
          </div>
        </div>
      );
    }

    const columns = count === 4 ? 2 : 3;

    return (
      <div className="grid gap-1.5 md:gap-2 mt-4 md:mt-5" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {images.slice(0, 9).map((src, idx) => {
          const isLastVisible = idx === 8 && count > 9;
          return (
            <div key={idx} onClick={() => setLightbox({ images, index: idx })} className="group/img relative aspect-square overflow-hidden rounded-lg bg-slate-200/30 dark:bg-slate-700/30 border border-slate-200/50 dark:border-white/10 cursor-zoom-in">
              <img src={src} alt="moment" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-500" />
              {isLastVisible && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white backdrop-blur-[2px]">
                  <span className="text-lg md:text-xl font-black">+{count - 9}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderMomentCard = (moment: Moment, index: number) => {
    const date = stamp(moment.date);
    return (
      <motion.div
        key={moment.id}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.45, delay: Math.min(index, 5) * 0.05 }}
        className="relative pl-8 md:pl-20"
      >
        {/* 时间轴：圆点 + 日期戳 */}
        <div className="absolute left-0 md:left-4 top-1 flex flex-col items-center">
          <span className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-white dark:bg-slate-900 border-2 border-indigo-500 shadow-[0_0_0_4px_rgba(99,102,241,0.12)] mt-2"></span>
        </div>
        <div className="hidden md:flex absolute left-[54px] top-8 bottom-0 w-px bg-gradient-to-b from-indigo-500/30 to-transparent"></div>

        <motion.article
          whileHover={{ rotate: 0, y: -6 }}
          transition={{ type: 'spring', stiffness: 220, damping: 20 }}
          style={{ rotate: TILTS[index % TILTS.length] }}
          className="group relative bg-white dark:bg-slate-800 rounded-[4px] p-3 md:p-4 pb-14 md:pb-16 shadow-[0_12px_30px_-12px_rgba(15,23,42,0.35)] dark:shadow-[0_12px_30px_-12px_rgba(0,0,0,0.7)] border border-white/70 dark:border-white/10"
        >
          {/* 胶带 */}
          <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-4 md:w-20 md:h-5 bg-indigo-200/50 dark:bg-indigo-400/20 rotate-[-2deg] backdrop-blur-[1px] rounded-[2px] pointer-events-none"></span>

          <div className="px-1 md:px-2 pt-2">
            <div className="flex items-center gap-3 mb-3 md:mb-4">
              <div className="w-9 h-9 md:w-11 md:h-11 shrink-0 rounded-full overflow-hidden border-2 border-white dark:border-slate-700 shadow-sm">
                <img src={avatarUrl} alt="avatar" loading="lazy" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col min-w-0">
                <h3 className="text-sm md:text-base font-black text-[#576b95] dark:text-[#7f99cc] tracking-wide truncate">{authorName}</h3>
                <div className="flex items-center gap-1.5 text-[10px] md:text-[11px] text-slate-400 font-bold">
                  <Clock size={10} /> {timeAgo(moment.date)}
                </div>
              </div>
            </div>

            <p className="text-slate-800 dark:text-slate-200 text-[14px] md:text-[15px] leading-relaxed whitespace-pre-wrap font-medium break-words">{moment.content}</p>

            {renderImages(moment.images)}
          </div>

          {/* 拍立得下白边：手写日期 + 地点 */}
          <div className="absolute bottom-3 md:bottom-4 left-3 md:left-4 right-3 md:right-4 flex items-end justify-between gap-2">
            <div className="flex items-baseline gap-2 min-w-0">
              <span className="font-serif italic text-2xl md:text-3xl leading-none text-slate-700 dark:text-slate-200">{date.day}</span>
              <span className="font-serif italic text-xs md:text-sm text-slate-400">{date.month}</span>
              {moment.location && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] md:text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/10 max-w-[12rem]">
                  <MapPin size={10} className="shrink-0" />
                  <span className="truncate">{moment.location}</span>
                </span>
              )}
            </div>
            <button
              onClick={() => setOpenCommentId(openCommentId === moment.id ? null : moment.id)}
              aria-label="展开评论"
              className={`w-8 h-8 md:w-9 md:h-9 flex items-center justify-center shrink-0 rounded-full transition-all shadow-sm ${openCommentId === moment.id ? 'bg-indigo-500 text-white shadow-indigo-500/30 rotate-12' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-indigo-500'}`}
            >
              <MessageSquare size={14} className="md:w-4 md:h-4" />
            </button>
          </div>

          <AnimatePresence>
            {openCommentId === moment.id && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="pt-4">
                  <MomentComments id={`/moments/${moment.id}`} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.article>
      </motion.div>
    );
  };

  return (
    <div className="w-[95%] md:w-[90%] max-w-3xl mx-auto py-6 md:py-10 mt-24 md:mt-28 relative z-10 flex-1 flex flex-col min-h-[85vh]">

      <div className="mb-8 md:mb-12 text-center relative">
        <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-2 md:mb-4 tracking-tighter">生活动态</motion.h1>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium italic opacity-80 flex items-center justify-center gap-1.5 md:gap-2">
          <Sparkles size={12} className="md:w-3.5 md:h-3.5 text-indigo-500" /> “ 在代码之外捕捉瞬间的温度 ”
        </p>
      </div>

      <div className="mb-8 md:mb-14 flex flex-col items-center gap-4 md:gap-6">
        <div className="relative w-full max-w-lg group px-2 md:px-0">
          <Search className="w-5 h-5 md:w-6 md:h-6 absolute left-6 md:left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors z-20 pointer-events-none" />
          <input type="text" placeholder="搜寻被遗忘的记忆..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/40 dark:border-white/5 rounded-xl md:rounded-2xl px-5 md:px-6 py-3 md:py-4 pl-12 md:pl-14 text-sm md:text-base text-slate-800 dark:text-white shadow-lg md:shadow-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium relative z-10" />
        </div>

        <div className="flex bg-white/50 dark:bg-slate-800/50 p-1 md:p-1.5 rounded-xl md:rounded-2xl border border-white/50 dark:border-white/10 shadow-sm relative z-10">
          <button onClick={() => setSortOrder('desc')} className={`flex items-center gap-1.5 md:gap-2 px-4 md:px-6 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black transition-all duration-300 ${sortOrder === 'desc' ? 'bg-indigo-500 text-white shadow-md md:shadow-lg scale-105' : 'text-slate-500 hover:text-indigo-500'}`}>
            <ArrowDownAZ size={12} className="md:w-3.5 md:h-3.5"/> 最新
          </button>
          <button onClick={() => setSortOrder('asc')} className={`flex items-center gap-1.5 md:gap-2 px-4 md:px-6 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black transition-all duration-300 ${sortOrder === 'asc' ? 'bg-indigo-500 text-white shadow-md md:shadow-lg scale-105' : 'text-slate-500 hover:text-indigo-500'}`}>
            <ArrowUpZA size={12} className="md:w-3.5 md:h-3.5"/> 最早
          </button>
        </div>
      </div>

      {processedMoments.length > 0 ? (
        <div className="relative flex flex-col gap-8 md:gap-12 pb-32">
          {/* 时间轴主线 */}
          <div className="absolute left-[5px] md:left-[23px] top-4 bottom-24 w-px bg-gradient-to-b from-indigo-500/40 via-indigo-500/20 to-transparent pointer-events-none"></div>
          <AnimatePresence mode="popLayout">
            {processedMoments.map((moment, index) => renderMomentCard(moment, index))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center py-12 md:py-24 min-h-[300px] md:min-h-[450px]">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center px-6 md:px-10 py-12 md:py-20 bg-white/40 dark:bg-slate-800/30 backdrop-blur-3xl rounded-[32px] md:rounded-[50px] border border-white/30 dark:border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] max-w-lg w-full mx-auto">
            <div className="w-16 h-16 md:w-24 md:h-24 bg-indigo-500/10 rounded-2xl md:rounded-3xl flex items-center justify-center mb-6 md:mb-8 relative">
              <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full animate-pulse"></div>
              <Ghost size={32} className="md:w-12 md:h-12 text-indigo-500 relative z-10" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white mb-2 md:mb-4 tracking-tight">{searchQuery ? "没找到相关记忆" : "朋友圈空空如也"}</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm md:text-lg leading-relaxed px-2 md:px-4">{searchQuery ? `尝试精简你的搜索词，或者换个心情再次出发。` : `还没有记录下任何生活碎片呢。`}</p>
          </motion.div>
        </div>
      )}

      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-slate-950/98 backdrop-blur-xl flex items-center justify-center cursor-pointer overflow-hidden"
            onClick={() => setLightbox(null)}
          >
            {lightbox.images.length > 1 && (
              <>
                <button className="absolute left-4 md:left-12 w-10 h-10 md:w-14 md:h-14 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-50 border border-white/5 backdrop-blur-md" onClick={prevImg}><ChevronLeft size={24} className="md:w-9 md:h-9"/></button>
                <button className="absolute right-4 md:right-12 w-10 h-10 md:w-14 md:h-14 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-50 border border-white/5 backdrop-blur-md" onClick={nextImg}><ChevronRight size={24} className="md:w-9 md:h-9"/></button>
              </>
            )}
            <motion.div key={lightbox.index} initial={{ opacity: 0, scale: 0.9, x: 50 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9, x: -50 }} className="relative w-full h-full flex flex-col items-center justify-center p-4 md:p-12 pointer-events-none">
              <img src={lightbox.images[lightbox.index]} className="max-w-full max-h-[75vh] md:max-h-[85vh] object-contain rounded-2xl shadow-[0_0_80px_rgba(0,0,0,0.5)] border border-white/10 pointer-events-auto" alt="fullscreen" />
              <div className="absolute bottom-8 md:bottom-10 px-4 md:px-5 py-1.5 md:py-2 rounded-full bg-white/10 backdrop-blur-md text-white/90 text-[10px] md:text-xs font-black tracking-widest border border-white/10">
                {lightbox.index + 1} / {lightbox.images.length}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
