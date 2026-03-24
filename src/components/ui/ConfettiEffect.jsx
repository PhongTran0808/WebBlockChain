import { useEffect, useState } from 'react';

const COLORS = ['#1d4ed8','#16a34a','#dc2626','#f59e0b','#9333ea'];
const PIECES = 40;

function randomPiece(i) {
  return {
    id: i,
    x: Math.random() * 100,
    color: COLORS[i % COLORS.length],
    delay: Math.random() * 0.5,
    size: 6 + Math.random() * 8,
  };
}

export default function ConfettiEffect({ show, onDone }) {
  const [pieces] = useState(() => Array.from({ length: PIECES }, (_, i) => randomPiece(i)));

  useEffect(() => {
    if (show) {
      const t = setTimeout(() => onDone?.(), 2500);
      return () => clearTimeout(t);
    }
  }, [show]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map(p => (
        <div key={p.id} className="absolute top-0 animate-bounce"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: '2px',
            animationDelay: `${p.delay}s`,
            animationDuration: '1.5s',
          }} />
      ))}
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="text-white text-3xl font-bold drop-shadow-lg">🎉 Giao hàng thành công!</p>
      </div>
    </div>
  );
}
