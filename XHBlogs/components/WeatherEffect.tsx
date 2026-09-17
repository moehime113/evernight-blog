// components/WeatherEffect.tsx
"use client";

const particles = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  left: `${((i * 37 + 11) % 101) / 101 * 100}%`,
  duration: `${((i * 61 + 23) % 101) / 101 * 15 + 10}s`,
  delay: `${((i * 43 + 47) % 101) / 101 * -20}s`,
  opacity: ((i * 73 + 19) % 101) / 101 * 0.5 + 0.1,
  size: ((i * 53 + 31) % 101) / 101 * 3 + 2,
}));

export default function WeatherEffect() {

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <style>{`
        @keyframes float-down {
          0% { transform: translateY(-10vh) translateX(0) scale(0.8); }
          50% { transform: translateY(50vh) translateX(20px) scale(1.2); }
          100% { transform: translateY(110vh) translateX(-10px) scale(0.8); }
        }
        .cyber-particle {
          position: absolute;
          top: -10vh;
          background: #ffffff;
          border-radius: 50%;
          animation: float-down linear infinite;
          filter: blur(1px);
        }
        /* 暗黑模式下的发光特效 */
        .dark .cyber-particle {
           background: rgba(165, 180, 252, 0.8);
           box-shadow: 0 0 10px 2px rgba(99, 102, 241, 0.3);
        }
      `}</style>
      {particles.map((p) => (
        <div
          key={p.id}
          className="cyber-particle"
          style={{
            left: p.left,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDuration: p.duration,
            animationDelay: p.delay,
            opacity: p.opacity,
          }}
        />
      ))}
    </div>
  );
}