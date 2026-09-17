"use client";

import { useEffect } from "react";

const types = ["❄", "❅", "❆"];
const snowParticles = Array.from({ length: 40 }, (_, i) => ({
  char: types[i % types.length],
  size: ((i * 37 + 11) % 101) / 101 * 15 + 10,
  left: ((i * 61 + 23) % 101) / 101 * 100,
  duration: ((i * 43 + 47) % 101) / 101 * 6 + 4,
  delay: ((i * 73 + 19) % 101) / 101 * 5,
  opacity: ((i * 53 + 31) % 101) / 101 * 0.5 + 0.3,
}));

export default function GlobalSnow() {
  useEffect(() => {
    try {
      if (localStorage.getItem("winter-mode") === "true") document.body.classList.add("winter-mode");
    } catch {}
  }, []);

  return (
    <div className="global-snow fixed inset-0 pointer-events-none z-[190] overflow-hidden">
      {/* 1. 全局冷色调滤镜 */}
      <div className="absolute inset-0 bg-blue-500/5 dark:bg-blue-900/10 mix-blend-overlay transition-opacity duration-1000" />

      {/* 2. 真正的雪花粒子 */}
      {snowParticles.map((p, i) => (
        <div
          key={i}
          className="absolute text-white select-none pointer-events-none"
          style={{
            fontSize: p.size,
            left: `${p.left}vw`,
            top: "-20px",
            opacity: p.opacity,
            animation: `snowDrop ${p.duration}s linear ${p.delay}s infinite`,
            filter: "drop-shadow(0 0 2px rgba(255,255,255,0.8))",
          }}
        >
          {p.char}
        </div>
      ))}

      <style dangerouslySetInnerHTML={{ __html: `
        .global-snow { display: none; }
        body.winter-mode .global-snow { display: block; }
        @keyframes snowDrop {
          0% { transform: translateY(0) rotate(0deg); }
          100% { transform: translateY(105vh) rotate(360deg); }
        }
      `}} />
    </div>
  );
}