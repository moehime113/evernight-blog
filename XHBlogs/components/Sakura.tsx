"use client";

interface Petal {
  id: number;
  left: string;
  size: number;
  duration: number;
  delay: number;
}

const petals: Petal[] = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  left: `${((i * 37 + 11) % 101) / 101 * 100}%`,
  size: 8 + ((i * 61 + 23) % 101) / 101 * 12,
  duration: 6 + ((i * 43 + 47) % 101) / 101 * 8,
  delay: ((i * 73 + 19) % 101) / 101 * -15,
}));

export default function Sakura() {

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-10 overflow-hidden">
      <style>{`
        @keyframes sakuraFall {
          0% { transform: translate(0, -10vh) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translate(15vw, 110vh) rotate(360deg); opacity: 0; }
        }
      `}</style>

      {petals.map(p => (
        <div
          key={p.id}
          className="absolute top-0 bg-pink-300/70 shadow-[0_0_5px_rgba(255,182,193,0.6)]"
          style={{
            left: p.left,
            width: `${p.size}px`,
            height: `${p.size * 1.2}px`,
            // 樱花特有的圆角形状
            borderRadius: '100% 0 100% 0',
            animation: `sakuraFall ${p.duration}s linear infinite`,
            animationDelay: `${p.delay}s`,
          }}
        ></div>
      ))}
    </div>
  );
}