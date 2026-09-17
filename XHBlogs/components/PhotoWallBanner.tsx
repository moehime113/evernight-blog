"use client";

// 首页照片墙大海报：复用文章/说说轮播的淡入淡出 + 圆点切换
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import type { Album } from '../data/albums';

export default function PhotoWallBanner({ album }: { album: Album }) {
  const [index, setIndex] = useState(0);
  const slides = album.photos.length > 0 ? album.photos : [{ url: album.cover, caption: album.description }];

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => setIndex(prev => (prev + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const current = slides[Math.min(index, slides.length - 1)];

  return (
    <div className="w-full rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl overflow-hidden transition-all duration-700 hover:scale-[1.02] relative group min-h-[200px] sm:min-h-[220px] flex-shrink-0">
      <Link href="/photowall" className="absolute inset-0 z-20" aria-label={`查看照片墙 ${album.title}`} />

      <AnimatePresence>
        <motion.img
          key={current.url}
          src={current.url}
          alt={current.caption || album.title}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full h-full absolute inset-0 object-cover transition-transform duration-700 group-hover:scale-105 opacity-90"
        />
      </AnimatePresence>
      <div className="absolute inset-0 bg-black/30 dark:bg-black/50 group-hover:bg-black/10 transition-colors duration-500"></div>

      <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 right-6 z-10 pointer-events-none">
        <h3 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2 underline decoration-pink-400">{album.title}</h3>
        <p className="text-white/90 text-sm sm:text-lg line-clamp-1">{current.caption || album.description}</p>
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-4 right-6 z-30 flex gap-2">
          {slides.map((slide, i) => (
            <button
              key={slide.url}
              type="button"
              onClick={(event) => { event.stopPropagation(); setIndex(i); }}
              aria-label={`第 ${i + 1} 张`}
              className={`h-1.5 rounded-full transition-all duration-500 shadow-sm ${i === index ? 'w-6 bg-pink-400' : 'w-2 bg-white/40 hover:bg-white/80'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
