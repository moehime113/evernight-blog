"use client";

// 首页取景窗：缓慢推镜 + 叠化，可暂停且尊重减少动态效果偏好。
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import type { Album } from '../data/albums';

export default function PhotoWallBanner({ album }: { album: Album }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const reducedMotion = useReducedMotion();
  const slides = album.photos.length > 0 ? album.photos : [{ url: album.cover, caption: album.description }];

  useEffect(() => {
    if (slides.length <= 1 || paused || interacting || reducedMotion) return;
    const timer = setInterval(() => setIndex(prev => (prev + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, [slides.length, paused, interacting, reducedMotion]);

  const current = slides[Math.min(index, slides.length - 1)];

  return (
    <div onMouseEnter={() => setInteracting(true)} onMouseLeave={() => setInteracting(false)} onFocusCapture={() => setInteracting(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setInteracting(false); }} className={`photo-banner ${paused ? 'photo-banner-paused' : ''} w-full rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl overflow-hidden transition-all duration-700 hover:scale-[1.02] relative group min-h-[200px] sm:min-h-[220px] flex-shrink-0`}>
      <Link href="/photowall" className="absolute inset-0 z-20" aria-label={`查看照片墙 ${album.title}`} />

      <AnimatePresence>
        <motion.img
          key={current.url}
          src={current.url}
          alt={current.caption || album.title}
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.9 }}
          className="photo-drift w-full h-full absolute inset-0 object-cover opacity-90"
        />
      </AnimatePresence>
      <div className="absolute top-5 left-5 right-5 z-10 flex items-center justify-between text-[10px] tracking-[.25em] text-white/80 pointer-events-none"><span>✦ 光影档案</span><span>{String(index + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}</span></div>
      <div className="absolute inset-5 z-10 border border-white/20 rounded-xl pointer-events-none" />
      <div className="absolute inset-0 bg-black/30 dark:bg-black/50 group-hover:bg-black/10 transition-colors duration-500"></div>

      <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 right-6 z-10 pointer-events-none">
        <h3 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2 underline decoration-pink-400">{album.title}</h3>
        <p className="text-white/90 text-sm sm:text-lg line-clamp-1">{current.caption || album.description}</p>
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-4 right-6 z-30 flex gap-2">
          <button type="button" onClick={() => setPaused(!paused)} aria-label={paused ? '播放照片轮播' : '暂停照片轮播'} aria-pressed={paused} className="mr-1 -my-2 grid h-7 w-7 place-items-center rounded-full bg-black/30 text-xs text-white">{paused ? '▶' : 'Ⅱ'}</button>
          {slides.map((slide, i) => (
            <button
              key={slide.url}
              type="button"
              onClick={(event) => { event.stopPropagation(); setIndex(i); }}
              aria-label={`第 ${i + 1} 张`}
              aria-pressed={i === index}
              className={`h-1.5 rounded-full transition-all duration-500 shadow-sm ${i === index ? 'w-6 bg-pink-400' : 'w-2 bg-white/40 hover:bg-white/80'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
