import { useEffect, useState } from 'react';

export default function ErrorFlash({ trigger }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (trigger) {
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 1000);
      return () => clearTimeout(t);
    }
  }, [trigger]);

  if (!visible) return null;
  return (
    <div className="fixed inset-0 bg-red-500/70 z-50 flex items-center justify-center animate-pulse pointer-events-none">
      <span className="text-white text-4xl font-bold">❌ Lỗi QR</span>
    </div>
  );
}
