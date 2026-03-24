import { useState } from 'react';

const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

export default function PinModal({ title = 'Nhập PIN', onConfirm, onCancel }) {
  const [pin, setPin] = useState('');

  const handleKey = (key) => {
    if (key === '⌫') {
      setPin(p => p.slice(0, -1));
    } else if (key && pin.length < 6) {
      const next = pin + key;
      setPin(next);
      if (next.length === 6) {
        setTimeout(() => onConfirm(next), 100);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50">
      <div className="bg-white w-full max-w-sm rounded-t-2xl p-6">
        <h2 className="text-center text-lg font-semibold mb-4">{title}</h2>

        {/* PIN dots */}
        <div className="flex justify-center gap-3 mb-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`w-4 h-4 rounded-full border-2 ${i < pin.length ? 'bg-blue-600 border-blue-600' : 'border-gray-400'}`} />
          ))}
        </div>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3">
          {KEYS.map((key, i) => (
            <button
              key={i}
              onClick={() => handleKey(key)}
              disabled={!key}
              className={`h-16 rounded-xl text-2xl font-medium transition-colors
                ${key ? 'bg-gray-100 active:bg-gray-200' : 'invisible'}`}
            >
              {key}
            </button>
          ))}
        </div>

        <button onClick={onCancel} className="mt-4 w-full py-3 text-gray-500 text-sm">
          Huỷ
        </button>
      </div>
    </div>
  );
}
