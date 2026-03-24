import { useRef, useState } from 'react';

export default function SwipeAction({ label, onConfirm, children }) {
  const [swiped, setSwiped] = useState(false);
  const startX = useRef(0);

  const handleTouchStart = (e) => { startX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    const diff = e.changedTouches[0].clientX - startX.current;
    if (diff > 80) { setSwiped(true); onConfirm(); }
  };

  return (
    <div className="relative overflow-hidden rounded-xl">
      <div className={`transition-transform duration-300 ${swiped ? 'translate-x-full' : ''}`}
        onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        {children}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 flex items-center gap-1">
          <span>→</span> {label}
        </div>
      </div>
    </div>
  );
}
