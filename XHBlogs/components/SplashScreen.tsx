"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { siteConfig } from '../siteConfig';

const subscribe = () => () => {};

export default function SplashScreen() {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  return mounted ? <SplashContent /> : null;
}

function SplashContent() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [show, setShow] = useState(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    try { return sessionStorage.getItem('hasSeenSplash') !== 'true'; } catch { return true; }
  });

  useEffect(() => {
    if (!show) {
      try { sessionStorage.setItem('hasSeenSplash', 'true'); } catch {}
      return;
    }
    const dialog = dialogRef.current;
    dialog?.showModal();
    const timer = setTimeout(() => setShow(false), 1800);
    return () => { clearTimeout(timer); dialog?.close(); };
  }, [show]);

  if (!show) return null;
  return (
    <dialog ref={dialogRef} onCancel={() => setShow(false)} className="night-intro fixed inset-0 m-0 h-dvh w-screen max-h-none max-w-none border-0 bg-transparent p-0 z-[100000] flex items-center justify-center text-white" aria-label="永夜入场">
      <div className="night-intro-curtain night-intro-left" />
      <div className="night-intro-curtain night-intro-right" />
      <div className="night-intro-copy relative text-center" aria-hidden="true">
        <span className="night-intro-orbit absolute -inset-16 rounded-full border border-indigo-300/20" />
        <p className="mb-6 text-[10px] tracking-[0.5em] text-indigo-200">A LITTLE WORLD AFTER DARK</p>
        <p className="text-5xl font-black tracking-[0.12em] sm:text-7xl">{siteConfig.authorName}</p>
        <p className="mt-6 text-sm tracking-[0.4em] text-slate-300">光落成诗 · 夜藏片刻</p>
      </div>
      <button type="button" onClick={() => setShow(false)} className="absolute bottom-10 right-8 rounded-full border border-white/20 px-5 py-2 text-xs text-slate-300 hover:bg-white/10">跳过开场 ↗</button>
    </dialog>
  );
}
