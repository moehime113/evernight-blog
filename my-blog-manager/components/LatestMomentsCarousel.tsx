// components/LatestMomentsCarousel.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export interface CarouselMoment {
  id: string;
  date: string;
  formattedDate: string;
  content: string;
  images: string[];
  location?: string;
}

export default function LatestMomentsCarousel({ moments }: { moments: CarouselMoment[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (moments.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % moments.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [moments.length]);

  if (!moments || moments.length === 0) return null;

  const current = moments[currentIndex];
  const cover = current.images?.[0];

  const holoVariants = {
    initial: { opacity: 0, scale: 0.95, filter: "blur(10px)" },
    animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
    exit: { opacity: 0, scale: 1.05, filter: "blur(10px)" },
  };

  return (
    <div className="w-full h-full rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl overflow-hidden relative group min-h-[220px] flex flex-col">
      <Link href="/moments" className="absolute inset-0 z-20" aria-label="查看说说" />

      {cover ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            variants={holoVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-0 z-0"
          >
            <img src={cover} className="w-full h-full object-cover opacity-80 dark:opacity-60 transition-transform duration-1000 group-hover:scale-105" alt="说说配图" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-black/20"></div>
          </motion.div>
        </AnimatePresence>
      ) : (
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-indigo-500/30 to-purple-500/30">
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent"></div>
        </div>
      )}

      <div className="relative z-10 flex flex-col justify-center p-6 md:p-8 h-full pointer-events-none w-full md:w-[88%]">
        <div className="flex items-end gap-2 mb-2">
          <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest bg-black/30 backdrop-blur-sm px-2 py-1 rounded-md border border-white/10 shadow-sm">
            说说
          </span>
          {current.formattedDate && (
            <span className="text-[11px] font-mono text-slate-300 drop-shadow-md">{current.formattedDate}</span>
          )}
          {current.location && (
            <span className="text-[11px] font-mono text-slate-300/80 drop-shadow-md truncate max-w-[10rem]">· {current.location}</span>
          )}
        </div>

        <p className="text-base md:text-lg text-white font-medium leading-relaxed drop-shadow-md line-clamp-2 md:line-clamp-3">
          {current.content}
        </p>
      </div>

      {moments.length > 1 && (
        <div className="absolute bottom-5 right-6 z-30 flex gap-2">
          {moments.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(i); }}
              aria-label="切换到这条说说"
              className={`h-1.5 rounded-full transition-all duration-500 shadow-sm ${i === currentIndex ? 'w-6 bg-indigo-400' : 'w-2 bg-white/40 hover:bg-white/80'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
