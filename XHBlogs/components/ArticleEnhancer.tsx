"use client";

import { useEffect, useState } from 'react';

type LightboxImage = { src: string; alt: string } | null;

// 文章增强器：为正文里的代码块注入「复制」按钮和语言标签，
// 为图片接上点击放大灯箱。正文是 dangerouslySetInnerHTML 的静态内容，
// 挂载后做一次 DOM 增强是安全的。
export default function ArticleEnhancer() {
  const [lightbox, setLightbox] = useState<LightboxImage>(null);

  useEffect(() => {
    const content = document.getElementById('article-content');
    if (!content) return;

    const cleanups: Array<() => void> = [];

    // ---------- 代码块：复制按钮 + 语言标签 ----------
    const pres = Array.from(content.querySelectorAll('pre'));
    pres.forEach((pre) => {
      const code = pre.querySelector('code');
      if (!code) return;

      let chip: HTMLSpanElement | null = null;
      const langClass = Array.from(code.classList).find(c => c.startsWith('language-'));
      if (langClass) {
        chip = document.createElement('span');
        chip.className = 'code-lang-chip';
        chip.textContent = langClass.replace('language-', '');
        pre.appendChild(chip);
      }

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'code-copy-btn';
      btn.setAttribute('aria-label', '复制代码');
      btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg><span>复制</span>';

      const label = btn.querySelector('span') as HTMLElement | null;
      const timer: ReturnType<typeof setTimeout>[] = [];
      const done = () => {
        btn.classList.add('copied');
        if (label) label.textContent = '已复制';
        timer.push(setTimeout(() => {
          btn.classList.remove('copied');
          if (label) label.textContent = '复制';
        }, 2000));
      };
      // 先走异步 Clipboard API，被权限拒绝时降级到 execCommand
      const copyText = async (text: string) => {
        try {
          await navigator.clipboard.writeText(text);
          return true;
        } catch { /* 权限受限或非安全上下文，走降级 */ }
        try {
          const ta = document.createElement('textarea');
          ta.value = text;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          const ok = document.execCommand('copy');
          document.body.removeChild(ta);
          return ok;
        } catch {
          return false;
        }
      };
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        copyText(code.textContent || '').then(ok => { if (ok) done(); });
      });

      pre.appendChild(btn);
      cleanups.push(() => {
        timer.forEach(clearTimeout);
        btn.remove();
        chip?.remove();
      });
    });

    // ---------- 图片：懒加载 + 事件委托点击灯箱（对动态插入的图片同样生效） ----------
    const imgs = Array.from(content.querySelectorAll('img'));
    imgs.forEach((img) => {
      img.loading = 'lazy';
      img.decoding = 'async';
    });
    const onContentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target || target.tagName !== 'IMG') return;
      const img = target as HTMLImageElement;
      e.preventDefault();
      setLightbox({ src: img.currentSrc || img.src, alt: img.alt || '' });
    };
    content.addEventListener('click', onContentClick);
    cleanups.push(() => content.removeEventListener('click', onContentClick));

    return () => cleanups.forEach(fn => fn());
  }, []);

  // ---------- 灯箱：点击空白 / ESC 关闭，打开时锁定滚动 ----------
  useEffect(() => {
    if (!lightbox) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [lightbox]);

  if (!lightbox) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md cursor-zoom-out p-6 md:p-10"
      onClick={() => setLightbox(null)}
      role="dialog"
      aria-modal="true"
      aria-label="图片预览"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={lightbox.src}
        alt={lightbox.alt}
        className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl animate-[lightboxIn_0.25s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      />
      {lightbox.alt && (
        <p className="absolute bottom-6 left-0 right-0 text-center text-sm text-white/70 px-6 truncate">{lightbox.alt}</p>
      )}
      <style>{`@keyframes lightboxIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }`}</style>
    </div>
  );
}
