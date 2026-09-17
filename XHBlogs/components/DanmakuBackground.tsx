"use client";

import { siteConfig } from '../siteConfig';

interface DanmakuItem {
  id: number;
  text: string;
  top: number;
  duration: number;
  delay: number;
}

const list = siteConfig.danmakuList || [];
const danmakus: DanmakuItem[] = Array.from({ length: list.length ? 15 : 0 }, (_, i) => ({
  id: i,
  text: list[Math.floor(((i * 37 + 11) % 101) / 101 * list.length)],
  top: ((i * 61 + 23) % 101) / 101 * 80 + 10,
  duration: ((i * 43 + 47) % 101) / 101 * 20 + 25,
  delay: ((i * 73 + 19) % 101) / 101 * 20,
}));

export default function DanmakuBackground() {

  return (
    // 🌟 终极限制：去掉了 bottom-0，换成了 h-[30vh] 强制锁死容器高度！
    // 并且加上 z-0 确保它在卡片矩阵的后面
    <div className="fixed top-28 h-[30vh] left-0 right-0 overflow-hidden pointer-events-none z-0">
      {danmakus.map((item) => (
        <div
          key={item.id}
          className="absolute whitespace-nowrap text-white/30 dark:text-white/10 font-bold text-lg tracking-wider select-none"
          style={{
            top: `${item.top}%`,
            right: '-100%',
            animation: `float-left ${item.duration}s linear ${item.delay}s infinite`,
          }}
        >
          {item.text}
        </div>
      ))}

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes float-left {
          0% {
            right: -100%;
            transform: translateX(100%);
          }
          100% {
            right: 100%;
            transform: translateX(-100%);
          }
        }
      `}} />
    </div>
  );
}